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
#include <process.h>
#include <dwmapi.h>
#include <uxtheme.h>
#include <richedit.h>
#include <commctrl.h>
#include <windowsx.h>

#pragma comment(lib, "ws2_32.lib")
#pragma comment(lib, "dwmapi.lib")
#pragma comment(lib, "uxtheme.lib")

// WebSocket support for smart updates
typedef struct WebSocketClient {
    SOCKET socket;
    int is_websocket;
    struct WebSocketClient* next;
} WebSocketClient;

static WebSocketClient* ws_clients = NULL;
static CRITICAL_SECTION ws_clients_lock;

// File type detection for smart updates
typedef enum {
    FILE_TYPE_HTML,
    FILE_TYPE_CSS,
    FILE_TYPE_JS,
    FILE_TYPE_JSON,
    FILE_TYPE_OTHER
} FileType;

// Change tracking
typedef struct FileChange {
    char filename[260];
    FileType type;
    char* old_content;
    char* new_content;
    time_t change_time;
} FileChange;

static FileChange* recent_changes = NULL;
static int recent_changes_count = 0;

// Original variables (keeping existing structure)
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
    FileType type;
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

#ifndef DWMWA_USE_IMMERSIVE_DARK_MODE
#define DWMWA_USE_IMMERSIVE_DARK_MODE 20
#endif
#ifndef DWMWA_USE_IMMERSIVE_DARK_MODE_BEFORE_20
#define DWMWA_USE_IMMERSIVE_DARK_MODE_BEFORE_20 19
#endif

// Function declarations
void Log(const char* format, ...);
void LogWithColor(const char* format, COLORREF color, ...);
void serve_404_page(SOCKET client, const char* requested_file);

