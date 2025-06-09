#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <winsock2.h>
#include <windows.h>
#include <sys/stat.h>
#include <dirent.h>
#include <stdint.h>
#include <time.h>  
#include <signal.h>

#pragma comment(lib, "ws2_32.lib")

// ANSI Color Codes for Windows CMD
#define RESET "\033[0m"
#define BOLD "\033[1m"
#define DIM "\033[2m"
#define RED "\033[31m"
#define GREEN "\033[32m"
#define YELLOW "\033[33m"
#define BLUE "\033[34m"
#define MAGENTA "\033[35m"
#define CYAN "\033[36m"
#define WHITE "\033[37m"
#define BRIGHT_GREEN "\033[92m"
#define BRIGHT_YELLOW "\033[93m"
#define BRIGHT_BLUE "\033[94m"
#define BRIGHT_CYAN "\033[96m"

typedef struct FileSnapshot {
    char filename[260];
    char* content;
    size_t size;
    FILETIME last_modified;
    int line_count;
} FileSnapshot;

typedef struct MemoryPool {
    void** blocks;
    size_t* sizes;
    int count;
    int capacity;
    size_t total_allocated;
} MemoryPool;

static MemoryPool* memory_pool = NULL;
static FILETIME last_check_time;
static int files_changed = 0;
static FileSnapshot* file_snapshots = NULL;
static int snapshot_count = 0;
static int snapshot_capacity = 0;

// Enable ANSI colors in Windows CMD
void enable_ansi_colors() {
    HANDLE hOut = GetStdHandle(STD_OUTPUT_HANDLE);
    DWORD dwMode = 0;
    GetConsoleMode(hOut, &dwMode);
    dwMode |= ENABLE_VIRTUAL_TERMINAL_PROCESSING;
    SetConsoleMode(hOut, dwMode);
}

static inline void fast_memcpy(void* dest, const void* src, size_t n) {
    #ifdef _WIN64
    __asm__ volatile (
        "cld\n\t"
        "rep movsb"
        : "=&D" (dest), "=&S" (src), "=&c" (n)
        : "0" (dest), "1" (src), "2" (n)
        : "memory"
    );
    #else
    memcpy(dest, src, n);
    #endif
}

static inline void fast_memset(void* dest, int val, size_t n) {
    #ifdef _WIN64
    __asm__ volatile (
        "cld\n\t"
        "rep stosb"
        : "=&D" (dest), "=&c" (n)
        : "0" (dest), "a" (val), "1" (n)
        : "memory"
    );
    #else
    memset(dest, val, n);
    #endif
}

static inline size_t fast_strlen(const char* str) {
    size_t len;
    #ifdef _WIN64
    __asm__ volatile (
        "xor %%rax, %%rax\n\t"
        "mov $-1, %%rcx\n\t"
        "cld\n\t"
        "repne scasb\n\t"
        "not %%rcx\n\t"
        "dec %%rcx"
        : "=c" (len)
        : "D" (str), "a" (0)
        : "memory"
    );
    return len;
    #else
    return strlen(str);
    #endif
}

MemoryPool* init_memory_pool(int initial_capacity) {
    MemoryPool* pool = (MemoryPool*)malloc(sizeof(MemoryPool));
    if (!pool) return NULL;
    
    pool->blocks = (void**)malloc(sizeof(void*) * initial_capacity);
    pool->sizes = (size_t*)malloc(sizeof(size_t) * initial_capacity);
    pool->count = 0;
    pool->capacity = initial_capacity;
    pool->total_allocated = 0;
    
    if (!pool->blocks || !pool->sizes) {
        free(pool->blocks);
        free(pool->sizes);
        free(pool);
        return NULL;
    }
    
    fast_memset(pool->blocks, 0, sizeof(void*) * initial_capacity);
    fast_memset(pool->sizes, 0, sizeof(size_t) * initial_capacity);
    
    printf("%s[Memory Pool]%s Initialized with %d slots\n\n", BRIGHT_BLUE, RESET, initial_capacity);
    return pool;
}

