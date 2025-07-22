#include <iostream>
#include <string>
#include <vector>
#include <unordered_map>
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
#include <memory>
#include <string_view>
#include <array>

#ifdef _WIN32
    #include <winsock2.h>
    #include <ws2tcpip.h>
    #include <windows.h>
    #include <shellapi.h>
    #pragma comment(lib, "ws2_32.lib")
#else
    #include <sys/socket.h>
    #include <netinet/in.h>
    #include <netinet/tcp.h>
    #include <arpa/inet.h>
    #include <unistd.h>
    #include <signal.h>
    #include <sys/select.h>
    #include <sys/stat.h>
    #include <fcntl.h>
#endif

namespace fs = std::filesystem;

class MemoryPool {
private:
    static constexpr size_t POOL_SIZE = 1024 * 1024; // 1MB
    static constexpr size_t BLOCK_SIZE = 4096;
    
    std::vector<std::array<char, BLOCK_SIZE>> blocks;
    std::vector<bool> used;
    std::mutex poolMutex;
    
public:
    MemoryPool() {
        size_t numBlocks = POOL_SIZE / BLOCK_SIZE;
        blocks.reserve(numBlocks);
        used.reserve(numBlocks);
        
        for (size_t i = 0; i < numBlocks; ++i) {
            blocks.emplace_back();
            used.push_back(false);
        }
    }
    
    char* acquire() {
        std::lock_guard<std::mutex> lock(poolMutex);
        for (size_t i = 0; i < used.size(); ++i) {
            if (!used[i]) {
                used[i] = true;
                return blocks[i].data();
            }
        }
        return nullptr; // He just tried lol
    }
    
    void release(char* ptr) {
        std::lock_guard<std::mutex> lock(poolMutex);
        for (size_t i = 0; i < blocks.size(); ++i) {
            if (blocks[i].data() == ptr) {
                used[i] = false;
                return;
            }
        }
    }
};

// RAII
class PooledBuffer {
private:
    MemoryPool& pool;
    char* buffer;
    
public:
    PooledBuffer(MemoryPool& p) : pool(p), buffer(p.acquire()) {}
    ~PooledBuffer() { if (buffer) pool.release(buffer); }
    
    char* get() const { return buffer; }
    bool valid() const { return buffer != nullptr; }
    
    PooledBuffer(const PooledBuffer&) = delete;
    PooledBuffer& operator=(const PooledBuffer&) = delete;
    
    PooledBuffer(PooledBuffer&& other) noexcept 
        : pool(other.pool), buffer(other.buffer) {
        other.buffer = nullptr;
    }
};

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
        
        if (valid) {
            int flags = fcntl(sock, F_GETFL, 0);
            fcntl(sock, F_SETFL, flags | O_NONBLOCK);
        }
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
        
#ifdef _WIN32
        setsockopt(sock, IPPROTO_TCP, TCP_NODELAY, (char*)&opt, sizeof(opt));
#else
        setsockopt(sock, IPPROTO_TCP, TCP_NODELAY, &opt, sizeof(opt));