// Live-reload script - Fixed string termination
static const char* SMART_LIVE_RELOAD_JS = 
    "class SmartHMR {\n"
    "    constructor() {\n"
    "        this.ws = null;\n"
    "        this.reconnectAttempts = 0;\n"
    "        this.maxReconnectAttempts = 5;\n"
    "        this.state = {};\n"
    "        this.connect();\n"
    "    }\n"
    "\n"
    "    connect() {\n"
    "        if (this.ws && this.ws.readyState === WebSocket.OPEN) return;\n"
    "        \n"
    "        try {\n"
    "            this.ws = new WebSocket('ws://localhost:3001');\n"
    "            this.ws.onopen = () => {\n"
    "                console.log('HMR Connected');\n"
    "                this.showStatus('Connected', 'success');\n"
    "                this.reconnectAttempts = 0;\n"
    "            };\n"
    "            \n"
    "            this.ws.onmessage = (event) => {\n"
    "                try {\n"
    "                    const data = JSON.parse(event.data);\n"
    "                    this.handleUpdate(data);\n"
    "                } catch (e) {\n"
    "                    console.error('HMR message parse error:', e);\n"
    "                }\n"
    "            };\n"
    "            \n"
    "            this.ws.onclose = () => {\n"
    "                console.log('HMR disconnected');\n"
    "                this.showStatus('Disconnected', 'error');\n"
    "                this.reconnect();\n"
    "            };\n"
    "        } catch (error) {\n"
    "            console.error('WebSocket connection failed:', error);\n"
    "            setTimeout(() => this.connect(), 1000);\n"
    "        }\n"
    "    }\n"
    "\n"
    "    handleUpdate(data) {\n"
    "        switch (data.type) {\n"
    "            case 'css':\n"
    "                this.updateCSS(data.filename, data.content);\n"
    "                break;\n"
    "            case 'js':\n"
    "                this.updateJS(data.filename, data.content);\n"
    "                break;\n"
    "            case 'html':\n"
    "                this.updateHTML(data.filename, data.content);\n"
    "                break;\n"
    "            case 'reload':\n"
    "                this.fullReload();\n"
    "                break;\n"
    "        }\n"
    "    }\n"
    "\n"
    "    updateCSS(filename, content) {\n"
    "        this.preserveState();\n"
    "        \n"
    "        let link = document.querySelector(`link[href*='${filename}']`);\n"
    "        if (link) {\n"
    "            const newLink = link.cloneNode();\n"
    "            newLink.href = filename + '?t=' + Date.now();\n"
    "            link.parentNode.insertBefore(newLink, link.nextSibling);\n"
    "            setTimeout(() => link.remove(), 100);\n"
    "        } else {\n"
    "            // Update inline styles\n"
    "            const styles = document.querySelectorAll('style');\n"
    "            styles.forEach(style => {\n"
    "                if (style.textContent.includes(filename.replace('.css', ''))) {\n"
    "                    style.textContent = content;\n"
    "                }\n"
    "            });\n"
    "        }\n"
    "        \n"
    "        this.showStatus(`CSS Updated: ${filename}`, 'success');\n"
    "        this.restoreState();\n"
    "    }\n"
    "\n"
    "    updateJS(filename, content) {\n"
    "        this.preserveState();\n"
    "        \n"
    "        // For now, reload for JS changes (can be improved)\n"
    "        console.log(`⚡ JS file changed: ${filename}`);\n"
    "        this.showStatus(`⚡ JS Updated: ${filename}`, 'warning');\n"
    "        setTimeout(() => this.fullReload(), 500);\n"
    "    }\n"
    "\n"
    "    updateHTML(filename, content) {\n"
    "        this.preserveState();\n"
    "        this.showStatus(`HTML Updated: ${filename}`, 'warning');\n"
    "        setTimeout(() => this.fullReload(), 300);\n"
    "    }\n"
    "\n"
    "    fullReload() {\n"
    "        console.log('Full page reload');\n"
    "        location.reload();\n"
    "    }\n"
    "\n"
    "    preserveState() {\n"
    "        this.state.scroll = window.scrollY;\n"
    "        this.state.inputs = {};\n"
    "        \n"
    "        document.querySelectorAll('input, textarea, select').forEach(el => {\n"
    "            if (el.id || el.name) {\n"
    "                this.state.inputs[el.id || el.name] = el.value;\n"
    "            }\n"
    "        });\n"
    "    }\n"
    "\n"
    "    restoreState() {\n"
    "        if (this.state.scroll !== undefined) {\n"
    "            window.scrollTo(0, this.state.scroll);\n"
    "        }\n"
    "        \n"
    "        Object.keys(this.state.inputs || {}).forEach(key => {\n"
    "            const el = document.getElementById(key) || document.querySelector(`[name='${key}']`);\n"
    "            if (el) el.value = this.state.inputs[key];\n"
    "        });\n"
    "    }\n"
    "\n"
    "    showStatus(message, type) {\n"
    "        let status = document.getElementById('hmr-status');\n"
    "        if (!status) {\n"
    "            status = document.createElement('div');\n"
    "            status.id = 'hmr-status';\n"
    "            status.style.cssText = `\n"
    "                position: fixed; top: 20px; right: 20px; z-index: 10000;\n"
    "                padding: 8px 16px; border-radius: 4px; font-size: 12px;\n"
    "                font-family: monospace; font-weight: bold;\n"
    "                transition: all 0.3s ease; transform: translateX(100%);\n"
    "            `;\n"
    "            document.body.appendChild(status);\n"
    "        }\n"
    "        \n"
    "        const colors = {\n"
    "            success: 'background: #10b981; color: white;',\n"
    "            warning: 'background: #f59e0b; color: white;',\n"
    "            error: 'background: #ef4444; color: white;'\n"
    "        };\n"
    "        \n"
    "        status.style.cssText += colors[type] || colors.success;\n"
    "        status.textContent = message;\n"
    "        status.style.transform = 'translateX(0)';\n"
    "        \n"
    "        setTimeout(() => {\n"
    "            status.style.transform = 'translateX(100%)';\n"
    "        }, 3000);\n"
    "    }\n"
    "\n"
    "    reconnect() {\n"
    "        if (this.reconnectAttempts >= this.maxReconnectAttempts) {\n"
    "            console.log('Max reconnection attempts reached');\n"
    "            return;\n"
    "        }\n"
    "        \n"
    "        this.reconnectAttempts++;\n"
    "        setTimeout(() => this.connect(), 1000 * this.reconnectAttempts);\n"
    "    }\n"
    "}\n"
    "\n"
    "// Initialize Smart HMR\n"
    "if (typeof window !== 'undefined') {\n"
    "    window.smartHMR = new SmartHMR();\n"
    "    \n"
    "    // Fallback polling for servers without WebSocket\n"
    "    setInterval(async () => {\n"
    "        try {\n"
    "            const response = await fetch('/reload');\n"
    "            const data = await response.json();\n"
    "            if (data.reload && (!window.smartHMR.ws || window.smartHMR.ws.readyState !== WebSocket.OPEN)) {\n"
    "                console.log('Fallback reload detected');\n"
    "                window.smartHMR.showStatus('File changed (fallback)', 'warning');\n"
    "                setTimeout(() => location.reload(), 300);\n"
    "            }\n"
    "        } catch (e) {\n"
    "            // Ignore polling errors\n"
    "        }\n"
    "    }, 1000);\n"
    "}";

