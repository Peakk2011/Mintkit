#include <iostream>
#include <string>
#include <vector>
#include <map>
#include <thread>
#include <mutex>
#include <chrono>
#include <filesystem>
#include <fstream>
#include <sstream>
#include <algorithm>
#include <atomic>
#include <cstring>
#include <cstdio>
#include <cstdlib>

#ifdef _WIN32
    #include <winsock2.h>
    #include <ws2tcpip.h>
    #include <windows.h>
    #include <shellapi.h>
    #pragma comment(lib, "ws2_32.lib")
#else
    #include <sys/socket.h>
    #include <netinet/in.h>
    #include <arpa/inet.h>
    #include <unistd.h>
    #include <signal.h>
    #include <sys/select.h>
#endif

namespace fs = std::filesystem;

class Socket {
private:
#ifdef _WIN32
    SOCKET sock;
#else
    int sock;
#endif
    bool valid;

public:
    Socket() : sock(-1), valid(false) {}
    
    Socket(Socket&& other) noexcept : sock(other.sock), valid(other.valid) {
        other.sock = -1;
        other.valid = false;
    }
    
    Socket& operator=(Socket&& other) noexcept {
        if (this != &other) {
            close();
            sock = other.sock;
            valid = other.valid;
            other.sock = -1;
            other.valid = false;
        }
        return *this;
    }
    
    Socket(const Socket&) = delete;
    Socket& operator=(const Socket&) = delete;
    
    bool create() {
#ifdef _WIN32
        sock = socket(AF_INET, SOCK_STREAM, 0);
        valid = (sock != INVALID_SOCKET);
#else
        sock = socket(AF_INET, SOCK_STREAM, 0);
        valid = (sock >= 0);
#endif
        return valid;
    }
    
    bool bind(int port) {
        if (!valid) return false;
        
        struct sockaddr_in addr{};
        addr.sin_family = AF_INET;
        addr.sin_port = htons(port);
        addr.sin_addr.s_addr = INADDR_ANY;
        
        int opt = 1;
        setsockopt(sock, SOL_SOCKET, SO_REUSEADDR, (char*)&opt, sizeof(opt));
        
        return ::bind(sock, (struct sockaddr*)&addr, sizeof(addr)) == 0;
    }
    
    bool listen(int backlog = 5) {
        if (!valid) return false;
        return ::listen(sock, backlog) == 0;
    }
    
    Socket accept() {
        if (!valid) return Socket();
        
        Socket client;
#ifdef _WIN32
        client.sock = ::accept(sock, NULL, NULL);
        client.valid = (client.sock != INVALID_SOCKET);
#else
        client.sock = ::accept(sock, NULL, NULL);
        client.valid = (client.sock >= 0);
#endif
        return client;
    }
    
    bool send(const std::string& data) {
        if (!valid) return false;
        return ::send(sock, data.c_str(), data.length(), 0) > 0;
    }
    
    std::string recv(int maxSize = 2048) {
        if (!valid) return "";
        
        std::vector<char> buffer(maxSize);
        int result = ::recv(sock, buffer.data(), maxSize - 1, 0);
        
        if (result > 0) {
            buffer[result] = '\0';
            return std::string(buffer.data());
        }
        return "";
    }
    
    void close() {
        if (valid) {
#ifdef _WIN32
            closesocket(sock);
#else
            ::close(sock);
#endif
            valid = false;
        }
    }
    
    bool isValid() const { return valid; }
    
    ~Socket() { close(); }
};

class Logger {
private:
    std::mutex logMutex;
    
public:
    void log(const std::string& message, const std::string& color = "") {
        std::lock_guard<std::mutex> lock(logMutex);
        
        auto now = std::chrono::system_clock::now();
        auto time_t = std::chrono::system_clock::to_time_t(now);
        auto tm = *std::localtime(&time_t);
        
        std::cout << "[" << std::put_time(&tm, "%H:%M:%S") << "] " << message << std::endl;
    }
    
