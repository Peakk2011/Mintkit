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
#include <list>

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

// Improved memory pool with better tracking and cleanup
class MemoryPool {
private:
    static constexpr size_t POOL_SIZE = 2 * 1024 * 1024; // 2MB pool
    static constexpr size_t BLOCK_SIZE = 8192; // Larger blocks for better performance
    static constexpr size_t MAX_BLOCKS = POOL_SIZE / BLOCK_SIZE;
    
    struct Block {
        std::array<char, BLOCK_SIZE> data;
        std::atomic<bool> inUse{false};
        std::chrono::steady_clock::time_point lastUsed;
    };
    
    std::vector<std::unique_ptr<Block>> blocks;
    std::mutex poolMutex;
    std::atomic<size_t> activeBlocks{0};
    std::atomic<size_t> totalAllocations{0};
    
public:
    MemoryPool() {
        blocks.reserve(MAX_BLOCKS);
        for (size_t i = 0; i < MAX_BLOCKS; ++i) {
            blocks.push_back(std::make_unique<Block>());
        }
    }
    
    char* acquire() {
        std::lock_guard<std::mutex> lock(poolMutex);
        
        // Find available block
        for (auto& block : blocks) {
            bool expected = false;
            if (block->inUse.compare_exchange_strong(expected, true)) {
                block->lastUsed = std::chrono::steady_clock::now();
                activeBlocks++;
                totalAllocations++;
                return block->data.data();
            }
        }
        
        // Pool exhausted - try emergency cleanup
        cleanupStaleBlocks();
        
        // Try once more after cleanup
        for (auto& block : blocks) {
            bool expected = false;
            if (block->inUse.compare_exchange_strong(expected, true)) {
                block->lastUsed = std::chrono::steady_clock::now();
                activeBlocks++;
                totalAllocations++;
                return block->data.data();
            }
        }
        
        return nullptr; // Pool truly exhausted
    }
    
    void release(char* ptr) {
        if (!ptr) return;
        
        std::lock_guard<std::mutex> lock(poolMutex);
        for (auto& block : blocks) {
            if (block->data.data() == ptr) {
                block->inUse = false;
                activeBlocks--;
                return;
            }
        }
    }
    
    void cleanupStaleBlocks() {
        auto now = std::chrono::steady_clock::now();
        constexpr auto STALE_TIME = std::chrono::seconds(30);
        
        for (auto& block : blocks) {
            if (block->inUse.load() && 
                (now - block->lastUsed) > STALE_TIME) {
                // Force release stale blocks (potential leak recovery)
                block->inUse = false;
                activeBlocks--;
            }
        }
    }
    
    size_t getActiveBlocks() const { return activeBlocks.load(); }
    size_t getTotalAllocations() const { return totalAllocations.load(); }
    double getUtilization() const { 
        return static_cast<double>(activeBlocks.load()) / MAX_BLOCKS * 100.0; 
    }
};

// RAII buffer wrapper with automatic cleanup
class PooledBuffer {
private:
    MemoryPool& pool;
    char* buffer;
    
public:
    explicit PooledBuffer(MemoryPool& p) : pool(p), buffer(p.acquire()) {}
    
    ~PooledBuffer() { 
        if (buffer) {
            pool.release(buffer); 
        }
    }
    
    char* get() const { return buffer; }
    bool valid() const { return buffer != nullptr; }
    size_t size() const { return 8192; } // BLOCK_SIZE
    
    // Prevent copying
    PooledBuffer(const PooledBuffer&) = delete;
    PooledBuffer& operator=(const PooledBuffer&) = delete;
    
    // Allow moving
    PooledBuffer(PooledBuffer&& other) noexcept 
        : pool(other.pool), buffer(other.buffer) {
        other.buffer = nullptr;
    }
};

