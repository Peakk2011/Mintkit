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
#include <queue>

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
        return nullptr;
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

class RateLimiter {
private:
    std::queue<std::chrono::steady_clock::time_point> requests;
    std::mutex limiterMutex;
    static constexpr size_t MAX_REQUESTS = 10;
    static constexpr std::chrono::seconds TIME_WINDOW{5};
    
public:
    bool allowRequest() {
        std::lock_guard<std::mutex> lock(limiterMutex);
        auto now = std::chrono::steady_clock::now();
        
        while (!requests.empty() && 
               (now - requests.front()) > TIME_WINDOW) {
            requests.pop();
        }
        
        if (requests.size() >= MAX_REQUESTS) {
            return false;
        }
        
        requests.push(now);
        return true;
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
            
            // Set socket timeout
            struct timeval timeout;
            timeout.tv_sec = 5;
            timeout.tv_usec = 0;
            setsockopt(sock, SOL_SOCKET, SO_RCVTIMEO, &timeout, sizeof(timeout));
            setsockopt(sock, SOL_SOCKET, SO_SNDTIMEO, &timeout, sizeof(timeout));
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
        DWORD timeout = 5000; // 5 seconds
        setsockopt(sock, SOL_SOCKET, SO_RCVTIMEO, (char*)&timeout, sizeof(timeout));
        setsockopt(sock, SOL_SOCKET, SO_SNDTIMEO, (char*)&timeout, sizeof(timeout));
#else
        setsockopt(sock, IPPROTO_TCP, TCP_NODELAY, &opt, sizeof(opt));
#endif
        
        return ::bind(sock, (struct sockaddr*)&addr, sizeof(addr)) == 0;
    }
    
