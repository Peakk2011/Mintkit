#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <winsock2.h>
#include <windows.h>
#include <sys/stat.h>
#include <dirent.h>
#include <stdint.h>
#include <shellapi.h>
#include <time.h>  
#include <process.h> // _beginthreadex
#include <dwmapi.h>  // Dark mode title bar
#include <uxtheme.h> // SetWindowTheme
#include <richedit.h>
#include <commctrl.h>
#include <windowsx.h>

#pragma comment(lib, "ws2_32.lib")
#pragma comment(lib, "dwmapi.lib")
#pragma comment(lib, "uxtheme.lib")

static HWND hLogEdit = NULL;
static HANDLE hServerThread = NULL;
static volatile int server_running = 1;
static COLORREF g_bgColor = RGB(255, 255, 255);
static COLORREF g_textColor = RGB(0, 0, 0);
static HBRUSH g_bgBrush = NULL;
static HFONT g_hFont = NULL;
static HINSTANCE hRichEdit = NULL;
static BOOL g_scrollbarVisible = TRUE;
static BOOL g_fullscreen = FALSE;
static HMENU g_contextMenu = NULL;
static WNDPROC g_OrigRichEditProc = NULL;
static RECT g_windowRect = {0};
static HACCEL g_hAccel = NULL;

#ifndef DWMWA_USE_IMMERSIVE_DARK_MODE
#define DWMWA_USE_IMMERSIVE_DARK_MODE 20
#endif
#ifndef DWMWA_USE_IMMERSIVE_DARK_MODE_BEFORE_20
#define DWMWA_USE_IMMERSIVE_DARK_MODE_BEFORE_20 19
#endif

// declarations
void Log(const char* format, ...);
void LogWithColor(const char* format, COLORREF color, ...);
void serve_404_page(SOCKET client, const char* requested_file);
BOOL IsDarkModeEnabled();
void ToggleScrollbar(HWND hwnd);
void ToggleFullscreen(HWND hwnd);
void CreateContextMenu(HWND hwnd);
void UpdateScrollbarVisibility(HWND hwnd);
void CreateAppAcceleratorTable();

void serve_mintkit_enhanced_html(SOCKET client, const char *filename);
void serve_mintkit_api(SOCKET client, const char *request);

typedef struct {
    int argc;
    char** argv;
} ThreadArgs;

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

static const char* PAGE_404_HTML =
    "<!DOCTYPE html>"
    "<html lang=\"en\">"
    "<head>"
    "    <meta charset=\"UTF-8\">"
    "    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">"
    "    <title>404 Not Found</title>"
    "    <style>"
    "        :root {"
    "            --bg-color: #faf9f5;"
    "            --text-color: #333333;"
    "            --title-color: #000000;"
    "        }"
    "        @media (prefers-color-scheme: dark) {"
    "            :root {"
    "                --bg-color: #0d0d0d;"
    "                --text-color: #e5e4e0;"
    "                --title-color: #faf9f5;"
    "            }"
    "        }"
    "        body {"
    "            font-family: -apple-system, BlinkMacSystemFont, \\\"Segoe UI\\\", Roboto, \\\"Helvetica Neue\\\", Arial, sans-serif;"
    "            background-color: var(--bg-color);"
    "            color: var(--text-color);"
    "            display: flex;"
    "            justify-content: center;"
    "            align-items: center;"
    "            height: 100vh;"
    "            margin: 0;"
    "            text-align: center;"
    "        }"
    "        .container { max-width: 600px; padding: 2rem; }"
    "        h1 { font-size: 6rem; font-weight: 600; margin: 0; color: var(--title-color); margin-bottom: 1rem; }"
    "        h2 { font-size: 1.5rem; margin-top: 0; margin-bottom: 1.7rem; font-weight: 500; }"
    "        p { margin-bottom: 2rem; width: 300px; }"
    "    </style>"
    "</head>"
    "<body>"
    "    <div class=\"container\">"
    "        <h1>404</h1>"
    "        <h2>Page Not Found</h2>"
    "        <p>The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.</p>"
    "    </div>"
    "</body>"
    "</html>";

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
    
    LogWithColor("Memory pool initialized: %d slots", RGB(0, 200, 255), initial_capacity);
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
    const int MAX_LINE_LENGTH = 8192;
    char* old_line = (char*)smart_malloc(MAX_LINE_LENGTH);
    char* new_line = (char*)smart_malloc(MAX_LINE_LENGTH);

    if (!old_line || !new_line) {
        Log("[Memory Error] Failed to allocate memory for diff buffers.");
        smart_free(old_line); // smart_free is safe to call on NULL
        smart_free(new_line);
        return;
    }
    
    const char* old_ptr = old_content;
    const char* new_ptr = new_content;
    int line_num = 1;
    int changes_found = 0;
    
    LogWithColor("File changed: %s", RGB(255, 255, 0), filename);
    LogWithColor("─────────────────────────────────────────────", RGB(128, 128, 128));
    
    while (*old_ptr || *new_ptr) {
        int old_len = 0;
        while (*old_ptr && *old_ptr != '\n' && old_len < MAX_LINE_LENGTH - 1) {
            old_line[old_len++] = *old_ptr++;
        }
        old_line[old_len] = '\0';
        if (*old_ptr == '\n') old_ptr++;
        
        int new_len = 0;
        while (*new_ptr && *new_ptr != '\n' && new_len < MAX_LINE_LENGTH - 1) {
            new_line[new_len++] = *new_ptr++;
        }
        new_line[new_len] = '\0';
        if (*new_ptr == '\n') new_ptr++;
        
        if (strcmp(old_line, new_line) != 0) {
            if (old_len == 0 && new_len > 0) {
                LogWithColor("+ %d: %s", RGB(0, 255, 0), line_num, new_line);
            } else if (old_len > 0 && new_len == 0) {
                LogWithColor("- %d: %s", RGB(255, 0, 0), line_num, old_line);
            } else {
                LogWithColor("~ %d: %s", RGB(255, 255, 0), line_num, new_line);
            }
            changes_found = 1;
        }
        
        if (!*old_ptr && !*new_ptr) break;
        line_num++;
    }
    
    if (!changes_found) {
        LogWithColor("No changes detected", RGB(128, 128, 128));
    }
    
    LogWithColor("─────────────────────────────────────────────", RGB(128, 128, 128));
    
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
        strncpy(snapshot->filename, filename, sizeof(snapshot->filename) - 1);
        snapshot->filename[sizeof(snapshot->filename) - 1] = '\0';
        snapshot->content = NULL;
    }
    
    if (snapshot->content) {
        compare_and_show_changes(filename, snapshot->content, content);
        smart_free(snapshot->content);
    } else {
        LogWithColor("New file: %s", RGB(0, 255, 255), filename);
    }
    
    snapshot->content = content;
    snapshot->size = file_size;
    snapshot->last_modified = *write_time;
    snapshot->line_count = count_lines(content);
}