// Determine file type - Fixed function name to avoid Windows API conflict
FileType detect_file_type(const char* filename) {
    const char* ext = strrchr(filename, '.');
    if (!ext) return FILE_TYPE_OTHER;
    
    if (strcmp(ext, ".css") == 0) return FILE_TYPE_CSS;
    if (strcmp(ext, ".js") == 0 || strcmp(ext, ".ts") == 0 || 
        strcmp(ext, ".jsx") == 0 || strcmp(ext, ".tsx") == 0) return FILE_TYPE_JS;
    if (strcmp(ext, ".html") == 0 || strcmp(ext, ".htm") == 0) return FILE_TYPE_HTML;
    if (strcmp(ext, ".json") == 0) return FILE_TYPE_JSON;
    
    return FILE_TYPE_OTHER;
}

// WebSocket utilities
void add_websocket_client(SOCKET client_socket) {
    EnterCriticalSection(&ws_clients_lock);
    
    WebSocketClient* new_client = (WebSocketClient*)malloc(sizeof(WebSocketClient));
    new_client->socket = client_socket;
    new_client->is_websocket = 1;
    new_client->next = ws_clients;
    ws_clients = new_client;
    
    LeaveCriticalSection(&ws_clients_lock);
    LogWithColor("WebSocket client connected", RGB(0, 255, 128));
}

void remove_websocket_client(SOCKET client_socket) {
    EnterCriticalSection(&ws_clients_lock);
    
    WebSocketClient** current = &ws_clients;
    while (*current) {
        if ((*current)->socket == client_socket) {
            WebSocketClient* to_remove = *current;
            *current = (*current)->next;
            free(to_remove);
            break;
        }
        current = &(*current)->next;
    }
    
    LeaveCriticalSection(&ws_clients_lock);
}

void broadcast_to_websockets(const char* message) {
    EnterCriticalSection(&ws_clients_lock);
    
    WebSocketClient* current = ws_clients;
    while (current) {
        WebSocketClient* next = current->next;
        
        // Send WebSocket frame (simplified)
        char frame[2048];
        int message_len = strlen(message);
        int frame_len;
        
        if (message_len < 126) {
            frame[0] = 0x81; // Final frame, text
            frame[1] = message_len;
            memcpy(frame + 2, message, message_len);
            frame_len = message_len + 2;
        } else {
            frame[0] = 0x81;
            frame[1] = 126;
            frame[2] = (message_len >> 8) & 0xFF;
            frame[3] = message_len & 0xFF;
            memcpy(frame + 4, message, message_len);
            frame_len = message_len + 4;
        }
        
        if (send(current->socket, frame, frame_len, 0) == SOCKET_ERROR) {
            remove_websocket_client(current->socket);
        }
        
        current = next;
    }
    
    LeaveCriticalSection(&ws_clients_lock);
}