// Improved rate limiter with sliding window
class RateLimiter {
private:
    std::queue<std::chrono::steady_clock::time_point> requests;
    std::mutex limiterMutex;
    static constexpr size_t MAX_REQUESTS = 15; // Slightly more permissive
    static constexpr std::chrono::seconds TIME_WINDOW{5};
    
public:
    bool allowRequest() {
        std::lock_guard<std::mutex> lock(limiterMutex);
        auto now = std::chrono::steady_clock::now();
        
        // Remove old requests outside time window
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
    
    size_t getCurrentRequests() const {
        return requests.size();
    }
};

// Enhanced socket with better error handling and cleanup
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
        
        if (valid) {
            DWORD timeout = 3000; // 3 seconds
            setsockopt(sock, SOL_SOCKET, SO_RCVTIMEO, (char*)&timeout, sizeof(timeout));
            setsockopt(sock, SOL_SOCKET, SO_SNDTIMEO, (char*)&timeout, sizeof(timeout));
        }
#else
        sock = socket(AF_INET, SOCK_STREAM, 0);
        valid = (sock >= 0);
        
        if (valid) {
            // Set non-blocking mode
            int flags = fcntl(sock, F_GETFL, 0);
            fcntl(sock, F_SETFL, flags | O_NONBLOCK);
            
            // Set socket timeouts
            struct timeval timeout;
            timeout.tv_sec = 3;
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
#else
        setsockopt(sock, IPPROTO_TCP, TCP_NODELAY, &opt, sizeof(opt));
#endif
        
        return ::bind(sock, (struct sockaddr*)&addr, sizeof(addr)) == 0;
    }
    