static LARGE_INTEGER performance_frequency;
static BOOL frequency_initialized = FALSE;

static inline double get_high_res_time_ms() {
    LARGE_INTEGER counter;
    if (!frequency_initialized) {
        QueryPerformanceFrequency(&performance_frequency);
        frequency_initialized = TRUE;
    }
    QueryPerformanceCounter(&counter);
    return (double)counter.QuadPart * 1000.0 / (double)performance_frequency.QuadPart;
}

int check_files_modified() {
    double start_time_ms = get_high_res_time_ms();
    
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
        LogWithColor("Hot reload: %02d:%02d:%02d", RGB(255, 255, 0), st.wHour, st.wMinute, st.wSecond);
    }
    
    double end_time_ms = get_high_res_time_ms();
    if (changed) {
        LogWithColor("Scan completed: %.3f ms", RGB(0, 200, 255), end_time_ms - start_time_ms);
    }
    
    return changed;
}

void serve_404_page(SOCKET client, const char* requested_file) {
    LogWithColor("404: %s", RGB(255, 165, 0), requested_file);

    size_t content_len = strlen(PAGE_404_HTML);

    char header[256];
    int header_len = snprintf(header, sizeof(header),
        "HTTP/1.1 404 Not Found\r\n"
        "Content-Type: text/html\r\n"
        "Content-Length: %zu\r\n\r\n",
        content_len);

    send(client, header, header_len, 0);
    send(client, PAGE_404_HTML, content_len, 0);
}