void* smart_malloc(size_t size) {
    if (!memory_pool) {
        memory_pool = init_memory_pool(100);
        if (!memory_pool) return NULL;
    }
    
    void* ptr = malloc(size);
    if (!ptr) return NULL;
    
    if (memory_pool->count >= memory_pool->capacity) {
        int new_capacity = memory_pool->capacity * 2;
        void** new_blocks = (void**)realloc(memory_pool->blocks, sizeof(void*) * new_capacity);
        size_t* new_sizes = (size_t*)realloc(memory_pool->sizes, sizeof(size_t) * new_capacity);
        
        if (new_blocks && new_sizes) {
            memory_pool->blocks = new_blocks;
            memory_pool->sizes = new_sizes;
            memory_pool->capacity = new_capacity;
        }
    }
    
    if (memory_pool->count < memory_pool->capacity) {
        memory_pool->blocks[memory_pool->count] = ptr;
        memory_pool->sizes[memory_pool->count] = size;
        memory_pool->count++;
        memory_pool->total_allocated += size;
    }
    
    fast_memset(ptr, 0, size);
    return ptr;
}

void smart_free(void* ptr) {
    if (!ptr || !memory_pool) return;
    
    for (int i = 0; i < memory_pool->count; i++) {
        if (memory_pool->blocks[i] == ptr) {
            memory_pool->total_allocated -= memory_pool->sizes[i];
            
            for (int j = i; j < memory_pool->count - 1; j++) {
                memory_pool->blocks[j] = memory_pool->blocks[j + 1];
                memory_pool->sizes[j] = memory_pool->sizes[j + 1];
            }
            memory_pool->count--;
            break;
        }
    }
    
    free(ptr);
}

char* read_file_content(const char* filename, size_t* file_size) {
    FILE* file = fopen(filename, "rb");
    if (!file) return NULL;
    
    fseek(file, 0, SEEK_END);
    *file_size = ftell(file);
    rewind(file);
    
    char* content = (char*)smart_malloc(*file_size + 1);
    if (!content) {
        fclose(file);
        return NULL;
    }
    
    fread(content, 1, *file_size, file);
    content[*file_size] = '\0';
    fclose(file);
    
    return content;
}

int count_lines(const char* content) {
    int lines = 1;
    for (const char* p = content; *p; p++) {
        if (*p == '\n') lines++;
    }
    return lines;
}

void compare_and_show_changes(const char* filename, const char* old_content, const char* new_content) {
    char* old_line = (char*)smart_malloc(1024);
    char* new_line = (char*)smart_malloc(1024);
    
    const char* old_ptr = old_content;
    const char* new_ptr = new_content;
    int line_num = 1;
    int changes_found = 0;
    
    printf("\n%s[File Changed]%s %s%s%s\n", BRIGHT_YELLOW, RESET, CYAN, filename, RESET);
    printf("%s─────────────────────────────────────────────%s\n", DIM, RESET);
    
    while (*old_ptr || *new_ptr) {
        int old_len = 0;
        while (*old_ptr && *old_ptr != '\n' && old_len < 1023) {
            old_line[old_len++] = *old_ptr++;
        }
        old_line[old_len] = '\0';
        if (*old_ptr == '\n') old_ptr++;
        
        int new_len = 0;
        while (*new_ptr && *new_ptr != '\n' && new_len < 1023) {
            new_line[new_len++] = *new_ptr++;
        }
        new_line[new_len] = '\0';
        if (*new_ptr == '\n') new_ptr++;
        
        if (strcmp(old_line, new_line) != 0) {
            if (old_len == 0 && new_len > 0) {
                printf("%s+ %s%d%s: %s%s%s\n", BRIGHT_GREEN, YELLOW, line_num, RESET, GREEN, new_line, RESET);
            } else if (old_len > 0 && new_len == 0) {
                printf("%s- %s%d%s: %s%s%s\n", RED, YELLOW, line_num, RESET, RED, old_line, RESET);
            } else {
                printf("%s~ %s%d%s: %s%s%s\n", BRIGHT_YELLOW, YELLOW, line_num, RESET, BRIGHT_CYAN, new_line, RESET);
            }
            changes_found = 1;
        }
        
        if (!*old_ptr && !*new_ptr) break;
        line_num++;
    }
    
    if (!changes_found) {
        printf("%sNo line changes detected (possibly metadata only)%s\n", DIM, RESET);
    }
    
    printf("%s─────────────────────────────────────────────%s\n\n", DIM, RESET);
    
    smart_free(old_line);
    smart_free(new_line);
}