    bool listen(int backlog = 64) { // Reduced backlog to prevent resource exhaustion
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
        if (!valid || data.empty()) return false;
        
        size_t sent = 0;
        int retries = 0;
        const int MAX_RETRIES = 2; // Reduced retries to fail faster
        
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
                    std::this_thread::sleep_for(std::chrono::milliseconds(5));
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
            shutdown(sock, SD_BOTH);
            closesocket(sock);
#else
            shutdown(sock, SHUT_RDWR);
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

// Improved file cache with LRU eviction and better memory management
class FileCache {
private:
    struct CacheEntry {
        std::string content;
        fs::file_time_type lastModified;
        size_t size;
        std::chrono::steady_clock::time_point lastAccessed;
        
        CacheEntry(std::string c, fs::file_time_type mod, size_t s) 
            : content(std::move(c)), lastModified(mod), size(s), 
              lastAccessed(std::chrono::steady_clock::now()) {}
    };
    
    std::unordered_map<std::string, std::unique_ptr<CacheEntry>> cache;
    std::mutex cacheMutex;
    
    // Reduced cache limits to prevent memory issues
    static constexpr size_t MAX_CACHE_SIZE = 20 * 1024 * 1024; // 20MB max
    static constexpr size_t MAX_FILE_SIZE = 5 * 1024 * 1024;   // 5MB per file max
    static constexpr size_t MAX_CACHE_ENTRIES = 100;           // Max 100 files cached
    
    std::atomic<size_t> currentCacheSize{0};
    
public:
    std::string getFile(const std::string& filename) {
        std::lock_guard<std::mutex> lock(cacheMutex);
        
        try {
            if (!fs::exists(filename)) {
                return "";
            }
            
            // Check file size before reading
            auto fileSize = fs::file_size(filename);
            if (fileSize > MAX_FILE_SIZE) {
                // Don't cache large files, read directly
                return readFileDirect(filename);
            }
            
            auto lastWrite = fs::last_write_time(filename);
            
            auto it = cache.find(filename);
            if (it != cache.end() && it->second->lastModified == lastWrite) {
                // Update access time for LRU
                it->second->lastAccessed = std::chrono::steady_clock::now();
                return it->second->content;
            }
            
            // Read file content
            std::string content = readFileDirect(filename);
            if (content.empty()) return "";
            
            // Ensure cache doesn't exceed limits
            ensureCacheSpace(content.size());
            
            // Add to cache
            auto entry = std::make_unique<CacheEntry>(content, lastWrite, content.size());
            currentCacheSize += content.size();
            cache[filename] = std::move(entry);
            
            return content;
            
        } catch (const std::exception&) {
            // File system error - return empty
            return "";
        }
    }
    
    void invalidateFile(const std::string& filename) {
        std::lock_guard<std::mutex> lock(cacheMutex);
        auto it = cache.find(filename);
        if (it != cache.end()) {
            currentCacheSize -= it->second->size;
            cache.erase(it);
        }
    }
    
    void cleanup() {
        std::lock_guard<std::mutex> lock(cacheMutex);
        
        // Remove entries older than 10 minutes
        auto cutoff = std::chrono::steady_clock::now() - std::chrono::minutes(10);
        
        auto it = cache.begin();
        while (it != cache.end()) {
            if (it->second->lastAccessed < cutoff) {
                currentCacheSize -= it->second->size;
                it = cache.erase(it);
            } else {
                ++it;
            }
        }
    }
    
    size_t getCacheSize() const { return currentCacheSize.load(); }
    size_t getCacheEntries() const { 
        std::lock_guard<std::mutex> lock(const_cast<std::mutex&>(cacheMutex));
        return cache.size(); 
    }
    
private:
    std::string readFileDirect(const std::string& filename) {
        std::ifstream file(filename, std::ios::binary);
        if (!file.is_open()) return "";
        
        // Get file size and reserve string capacity
        file.seekg(0, std::ios::end);
        size_t size = file.tellg();
        file.seekg(0, std::ios::beg);
        
        std::string content;
        content.reserve(size);
        
        // Read in chunks to avoid large allocations
        constexpr size_t CHUNK_SIZE = 8192;
        char chunk[CHUNK_SIZE];
        
        while (file.read(chunk, CHUNK_SIZE) || file.gcount() > 0) {
            content.append(chunk, file.gcount());
        }
        
        return content;
    }
    
    void ensureCacheSpace(size_t neededSize) {
        // Check if we need to free space
        while ((currentCacheSize + neededSize > MAX_CACHE_SIZE) || 
               (cache.size() >= MAX_CACHE_ENTRIES)) {
            
            if (cache.empty()) break;
            
            // Find least recently used entry
            auto oldestIt = cache.begin();
            for (auto it = cache.begin(); it != cache.end(); ++it) {
                if (it->second->lastAccessed < oldestIt->second->lastAccessed) {
                    oldestIt = it;
                }
            }
            
            // Remove oldest entry
            currentCacheSize -= oldestIt->second->size;
            cache.erase(oldestIt);
        }
    }
};

// Enhanced health monitoring with crash detection
class HealthMonitor {
private:
    std::atomic<std::chrono::steady_clock::time_point> lastActivity;
    std::atomic<uint64_t> totalRequests{0};
    std::atomic<uint64_t> errorCount{0};
    std::atomic<uint64_t> consecutiveErrors{0};
    std::atomic<bool> isHealthy{true};
    std::mutex healthMutex;
    
    // Health thresholds
    static constexpr std::chrono::seconds ACTIVITY_TIMEOUT{120}; // 2 minutes
    static constexpr uint32_t MAX_ERROR_RATE = 40;               // 40% error rate
    static constexpr uint32_t MAX_CONSECUTIVE_ERRORS = 5;        // 5 consecutive errors
    
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
        consecutiveErrors++;
        updateActivity();
    }
    
    void recordSuccess() {
        consecutiveErrors = 0; // Reset consecutive error counter
        updateActivity();
    }
    
    struct HealthStatus {
        bool healthy;
        uint64_t requests;
        uint64_t errors;
        uint64_t consecutiveErrors;
        std::chrono::seconds lastActivityAge;
        double errorRate;
        std::string status;
        bool criticalIssue;
    };
    
    HealthStatus getHealth() {
        auto now = std::chrono::steady_clock::now();
        auto lastAct = lastActivity.load();
        auto ageSec = std::chrono::duration_cast<std::chrono::seconds>(now - lastAct);
        
        uint64_t req = totalRequests.load();
        uint64_t err = errorCount.load();
        uint64_t consErr = consecutiveErrors.load();
        double errorRate = req > 0 ? (double)err / req * 100.0 : 0.0;
        
        bool healthy = true;
        bool critical = false;
        std::string status = "HEALTHY";
        
        // Check for critical issues that could lead to crashes
        if (consErr >= MAX_CONSECUTIVE_ERRORS) {
            healthy = false;
            critical = true;
            status = "CRITICAL - " + std::to_string(consErr) + " consecutive errors";
        } else if (ageSec > ACTIVITY_TIMEOUT) {
            healthy = false;
            status = "INACTIVE - No activity for " + std::to_string(ageSec.count()) + "s";
        } else if (errorRate > MAX_ERROR_RATE && req > 10) {
            healthy = false;
            status = "WARNING - High error rate: " + std::to_string(errorRate) + "%";
        } else if (req == 0) {
            status = "WAITING - Ready for requests";
        }
        
        isHealthy.store(healthy);
        
        return {healthy, req, err, consErr, ageSec, errorRate, status, critical};
    }
    
    bool isCurrentlyHealthy() const {
        return isHealthy.load();
    }
    
    void resetStats() {
        totalRequests = 0;
        errorCount = 0;
        consecutiveErrors = 0;
        updateActivity();
    }
};

// Enhanced self-healer with crash prevention
class SelfHealer {
private:
    std::atomic<uint32_t> healingAttempts{0};
    std::atomic<bool> healingInProgress{false};
    Logger& logger;
    FileCache& fileCache;
    MemoryPool& memoryPool;
    