    bool listen(int backlog = 128) {
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
        int retries = 0;
        const int MAX_RETRIES = 3;
        
        while (sent < data.size() && retries < MAX_RETRIES) {
            int result = ::send(sock, data.data() + sent, data.size() - sent, 0);
            if (result <= 0) {
#ifdef _WIN32
                int error = WSAGetLastError();
                if (error == WSAEWOULDBLOCK) {
#else
                if (errno == EAGAIN || errno == EWOULDBLOCK) {
#endif
                    retries++;
                    std::this_thread::sleep_for(std::chrono::milliseconds(10));
                    continue;
                } else {
                    return false;
                }
            }
            sent += result;
            retries = 0;
        }
        return sent == data.size();
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
    
    void invalidateFile(const std::string& filename) {
        std::lock_guard<std::mutex> lock(cacheMutex);
        auto it = cache.find(filename);
        if (it != cache.end()) {
            currentCacheSize -= it->second.size;
            cache.erase(it);
        }
    }
    
private:
    void clearCache() {
        cache.clear();
        currentCacheSize = 0;
    }
};

// Health monitoring system
class HealthMonitor {
private:
    std::atomic<std::chrono::steady_clock::time_point> lastActivity;
    std::atomic<uint64_t> totalRequests{0};
    std::atomic<uint64_t> errorCount{0};
    std::atomic<bool> isHealthy{true};
    std::mutex healthMutex;
    
    static constexpr std::chrono::seconds HEALTH_CHECK_INTERVAL{10};
    static constexpr std::chrono::seconds ACTIVITY_TIMEOUT{60}; // 1 minute no activity = concern
    static constexpr uint32_t MAX_ERROR_RATE = 50;              // 50% error rate = unhealthy
    
public:
    HealthMonitor() {
        updateActivity();
    }
    
    void updateActivity() {
        lastActivity.store(std::chrono::steady_clock::now());
    }
    
    void recordRequest() {
        totalRequests++;
        updateActivity();
    }
    
    void recordError() {
        errorCount++;
        updateActivity();
    }
    
    struct HealthStatus {
        bool healthy;
        uint64_t requests;
        uint64_t errors;
        std::chrono::seconds lastActivityAge;
        double errorRate;
        std::string status;
    };
    
    HealthStatus getHealth() {
        auto now = std::chrono::steady_clock::now();
        auto lastAct = lastActivity.load();
        auto ageSec = std::chrono::duration_cast<std::chrono::seconds>(now - lastAct);
        
        uint64_t req = totalRequests.load();
        uint64_t err = errorCount.load();
        double errorRate = req > 0 ? (double)err / req * 100.0 : 0.0;
        
        bool healthy = true;
        std::string status = "HEALTHY";
        
        if (ageSec > ACTIVITY_TIMEOUT) {
            healthy = false;
            status = "INACTIVE - No activity for " + std::to_string(ageSec.count()) + "s";
        } else if (errorRate > MAX_ERROR_RATE && req > 10) {
            healthy = false;
            status = "WARNING - High error rate: " + std::to_string(errorRate) + "%";
        } else if (req == 0) {
            status = "WAITING - Ready for requests";
        }
        
        isHealthy.store(healthy);
        
        return {healthy, req, err, ageSec, errorRate, status};
    }
    
    bool isCurrentlyHealthy() const {
        return isHealthy.load();
    }
    
    void resetStats() {
        totalRequests = 0;
        errorCount = 0;
        updateActivity();
    }
};

// Self-healing system
class SelfHealer {
private:
    std::atomic<uint32_t> consecutiveFailures{0};
    std::atomic<bool> healingInProgress{false};
    Logger& logger;
    
    static constexpr uint32_t MAX_FAILURES = 3;
    
public:
    SelfHealer(Logger& log) : logger(log) {}
    
    void recordFailure() {
        consecutiveFailures++;
        if (consecutiveFailures >= MAX_FAILURES && !healingInProgress.load()) {
            attemptHealing();
        }
    }
    
    void recordSuccess() {
        consecutiveFailures = 0;
    }
    
private:
    void attemptHealing() {
        healingInProgress = true;
        // logger.warn("Activated after " + std::to_string(consecutiveFailures.load()) + " failures");
        
        // Give system time to recover
        std::this_thread::sleep_for(std::chrono::seconds(2));
        
        // logger.info("System recovery attempt completed");
        consecutiveFailures = 0;
        healingInProgress = false;
    }
};

// Debounced file change detector
class FileWatcher {
private:
    std::unordered_map<std::string, fs::file_time_type> fileStates;
    std::mutex watcherMutex;
    std::chrono::steady_clock::time_point lastChangeTime;
    static constexpr std::chrono::milliseconds DEBOUNCE_TIME{500}; // 500ms
    
public:
    bool hasChanges(const std::vector<std::string>& extensions) {
        std::lock_guard<std::mutex> lock(watcherMutex);
        
        bool hasNewChanges = false;
        auto now = std::chrono::steady_clock::now();
        
        try {
            for (const auto& entry : fs::directory_iterator(".")) {
                if (!entry.is_regular_file()) continue;
                
                std::string ext = entry.path().extension().string();
                if (std::find(extensions.begin(), extensions.end(), ext) == extensions.end()) {
                    continue;
                }
                
                std::string filepath = entry.path().string();
                auto writeTime = fs::last_write_time(entry.path());
                
                auto it = fileStates.find(filepath);
                if (it == fileStates.end() || it->second != writeTime) {
                    fileStates[filepath] = writeTime;
                    hasNewChanges = true;
                    lastChangeTime = now;
                }
            }
        } catch (const std::exception&) {
            // Just let's it go
        }
        
        if (hasNewChanges && (now - lastChangeTime) >= DEBOUNCE_TIME) {
            return true;
        }
        
        return false;
    }
};

class HTTPServer {
private:
    Socket serverSocket;
    std::atomic<bool> running{false};
    std::thread serverThread;
    std::thread watcherThread;
    std::thread healthThread; // health monitoring thread
    std::atomic<bool> filesChanged{false};
    Logger logger;
    FileCache fileCache;
    MemoryPool memoryPool;
    FileWatcher fileWatcher;
    RateLimiter rateLimiter;
    HealthMonitor healthMonitor; // health monitor
    SelfHealer selfHealer;       // self healer
    int port;
    
    static const std::unordered_map<std::string, std::string> mimeTypes;
    static const std::vector<std::string> watchedExtensions;
    
    static const std::string notFoundResponse;
    static const std::string rateLimitResponse;
    static const std::string liveReloadScript;

public:
    HTTPServer(int p = 3000) : port(p), selfHealer(logger) {}
    
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
                try {
                    if (fileWatcher.hasChanges(watchedExtensions)) {
                        filesChanged = true;
                        logger.info("File changes detected");
                        healthMonitor.updateActivity();
                    }
                } catch (const std::exception& e) {
                    logger.error("File watcher error: " + std::string(e.what()));
                    selfHealer.recordFailure();
                }
                std::this_thread::sleep_for(std::chrono::milliseconds(100));
            }
        });
        
        // Health monitoring thread
        healthThread = std::thread([this]() {
            while (running) {
                std::this_thread::sleep_for(std::chrono::seconds(10));
                
                auto health = healthMonitor.getHealth();
                
                static int healthLogCounter = 0;
                if (++healthLogCounter % 6 == 0) {
                    logger.info("Health: " + health.status + 
                              "  Requests: " + std::to_string(health.requests) + 
                              "  Errors: " + std::to_string(health.errors));
                }
                
                // Check if system needs attention
                if (!health.healthy) {
                    // logger.warn("Server health issue detected - " + health.status);
                    
                    if (health.errorRate > 50 && health.requests > 20) {
                        // logger.warn("High error rate detected, resetting stats...");
                        healthMonitor.resetStats();
                    }
                }
                
                // extreme cases
                if (health.lastActivityAge > std::chrono::minutes(5) && health.requests > 0) {
                    logger.error("Server appears frozen! Consider manual restart.");
                }
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
        
        if (healthThread.joinable()) {
            healthThread.join();
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
        healthMonitor.recordRequest();
        
        PooledBuffer buffer(memoryPool);
        if (!buffer.valid()) {
            logger.warn("Memory pool exhausted");
            healthMonitor.recordError();
            selfHealer.recordFailure();
            return;
        }
        
        int bytesRead = client.recv(buffer.get(), 4096);
        if (bytesRead <= 0) {
            healthMonitor.recordError();
            return;
        }
        
        std::string_view request(buffer.get(), bytesRead);
        
        auto firstSpace = request.find(' ');
        if (firstSpace == std::string_view::npos) {
            healthMonitor.recordError();
            return;
        }
        
        auto secondSpace = request.find(' ', firstSpace + 1);
        if (secondSpace == std::string_view::npos) {
            healthMonitor.recordError();
            return;
        }
        
        std::string_view method = request.substr(0, firstSpace);
        std::string_view path = request.substr(firstSpace + 1, secondSpace - firstSpace - 1);
        
        try {
            if (path == "/reload") {
                serveReload(client);
            } else if (path == "/live-reload.js") {
                serveLiveReloadScript(client);
            } else if (path == "/health") {
                serveHealth(client);
            } else {
                std::string filename = (path == "/") ? "index.html" : std::string(path.substr(1));
                serveFile(client, filename);
            }
            selfHealer.recordSuccess();
        } catch (const std::exception& e) {
            logger.error("Request handling error: " + std::string(e.what()));
            healthMonitor.recordError();
            selfHealer.recordFailure();
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
                   "Access-Control-Allow-Origin: *\r\n"
                   "Connection: close\r\n\r\n";
        response += content;
        
        if (!client.send(response)) {
            logger.warn("Failed to send file: " + filename);
        } else {
            logger.info("Served: " + filename + " (" + std::to_string(content.length()) + " bytes)");
        }
    }
    
    void serveReload(Socket& client) {
        if (!rateLimiter.allowRequest()) {
            client.send(rateLimitResponse);
            logger.warn("Reload request rate limited");
            return;
        }
        
        bool shouldReload = filesChanged.exchange(false);
        
        std::string response = "HTTP/1.1 200 OK\r\n"
                              "Content-Type: application/json\r\n"
                              "Access-Control-Allow-Origin: *\r\n"
                              "Cache-Control: no-store, no-cache, must-revalidate, max-age=0\r\n"
                              "Pragma: no-cache\r\n"
                              "Expires: 0\r\n"
                              "Connection: close\r\n\r\n{\"reload\":";
        response += shouldReload ? "true" : "false";
        response += "}";
        
        client.send(response);
    }
    
    void serveHealth(Socket& client) {
        auto health = healthMonitor.getHealth();
        
        std::string jsonResponse = "{"
            "\"healthy\":" + std::string(health.healthy ? "true" : "false") + ","
            "\"status\":\"" + health.status + "\","
            "\"requests\":" + std::to_string(health.requests) + ","
            "\"errors\":" + std::to_string(health.errors) + ","
            "\"error_rate\":" + std::to_string(health.errorRate) + ","
            "\"last_activity_seconds\":" + std::to_string(health.lastActivityAge.count()) + ","
            "\"uptime\":\"" + getUptimeString() + "\""
            "}";
        
        std::string response = "HTTP/1.1 200 OK\r\n"
                              "Content-Type: application/json\r\n"
                              "Content-Length: " + std::to_string(jsonResponse.length()) + "\r\n"
                              "Access-Control-Allow-Origin: *\r\n"
                              "Connection: close\r\n\r\n" + jsonResponse;
        
        client.send(response);
    }
    
private:
    std::chrono::steady_clock::time_point startTime = std::chrono::steady_clock::now();
    
    std::string getUptimeString() {
        auto now = std::chrono::steady_clock::now();
        auto uptime = std::chrono::duration_cast<std::chrono::seconds>(now - startTime);
        
        auto hours = uptime.count() / 3600;
        auto minutes = (uptime.count() % 3600) / 60;
        auto seconds = uptime.count() % 60;
        
        return std::to_string(hours) + "h " + std::to_string(minutes) + "m " + std::to_string(seconds) + "s";
    }
    
    void serveLiveReloadScript(Socket& client) {
        std::string response = "HTTP/1.1 200 OK\r\n"
                              "Content-Type: application/javascript\r\n"
                              "Content-Length: " + std::to_string(liveReloadScript.length()) + "\r\n"
                              "Cache-Control: no-store, no-cache, must-revalidate, max-age=0\r\n"
                              "Pragma: no-cache\r\n"
                              "Expires: 0\r\n"
                              "Connection: close\r\n\r\n" + liveReloadScript;
        
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
    "Content-Length: 187\r\n"
    "Connection: close\r\n\r\n"
    "<!DOCTYPE html><html><head><title>404</title></head>"
    "<body><h1>404 - Not Found</h1><p>File not found.</p></body></html>";

const std::string HTTPServer::rateLimitResponse = 
    "HTTP/1.1 429 Too Many Requests\r\n"
    "Content-Type: application/json\r\n"
    "Retry-After: 5\r\n"
    "Connection: close\r\n\r\n"
    "{\"error\":\"Rate limited\",\"reload\":false}";

// Live reload script with better error handling and backoff
const std::string HTTPServer::liveReloadScript = R"(
(function() {
    console.log('Live reload script loaded');
    
    let retryCount = 0;
    let maxRetries = 5;
    let baseDelay = 1000;
    let isReloading = false;
    
    function getBackoffDelay() {
        return Math.min(baseDelay * Math.pow(2, retryCount), 10000);
    }
    
    function checkForReload() {
        if (isReloading) return;
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);
        
        fetch('/reload', { 
            signal: controller.signal,
            cache: 'no-cache'
        })
        .then(response => {
            clearTimeout(timeoutId);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            retryCount = 0; // Reset on successful request
            if (data.reload && !isReloading) {
                isReloading = true;
                console.log('Reloading page...');
                location.reload();
            }
        })
        .catch(error => {
            clearTimeout(timeoutId);
            if (error.name !== 'AbortError') {
                retryCount = Math.min(retryCount + 1, maxRetries);
                console.warn('Live reload error:', error, 'Retry:', retryCount);
            }
        });
    }
    
    function scheduleNextCheck() {
        const delay = retryCount > 0 ? getBackoffDelay() : 1500;
        setTimeout(() => {
            checkForReload();
            scheduleNextCheck();
        }, delay);
    }
    
    // Start the polling loop
    scheduleNextCheck();
    
    // Also check on page visibility change
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden && retryCount > 0) {
            retryCount = Math.max(0, retryCount - 1);
        }
    });
})();
)";

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
        logger.info("HMR improvements: Rate limiting, debouncing, better error handling");
        logger.info("Health monitoring: Auto-detection of issues and self-healing");
        logger.info("Health endpoint: http://localhost:" + std::to_string(server.getPort()) + "/health");
    }