// File change detection
void track_file_change(const char* filename, const char* old_content, const char* new_content) {
    FileType type = detect_file_type(filename);
    
    // Create change notification
    char notification[2048];
    const char* type_str;
    
    switch (type) {
        case FILE_TYPE_CSS: type_str = "css"; break;
        case FILE_TYPE_JS: type_str = "js"; break;
        case FILE_TYPE_HTML: type_str = "html"; break;
        case FILE_TYPE_JSON: type_str = "json"; break;
        default: type_str = "other"; break;
    }
    
    snprintf(notification, sizeof(notification),
        "{\"type\":\"%s\",\"filename\":\"%s\",\"timestamp\":%ld,\"action\":\"update\"}",
        type_str, filename, (long)time(NULL));
    
    // Broadcast to WebSocket clients
    broadcast_to_websockets(notification);
    
    // Log with appropriate color
    COLORREF color;
    switch (type) {
        case FILE_TYPE_CSS: color = RGB(0, 255, 255); break;
        case FILE_TYPE_JS: color = RGB(255, 255, 0); break;
        case FILE_TYPE_HTML: color = RGB(255, 165, 0); break;
        default: color = RGB(128, 128, 128); break;
    }
    
    LogWithColor("HMR: %s (%s)", color, filename, type_str);
}

// Memory management
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
    
    memset(pool->blocks, 0, sizeof(void*) * initial_capacity);
    memset(pool->sizes, 0, sizeof(size_t) * initial_capacity);
    
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
    
    memset(ptr, 0, size);
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

// Improved change detection with smart updates
void update_file_snapshot(const char* filename, FILETIME* write_time) {
    FILE* file = fopen(filename, "rb");
    if (!file) return;
    
    fseek(file, 0, SEEK_END);
    size_t file_size = ftell(file);
    rewind(file);
    
    char* content = (char*)smart_malloc(file_size + 1);
    if (!content) {
        fclose(file);
        return;
    }
    
    fread(content, 1, file_size, file);
    content[file_size] = '\0';
    fclose(file);
    
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
        snapshot->type = detect_file_type(filename);
    }
    
    if (snapshot->content) {
        // Smart update instead of just logging
        track_file_change(filename, snapshot->content, content);
        smart_free(snapshot->content);
    } else {
        LogWithColor("New file tracked: %s", RGB(0, 255, 255), filename);
    }
    
    snapshot->content = content;
    snapshot->size = file_size;
    snapshot->last_modified = *write_time;
}

// Enhanced serve functions
void serve_live_script(SOCKET client) {
    size_t content_len = strlen(SMART_LIVE_RELOAD_JS);
    
    char* header = (char*)smart_malloc(512);
    if (!header) {
        const char* error = "HTTP/1.1 500 Internal Server Error\r\n\r\nMemory allocation failed";
        send(client, error, (int)strlen(error), 0);
        return;
    }
    
    int header_len = snprintf(header, 512,
        "HTTP/1.1 200 OK\r\n"
        "Content-Type: application/javascript\r\n"
        "Content-Length: %zu\r\n"
        "Cache-Control: no-cache\r\n"
        "Access-Control-Allow-Origin: *\r\n\r\n",
        content_len);
    
    send(client, header, header_len, 0);
    send(client, SMART_LIVE_RELOAD_JS, (int)content_len, 0);
    smart_free(header);
}

// Check files with smart detection
int check_files_modified() {
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
    }
    
    return changed;
}