    static constexpr uint32_t MAX_HEALING_ATTEMPTS = 3;
    
public:
    SelfHealer(Logger& log, FileCache& cache, MemoryPool& pool) 
        : logger(log), fileCache(cache), memoryPool(pool) {}
    
    void performMaintenance() {
        if (healingInProgress.load()) return;
        
        healingInProgress = true;
        
        try {
            // Clean up file cache
            fileCache.cleanup();
            
            // Clean up memory pool
            memoryPool.cleanupStaleBlocks();
            
            // Force garbage collection of any remaining resources
            std::this_thread::sleep_for(std::chrono::milliseconds(100));
            
        } catch (const std::exception& e) {
            logger.error("Maintenance error: " + std::string(e.what()));
        }
        
        healingInProgress = false;
    }
    
    void handleCriticalState(const HealthMonitor::HealthStatus& health) {
        if (!health.criticalIssue || healingInProgress.load()) return;
        
        if (healingAttempts >= MAX_HEALING_ATTEMPTS) {
            logger.error("Max healing attempts reached - manual intervention required");
            return;
        }
        
        healingInProgress = true;
        healingAttempts++;
        
        logger.warn("Critical state detected - attempting recovery " + 
                   std::to_string(healingAttempts.load()) + "/" + 
                   std::to_string(MAX_HEALING_ATTEMPTS));
        
        try {
            // Aggressive cleanup
            fileCache.cleanup();
            memoryPool.cleanupStaleBlocks();
            
            // Brief pause to let system recover
            std::this_thread::sleep_for(std::chrono::seconds(1));
            
            logger.info("Recovery attempt completed");
            
        } catch (const std::exception& e) {
            logger.error("Recovery failed: " + std::string(e.what()));
        }
        
        healingInProgress = false;
    }
    
    void resetHealingAttempts() {
        healingAttempts = 0;
    }
};

// File watcher with improved change detection
class FileWatcher {
private:
    std::unordered_map<std::string, fs::file_time_type> fileStates;
    std::mutex watcherMutex;
    std::chrono::steady_clock::time_point lastChangeTime;
    static constexpr std::chrono::milliseconds DEBOUNCE_TIME{750}; // Increased debounce
    
public:
    bool hasChanges(const std::vector<std::string>& extensions) {
        std::lock_guard<std::mutex> lock(watcherMutex);
        
        bool hasNewChanges = false;
        auto now = std::chrono::steady_clock::now();
        
        try {
            // Only scan current directory to avoid deep recursion
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
            // Silently handle filesystem errors
            return false;
        }
        
        // Return true only if changes are debounced
        return hasNewChanges && (now - lastChangeTime) >= DEBOUNCE_TIME;
    }
    