    void info(const std::string& message) { log("INFO: " + message); }
    void warn(const std::string& message) { log("WARN: " + message); }
    void error(const std::string& message) { log("ERROR: " + message); }
};

class HTTPServer {
private:
    Socket serverSocket;
    std::atomic<bool> running{false};
    std::thread serverThread;
    std::thread watcherThread;
    std::atomic<bool> filesChanged{false};
    fs::file_time_type lastCheckTime;
    Logger logger;
    int port;
    
    std::map<std::string, std::string> mimeTypes = {
        {".html", "text/html"},
        {".css", "text/css"},
        {".js", "application/javascript"},
        {".json", "application/json"},
        {".png", "image/png"},
        {".jpg", "image/jpeg"},
        {".jpeg", "image/jpeg"},
        {".svg", "image/svg+xml"},
        {".ico", "image/x-icon"}
    };
    
    std::vector<std::string> watchedExtensions = {
        ".html", ".css", ".js", ".json"
    };

public:
    HTTPServer(int p = 3000) : port(p) {
        lastCheckTime = fs::file_time_type::clock::now();
    }
    
    ~HTTPServer() {
        stop();
    }
    
    bool start() {
        std::cout << "HTTPServer::start() called on port " << port << std::endl;
        
#ifdef _WIN32
        WSADATA wsa;
        std::cout << "Initializing WSA..." << std::endl;
        if (WSAStartup(MAKEWORD(2, 2), &wsa) != 0) {
            std::cout << "WSAStartup failed!" << std::endl;
            logger.error("WSAStartup failed");
            return false;
        }
        std::cout << "WSA initialized successfully" << std::endl;
#endif
        
        std::cout << "Creating socket..." << std::endl;
        if (!serverSocket.create()) {
            std::cout << "Failed to create socket!" << std::endl;
            logger.error("Failed to create socket");
            return false;
        }
        std::cout << "Socket created successfully" << std::endl;
        
        std::cout << "Binding to port " << port << "..." << std::endl;
        if (!serverSocket.bind(port)) {
            std::cout << "Failed to bind to port " << port << "!" << std::endl;
            logger.error("Failed to bind to port " + std::to_string(port));
            return false;
        }
        std::cout << "Bound to port " << port << " successfully" << std::endl;
        
        std::cout << "Starting to listen..." << std::endl;
        if (!serverSocket.listen()) {
            std::cout << "Failed to listen on socket!" << std::endl;
            logger.error("Failed to listen on socket");
            return false;
        }
        std::cout << "Listening started successfully" << std::endl;
        
        running = true;
        
        serverThread = std::thread([this]() {
            while (running) {
                Socket client = serverSocket.accept();
                if (client.isValid()) {
                    std::thread([this](Socket client) {
                        handleClient(client);
                    }, std::move(client)).detach();
                }
            }
        });
        
        watcherThread = std::thread([this]() {
            while (running) {
                checkFilesModified();
                std::this_thread::sleep_for(std::chrono::milliseconds(500));
            }
        });
        
        logger.info("Server started on port " + std::to_string(port));
        return true;
    }
    
    void stop() {
        running = false;
        serverSocket.close();
        
        if (serverThread.joinable()) {
            serverThread.join();
        }
        
        if (watcherThread.joinable()) {
            watcherThread.join();
        }
        
#ifdef _WIN32
        WSACleanup();
#endif
    }
    
    int getPort() const { return port; }
    
    void openBrowser() {
        std::string url = "http://localhost:" + std::to_string(port);
        
#ifdef _WIN32
        ShellExecuteA(nullptr, "open", url.c_str(), nullptr, nullptr, SW_SHOWNORMAL);
#elif defined(__APPLE__)
        system(("open " + url).c_str());
#else
        system(("xdg-open " + url).c_str());
#endif
    }
    
private:
    void handleClient(Socket& client) {
        std::string request = client.recv(4096);
        if (request.empty()) return;
        
        std::istringstream iss(request);
        std::string method, path, version;
        iss >> method >> path >> version;
        
        if (path == "/reload") {
            serveReload(client);
        } else if (path == "/live-reload.js") {
            serveLiveReloadScript(client);
        } else {
            std::string filename = (path == "/") ? "index.html" : path.substr(1);
            serveFile(client, filename);
        }
    }
    