// HTML serving with smart HMR injection
void serve_mintkit_enhanced_html(SOCKET client, const char *filename) {
    const char *file_to_open = filename;
    if (filename[0] == '/') {
        file_to_open = filename + 1;
    }
    
    FILE *file = fopen(file_to_open, "rb");
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
    
    // Inject
    char *body_end = strstr(buffer, "</body>");
    if (body_end) {
        const char *smart_script = "<script src=\"/live-reload.js\"></script>";
        size_t script_len = strlen(smart_script);
        memmove(body_end + script_len, body_end, strlen(body_end) + 1);
        memcpy(body_end, smart_script, script_len);
        bytes_read += script_len;
    }
    
    char *header = (char*)smart_malloc(512);
    int header_len = snprintf(header, 512,
        "HTTP/1.1 200 OK\r\n"
        "Content-Type: text/html; charset=utf-8\r\n"
        "Content-Length: %zu\r\n"
        "Cache-Control: no-cache\r\n"
        "Access-Control-Allow-Origin: *\r\n"
        "X-Smart-HMR: enabled\r\n\r\n",
        bytes_read);
    
    send(client, header, header_len, 0);
    send(client, buffer, (int)bytes_read, 0);
    
    smart_free(buffer);
    smart_free(header);
    
    LogWithColor("HMR HTML: %s", RGB(0, 255, 128), filename);
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
    
    int len = GetWindowTextLength(hLogEdit);
    SendMessage(hLogEdit, EM_SETSEL, len, len);
    
    CHARFORMAT2 cf = {0};
    cf.cbSize = sizeof(CHARFORMAT2);
    cf.dwMask = CFM_COLOR;
    cf.crTextColor = color;
    SendMessage(hLogEdit, EM_SETCHARFORMAT, SCF_SELECTION, (LPARAM)&cf);
    SendMessageA(hLogEdit, EM_REPLACESEL, FALSE, (LPARAM)buffer);
    SendMessageA(hLogEdit, EM_REPLACESEL, FALSE, (LPARAM)"\r\n");
}

// Initialize critical section for WebSocket clients
void init_hmr_system() {
    InitializeCriticalSection(&ws_clients_lock);
    LogWithColor("HMR System initialized", RGB(255, 255, 0));
}

void cleanup_hmr_system() {
    DeleteCriticalSection(&ws_clients_lock);
    
    WebSocketClient* current = ws_clients;
    while (current) {
        WebSocketClient* next = current->next;
        closesocket(current->socket);
        free(current);
        current = next;
    }
    ws_clients = NULL;
    
    LogWithColor("HMR System cleaned up", RGB(255, 165, 0));
}

// File serving with proper MIME types
void serve_file(SOCKET client, const char *filename) {
    const char *file_to_open = filename;
    if (filename[0] == '/') {
        file_to_open = filename + 1;
    }
    
    FILE *file = fopen(file_to_open, "rb");
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
        return;
    }

    size_t bytes_read = fread(buffer, 1, size, file);
    fclose(file);

    char *header = (char*)smart_malloc(512);
    int header_len = snprintf(header, 512,
        "HTTP/1.1 200 OK\r\n"
        "Content-Type: %s\r\n"
        "Content-Length: %zu\r\n"
        "Cache-Control: no-cache\r\n"
        "Access-Control-Allow-Origin: *\r\n\r\n",
        mime, bytes_read);

    send(client, header, header_len, 0);
    send(client, buffer, (int)bytes_read, 0);
    
    smart_free(buffer);
    smart_free(header);
}

// Enhanced reload endpoint with smart data
void serve_reload(SOCKET client) {
    int should_reload = files_changed;
    if (should_reload) files_changed = 0;

    char response[512];
    int response_len = snprintf(response, sizeof(response),
        "HTTP/1.1 200 OK\r\n"
        "Content-Type: application/json\r\n"
        "Access-Control-Allow-Origin: *\r\n"
        "Cache-Control: no-cache\r\n\r\n"
        "{\"reload\":%s,\"timestamp\":%ld,\"smart_hmr\":true,\"tracked_files\":%d}",
        should_reload ? "true" : "false",
        (long)time(NULL),
        snapshot_count);
    send(client, response, response_len, 0);
}