    void cleanup() {
        std::lock_guard<std::mutex> lock(watcherMutex);
        
        // Remove entries for files that no longer exist
        auto it = fileStates.begin();
        while (it != fileStates.end()) {
            if (!fs::exists(it->first)) {
                it = fileStates.erase(it);
            } else {
                ++it;
            }
        }
    }
};

class HTTPServer {
private:
    Socket serverSocket;
    std::atomic<bool> running{false};
    std::thread serverThread;
    std::thread watcherThread;
    std::thread healthThread;
    std::thread maintenanceThread; // New maintenance thread
    std::atomic<bool> filesChanged{false};
    
    Logger logger;
    FileCache fileCache;
    MemoryPool memoryPool;
    FileWatcher fileWatcher;
    RateLimiter rateLimiter;
    HealthMonitor healthMonitor;
    SelfHealer selfHealer;
    
    int port;
    std::atomic<uint32_t> activeConnections{0}; // Track active connections
    static constexpr uint32_t MAX_CONNECTIONS = 50; // Limit concurrent connections
    
    static const std::unordered_map<std::string, std::string> mimeTypes;
    static const std::vector<std::string> watchedExtensions;
    static const std::string notFoundResponse;
    static const std::string rateLimitResponse;
    static const std::string serverBusyResponse;
    static const std::string liveReloadScript;

public:
    HTTPServer(int p = 3000) : port(p), selfHealer(logger, fileCache, memoryPool) {}
    
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
        
        // Main server thread
        serverThread = std::thread([this]() {
            while (running) {
                try {
                    Socket client = serverSocket.accept();
                    if (client.isValid()) {
                        // Check connection limit
                        if (activeConnections >= MAX_CONNECTIONS) {
                            // Send busy response and close
                            client.send(serverBusyResponse);
                            continue;
                        }
                        
                        activeConnections++;
                        std::thread([this](Socket client) {
                            handleClient(std::move(client));
                            activeConnections--;
                        }, std::move(client)).detach();
                    }
                } catch (const std::exception& e) {
                    logger.error("Server thread error: " + std::string(e.what()));
                    healthMonitor.recordError();
                }
                
                // Brief yield to prevent tight loop
                std::this_thread::sleep_for(std::chrono::milliseconds(1));
            }
        });
        
        // File watcher thread
        watcherThread = std::thread([this]() {
            while (running) {
                try {
                    if (fileWatcher.hasChanges(watchedExtensions)) {
                        filesChanged = true;
                        logger.info("File changes detected");
                        healthMonitor.updateActivity();
                        
                        // Invalidate cache for changed files
                        for (const auto& ext : watchedExtensions) {
                            // Simple invalidation - could be more sophisticated
                            fileCache.invalidateFile("index.html");
                        }
                    }
                } catch (const std::exception& e) {
                    logger.error("File watcher error: " + std::string(e.what()));
                    healthMonitor.recordError();
                }
                std::this_thread::sleep_for(std::chrono::milliseconds(200));
            }
        });
        
        // Health monitoring thread
        healthThread = std::thread([this]() {
            int healthCheckCounter = 0;
            
            while (running) {
                std::this_thread::sleep_for(std::chrono::seconds(10));
                
                try {
                    auto health = healthMonitor.getHealth();
                    
                    // Log health status every minute
                    if (++healthCheckCounter % 6 == 0) {
                        logger.info("Health: " + health.status + 
                                  "  Requests: " + std::to_string(health.requests) + 
                                  "  Errors: " + std::to_string(health.errors) +
                                  "  Cache: " + std::to_string(fileCache.getCacheEntries()) + " files/" +
                                  std::to_string(fileCache.getCacheSize() / 1024) + "KB" +
                                  "  Memory: " + std::to_string(memoryPool.getUtilization()) + "%");
                    }
                    
                    // Handle critical states
                    if (health.criticalIssue) {
                        selfHealer.handleCriticalState(health);
                    } else if (health.healthy) {
                        selfHealer.resetHealingAttempts();
                    }
                    
                } catch (const std::exception& e) {
                    logger.error("Health check error: " + std::string(e.what()));
                }
            }
        });
        