#endif
        
        return ::bind(sock, (struct sockaddr*)&addr, sizeof(addr)) == 0;
    }
    
    bool listen(int backlog = 128) { // backlog
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
    
    bool send(std::string_view data) {
        if (!valid) return false;
        size_t sent = 0;
        while (sent < data.size()) {
            int result = ::send(sock, data.data() + sent, data.size() - sent, 0);
            if (result <= 0) return false;
            sent += result;
        }
        return true;
    }
    
    int recv(char* buffer, int maxSize) {
        if (!valid) return -1;
        return ::recv(sock, buffer, maxSize, 0);
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
    void log(std::string_view message) {
        std::lock_guard<std::mutex> lock(logMutex);
        
        auto now = std::chrono::system_clock::now();
        auto time_t = std::chrono::system_clock::to_time_t(now);
        auto tm = *std::localtime(&time_t);
        
        std::cout << "[" << std::put_time(&tm, "%H:%M:%S") << "] " << message << std::endl;
    }
    
    void info(std::string_view message) { log(std::string("INFO: ") + std::string(message)); }
    void warn(std::string_view message) { log(std::string("WARN: ") + std::string(message)); }
    void error(std::string_view message) { log(std::string("ERROR: ") + std::string(message)); }
};

class FileCache {
private:
    struct CacheEntry {
        std::string content;
        fs::file_time_type lastModified;
        size_t size;
    };
    
    std::unordered_map<std::string, CacheEntry> cache;
    std::mutex cacheMutex;
    static constexpr size_t MAX_CACHE_SIZE = 50 * 1024 * 1024; // 50MB
    size_t currentCacheSize = 0;
    
public:
    std::string getFile(const std::string& filename) {
        std::lock_guard<std::mutex> lock(cacheMutex);
        
        if (!fs::exists(filename)) {
            return "";
        }
        
        auto lastWrite = fs::last_write_time(filename);
        
        auto it = cache.find(filename);
        if (it != cache.end() && it->second.lastModified == lastWrite) {
            return it->second.content;
        }
        
        std::ifstream file(filename, std::ios::binary);
        if (!file.is_open()) {
            return "";
        }
        
        std::string content((std::istreambuf_iterator<char>(file)),
                           std::istreambuf_iterator<char>());
        
        if (currentCacheSize + content.size() > MAX_CACHE_SIZE) {
            clearCache();
        }
        
        cache[filename] = {content, lastWrite, content.size()};
        currentCacheSize += content.size();
        
        return content;
    }
    
private:
    void clearCache() {
        cache.clear();
        currentCacheSize = 0;
    }
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
    FileCache fileCache;
    MemoryPool memoryPool;
    int port;
    
    static const std::unordered_map<std::string, std::string> mimeTypes;
    static const std::vector<std::string> watchedExtensions;
    
    static const std::string notFoundResponse;
    static const std::string liveReloadScript;

public:
    HTTPServer(int p = 3000) : port(p) {
        lastCheckTime = fs::file_time_type::clock::now();
    }
    
    ~HTTPServer() {
        stop();
    }
    
    bool start() {
#ifdef _WIN32
        WSADATA wsa;
        if (WSAStartup(MAKEWORD(2, 2), &wsa) != 0) {
            logger.error("WSAStartup failed");
            return false;
        }
#endif
        
        if (!serverSocket.create()) {
            logger.error("Failed to create socket");
            return false;
        }
        
        if (!serverSocket.bind(port)) {
            logger.error("Failed to bind to port " + std::to_string(port));
            return false;
        }
        
        if (!serverSocket.listen()) {
            logger.error("Failed to listen on socket");
            return false;
        }
        
        running = true;
        
        serverThread = std::thread([this]() {
            while (running) {
                Socket client = serverSocket.accept();
                if (client.isValid()) {
                    std::thread([this](Socket client) {
                        handleClient(std::move(client));
                    }, std::move(client)).detach();
                }
            }
        });
        
        watcherThread = std::thread([this]() {
            while (running) {
                checkFilesModified();
                std::this_thread::sleep_for(std::chrono::milliseconds(250)); // Reduced interval
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
    void handleClient(Socket client) {
        PooledBuffer buffer(memoryPool);
        if (!buffer.valid()) {
            logger.warn("Memory pool exhausted");
            return;
        }
        
        int bytesRead = client.recv(buffer.get(), 4096);
        if (bytesRead <= 0) return;
        
        std::string_view request(buffer.get(), bytesRead);
        
        auto firstSpace = request.find(' ');
        if (firstSpace == std::string_view::npos) return;
        
        auto secondSpace = request.find(' ', firstSpace + 1);
        if (secondSpace == std::string_view::npos) return;
        
        std::string_view method = request.substr(0, firstSpace);
        std::string_view path = request.substr(firstSpace + 1, secondSpace - firstSpace - 1);
        
        if (path == "/reload") {
            serveReload(client);
        } else if (path == "/live-reload.js") {
            serveLiveReloadScript(client);
        } else {
            std::string filename = (path == "/") ? "index.html" : std::string(path.substr(1));
            serveFile(client, filename);
        }
    }
    
    void serveFile(Socket& client, const std::string& filename) {
        std::string content = fileCache.getFile(filename);
        
        if (content.empty()) {
            client.send(notFoundResponse);
            return;
        }
        
        if (filename.ends_with(".html")) {
            injectLiveReloadScript(content);
        }
        
        std::string mimeType = getMimeType(filename);
        
        std::string response;
        response.reserve(content.size() + 256);
        
        response = "HTTP/1.1 200 OK\r\n"
                  "Content-Type: ";
        response += mimeType;
        response += "\r\nContent-Length: ";
        response += std::to_string(content.length());
        response += "\r\nCache-Control: no-store, no-cache, must-revalidate, max-age=0\r\n"
                   "Pragma: no-cache\r\n"
                   "Expires: 0\r\n"
                   "Access-Control-Allow-Origin: *\r\n\r\n";
        response += content;
        
        client.send(response);
        logger.info("Served: " + filename + " (" + std::to_string(content.length()) + " bytes)");
    }
    
    void serveReload(Socket& client) {
        bool shouldReload = filesChanged.exchange(false);
        
        std::string response = "HTTP/1.1 200 OK\r\n"
                              "Content-Type: application/json\r\n"
                              "Access-Control-Allow-Origin: *\r\n"
                              "Cache-Control: no-store, no-cache, must-revalidate, max-age=0\r\n"
                              "Pragma: no-cache\r\n"
                              "Expires: 0\r\n\r\n{\"reload\":";
        response += shouldReload ? "true" : "false";
        response += "}";
        
        client.send(response);
    }
    
    void serveLiveReloadScript(Socket& client) {
        std::string response = "HTTP/1.1 200 OK\r\n"
                              "Content-Type: application/javascript\r\n"
                              "Content-Length: " + std::to_string(liveReloadScript.length()) + "\r\n"
                              "Cache-Control: no-store, no-cache, must-revalidate, max-age=0\r\n"
                              "Pragma: no-cache\r\n"
                              "Expires: 0\r\n\r\n" + liveReloadScript;
        
        client.send(response);
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
        static const std::string script = "<script src=\"/live-reload.js\"></script>";
        
        size_t bodyPos = content.find("</body>");
        if (bodyPos != std::string::npos) {
            content.insert(bodyPos, script);
        } else {
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

const std::unordered_map<std::string, std::string> HTTPServer::mimeTypes = {
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

const std::vector<std::string> HTTPServer::watchedExtensions = {
    ".html", ".css", ".js", ".json"
};

const std::string HTTPServer::notFoundResponse = 
    "HTTP/1.1 404 Not Found\r\n"
    "Content-Type: text/html\r\n"
    "Content-Length: 187\r\n\r\n"
    "<!DOCTYPE html><html><head><title>404</title></head>"
    "<body><h1>404 - Not Found</h1><p>File not found.</p></body></html>";

const std::string HTTPServer::liveReloadScript = R"(
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

// Main application
class LiveServer {
private:
    HTTPServer server;
    Logger logger;
    std::atomic<bool> running{true};
    std::chrono::steady_clock::time_point lastLogResetTime;
    const std::chrono::minutes logResetInterval{5};
    const bool AUTO_CLEAR_ENABLED{true}; 

    void clearLog() {
#ifdef _WIN32
        system("cls");
#else
        system("clear");
#endif
        logger.info("=== LOG CLEARED ===");
        logger.info("Server still running on: http://localhost:" + std::to_string(server.getPort()));
        logger.info("Press Ctrl+C to stop");
        logger.info("Linux/macOS: Send 'kill -USR1 <PID>' for manual clear");
        logger.info("==================");
    }

public:
    LiveServer(int port = 3000) : server(port) {}
    
    bool start() {
        logger.info("Starting Live Server...");
        
        if (!server.start()) {
            logger.error("Failed to start server");
            return false;
        }
        
        logger.info("Server ready!");
        logger.info("Local: http://localhost:" + std::to_string(server.getPort()));
        logger.info("Press Ctrl+C to stop");
        
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
        
        logger.info("=== LOG CLEAR OPTIONS ===");
        logger.info("Auto clear: Every 5 minutes");
        logger.info("Manual clear: Send SIGUSR1 signal (Linux/macOS) or modify code");
        logger.info("Disable auto clear: Set AUTO_CLEAR_ENABLED = false");
        logger.info("========================");
        
#ifndef _WIN32
        static auto clearLogHandler = [](int signal, LiveServer* server) {
            if (server) {
                server->clearLog();
                server->logger.info("Manual log clear triggered");
            }
        };

        if (signal(SIGUSR1, [](int sig){ clearLogHandler(sig, nullptr); }) == SIG_ERR) {
            logger.error("Failed to register SIGUSR1 handler");
        }
#endif

        while (running) {
            std::this_thread::sleep_for(std::chrono::seconds(1));

            // Auto clear if in use
            if (this->AUTO_CLEAR_ENABLED && 
                std::chrono::duration_cast<std::chrono::minutes>(std::chrono::steady_clock::now() - lastLogResetTime) >= logResetInterval) {
                clearLog();
                lastLogResetTime = std::chrono::steady_clock::now();
            }
        }
    }
    
    void stop() {
        running = false;
        server.stop();
    }
};

int main(int argc, char* argv[]) {
    int port = 3000;
    
    if (argc > 1) {
        port = std::atoi(argv[1]);
        if (port <= 0 || port > 65535) {
            std::cerr << "Invalid port number. Using default port 3000." << std::endl;
            port = 3000;
        }
    }
    
    try {
        LiveServer app(port);
        
        if (!app.start()) {
            std::cerr << "Failed to start server" << std::endl;
            return 1;
        }
        
        app.run();
    } catch (const std::exception& e) {
        std::cerr << "Exception: " << e.what() << std::endl;
        return 1;
    }
    
    return 0;
}

/*    
    WINDOWS (MinGW):
    g++ -x c++ -std=c++20 -static -O3 -DNDEBUG -flto -march=native LiveServer.cpp -o LiveServer.exe -lstdc++ -lws2_32
    
    LINUX:
    g++ -std=c++20 -O3 -DNDEBUG -flto -march=native LiveServer.cpp -o LiveServer -lpthread
    
    macOS:
    g++ -std=c++20 -O3 -DNDEBUG -flto -march=native LiveServer.cpp -o LiveServer
    
    - O3
    - DNDEBUG
    - flto Link-time
    - march=native CPU
*/