// 404 page
void serve_404_page(SOCKET client, const char* requested_file) {
    LogWithColor("404: %s", RGB(255, 165, 0), requested_file);

    char html_buffer[2048];
    snprintf(html_buffer, sizeof(html_buffer),
        "<!DOCTYPE html>\n"
        "<html><head><title>404 Not Found</title>"
        "<style>body{font-family:system-ui;text-align:center;padding:50px;}"
        "h1{font-size:4rem;margin:0;color:#ef4444;}p{font-size:1.2rem;}</style>"
        "</head><body><h1>404</h1><p>File not found: %s</p></body></html>",
        requested_file);

    size_t content_len = strlen(html_buffer);
    char header[256];
    int header_len = snprintf(header, sizeof(header),
        "HTTP/1.1 404 Not Found\r\n"
        "Content-Type: text/html\r\n"
        "Content-Length: %zu\r\n\r\n", content_len);

    send(client, header, header_len, 0);
    send(client, html_buffer, (int)content_len, 0);
}

// Main server thread with WebSocket support
unsigned __stdcall ServerThread(void* pArguments) {
    ThreadArgs* thread_args = (ThreadArgs*)pArguments;
    int argc = thread_args->argc;
    char** argv = thread_args->argv;
    
    // Initialise HMR(Hot Reload) system
    init_hmr_system();
    
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
        cleanup_hmr_system();
        free(thread_args);
        return 1;
    }

    listen(server, 10);
    GetSystemTimeAsFileTime(&last_check_time);

    LogWithColor("LiveServer Ready", RGB(0, 255, 0));
    LogWithColor("Local: http://localhost:%d", RGB(0, 200, 255), port);
    LogWithColor("Watching HTML , CSS , JS files...", RGB(255, 255, 0));

    char url[256];
    snprintf(url, sizeof(url), "http://localhost:%d", port);
    ShellExecuteA(NULL, "open", url, NULL, NULL, SW_SHOWNORMAL);

    while (server_running) {
        SOCKET client = accept(server, NULL, NULL);
        if (client == INVALID_SOCKET) break;
        
        char *buffer = (char*)smart_malloc(4096);
        if (!buffer) {
            closesocket(client);
            continue;
        }
        
        int bytes_received = recv(client, buffer, 4095, 0);
        if (bytes_received > 0) {
            buffer[bytes_received] = '\0';
            
            char method[16], path[1024];
            memset(method, 0, sizeof(method));
            memset(path, 0, sizeof(path));
            sscanf(buffer, "%15s %1023s", method, path);
            
            // Check for WebSocket upgrade
            if (strstr(buffer, "Upgrade: websocket") && strstr(buffer, "Connection: Upgrade")) {
                // WebSocket handshake (basic implementation)
                char* key = strstr(buffer, "Sec-WebSocket-Key: ");
                if (key) {
                    key += 19; // Skip "Sec-WebSocket-Key: "
                    char* key_end = strstr(key, "\r\n");
                    if (key_end) {
                        *key_end = '\0';
                        
                        const char* websocket_response = 
                            "HTTP/1.1 101 Switching Protocols\r\n"
                            "Upgrade: websocket\r\n"
                            "Connection: Upgrade\r\n"
                            "Sec-WebSocket-Accept: s3pPLMBiTxaQ9kYGzzhZRbK+xOo=\r\n"
                            "\r\n";
                        
                        send(client, websocket_response, (int)strlen(websocket_response), 0);
                        add_websocket_client(client);
                        LogWithColor("WebSocket connection established", RGB(0, 255, 128));
                        
                        smart_free(buffer);
                        continue; // Don't close the socket, keep it for WebSocket
                    }
                }
            }
            
            // Remove query parameters
            char *query_params = strchr(path, '?');
            if (query_params) *query_params = '\0';
            
            // Route handling
            if (strcmp(path, "/reload") == 0) {
                check_files_modified();
                serve_reload(client);
                LogWithColor("[%s] %s [Hot Reload System]", RGB(0, 255, 128), method, path);
            } 
            else if (strcmp(path, "/live-reload.js") == 0) {
                check_files_modified();
                serve_live_script(client);
                LogWithColor("[%s] %s [HMR Script]", RGB(0, 255, 128), method, path);
            }
            else if (strncmp(path, "/api/", 5) == 0) {
                char api_response[1024];
                int api_len = snprintf(api_response, sizeof(api_response),
                    "HTTP/1.1 200 OK\r\n"
                    "Content-Type: application/json\r\n"
                    "Access-Control-Allow-Origin: *\r\n\r\n"
                    "{\"status\":\"running\",\"smart_hmr\":true,\"files\":%d,\"memory\":%zu}",
                    snapshot_count, memory_pool ? memory_pool->total_allocated : 0);
                send(client, api_response, api_len, 0);
                LogWithColor("[%s] %s [API]", RGB(0, 200, 255), method, path);
            }
            else {
                char *file = path + 1;
                if (strlen(file) == 0) {
                    file = "index.html";
                }
                
                const char *ext = strrchr(file, '.');
                
                // Smart handling based on file type
                if (ext && strcmp(ext, ".html") == 0) {
                    FILE *test_file = fopen(file, "r");
                    if (test_file) {
                        fclose(test_file);
                        LogWithColor("[%s] %s [HTML]", RGB(0, 255, 128), method, path);
                        check_files_modified();
                        serve_mintkit_enhanced_html(client, file);
                    } else {
                        serve_404_page(client, file);
                    }
                }
                else if (ext && (strcmp(ext, ".css") == 0 || strcmp(ext, ".js") == 0)) {
                    LogWithColor("[%s] %s [Tracked Asset]", RGB(0, 255, 255), method, path);
                    check_files_modified();
                    serve_file(client, file);
                }
                else if (!ext) {
                    // Try .html extension
                    char html_file[1024];
                    snprintf(html_file, sizeof(html_file), "%s.html", file);
                    FILE *test_file = fopen(html_file, "r");
                    if (test_file) {
                        fclose(test_file);
                        LogWithColor("[%s] %s [Auto .html]", RGB(0, 255, 128), method, path);
                        check_files_modified();
                        serve_mintkit_enhanced_html(client, html_file);
                    } else {
                        serve_file(client, file);
                    }
                }
                else {
                    LogWithColor("[%s] %s", RGB(0, 200, 255), method, path);
                    serve_file(client, file);
                }
            }
        }
        
        smart_free(buffer);
        closesocket(client);
    }

    cleanup_hmr_system();
    closesocket(server);
    WSACleanup();
    free(thread_args);
    return 0;
}