void update_file_snapshot(const char* filename, FILETIME* write_time) {
    size_t file_size;
    char* content = read_file_content(filename, &file_size);
    if (!content) return;

    FileSnapshot* snapshot = NULL;
    for (int i = 0; i < snapshot_count; i++) {
        if (strcmp(file_snapshots[i].filename, filename) == 0) {
            snapshot = &file_snapshots[i];
            break;
        }
    }
    
    if (!snapshot) {
        if (snapshot_count >= snapshot_capacity) {
            snapshot_capacity = snapshot_capacity == 0 ? 10 : snapshot_capacity * 2;
            file_snapshots = (FileSnapshot*)realloc(file_snapshots, sizeof(FileSnapshot) * snapshot_capacity);
        }
        
        snapshot = &file_snapshots[snapshot_count++];
        strcpy(snapshot->filename, filename);
        snapshot->content = NULL;
    }
    
    if (snapshot->content) {
        compare_and_show_changes(filename, snapshot->content, content);
        smart_free(snapshot->content);
    } else {
        printf("%s[New File Tracked]%s %s%s%s\n\n", BRIGHT_GREEN, RESET, CYAN, filename, RESET);
    }
    
    snapshot->content = content;
    snapshot->size = file_size;
    snapshot->last_modified = *write_time;
    snapshot->line_count = count_lines(content);
}

static inline uint64_t get_cpu_cycles() {
    uint64_t cycles;
    #ifdef _WIN64
    __asm__ volatile (
        "rdtsc\n\t"
        "shl $32, %%rdx\n\t"
        "or %%rdx, %%rax"
        : "=a" (cycles)
        :
        : "rdx"
    );
    return cycles;
    #else
    return 0;
    #endif
}

int check_files_modified() {
    uint64_t start_cycles = get_cpu_cycles();
    
    WIN32_FIND_DATA findFileData;
    HANDLE hFind;
    FILETIME current_time;
    int changed = 0;
    
    GetSystemTimeAsFileTime(&current_time);
    
    const char* patterns[] = {"*.html", "*.css", "*.js", "*.json", "*.tsx", "*.jsx", "*.ts"};
    int pattern_count = sizeof(patterns) / sizeof(patterns[0]);
    
    for (int i = 0; i < pattern_count; i++) {
        hFind = FindFirstFile(patterns[i], &findFileData);
        
        if (hFind != INVALID_HANDLE_VALUE) {
            do {
                if (CompareFileTime(&findFileData.ftLastWriteTime, &last_check_time) > 0) {
                    update_file_snapshot(findFileData.cFileName, &findFileData.ftLastWriteTime);
                    changed = 1;
                }
            } while (FindNextFile(hFind, &findFileData) != 0);
            
            FindClose(hFind);
        }
    }
    
    if (changed) {
        GetSystemTimeAsFileTime(&last_check_time);
        files_changed = 1;
        
        SYSTEMTIME st;
        GetLocalTime(&st);
        printf("%s[Hot Reload]%s %s%02d:%02d:%02d%s - Changes detected, reloading...\n\n", 
               BRIGHT_GREEN, RESET, BRIGHT_BLUE, st.wHour, st.wMinute, st.wSecond, RESET);
    }
    
    uint64_t end_cycles = get_cpu_cycles();
    if (end_cycles > start_cycles && changed) {
        printf("%s[Performance]%s File scan completed in %s%llu%s CPU cycles\n\n", 
               MAGENTA, RESET, YELLOW, end_cycles - start_cycles, RESET);
    }
    
    return changed;
}