void serve_file(SOCKET client, const char *filename) {
    double start_time_ms = get_high_res_time_ms();
    
    FILE *file = fopen(filename, "rb");
    if (!file) {
        serve_404_page(client, filename);
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
        send(client, error, (int)strlen(error), 0);
        fclose(file);
        Log("[Memory Error] Failed to allocate memory for: %s", filename);
        return;
    }

    size_t bytes_read = fread(buffer, 1, size, file);
    fclose(file);

    if (bytes_read != size) {
        const char *error = "HTTP/1.1 500 Internal Server Error\r\n\r\nFailed to read file";
        send(client, error, (int)strlen(error), 0);
        smart_free(buffer);
        Log("[Read Error] Failed to read file: %s", filename);
        return;
    }

    char *header = (char*)smart_malloc(512);
    if (!header) {
        const char *error = "HTTP/1.1 500 Internal Server Error\r\n\r\nHeader allocation failed";
        send(client, error, (int)strlen(error), 0);
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
    
    double end_time_ms = get_high_res_time_ms();
    LogWithColor("%s (%zu bytes, %.3f ms)", RGB(0, 255, 0), filename, bytes_read, end_time_ms - start_time_ms);
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
    
    LogWithColor("Memory cleanup started", RGB(255, 165, 0));
    LogWithColor("Blocks: %d, Memory: %zu bytes", RGB(0, 200, 255), memory_pool->count, memory_pool->total_allocated);

    for (int i = 0; i < memory_pool->count; i++) {
        if (memory_pool->blocks[i]) free(memory_pool->blocks[i]);
    }
    free(file_snapshots);
    file_snapshots = NULL;
    
    free(memory_pool->blocks);
    free(memory_pool->sizes);
    free(memory_pool);
    memory_pool = NULL;

    LogWithColor("Memory cleanup completed", RGB(0, 255, 0));
}

void get_local_ip(char* buffer, int size) {
    char host_name[256];
    struct hostent *host_entry;
    if (gethostname(host_name, sizeof(host_name)) == SOCKET_ERROR) {
        strncpy(buffer, "127.0.0.1", size - 1);
        buffer[size - 1] = '\0';
        return;
    }

    host_entry = gethostbyname(host_name);
    if (host_entry == NULL) {
        strncpy(buffer, "127.0.0.1", size - 1);
        buffer[size - 1] = '\0';
        return;
    }

    strncpy(buffer, inet_ntoa(*(struct in_addr *)*host_entry->h_addr_list), size - 1);
    buffer[size - 1] = '\0';
}

unsigned __stdcall ServerThread(void* pArguments) {
    ThreadArgs* thread_args = (ThreadArgs*)pArguments;
    int argc = thread_args->argc;
    char** argv = thread_args->argv;
    
    WSADATA wsa;
    WSAStartup(MAKEWORD(2, 2), &wsa);

    SOCKET server = socket(AF_INET, SOCK_STREAM, 0);
    int opt = 1;
    setsockopt(server, SOL_SOCKET, SO_REUSEADDR, (char*)&opt, sizeof(opt));

    unsigned short port = 3000;
    if (argc > 1) {
        port = (unsigned short)atoi(argv[1]);
        if (port == 0) {
            LogWithColor("Invalid port '%s', using 3000", RGB(255, 165, 0), argv[1]);
            port = 3000;
        }
    }
    struct sockaddr_in addr;
    addr.sin_family = AF_INET;
    addr.sin_port = htons(port);
    addr.sin_addr.s_addr = INADDR_ANY;

    if (bind(server, (struct sockaddr *)&addr, sizeof(addr)) == SOCKET_ERROR) {
        LogWithColor("Bind failed: %d", RGB(255, 0, 0), WSAGetLastError());
        cleanup_memory_pool();
        free(thread_args);
        return 1;
    }

    listen(server, 5);
    GetSystemTimeAsFileTime(&last_check_time);

    char local_ip[40] = {0};
    get_local_ip(local_ip, sizeof(local_ip));

    LogWithColor("Server Ready", RGB(0, 255, 0));
    LogWithColor("Local: http://localhost:%d", RGB(0, 200, 255), port);
    if (strcmp(local_ip, "127.0.0.1") != 0 && strlen(local_ip) > 0) {
        LogWithColor("Network: http://%s:%d", RGB(0, 200, 255), local_ip, port);
    }
    LogWithColor("Watching: HTML, CSS, JS, JSON, TS, TSX, JSX", RGB(255, 255, 0));

    char url[256];
    snprintf(url, sizeof(url), "http://localhost:%d", port);
    ShellExecuteA(NULL, "open", url, NULL, NULL, SW_SHOWNORMAL);

    while (server_running) {
        SOCKET client = accept(server, NULL, NULL);
        if (client == INVALID_SOCKET) break;
        char *buffer = (char*)smart_malloc(2048);
        if (!buffer) {
            LogWithColor("Memory allocation failed", RGB(255, 0, 0));
            closesocket(client);
            continue;
        }
        int bytes_received = recv(client, buffer, 2047, 0);
        if (bytes_received > 0) {
            char method[16], path[1024];
            memset(method, 0, sizeof(method));
            memset(path, 0, sizeof(path));
            sscanf(buffer, "%15s %1023s", method, path);
            char *query_params = strchr(path, '?');
            if (query_params) {
                *query_params = '\0'; 
                query_params++; 
            }
            if (strncmp(path, "/api/mintkit/", 13) == 0) {
                LogWithColor("[%s] %s [Mintkit API]", RGB(0, 255, 128), method, path);
                serve_mintkit_api(client, path);
            } else if (strcmp(path, "/reload") == 0) {
                check_files_modified();
                serve_reload(client);
            } else if (strcmp(path, "/live-reload.js") == 0) {
                LogWithColor("[%s] %s", RGB(0, 200, 255), method, path);
                check_files_modified();
                serve_live_script(client);
            } else if (strcmp(path, "/memory-stats") == 0) {
                char *stats = (char*)smart_malloc(512);
                if (stats) {
                    int stats_len = snprintf(stats, 512,
                        "HTTP/1.1 200 OK\r\nContent-Type: application/json; charset=utf-8\r\nAccess-Control-Allow-Origin: *\r\n\r\n"
                        "{\"total_allocated\":%zu,\"active_blocks\":%d,\"pool_capacity\":%d,\"tracked_files\":%d}",
                        memory_pool ? memory_pool->total_allocated : 0,
                        memory_pool ? memory_pool->count : 0,
                        memory_pool ? memory_pool->capacity : 0,
                        snapshot_count);
                    send(client, stats, stats_len, 0);
                    smart_free(stats);
                }
                LogWithColor("[%s] %s", RGB(0, 200, 255), method, path);
            } else if (strcmp(path, "/api/status") == 0) {
                char *response = (char*)smart_malloc(1024);
                if (response) {
                    int response_len = snprintf(response, 1024,
                        "HTTP/1.1 200 OK\r\nContent-Type: application/json; charset=utf-8\r\nAccess-Control-Allow-Origin: *\r\n\r\n"
                        "{\"status\":\"running\",\"uptime\":%ld,\"files_tracked\":%d,\"memory_usage\":%zu,\"hot_reload\":true}",
                        (long)time(NULL), snapshot_count, memory_pool ? memory_pool->total_allocated : 0);
                    send(client, response, response_len, 0);
                    smart_free(response);
                }
                LogWithColor("[%s] %s", RGB(0, 200, 255), method, path);
            } else {
                char *file = path + 1;
                if (strlen(file) == 0) {
                    file = "index.html";
                }
                const char *ext = strrchr(file, '.');
                if (ext && (strcmp(ext, ".html") == 0 || strcmp(ext, ".htm") == 0)) {
                    FILE *test_file = fopen(file, "r");
                    if (test_file) {
                        fclose(test_file);
                        LogWithColor("[%s] %s [Mintkit Support]", RGB(0, 255, 128), method, path);
                        check_files_modified();
                        serve_mintkit_enhanced_html(client, file);
                    } else {
                        LogWithColor("[%s] %s", RGB(0, 200, 255), method, path);
                        check_files_modified();
                        serve_file(client, path);
                    }
                } else if (!ext) {
                    char html_file[1024];
                    snprintf(html_file, sizeof(html_file), "%s.html", file);
                    FILE *test_file = fopen(html_file, "r");
                    if (test_file) {
                        fclose(test_file);
                        LogWithColor("[%s] %s [Mintkit Support - Auto .html]", RGB(0, 255, 128), method, path);
                        check_files_modified();
                        serve_mintkit_enhanced_html(client, html_file);
                    } else {
                        LogWithColor("[%s] %s", RGB(0, 200, 255), method, path);
                        check_files_modified();
                        serve_file(client, path);
                    }
                } else {
                    LogWithColor("[%s] %s", RGB(0, 200, 255), method, path);
                    check_files_modified();
                    serve_file(client, path);
                }
                if (query_params) {
                    *(query_params - 1) = '?';
                }
            }
        }
        smart_free(buffer);
        closesocket(client);
    }

    cleanup_memory_pool();
    closesocket(server);
    WSACleanup();
    free(thread_args);
    return 0;
}

void Log(const char* format, ...) {
    if (!hLogEdit) return;

    char buffer[4096];
    va_list args;
    va_start(args, format);
    int count = vsnprintf(buffer, sizeof(buffer), format, args);
    va_end(args);

    if (count < 0) return;

    int len = GetWindowTextLength(hLogEdit);
    SendMessage(hLogEdit, EM_SETSEL, (WPARAM)len, (LPARAM)len);
    SendMessage(hLogEdit, EM_REPLACESEL, 0, (LPARAM)buffer);
    SendMessage(hLogEdit, EM_REPLACESEL, 0, (LPARAM)"\r\n");
}

void LogWithColor(const char* format, COLORREF color, ...) {
    if (!hLogEdit) return;

    char buffer[4096];
    va_list args;
    va_start(args, color);
    int count = vsnprintf(buffer, sizeof(buffer), format, args);
    va_end(args);
    if (count < 0) return;

    // VSCode-like muted colors
    // Green: #6A9955, Cyan: #4EC9B0, Yellow: #DCDCAA, Orange: #CE9178, Red: #F44747, Blue: #569CD6, Gray: #808080
    if (color == RGB(0, 255, 0)) {
        color = RGB(106, 153, 85); // Green
    } else if (color == RGB(0, 255, 255)) {
        color = RGB(78, 201, 176); // Cyan
    } else if (color == RGB(255, 255, 0)) {
        color = RGB(220, 220, 170); // Yellow
    } else if (color == RGB(255, 165, 0)) {
        color = RGB(206, 145, 120); // Orange
    } else if (color == RGB(255, 0, 0)) {
        color = RGB(244, 71, 71); // Red
    } else if (color == RGB(0, 200, 255)) {
        color = RGB(86, 156, 214); // Blue
    } else if (color == RGB(128, 128, 128)) {
        color = RGB(128, 128, 128); // Gray
    } else {
        color = RGB(212, 212, 212); // Default text
    }

    int len = GetWindowTextLength(hLogEdit);
    SendMessage(hLogEdit, EM_SETSEL, len, len);
    // Set CHARFORMAT for color
    CHARFORMAT2 cf = {0};
    cf.cbSize = sizeof(CHARFORMAT2);
    cf.dwMask = CFM_COLOR;
    cf.crTextColor = color;
    SendMessage(hLogEdit, EM_SETCHARFORMAT, SCF_SELECTION, (LPARAM)&cf);
    SendMessageA(hLogEdit, EM_REPLACESEL, FALSE, (LPARAM)buffer);
    SendMessageA(hLogEdit, EM_REPLACESEL, FALSE, (LPARAM)"\r\n");
}

BOOL IsDarkModeEnabled() {
    HKEY hKey;
    DWORD dwValue = 1; 
    DWORD dwSize = sizeof(dwValue);

    if (RegOpenKeyExW(HKEY_CURRENT_USER, L"Software\\Microsoft\\Windows\\CurrentVersion\\Themes\\Personalize", 0, KEY_READ, &hKey) == ERROR_SUCCESS) {
        if (RegQueryValueExW(hKey, L"AppsUseLightTheme", NULL, NULL, (LPBYTE)&dwValue, &dwSize) != ERROR_SUCCESS) {
            dwValue = 1;
        }
        RegCloseKey(hKey);
    }
    return dwValue == 0;
}

void UpdateScrollbarVisibility(HWND hwnd) {
    if (hLogEdit) {
        DWORD style = GetWindowLong(hLogEdit, GWL_STYLE);
        if (g_scrollbarVisible) {
            style |= WS_VSCROLL;
        } else {
            style &= ~WS_VSCROLL;
        }
        SetWindowLong(hLogEdit, GWL_STYLE, style);
        SetWindowPos(hLogEdit, NULL, 0, 0, 0, 0, SWP_NOMOVE | SWP_NOSIZE | SWP_NOZORDER | SWP_FRAMECHANGED);
        InvalidateRect(hLogEdit, NULL, TRUE);
        UpdateWindow(hLogEdit);
    }
}

void ToggleScrollbar(HWND hwnd) {
    g_scrollbarVisible = !g_scrollbarVisible;
    UpdateScrollbarVisibility(hwnd);
    LogWithColor("Scrollbar: %s", RGB(0, 200, 255), g_scrollbarVisible ? "ON" : "OFF");
}

void ToggleFullscreen(HWND hwnd) {
    g_fullscreen = !g_fullscreen;
    if (g_fullscreen) {
        GetWindowRect(hwnd, &g_windowRect);
        SetWindowLong(hwnd, GWL_STYLE, WS_POPUP | WS_VISIBLE);
        SetWindowPos(hwnd, HWND_TOP, 0, 0, GetSystemMetrics(SM_CXSCREEN), GetSystemMetrics(SM_CYSCREEN), SWP_FRAMECHANGED);
        ShowWindow(hwnd, SW_SHOWMAXIMIZED);
    } else {
        SetWindowLong(hwnd, GWL_STYLE, WS_CAPTION | WS_MINIMIZEBOX | WS_MAXIMIZEBOX | WS_THICKFRAME | WS_SYSMENU);
        SetWindowPos(hwnd, HWND_TOP, g_windowRect.left, g_windowRect.top, g_windowRect.right - g_windowRect.left, g_windowRect.bottom - g_windowRect.top, SWP_FRAMECHANGED);
        ShowWindow(hwnd, SW_SHOWNORMAL);
    }
}

void CreateContextMenu(HWND hwnd) {
    if (g_contextMenu) {
        DestroyMenu(g_contextMenu);
    }
    
    g_contextMenu = CreatePopupMenu();
    
    // Scrollbar toggle
    AppendMenuA(g_contextMenu, MF_STRING | (g_scrollbarVisible ? MF_CHECKED : MF_UNCHECKED), 1001, "Toggle Scrollbar");
    
    // Separator
    AppendMenuA(g_contextMenu, MF_SEPARATOR, 0, NULL);
    
    // Fullscreen toggle
    AppendMenuA(g_contextMenu, MF_STRING | (g_fullscreen ? MF_CHECKED : MF_UNCHECKED), 1002, "Toggle Fullscreen");
    
    // Separator
    AppendMenuA(g_contextMenu, MF_SEPARATOR, 0, NULL);
    
    // Exit
    AppendMenuA(g_contextMenu, MF_STRING, 1003, "Exit");
}

void CreateAppAcceleratorTable() {
    ACCEL accel[] = {
        { FCONTROL, 'W', 1003 },  // Ctrl+W = Exit
        { FALT, VK_F11, 1002 },   // Alt+F11 = Toggle Fullscreen
    };
    
    g_hAccel = CreateAcceleratorTable(accel, 2);
}

void ApplyTheme(HWND hwnd) {
    // VSCode Dark+ Theme
    g_bgColor = RGB(18, 18, 18);
    g_textColor = RGB(248, 248, 248);

    if (g_bgBrush) {
        DeleteObject(g_bgBrush);
    }
    g_bgBrush = CreateSolidBrush(g_bgColor);

    BOOL dark = TRUE;
    DwmSetWindowAttribute(hwnd, DWMWA_USE_IMMERSIVE_DARK_MODE, &dark, sizeof(dark));
    DwmSetWindowAttribute(hwnd, DWMWA_USE_IMMERSIVE_DARK_MODE_BEFORE_20, &dark, sizeof(dark));

    InvalidateRect(hwnd, NULL, TRUE);
    UpdateWindow(hwnd);

    if (hLogEdit) {
        SendMessage(hLogEdit, EM_SETBKGNDCOLOR, 0, g_bgColor);
        
        // Set dark scrollbar colors using system colors
        SetWindowTheme(hLogEdit, L"", L"");
        
        // Force redraw to apply theme changes
        InvalidateRect(hLogEdit, NULL, TRUE);
        UpdateWindow(hLogEdit);
    }
}

LRESULT CALLBACK RichEditSubclassProc(HWND hwnd, UINT msg, WPARAM wParam, LPARAM lParam) {
    switch (msg) {
        case WM_RBUTTONUP: {
            POINT pt;
            GetCursorPos(&pt);
            CreateContextMenu(GetParent(hwnd));
            TrackPopupMenu(g_contextMenu, TPM_LEFTALIGN | TPM_RIGHTBUTTON, pt.x, pt.y, 0, GetParent(hwnd), NULL);
            return 0;
        }
    }
    return CallWindowProc(g_OrigRichEditProc, hwnd, msg, wParam, lParam);
}

LRESULT CALLBACK WindowProc(HWND hwnd, UINT uMsg, WPARAM wParam, LPARAM lParam) {
    switch (uMsg) {
        case WM_CREATE:
            SetClassLongPtr(hwnd, GCLP_HICON, (LONG_PTR)NULL);
            SetClassLongPtr(hwnd, GCLP_HICONSM, (LONG_PTR)NULL);
            hRichEdit = LoadLibraryA("Msftedit.dll");
            if (!hRichEdit) {
                MessageBox(hwnd, "Could not load Msftedit.dll (Rich Edit)", "Error", MB_OK | MB_ICONERROR);
                return -1;
            }
            hLogEdit = CreateWindowExA(
                0, "RICHEDIT50W", "",
                WS_CHILD | WS_VISIBLE | WS_VSCROLL | ES_LEFT | ES_MULTILINE | ES_AUTOVSCROLL | ES_READONLY,
                0, 0, 0, 0,
                hwnd, (HMENU)1, GetModuleHandle(NULL), NULL);
            if(hLogEdit == NULL) {
                MessageBox(hwnd, "Could not create rich edit box.", "Error", MB_OK | MB_ICONERROR);
            }
            SetWindowTheme(hLogEdit, L"Explorer", NULL);
            if (g_hFont) {
                DeleteObject(g_hFont);
            }
            g_hFont = CreateFontA(16, 0, 0, 0, FW_NORMAL, FALSE, FALSE, FALSE, DEFAULT_CHARSET, 
                                  OUT_DEFAULT_PRECIS, CLIP_DEFAULT_PRECIS, DEFAULT_QUALITY, 
                                  FIXED_PITCH | FF_MODERN, "Consolas");
            if (g_hFont == NULL) {
                g_hFont = (HFONT)GetStockObject(DEFAULT_GUI_FONT);
            }
            SendMessage(hLogEdit, WM_SETFONT, (WPARAM)g_hFont, TRUE);
            ApplyTheme(hwnd);
            UpdateScrollbarVisibility(hwnd);
            CreateContextMenu(hwnd);
            CreateAppAcceleratorTable();
            // Subclass RichEdit for context menu and key shortcuts
            g_OrigRichEditProc = (WNDPROC)SetWindowLongPtr(hLogEdit, GWLP_WNDPROC, (LONG_PTR)RichEditSubclassProc);
            // Set dark mode theme for scrollbar
            SetWindowTheme(hLogEdit, L"DarkMode_Explorer", NULL);
            break;

        case WM_COMMAND:
            switch (LOWORD(wParam)) {
                case 1001: // Toggle Scrollbar
                    ToggleScrollbar(hwnd);
                    CreateContextMenu(hwnd);
                    break;
                case 1002: // Toggle Fullscreen
                    ToggleFullscreen(hwnd);
                    CreateContextMenu(hwnd);
                    break;
                case 1003: // Exit
                    PostMessage(hwnd, WM_CLOSE, 0, 0);
                    break;
            }
            break;

        case WM_CTLCOLOREDIT: {
            HDC hdcEdit = (HDC) wParam;
            SetTextColor(hdcEdit, g_textColor);
            SetBkColor(hdcEdit, g_bgColor);
            return (LRESULT)g_bgBrush;
        }

        case WM_SETTINGCHANGE:
            if (lParam && wcscmp((LPCWSTR)lParam, L"ImmersiveColorSet") == 0) {
                ApplyTheme(hwnd);
            }
            break;

        case WM_SIZE:
            MoveWindow(hLogEdit, 0, 0, LOWORD(lParam), HIWORD(lParam), TRUE);
            break;

        case WM_CLOSE:
            if (MessageBox(hwnd, "Closing Mintkit console will stop the local web server. Are you sure?", "Mintputs", MB_OKCANCEL) == IDOK) {
                server_running = 0;
                closesocket(0); 
                DestroyWindow(hwnd);
            }
            break;

        case WM_DESTROY:
            if (g_hFont && g_hFont != GetStockObject(DEFAULT_GUI_FONT)) {
                DeleteObject(g_hFont);
            }
            if (g_bgBrush) {
                DeleteObject(g_bgBrush);
            }
            if (hRichEdit) {
                FreeLibrary(hRichEdit);
            }
            if (g_contextMenu) {
                DestroyMenu(g_contextMenu);
            }
            if (g_hAccel) {
                DestroyAcceleratorTable(g_hAccel);
            }
            cleanup_memory_pool();
            PostQuitMessage(0);
            break;

        default:
            return DefWindowProc(hwnd, uMsg, wParam, lParam);
    }
    return 0;
}

int WINAPI WinMain(HINSTANCE hInstance, HINSTANCE hPrevInstance, LPSTR lpCmdLine, int nCmdShow) {
    const char CLASS_NAME[]  = "MintkitWindowClass";
    
    WNDCLASS wc = {0};
    wc.lpfnWndProc   = WindowProc;
    wc.hInstance     = hInstance;
    wc.lpszClassName = CLASS_NAME;
    wc.hCursor       = LoadCursor(NULL, IDC_ARROW);
    wc.hbrBackground = (HBRUSH)(COLOR_WINDOW + 1);

    RegisterClass(&wc);

    HWND hwnd = CreateWindowEx(0, CLASS_NAME, "Console",
        WS_CAPTION | WS_MINIMIZEBOX | WS_MAXIMIZEBOX | WS_THICKFRAME,
        CW_USEDEFAULT, CW_USEDEFAULT, 800, 600,
        NULL, NULL, hInstance, NULL);

    if (hwnd == NULL) return 0;

    ShowWindow(hwnd, nCmdShow);

    ThreadArgs* args = (ThreadArgs*)malloc(sizeof(ThreadArgs));
    if (!args) {
        MessageBox(hwnd, "Failed to allocate memory for thread arguments.", "Fatal Error", MB_OK | MB_ICONERROR);
        return 1;
    }
    args->argc = __argc;
    args->argv = __argv;

    hServerThread = (HANDLE)_beginthreadex(NULL, 0, &ServerThread, (void*)args, 0, NULL);

    MSG msg = {0};
    while (GetMessage(&msg, NULL, 0, 0)) {
        if (!TranslateAccelerator(hwnd, g_hAccel, &msg)) {
            TranslateMessage(&msg);
            DispatchMessage(&msg);
        }
    }

    WaitForSingleObject(hServerThread, INFINITE);
    CloseHandle(hServerThread);

    return (int)msg.wParam;
}

int CustomMessageBox(HWND hParent, const char* text, const char* title) {
    // Register class
    WNDCLASSA wc = {0};
    wc.lpfnWndProc = DefWindowProcA;
    wc.hInstance = GetModuleHandle(NULL);
    wc.lpszClassName = "DarkMsgBox";
    wc.hbrBackground = CreateSolidBrush(RGB(18,18,18));
    wc.hCursor = LoadCursor(NULL, IDC_ARROW);
    RegisterClassA(&wc);

    // Create window with Minimize, Maximize, Close
    HWND hWnd = CreateWindowExA(0, "DarkMsgBox", title,
        WS_OVERLAPPEDWINDOW & ~WS_THICKFRAME, // No resize by border
        CW_USEDEFAULT, CW_USEDEFAULT, 360, 160,
        hParent, NULL, GetModuleHandle(NULL), NULL);

    // Set dark titlebar
    BOOL dark = TRUE;
    DwmSetWindowAttribute(hWnd, DWMWA_USE_IMMERSIVE_DARK_MODE, &dark, sizeof(dark));
    DwmSetWindowAttribute(hWnd, DWMWA_USE_IMMERSIVE_DARK_MODE_BEFORE_20, &dark, sizeof(dark));

    // Static text
    HWND hStatic = CreateWindowExA(0, "STATIC", text,
        WS_CHILD | WS_VISIBLE | SS_CENTER,
        20, 30, 320, 40, hWnd, NULL, GetModuleHandle(NULL), NULL);
    SendMessageA(hStatic, WM_SETFONT, (WPARAM)GetStockObject(DEFAULT_GUI_FONT), TRUE);
    SetTextColor(GetDC(hStatic), RGB(248,248,248));
    SetBkColor(GetDC(hStatic), RGB(18,18,18));

    // OK button
    HWND hBtn = CreateWindowExA(0, "BUTTON", "OK",
        WS_CHILD | WS_VISIBLE | BS_DEFPUSHBUTTON,
        130, 90, 100, 28, hWnd, (HMENU)1, GetModuleHandle(NULL), NULL);
    SendMessageA(hBtn, WM_SETFONT, (WPARAM)GetStockObject(DEFAULT_GUI_FONT), TRUE);

    ShowWindow(hWnd, SW_SHOW);
    UpdateWindow(hWnd);

    // Message loop
    MSG msg;
    int ret = 0;
    while (GetMessage(&msg, NULL, 0, 0)) {
        if (msg.message == WM_COMMAND && msg.hwnd == hBtn) {
            ret = IDOK;
            break;
        }
        if (msg.message == WM_CLOSE && msg.hwnd == hWnd) {
            ret = IDCANCEL;
            break;
        }
        TranslateMessage(&msg);
        DispatchMessage(&msg);
    }
    DestroyWindow(hWnd);
    UnregisterClassA("DarkMsgBox", GetModuleHandle(NULL));
    return ret;
}

void serve_mintkit_enhanced_html(SOCKET client, const char *filename) {
    double start_time_ms = get_high_res_time_ms();
    FILE *file = fopen(filename, "rb");
    if (!file) {
        serve_404_page(client, filename);
        return;
    }
    fseek(file, 0, SEEK_END);
    long size = ftell(file);
    rewind(file);
    char *buffer = (char*)smart_malloc(size + 5000); 
    if (!buffer) {
        const char *error = "HTTP/1.1 500 Internal Server Error\r\n\r\nMemory allocation failed";
        send(client, error, (int)strlen(error), 0);
        fclose(file);
        return;
    }
    size_t bytes_read = fread(buffer, 1, size, file);
    fclose(file);
    const char *ext = strrchr(filename, '.');
    if (ext && strcmp(ext, ".html") == 0) {
        char *body_end = strstr(buffer, "</body>");
        if (body_end) {
            const char *script_tag = "<script src=\"/live-reload.js\"></script>";
            size_t script_len = strlen(script_tag);
            memmove(body_end + script_len, body_end, strlen(body_end) + 1);
            memcpy(body_end, script_tag, script_len);
            bytes_read += script_len;
            LogWithColor("[Mintkit] Live reload script injected: %s", RGB(0, 255, 128), filename);
        }
    }
    char *header = (char*)smart_malloc(512);
    if (!header) {
        const char *error = "HTTP/1.1 500 Internal Server Error\r\n\r\nHeader allocation failed";
        send(client, error, (int)strlen(error), 0);
        smart_free(buffer);
        return;
    }
    int header_len = snprintf(header, 512,
            "HTTP/1.1 200 OK\r\n"
            "Content-Type: text/html; charset=utf-8\r\n"
            "Content-Length: %zu\r\n"
            "Cache-Control: no-cache\r\n"
            "Access-Control-Allow-Origin: *\r\n"
            "X-Mintkit-Support: true\r\n"
            "X-Memory-Pool: %zu bytes allocated\r\n\r\n",
            bytes_read, memory_pool ? memory_pool->total_allocated : 0);
    send(client, header, header_len, 0);
    send(client, buffer, bytes_read, 0);
    smart_free(buffer);
    smart_free(header);
    double end_time_ms = get_high_res_time_ms();
    LogWithColor("[Mintkit Support] %s (%zu bytes, %.3f ms)", RGB(0, 255, 128), filename, bytes_read, end_time_ms - start_time_ms);
}

void serve_mintkit_api(SOCKET client, const char *request) {
    if (strstr(request, "/api/mintkit/status")) {
        char response[512];
        int response_len = snprintf(
            response, sizeof(response),
            "HTTP/1.1 200 OK\r\n"
            "Content-Type: application/json; charset=utf-8\r\n"
            "Access-Control-Allow-Origin: *\r\n"
            "Cache-Control: no-cache\r\n\r\n"
            "{\"framework\":\"Mintkit\",\"version\":\"1.0\",\"status\":\"active\"," \
            "\"memory_usage\":%zu,\"files_watched\":%d}",
            memory_pool ? memory_pool->total_allocated : 0,
            snapshot_count
        );
        send(client, response, response_len, 0);
        LogWithColor("[Mintkit API] Status", RGB(0, 255, 128));
    } else {
        serve_404_page(client, request);
    }
}

/*  
    Compile using:
    gcc -O2 LiveServer.c -o LiveServer.exe -lws2_32 -lshell32 -mwindows -ldwmapi -luxtheme
    
    Than run  ./liveserver.exe path
    Then open http://localhost:3000
*/