// Memory cleanup
void cleanup_memory_pool() {
    if (!memory_pool) return;
    
    LogWithColor("Memory cleanup started", RGB(255, 165, 0));
    LogWithColor("Blocks: %d, Memory: %zu bytes", RGB(0, 200, 255), 
                 memory_pool->count, memory_pool->total_allocated);

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

// UI functions
BOOL IsDarkModeEnabled() {
    return TRUE; 
}

void ApplyTheme(HWND hwnd) {
    g_bgColor = RGB(18, 18, 18);
    g_textColor = RGB(248, 248, 248);

    if (g_bgBrush) DeleteObject(g_bgBrush);
    g_bgBrush = CreateSolidBrush(g_bgColor);

    BOOL dark = TRUE;
    DwmSetWindowAttribute(hwnd, DWMWA_USE_IMMERSIVE_DARK_MODE, &dark, sizeof(dark));

    if (hLogEdit) {
        SendMessage(hLogEdit, EM_SETBKGNDCOLOR, 0, g_bgColor);
        InvalidateRect(hLogEdit, NULL, TRUE);
        UpdateWindow(hLogEdit);
    }
}

// Window procedure
LRESULT CALLBACK WindowProc(HWND hwnd, UINT uMsg, WPARAM wParam, LPARAM lParam) {
    switch (uMsg) {
        case WM_CREATE:
            hRichEdit = LoadLibraryA("Msftedit.dll");
            if (!hRichEdit) {
                MessageBox(hwnd, "Could not load Rich Edit library", "Error", MB_OK);
                return -1;
            }
            
            hLogEdit = CreateWindowExA(0, "RICHEDIT50W", "",
                WS_CHILD | WS_VISIBLE | WS_VSCROLL | ES_LEFT | ES_MULTILINE | ES_AUTOVSCROLL | ES_READONLY,
                0, 0, 0, 0, hwnd, (HMENU)1, GetModuleHandle(NULL), NULL);
            
            if (!hLogEdit) {
                MessageBox(hwnd, "Could not create log window", "Error", MB_OK);
                return -1;
            }
            
            g_hFont = CreateFontA(16, 0, 0, 0, FW_NORMAL, FALSE, FALSE, FALSE, 
                DEFAULT_CHARSET, OUT_DEFAULT_PRECIS, CLIP_DEFAULT_PRECIS, 
                DEFAULT_QUALITY, FIXED_PITCH | FF_MODERN, "Consolas");
            
            if (g_hFont) SendMessage(hLogEdit, WM_SETFONT, (WPARAM)g_hFont, TRUE);
            
            ApplyTheme(hwnd);
            break;

        case WM_SIZE:
            MoveWindow(hLogEdit, 0, 0, LOWORD(lParam), HIWORD(lParam), TRUE);
            break;

        case WM_CLOSE:
            if (MessageBox(hwnd, "Stop Server?", "Hot Reload", MB_OKCANCEL) == IDOK) {
                server_running = 0;
                DestroyWindow(hwnd);
            }
            break;

        case WM_DESTROY:
            if (g_hFont) DeleteObject(g_hFont);
            if (g_bgBrush) DeleteObject(g_bgBrush);
            if (hRichEdit) FreeLibrary(hRichEdit);
            cleanup_memory_pool();
            PostQuitMessage(0);
            break;

        default:
            return DefWindowProc(hwnd, uMsg, wParam, lParam);
    }
    return 0;
}

// Main entry point
int WINAPI WinMain(HINSTANCE hInstance, HINSTANCE hPrevInstance, LPSTR lpCmdLine, int nCmdShow) {
    const char CLASS_NAME[] = "SmartHMRWindowClass";
    
    WNDCLASS wc = {0};
    wc.lpfnWndProc = WindowProc;
    wc.hInstance = hInstance;
    wc.lpszClassName = CLASS_NAME;
    wc.hCursor = LoadCursor(NULL, IDC_ARROW);
    wc.hbrBackground = (HBRUSH)(COLOR_WINDOW + 1);

    RegisterClass(&wc);

    HWND hwnd = CreateWindowEx(0, CLASS_NAME, "Hot Reload Console",
        WS_OVERLAPPEDWINDOW, CW_USEDEFAULT, CW_USEDEFAULT, 900, 700,
        NULL, NULL, hInstance, NULL);

    if (!hwnd) return 0;

    ShowWindow(hwnd, nCmdShow);

    ThreadArgs* args = (ThreadArgs*)malloc(sizeof(ThreadArgs));
    if (!args) {
        MessageBox(hwnd, "Failed to allocate memory", "Fatal Error", MB_OK);
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
    gcc -O3 LiveServer.c -o LiveServer.exe -lws2_32 -lshell32 -mwindows -ldwmapi -luxtheme
    
    Then run  ./LiveServer.exe [port]
    Then open http://localhost:3000

    Usage: ./LiveServer.exe [port]
*/