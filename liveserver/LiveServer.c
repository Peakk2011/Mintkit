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

// declarations
void Log(const char* format, ...);

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
    
    Log("[Memory Pool] Initialized with %d slots", initial_capacity);
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
    
    Log("\n[File Changed] %s", filename);
    Log("─────────────────────────────────────────────");
    
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
                Log("+ %d: %s", line_num, new_line);
            } else if (old_len > 0 && new_len == 0) {
                Log("- %d: %s", line_num, old_line);
            } else {
                Log("~ %d: %s", line_num, new_line);
            }
            changes_found = 1;
        }
        
        if (!*old_ptr && !*new_ptr) break;
        line_num++;
    }
    
    if (!changes_found) {
        Log("No line changes detected (possibly metadata only)");
    }
    
    Log("─────────────────────────────────────────────\n");
    
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
        Log("[New File Tracked] %s\n", filename);
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
        Log("[Hot Reload] %02d:%02d:%02d - Changes detected, reloading...\n", st.wHour, st.wMinute, st.wSecond);
    }
    
    uint64_t end_cycles = get_cpu_cycles();
    if (end_cycles > start_cycles && changed) {
        Log("[Performance] File scan completed in %llu CPU cycles\n", end_cycles - start_cycles);
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
        send(client, not_found, (int)strlen(not_found), 0);
        Log("[404 Error] File not found: %s", filename);
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
    
    uint64_t end_cycles = get_cpu_cycles();
    if (end_cycles > start_cycles) {
        Log("[Request Served] %s (%zu bytes) - %llu cycles", filename, bytes_read, end_cycles - start_cycles);
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
    
    Log("\n[Cleanup] Memory pool cleanup initiated");
    Log("[Stats] Total allocations: %d blocks", memory_pool->count);
    Log("[Stats] Total memory: %zu bytes", memory_pool->total_allocated);

    for (int i = 0; i < memory_pool->count; i++) {
        if (memory_pool->blocks[i]) free(memory_pool->blocks[i]);
    }
    free(file_snapshots);
    file_snapshots = NULL;
    
    free(memory_pool->blocks);
    free(memory_pool->sizes);
    free(memory_pool);
    memory_pool = NULL;

    Log("[Success] Memory pool cleaned up successfully\n");
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
            Log("[Warning] Invalid port '%s'. Using default 3000.", argv[1]);
            port = 3000;
        }
    }
    struct sockaddr_in addr;
    addr.sin_family = AF_INET;
    addr.sin_port = htons(port);
    addr.sin_addr.s_addr = INADDR_ANY;

    if (bind(server, (struct sockaddr *)&addr, sizeof(addr)) == SOCKET_ERROR) {
        Log("[Error] Bind failed with error: %d", WSAGetLastError());
        cleanup_memory_pool();
        free(thread_args);
        return 1;
    }

    listen(server, 5);
    GetSystemTimeAsFileTime(&last_check_time);

    char local_ip[40] = {0};
    get_local_ip(local_ip, sizeof(local_ip));

    Log("[Server Ready] Listening on:");
    Log("  - Local:   http://localhost:%d", port);
    if (strcmp(local_ip, "127.0.0.1") != 0 && strlen(local_ip) > 0) {
        Log("  - Network: http://%s:%d \n", local_ip, port);
    }
    Log("[Watching] HTML, CSS, JS, JSON, TS, TSX, JSX files\n");

    char url[256];
    snprintf(url, sizeof(url), "http://localhost:%d", port);
    ShellExecuteA(NULL, "open", url, NULL, NULL, SW_SHOWNORMAL);

    while (server_running) {
        SOCKET client = accept(server, NULL, NULL);
        if (client == INVALID_SOCKET) break;

        char *buffer = (char*)smart_malloc(2048);
        if (!buffer) {
            Log("[Memory Error] Failed to allocate request buffer.");
            closesocket(client);
            continue;
        }
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
                Log("[%s] %s", method, path);
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
                Log("[%s] %s", method, path);
            } else {
                char *file = path + 1;  
                if (strlen(file) == 0) {
                    file = "index.html";
                }
                Log("[%s] %s", method, path);
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

    // Append text to the edit control
    int len = GetWindowTextLength(hLogEdit);
    SendMessage(hLogEdit, EM_SETSEL, (WPARAM)len, (LPARAM)len);
    SendMessage(hLogEdit, EM_REPLACESEL, 0, (LPARAM)buffer);
    SendMessage(hLogEdit, EM_REPLACESEL, 0, (LPARAM)"\r\n");
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

void ApplyTheme(HWND hwnd) {
    BOOL isDark = IsDarkModeEnabled();

    g_bgColor = isDark ? RGB(16, 16, 16) : RGB(255, 255, 255);
    g_textColor = isDark ? RGB(240, 240, 240) : RGB(0, 0, 0);

    if (g_bgBrush) {
        DeleteObject(g_bgBrush);
    }
    g_bgBrush = CreateSolidBrush(g_bgColor);

    DwmSetWindowAttribute(hwnd, 20, &isDark, sizeof(isDark));

    InvalidateRect(hwnd, NULL, TRUE);
    UpdateWindow(hwnd);
}

LRESULT CALLBACK WindowProc(HWND hwnd, UINT uMsg, WPARAM wParam, LPARAM lParam) {
    switch (uMsg) {
        case WM_CREATE:
            SetClassLongPtr(hwnd, GCLP_HICON, (LONG_PTR)NULL);
            SetClassLongPtr(hwnd, GCLP_HICONSM, (LONG_PTR)NULL);
            
            hLogEdit = CreateWindowEx(
                0, "EDIT", "",
                WS_CHILD | WS_VISIBLE | WS_VSCROLL | ES_LEFT | ES_MULTILINE | ES_AUTOVSCROLL,
                0, 0, 0, 0,
                hwnd, (HMENU)1, GetModuleHandle(NULL), NULL);
            
            if(hLogEdit == NULL) {
                MessageBox(hwnd, "Could not create edit box.", "Error", MB_OK | MB_ICONERROR);
            }
            
            SetWindowTheme(hLogEdit, L"Explorer", NULL);
            g_hFont = CreateFontA(16, 0, 0, 0, FW_NORMAL, FALSE, FALSE, FALSE, DEFAULT_CHARSET, 
                                  OUT_DEFAULT_PRECIS, CLIP_DEFAULT_PRECIS, DEFAULT_QUALITY, 
                                  FIXED_PITCH | FF_MODERN, "Consolas");
            if (g_hFont == NULL) {
                g_hFont = (HFONT)GetStockObject(DEFAULT_GUI_FONT);
            }
            SendMessage(hLogEdit, WM_SETFONT, (WPARAM)g_hFont, TRUE);
            ApplyTheme(hwnd);
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
            if (MessageBox(hwnd, "Closing Mintputs will stop the local web server. Are you sure?", "Mintputs", MB_OKCANCEL) == IDOK) {
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
            cleanup_memory_pool();
            PostQuitMessage(0);
            break;

        default:
            return DefWindowProc(hwnd, uMsg, wParam, lParam);
    }
    return 0;
}

int WINAPI WinMain(HINSTANCE hInstance, HINSTANCE hPrevInstance, LPSTR lpCmdLine, int nCmdShow) {
    const char CLASS_NAME[]  = "MintPutsWindowClass";
    
    WNDCLASS wc = {0};
    wc.lpfnWndProc   = WindowProc;
    wc.hInstance     = hInstance;
    wc.lpszClassName = CLASS_NAME;
    wc.hCursor       = LoadCursor(NULL, IDC_ARROW);
    wc.hbrBackground = (HBRUSH)(COLOR_WINDOW + 1);

    RegisterClass(&wc);

    HWND hwnd = CreateWindowEx(0, CLASS_NAME, "Live server console",
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
        TranslateMessage(&msg);
        DispatchMessage(&msg);
    }

    WaitForSingleObject(hServerThread, INFINITE);
    CloseHandle(hServerThread);

    return (int)msg.wParam;
}

/*  
    Compile using:
    gcc -O2 LiveServer.c -o LiveServer.exe -lws2_32 -lshell32 -mwindows -ldwmapi -luxtheme
    
    Then open http://localhost:3000
    
    Features:
    - Real-time file change detection with line-by-line diff
    - Colored output compatible with Windows CMD
    - Tracks HTML, CSS, JS, JSON, TS, TSX, JSX files
    - Shows added (+), removed (-), and modified (~) lines
    - Performance monitoring with CPU cycle counting
    - Memory pool management with statistics
*/