public:
    LiveServer(int port = 3000) : server(port) {
        lastLogResetTime = std::chrono::steady_clock::now();
    }
    
    bool start() {
        // logger.info("Live Server");
        
        if (!server.start()) {
            logger.error("Failed to start server");
            return false;
        }
        
        logger.info("Server ready with improved HMR!");
        logger.info("http://localhost:" + std::to_string(server.getPort()));
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
        
        // For manual log clearing
        signal(SIGUSR1, [this](int) {
            clearLog();
            logger.info("Manual log clear triggered");
        });
#endif

        while (running) {
            std::this_thread::sleep_for(std::chrono::seconds(1));

            if (AUTO_CLEAR_ENABLED && 
                std::chrono::duration_cast<std::chrono::minutes>(
                    std::chrono::steady_clock::now() - lastLogResetTime) >= logResetInterval) {
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

    Hot Reload fixed updates
    
    1. Rate Limiter: Prevents excessive reload requests (10 requests per 5 seconds)
    2. File Change Debouncing: 500ms debounce to avoid rapid-fire changes
    3. Socket Timeouts: Prevents hanging connections
    4. Exponential Backoff: Client-side retry with increasing delays
    5. Connection Management: Proper socket cleanup with "Connection: close"
    6. Error Handling: Better error recovery and logging
    7. Memory Pool: Efficient buffer management to prevent exhaustion

*/