void serve_file(SOCKET client, const char *filename) {
    uint64_t start_cycles = get_cpu_cycles();
    
    FILE *file = fopen(filename, "rb");
    if (!file) {
        const char *not_found = 
            "HTTP/1.1 404 Not Found\r\n"
            "Content-Type: text/html\r\n"
            "Content-Length: 47\r\n\r\n"
            "<h1>404 Not Found</h1><p>File not found</p>";
        send(client, not_found, strlen(not_found), 0);
        printf("%s[404 Error]%s File not found: %s%s%s\n", RED, RESET, CYAN, filename, RESET);
        return;
    }

    const char *ext = strrchr(filename, '.');
    const char *mime = "text/plain";
    if (ext) {
        if (strcmp(ext, ".html") == 0) mime = "text/html";
        else if (strcmp(ext, ".js") == 0) mime = "application/javascript";
        else if (strcmp(ext, ".css") == 0) mime = "text/css";
        else if (strcmp(ext, ".png") == 0) mime = "image/png";
        else if (strcmp(ext, ".jpg") == 0 || strcmp(ext, ".jpeg") == 0) mime = "image/jpeg";
        else if (strcmp(ext, ".svg") == 0) mime = "image/svg+xml";
        else if (strcmp(ext, ".json") == 0) mime = "application/json";
        else if (strcmp(ext, ".ico") == 0) mime = "image/x-icon";
        else if (strcmp(ext, ".tsx") == 0 || strcmp(ext, ".jsx") == 0) mime = "application/javascript";
        else if (strcmp(ext, ".ts") == 0) mime = "application/javascript";
    }

    fseek(file, 0, SEEK_END);
    long size = ftell(file);
    rewind(file);
    
    char *buffer = (char*)smart_malloc(size);
    if (!buffer) {
        const char *error = "HTTP/1.1 500 Internal Server Error\r\n\r\nMemory allocation failed";
        send(client, error, strlen(error), 0);
        fclose(file);
        printf("%s[Memory Error]%s Failed to allocate memory for: %s%s%s\n", RED, RESET, CYAN, filename, RESET);
        return;
    }

    size_t bytes_read = fread(buffer, 1, size, file);
    fclose(file);

    if (bytes_read == 0) {
        const char *error = "HTTP/1.1 500 Internal Server Error\r\n\r\nFailed to read file";
        send(client, error, strlen(error), 0);
        smart_free(buffer);
        printf("%s[Read Error]%s Failed to read file: %s%s%s\n", RED, RESET, CYAN, filename, RESET);
        return;
    }

    char *header = (char*)smart_malloc(512);
    if (!header) {
        const char *error = "HTTP/1.1 500 Internal Server Error\r\n\r\nHeader allocation failed";
        send(client, error, strlen(error), 0);
        smart_free(buffer);
        return;
    }

    int header_len = snprintf(header, 512,
            "HTTP/1.1 200 OK\r\n"
            "Content-Type: %s\r\n"
            "Content-Length: %zu\r\n"
            "Cache-Control: no-cache\r\n"
            "Access-Control-Allow-Origin: *\r\n"
            "X-Memory-Pool: %zu bytes allocated\r\n\r\n",
            mime, bytes_read, memory_pool ? memory_pool->total_allocated : 0);

    send(client, header, header_len, 0);
    send(client, buffer, bytes_read, 0);
    
    smart_free(buffer);
    smart_free(header);
    
    uint64_t end_cycles = get_cpu_cycles();
    if (end_cycles > start_cycles) {
        printf("%s[Request Served]%s %s%s%s (%s%zu%s bytes) - %s%llu%s cycles\n", 
               GREEN, RESET, CYAN, filename, RESET, YELLOW, bytes_read, RESET, YELLOW, end_cycles - start_cycles, RESET);
    }
}

void serve_reload(SOCKET client) {
    int should_reload = files_changed;
    if (should_reload) files_changed = 0;

    char response[256];
    int response_len = snprintf(
        response, sizeof(response),
        "HTTP/1.1 200 OK\r\n"
        "Content-Type: application/json\r\n"
        "Access-Control-Allow-Origin: *\r\n"
        "Cache-Control: no-cache\r\n\r\n"
        "{\"reload\":%s,\"timestamp\":%ld,\"memory_usage\":%zu}",
        should_reload ? "true" : "false",
        (long)time(NULL),
        memory_pool ? memory_pool->total_allocated : 0
    );
    send(client, response, response_len, 0);
}

void serve_live_script(SOCKET client) {
    serve_file(client, "live-reload.js");
}

void cleanup_memory_pool() {
    if (!memory_pool) return;
    
    printf("\n%s[Cleanup]%s Memory pool cleanup initiated\n", BRIGHT_YELLOW, RESET);
    printf("%s[Stats]%s Total allocations: %s%d%s blocks\n", MAGENTA, RESET, YELLOW, memory_pool->count, RESET);
    printf("%s[Stats]%s Total memory: %s%zu%s bytes\n", MAGENTA, RESET, YELLOW, memory_pool->total_allocated, RESET);
    
    for (int i = 0; i < memory_pool->count; i++) {
        if (memory_pool->blocks[i]) {
            free(memory_pool->blocks[i]);
        }
    }

    for (int i = 0; i < snapshot_count; i++) {
        if (file_snapshots[i].content) {
            smart_free(file_snapshots[i].content);
        }
    }
    free(file_snapshots);
    
    free(memory_pool->blocks);
    free(memory_pool->sizes);
    free(memory_pool);
    memory_pool = NULL;
    
    printf("%s[Success]%s Memory pool cleaned up successfully\n\n", BRIGHT_GREEN, RESET);
}