    void serveFile(Socket& client, const std::string& filename) {
        std::string content = readFile(filename);
        
        if (content.empty()) {
            serve404(client);
            return;
        }
        
        if (filename.ends_with(".html")) {
            injectLiveReloadScript(content);
        }
        
        std::string mimeType = getMimeType(filename);
        std::string response = 
            "HTTP/1.1 200 OK\r\n"
            "Content-Type: " + mimeType + "\r\n"
            "Content-Length: " + std::to_string(content.length()) + "\r\n"
            "Cache-Control: no-cache\r\n"
            "Access-Control-Allow-Origin: *\r\n\r\n" + content;
        
        client.send(response);
        logger.info("Served: " + filename + " (" + std::to_string(content.length()) + " bytes)");
    }
    
    void serve404(Socket& client) {
        std::string html = R"(
<!DOCTYPE html>
<html>
<head>
    <title>404 Not Found</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Roboto:ital,wght@0,100..900;1,100..900&display=swap');
        body { 
            font-family: "Roboto", sans-serif;
            text-align: center; 
            padding: 50px; 
            background: #faf9f5;
        }
        h1 { color: #000; }
        p { color: #444; }
    </style>
</head>
<body>
    <h1>404 - File Not Found</h1>
    <p>The requested file could not be found.</p>
</body>
</html>)";
        
        std::string response = 
            "HTTP/1.1 404 Not Found\r\n"
            "Content-Type: text/html\r\n"
            "Content-Length: " + std::to_string(html.length()) + "\r\n\r\n" + html;
        
        client.send(response);
    }
    
    void serveReload(Socket& client) {
        bool shouldReload = filesChanged.exchange(false);
        
        std::string json = "{\"reload\":" + (shouldReload ? std::string("true") : std::string("false")) + "}";
        std::string response = 
            "HTTP/1.1 200 OK\r\n"
            "Content-Type: application/json\r\n"
            "Access-Control-Allow-Origin: *\r\n"
            "Cache-Control: no-cache\r\n\r\n" + json;
        
        client.send(response);
    }
    
    void serveLiveReloadScript(Socket& client) {
        std::string script = R"(
(function() {
    console.log('Live reload script loaded');
    
    function checkForReload() {
        fetch('/reload')
            .then(response => response.json())
            .then(data => {
                if (data.reload) {
                    console.log('Reloading page...');
                    location.reload();
                }
            })
            .catch(error => {
                console.error('Live reload error:', error);
            });
    }
    
    setInterval(checkForReload, 1000);
})();
)";
        
        std::string response = 
            "HTTP/1.1 200 OK\r\n"
            "Content-Type: application/javascript\r\n"
            "Content-Length: " + std::to_string(script.length()) + "\r\n"
            "Cache-Control: no-cache\r\n\r\n" + script;
        
        client.send(response);
    }
    
    std::string readFile(const std::string& filename) {
        std::ifstream file(filename);
        if (!file.is_open()) {
            return "";
        }
        
        std::stringstream buffer;
        buffer << file.rdbuf();
        return buffer.str();
    }
    
    std::string getMimeType(const std::string& filename) {
        size_t dotPos = filename.find_last_of('.');
        if (dotPos == std::string::npos) {
            return "text/plain";
        }
        
        std::string ext = filename.substr(dotPos);
        auto it = mimeTypes.find(ext);
        return it != mimeTypes.end() ? it->second : "text/plain";
    }
    
    void injectLiveReloadScript(std::string& content) {
        std::string script = "<script src=\"/live-reload.js\"></script>";
        
        // Try to inject before closing body tag
        size_t bodyPos = content.find("</body>");
        if (bodyPos != std::string::npos) {
            content.insert(bodyPos, script);
        } else {
            // If no body tag, append at the end
            content += script;
        }
    }
    