        // Maintenance thread - periodic cleanup
        maintenanceThread = std::thread([this]() {
            while (running) {
                std::this_thread::sleep_for(std::chrono::minutes(2)); // Every 2 minutes
                
                try {
                    selfHealer.performMaintenance();
                    fileWatcher.cleanup();
                } catch (const std::exception& e) {
                    logger.error("Maintenance error: " + std::string(e.what()));
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
        
        if (maintenanceThread.joinable()) {
            maintenanceThread.join();
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
        // Ensure cleanup on scope exit
        struct ConnectionGuard {
            HTTPServer* server;
            ~ConnectionGuard() { 
                if (server) server->healthMonitor.updateActivity(); 
            }
        } guard{this};
        
        healthMonitor.recordRequest();
        
        PooledBuffer buffer(memoryPool);
        if (!buffer.valid()) {
            logger.warn("Memory pool exhausted - " + 
                       std::to_string(memoryPool.getUtilization()) + "% utilized");
            healthMonitor.recordError();
            client.send(serverBusyResponse);
            return;
        }
        
        int bytesRead = client.recv(buffer.get(), buffer.size() - 1);
        if (bytesRead <= 0) {
            healthMonitor.recordError();
            return;
        }
        
        // Null-terminate for safety
        buffer.get()[bytesRead] = '\0';
        std::string_view request(buffer.get(), bytesRead);
        
        // Parse HTTP request with better error handling
        auto firstSpace = request.find(' ');
        if (firstSpace == std::string_view::npos || firstSpace == 0) {
            healthMonitor.recordError();
            return;
        }
        
        auto secondSpace = request.find(' ', firstSpace + 1);
        if (secondSpace == std::string_view::npos || secondSpace <= firstSpace + 1) {
            healthMonitor.recordError();
            return;
        }
        
        std::string_view method = request.substr(0, firstSpace);
        std::string_view path = request.substr(firstSpace + 1, secondSpace - firstSpace - 1);
        
        // Only handle GET requests
        if (method != "GET") {
            healthMonitor.recordError();
            return;
        }
        
        try {
            if (path == "/reload") {
                serveReload(client);
            } else if (path == "/live-reload.js") {
                serveLiveReloadScript(client);
            } else if (path == "/health") {
                serveHealth(client);
            } else {
                std::string filename = (path == "/") ? "index.html" : std::string(path.substr(1));
                
                // Prevent directory traversal
                if (filename.find("..") != std::string::npos || 
                    filename.find("//") != std::string::npos) {
                    client.send(notFoundResponse);
                    healthMonitor.recordError();
                    return;
                }
                
                serveFile(client, filename);
            }
            healthMonitor.recordSuccess();
            
        } catch (const std::exception& e) {
            logger.error("Request handling error: " + std::string(e.what()));
            healthMonitor.recordError();
            client.send(serverBusyResponse);
        }
    }
    
    void serveFile(Socket& client, const std::string& filename) {
        try {
            std::string content = fileCache.getFile(filename);
            
            if (content.empty()) {
                client.send(notFoundResponse);
                return;
            }
            
            // Inject live reload script for HTML files
            if (filename.ends_with(".html")) {
                injectLiveReloadScript(content);
            }
            
            std::string mimeType = getMimeType(filename);
            
            // Pre-calculate response size to avoid reallocations
            size_t headerSize = 256; // Estimated header size
            std::string response;
            response.reserve(content.size() + headerSize);
            
            response = "HTTP/1.1 200 OK\r\n"
                      "Content-Type: " + mimeType + "\r\n"
                      "Content-Length: " + std::to_string(content.length()) + "\r\n"
                      "Cache-Control: no-store, no-cache, must-revalidate, max-age=0\r\n"
                      "Pragma: no-cache\r\n"
                      "Expires: 0\r\n"
                      "Access-Control-Allow-Origin: *\r\n"
                      "Connection: close\r\n\r\n";
            response += content;
            
            if (!client.send(response)) {
                logger.warn("Failed to send file: " + filename);
                healthMonitor.recordError();
            } else {
                logger.info("Served: " + filename + " (" + std::to_string(content.length()) + " bytes)");
            }
            
        } catch (const std::exception& e) {
            logger.error("File serving error: " + std::string(e.what()));
            healthMonitor.recordError();
            client.send(serverBusyResponse);
        }
    }
    
    void serveReload(Socket& client) {
        if (!rateLimiter.allowRequest()) {
            client.send(rateLimitResponse);
            logger.warn("Reload request rate limited");
            healthMonitor.recordError();
            return;
        }
        
        bool shouldReload = filesChanged.exchange(false);
        
        std::string jsonBody = "{\"reload\":" + std::string(shouldReload ? "true" : "false") + "}";
        
        std::string response = "HTTP/1.1 200 OK\r\n"
                              "Content-Type: application/json\r\n"
                              "Content-Length: " + std::to_string(jsonBody.length()) + "\r\n"
                              "Access-Control-Allow-Origin: *\r\n"
                              "Cache-Control: no-store, no-cache, must-revalidate, max-age=0\r\n"
                              "Pragma: no-cache\r\n"
                              "Expires: 0\r\n"
                              "Connection: close\r\n\r\n" + jsonBody;
        
        client.send(response);
    }
    
    void serveHealth(Socket& client) {
        auto health = healthMonitor.getHealth();
        
        std::string jsonResponse = "{"
            "\"healthy\":" + std::string(health.healthy ? "true" : "false") + ","
            "\"status\":\"" + health.status + "\","
            "\"requests\":" + std::to_string(health.requests) + ","
            "\"errors\":" + std::to_string(health.errors) + ","
            "\"consecutive_errors\":" + std::to_string(health.consecutiveErrors) + ","
            "\"error_rate\":" + std::to_string(health.errorRate) + ","
            "\"last_activity_seconds\":" + std::to_string(health.lastActivityAge.count()) + ","
            "\"active_connections\":" + std::to_string(activeConnections.load()) + ","
            "\"memory_utilization\":" + std::to_string(memoryPool.getUtilization()) + ","
            "\"cache_entries\":" + std::to_string(fileCache.getCacheEntries()) + ","
            "\"cache_size_kb\":" + std::to_string(fileCache.getCacheSize() / 1024) + ","
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

// Static member definitions
const std::unordered_map<std::string, std::string> HTTPServer::mimeTypes = {
    {".html", "text/html"},
    {".css", "text/css"},
    {".js", "application/javascript"},
    {".json", "application/json"},
    {".png", "image/png"},
    {".jpg", "image/jpeg"},
    {".jpeg", "image/jpeg"},
    {".svg", "image/svg+xml"},
    {".ico", "image/x-icon"},
    {".webp", "image/webp"},
    {".woff", "font/woff"},
    {".woff2", "font/woff2"}
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

const std::string HTTPServer::serverBusyResponse = 
    "HTTP/1.1 503 Service Unavailable\r\n"
    "Content-Type: application/json\r\n"
    "Retry-After: 3\r\n"
    "Connection: close\r\n\r\n"
    "{\"error\":\"Server busy\",\"reload\":false}";

// Enhanced live reload script with better stability
const std::string HTTPServer::liveReloadScript = R"(
(function() {
    'use strict';
    console.log('Enhanced live reload v2.0 loaded');
    
    let retryCount = 0;
    let maxRetries = 3; // Reduced max retries
    let baseDelay = 1500; // Increased base delay
    let isReloading = false;
    let isPageVisible = !document.hidden;
    let consecutiveFailures = 0;
    
    // Adaptive backoff with circuit breaker
    function getBackoffDelay() {
        if (consecutiveFailures > 5) {
            return 30000; // 30 second delay after multiple failures
        }
        return Math.min(baseDelay * Math.pow(1.5, retryCount), 15000);
    }
    
    function checkForReload() {
        if (isReloading || !isPageVisible) return;
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
            controller.abort();
            consecutiveFailures++;
        }, 2000); // Reduced timeout
        
        fetch('/reload', { 
            signal: controller.signal,
            cache: 'no-cache',
            keepalive: false
        })
        .then(response => {
            clearTimeout(timeoutId);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            // Success - reset counters
            retryCount = 0;
            consecutiveFailures = 0;
            
            if (data.reload && !isReloading) {
                isReloading = true;
                console.log('Reloading page due to file changes...');
                
                // Small delay to ensure server is ready
                setTimeout(() => {
                    location.reload();
                }, 100);
            }
        })
        .catch(error => {
            clearTimeout(timeoutId);
            
            if (error.name !== 'AbortError') {
                retryCount = Math.min(retryCount + 1, maxRetries);
                consecutiveFailures++;
                
                if (consecutiveFailures <= 3) {
                    console.warn('Live reload connection issue:', error.message, 
                                'Retry:', retryCount, 'Failures:', consecutiveFailures);
                }
            }
        });
    }
    
    function scheduleNextCheck() {
        if (isReloading) return;
        
        const delay = retryCount > 0 ? getBackoffDelay() : 
                     (consecutiveFailures > 3 ? 5000 : 1500);
        
        setTimeout(() => {
            if (!isReloading) {
                checkForReload();
                scheduleNextCheck();
            }
        }, delay);
    }
    
    // Track page visibility for better resource management
    document.addEventListener('visibilitychange', () => {
        isPageVisible = !document.hidden;
        
        if (isPageVisible) {
            // Reset some counters when page becomes visible again
            if (consecutiveFailures > 0) {
                consecutiveFailures = Math.max(0, consecutiveFailures - 1);
            }
            retryCount = Math.max(0, retryCount - 1);
        }
    });
    
    // Start the polling loop with initial delay
    setTimeout(() => {
        scheduleNextCheck();
    }, 500);
    
    // Cleanup on page unload
    window.addEventListener('beforeunload', () => {
        isReloading = true;
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
        logger.info("Enhanced Live Server running on: http://localhost:" + std::to_string(server.getPort()));
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
        if (!server.start()) {
            logger.error("Failed to start server");
            return false;
        }
        
        logger.info("Enhanced Live Server ready!");
        logger.info("http://localhost:" + std::to_string(server.getPort()));
        logger.info("Press Ctrl+C to stop");
        
        server.openBrowser();
        
        return true;
    }
    
    void run() {
#ifdef _WIN32
        SetConsoleCtrlHandler([](DWORD ctrlType) -> BOOL {
            if (ctrlType == CTRL_C_EVENT) {
                std::cout << "\nShutting down gracefully..." << std::endl;
                exit(0);
            }
            return FALSE;
        }, TRUE);
#else
        signal(SIGINT, [](int) {
            std::cout << "\nShutting down gracefully..." << std::endl;
            exit(0);
        });
        
        // Manual log clearing signal
        signal(SIGUSR1, [this](int) {
            clearLog();
            logger.info("Manual log clear triggered");
        });
#endif

        while (running) {
            std::this_thread::sleep_for(std::chrono::seconds(1));

            // Auto-clear log periodically to prevent console clutter
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
        std::cerr << "Critical error: " << e.what() << std::endl;
        return 1;
    } catch (...) {
        std::cerr << "Unknown critical error occurred" << std::endl;
        return 1;
    }
    
    return 0;
}

/*    
    COMPILATION COMMANDS:
    
    WINDOWS (MinGW):
    g++ -x c++ -std=c++20 -static -O3 -DNDEBUG -flto -march=native LiveServer.cpp -o LiveServer.exe -lstdc++ -lws2_32
    
    LINUX:
    g++ -std=c++20 -O3 -DNDEBUG -flto -march=native LiveServer.cpp -o LiveServer -lpthread
    
    macOS:
    g++ -std=c++20 -O3 -DNDEBUG -flto -march=native LiveServer.cpp -o LiveServer
    
    FLAGS:
    - O3: Maximum optimization
    - DNDEBUG: Disable debug assertions
    - flto: Link-time optimization
    - march=native: CPU-specific optimizations
*/