int main() {
    enable_ansi_colors();
    
    WSADATA wsa;
    WSAStartup(MAKEWORD(2, 2), &wsa);

    SOCKET server = socket(AF_INET, SOCK_STREAM, 0);
    int opt = 1;
    setsockopt(server, SOL_SOCKET, SO_REUSEADDR, (char*)&opt, sizeof(opt));

    struct sockaddr_in addr;
    addr.sin_family = AF_INET;
    addr.sin_port = htons(3000);
    addr.sin_addr.s_addr = INADDR_ANY;

    if (bind(server, (struct sockaddr *)&addr, sizeof(addr)) == SOCKET_ERROR) {
        printf("%s[Error]%s Bind failed with error: %d\n", RED, RESET, WSAGetLastError());
        cleanup_memory_pool();
        return 1;
    }

    listen(server, 5);
    GetSystemTimeAsFileTime(&last_check_time);

    printf("%s[Server Ready]%s %shttp://localhost:3000%s\n", BRIGHT_GREEN, RESET, BRIGHT_BLUE, RESET);
    printf("%s[Watching]%s HTML, CSS, JS, JSON, TS, TSX, JSX files\n\n", YELLOW, RESET);
    
    signal(SIGINT, (void(*)(int))cleanup_memory_pool);

    while (1) {
        SOCKET client = accept(server, NULL, NULL);
        if (client == INVALID_SOCKET) continue;
        
        char *buffer = (char*)smart_malloc(2048);
        fast_memset(buffer, 0, 2048);
        int bytes_received = recv(client, buffer, 2047, 0);
        
        if (bytes_received > 0) {
            char method[16], path[1024];
            memset(method, 0, sizeof(method));
            memset(path, 0, sizeof(path));
            
            sscanf(buffer, "%15s %1023s", method, path);            

            if (strcmp(path, "/reload") == 0) {
                check_files_modified();
                serve_reload(client);
            } else if (strcmp(path, "/live-reload.js") == 0) {
                printf("%s[%s]%s %s%s%s\n", BRIGHT_BLUE, method, RESET, CYAN, path, RESET);
                check_files_modified();
                serve_live_script(client);
            } else if (strcmp(path, "/memory-stats") == 0) {
                char *stats = (char*)smart_malloc(512);
                if (stats) {
                    int stats_len = snprintf(stats, 512,
                        "HTTP/1.1 200 OK\r\nContent-Type: application/json\r\nAccess-Control-Allow-Origin: *\r\n\r\n"
                        "{\"total_allocated\":%zu,\"active_blocks\":%d,\"pool_capacity\":%d,\"tracked_files\":%d}",
                        memory_pool ? memory_pool->total_allocated : 0,
                        memory_pool ? memory_pool->count : 0,
                        memory_pool ? memory_pool->capacity : 0,
                        snapshot_count);
                    send(client, stats, stats_len, 0);
                    smart_free(stats);
                }                
                printf("%s[%s]%s %s%s%s\n", BRIGHT_BLUE, method, RESET, CYAN, path, RESET);
            } else {
                char *file = path + 1;  
                if (strlen(file) == 0) {
                    file = "index.html";
                }
                printf("%s[%s]%s %s%s%s\n", BRIGHT_BLUE, method, RESET, CYAN, path, RESET);
                check_files_modified();
                serve_file(client, file);
            }
        }

        smart_free(buffer);
        closesocket(client);
    }

    cleanup_memory_pool();
    closesocket(server);
    WSACleanup();
    return 0;
}

/*  
    Compile using:
    gcc -O2 WebExecute.c -o WebExecute.exe -lws2_32
    If compile to assembly | GCC | NASM
    gcc -S -O2 WebExecute.c -o WebExecute.s -lws2_32
    gcc -S -masm=intel -O2 WebExecute.c -o WebExecute.asm -lws2_32
    Then open http://localhost:3000
    
    Features:
    - Real-time file change detection with line-by-line diff
    - Colored output compatible with Windows CMD
    - Tracks HTML, CSS, JS, JSON, TS, TSX, JSX files
    - Shows added (+), removed (-), and modified (~) lines
    - Performance monitoring with CPU cycle counting
    - Memory pool management with statistics
*/