    void checkFilesModified() {
        try {
            auto currentTime = fs::file_time_type::clock::now();
            
            for (const auto& entry : fs::directory_iterator(".")) {
                if (!entry.is_regular_file()) continue;
                
                std::string ext = entry.path().extension().string();
                if (std::find(watchedExtensions.begin(), watchedExtensions.end(), ext) == watchedExtensions.end()) {
                    continue;
                }
                
                auto writeTime = fs::last_write_time(entry.path());
                if (writeTime > lastCheckTime) {
                    logger.info("File changed: " + entry.path().string());
                    filesChanged = true;
                }
            }
            
            lastCheckTime = currentTime;
        } catch (const std::exception& e) {
            logger.error("Error checking files: " + std::string(e.what()));
        }
    }
};

// Main application
class LiveServer {
private:
    HTTPServer server;
    Logger logger;
    std::atomic<bool> running{true};

public:
    LiveServer(int port = 3000) : server(port) {}
    
    bool start() {
        std::cout << "LiveServer::start() called" << std::endl;
        logger.info("Starting Live Server...");
        
        std::cout << "Calling server.start()..." << std::endl;
        if (!server.start()) {
            std::cout << "server.start() failed!" << std::endl;
            logger.error("Failed to start server");
            return false;
        }
        
        std::cout << "server.start() succeeded!" << std::endl;
        logger.info("Server ready!");
        logger.info("Local: http://localhost:" + std::to_string(server.getPort()));
        logger.info("Press Ctrl+C to stop");
        
        std::cout << "Opening browser..." << std::endl;
        server.openBrowser();
        
        return true;
    }
    
    void run() {
#ifdef _WIN32
        SetConsoleCtrlHandler([](DWORD ctrlType) -> BOOL {
            if (ctrlType == CTRL_C_EVENT) {
                std::cout << "\nShutting down..." << std::endl;
                exit(0);
            }
            return FALSE;
        }, TRUE);
#else
        signal(SIGINT, [](int) {
            std::cout << "\nShutting down..." << std::endl;
            exit(0);
        });
#endif
        
        std::cout << "Server is running. Press Ctrl+C to stop." << std::endl;
        
        while (running) {
            std::this_thread::sleep_for(std::chrono::milliseconds(100));
        }
    }
    
    void stop() {
        running = false;
        server.stop();
    }
};

int main(int argc, char* argv[]) {
    std::cout.flush();
    std::cerr.flush();
    
    std::cout << "LiveServer starting..." << std::endl;
    std::cout.flush();
    
    int port = 3000;
    
    if (argc > 1) {
        port = std::atoi(argv[1]);
        if (port <= 0 || port > 65535) {
            std::cerr << "Invalid port number. Using default port 3000." << std::endl;
            std::cerr.flush();
            port = 3000;
        }
    }
    
    std::cout << "Using port: " << port << std::endl;
    std::cout.flush();
    
    try {
        std::cout << "Creating LiveServer instance" << std::endl;
        std::cout.flush();
        
        LiveServer app(port);
        
        std::cout << "Starting server" << std::endl;
        std::cout.flush();
        
        if (!app.start()) {
            std::cerr << "Failed to start server" << std::endl;
            std::cerr.flush();
            return 1;
        }
        
        std::cout << "Server started successfully" << std::endl;
        std::cout.flush();
        app.run();
    } catch (const std::exception& e) {
        std::cerr << "Exception: " << e.what() << std::endl;
        std::cerr.flush();
        return 1;
    } catch (...) {
        std::cerr << "Unknown exception occurred" << std::endl;
        std::cerr.flush();
        return 1;
    }
    
    return 0;
}

/*
    WINDOWS (MinGW):
    gcc -x c++ -std=c++20 -static -O2 LiveServer.cpp -o LiveServer.exe -lstdc++ -lws2_32
    LINUX:
    g++ -std=c++20 -O2 LiveServer.cpp -o LiveServer -lpthread
    macOS:
    g++ -std=c++20 -O2 LiveServer.cpp -o LiveServer
*/