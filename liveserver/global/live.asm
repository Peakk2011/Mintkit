; Supports: Windows (x64), Linux (x64), macOS (x64)
; OS Build
; Windows:     nasm -f win64 live.asm -o server.obj && link server.obj kernel32.lib ws2_32.lib /subsystem:console /entry:main
; ->  Windows Linker | x86_64-w64-mingw32-gcc server.obj -o server.exe -lws2_32 -static
; Linux:       nasm -f elf64 live.asm -o server.o && ld server.o -o server
; macOS:       nasm -f macho64 -DMACOS live.asm -o server.o && ld server.o -o server -lSystem -e _start

%ifdef WIN64
    %define PLATFORM_WINDOWS
    %define SYSCALL_CONV call
%elifdef LINUX
    %define PLATFORM_LINUX  
    %define SYSCALL_CONV syscall
%elifdef MACOS
    %define PLATFORM_MACOS
    %define SYSCALL_CONV syscall
%else
    %ifidn __OUTPUT_FORMAT__, win64
        %define PLATFORM_WINDOWS
        %define SYSCALL_CONV call
    %elifidn __OUTPUT_FORMAT__, elf64
        %define PLATFORM_LINUX
        %define SYSCALL_CONV syscall
    %elifidn __OUTPUT_FORMAT__, macho64
        %define PLATFORM_MACOS  
        %define SYSCALL_CONV syscall
    %endif
%endif

; Platform specific constants
%ifdef PLATFORM_WINDOWS
    %define STDOUT_HANDLE -11
    %define AF_INET 2
    %define SOCK_STREAM 1
    %define IPPROTO_TCP 6
    %define SOL_SOCKET 0xFFFF
    %define SO_REUSEADDR 4
    %define INADDR_ANY 0
    %define GENERIC_READ 0x80000000
    %define FILE_SHARE_READ 1
    %define OPEN_EXISTING 3
    %define FILE_ATTRIBUTE_NORMAL 0x80
%else
    ; Unix constants (Linux/macOS)
    %define STDOUT_FILENO 1
    %define AF_INET 2
    %define SOCK_STREAM 1
    %define IPPROTO_TCP 6
    %define SOL_SOCKET 1
    %define SO_REUSEADDR 2
    %define INADDR_ANY 0
    %define O_RDONLY 0
    
    ; System call
    %ifdef PLATFORM_LINUX
        %define SYS_READ 0
        %define SYS_WRITE 1
        %define SYS_OPEN 2
        %define SYS_CLOSE 3
        %define SYS_SOCKET 41
        %define SYS_BIND 49
        %define SYS_LISTEN 50
        %define SYS_ACCEPT 43
        %define SYS_RECV 45
        %define SYS_SEND 44
        %define SYS_SETSOCKOPT 54
        %define SYS_EXIT 60
    %else ; macOS
        %define SYS_READ 0x2000003
        %define SYS_WRITE 0x2000004
        %define SYS_OPEN 0x2000005
        %define SYS_CLOSE 0x2000006
        %define SYS_SOCKET 0x2000061
        %define SYS_BIND 0x2000068
        %define SYS_LISTEN 0x200006A
        %define SYS_ACCEPT 0x200001E
        %define SYS_RECV 0x200001D
        %define SYS_SEND 0x2000089 ; sendto
        %define SYS_SETSOCKOPT 0x2000069
        %define SYS_EXIT 0x2000001
    %endif
%endif

section .data
    ; Const variables
    PORT        equ 3000
    BUFFER_SIZE equ 8192
    BACKLOG     equ 10
    
    ; Server state
    server_fd   dq 0
    client_fd   dq 0
    
    ; Buffers
    file_buffer     times BUFFER_SIZE db 0
    response_buffer times BUFFER_SIZE db 0
    path_buffer     times 512 db 0
    temp_buffer     times 512 db 0
    
    ; Socket address struct  
    server_addr:
        dw AF_INET              ; sin_family
        dw 0                    ; sin_port
        dd INADDR_ANY           ; sin_addr
        times 8 db 0            ; padding
    
    client_addr times 16 db 0
    addr_len dd 16
    
    ; HTTP Messages
    startup_msg     db '[Server] Cross-Platform Live Server Starting...', 10, 0
    listening_msg   db '[Server] Listening on http://localhost:3000', 10, 0
    request_msg     db '[Request] ', 0
    newline         db 10, 0
    
    http_200        db 'HTTP/1.1 200 OK', 13, 10, 0
    http_404        db 'HTTP/1.1 404 Not Found', 13, 10, 0  
    http_500        db 'HTTP/1.1 500 Internal Server Error', 13, 10, 0
    
    content_type    db 'Content-Type: ', 0
    content_length  db 'Content-Length: ', 0
    connection      db 'Connection: close', 13, 10, 0
    cache_control   db 'Cache-Control: no-cache', 13, 10, 0
    
    ; MIME Types
    mime_html       db 'text/html', 0
    mime_css        db 'text/css', 0
    mime_js         db 'application/javascript', 0
    mime_json       db 'application/json', 0
    mime_png        db 'image/png', 0
    mime_jpg        db 'image/jpeg', 0
    mime_gif        db 'image/gif', 0
    mime_default    db 'application/octet-stream', 0
    
    ext_html        db '.html', 0
    ext_htm         db '.htm', 0
    ext_css         db '.css', 0
    ext_js          db '.js', 0
    ext_json        db '.json', 0
    ext_png         db '.png', 0
    ext_jpg         db '.jpg', 0
    ext_jpeg        db '.jpeg', 0
    ext_gif         db '.gif', 0

    index_file      db './index.html', 0
    root_path       db '/', 0
    current_dir     db '.', 0
    
    ; Error pages
    error_404       db '<!DOCTYPE html><html><head><title>404 Not Found</title></head>'
                    db '<body><h1>404 - File Not Found</h1><p>Cross-platform server says: File not found!</p></body></html>', 0
    
    error_500       db '<!DOCTYPE html><html><head><title>500 Error</title></head>'
                    db '<body><h1>500 - Internal Server Error</h1><p>Cross-platform server error!</p></body></html>', 0
    
    ; HTML Testing
    sample_html     db '<!DOCTYPE html><html><head><title>Cross-Platform Server</title></head>'
                    db '<body><h1>🚀 Cross-Platform Live Server</h1>'
                    db '<p>Running on Pure Assembly!</p>'
                    db '<ul><li>Windows ✓</li><li>Linux ✓</li><li>macOS ✓</li></ul>'
                    db '</body></html>', 0

section .bss
    file_size       resq 1
    bytes_read      resq 1
    
    http_buffer

section .text
%ifdef PLATFORM_WINDOWS
    ; Windows API imports
    extern GetStdHandle
    extern WriteConsoleA
    extern WSAStartup
    extern WSACleanup
    extern socket
    extern bind
    extern listen
    extern accept
    extern recv
    extern send
    extern closesocket
    extern setsockopt
    extern CreateFileA
    extern ReadFile
    extern CloseHandle
    extern GetFileSizeEx
    extern GetLastError
    extern htons
    
    global main
%else
    global _start
%endif

%ifdef PLATFORM_WINDOWS
main:
%else
_start:
%endif
    push rbp
    mov rbp, rsp
    
    
%ifdef PLATFORM_WINDOWS
    call init_winsock
%endif
    
    call create_server_socket
    test rax, rax
    js exit_error
    
    call start_server
    
    jmp exit_success

%ifdef PLATFORM_WINDOWS
init_winsock:

    ret
%endif

create_server_socket:
    push rbp
    mov rbp, rsp
%ifdef PLATFORM_WINDOWS
    mov rcx, AF_INET
    mov rdx, SOCK_STREAM  
    mov r8, IPPROTO_TCP
    call socket
    cmp rax, -1
    je .error
    mov [server_fd], rax
    
    mov rcx, [server_fd]
    mov rdx, SOL_SOCKET
    mov r8, SO_REUSEADDR
    lea r9, [temp_buffer]
    mov dword [r9], 1
    mov qword [rsp + 32], 4
    call setsockopt
    
    mov ax, PORT
    call htons
    mov [rel server_addr + 2], ax
    
    mov rcx, [rel server_fd] 
    lea rdx, [rel server_addr] 
    mov r8, 16
    call bind
    test rax, rax
    jnz .error
    mov rcx, [server_fd]  
    mov rdx, BACKLOG
    call listen
    test rax, rax
    jnz .error
    
%else
    mov rax, SYS_SOCKET
    mov rdi, AF_INET
    mov rsi, SOCK_STREAM
    mov rdx, IPPROTO_TCP
    SYSCALL_CONV
    test rax, rax
    js .error
    mov qword [rel server_fd], rax ; Explicitly specify qword size for Mach-O
    

    mov rax, SYS_SETSOCKOPT
    mov rdi, [server_fd]
    mov rsi, SOL_SOCKET
    mov rdx, SO_REUSEADDR
    lea r10, [temp_buffer]
    mov dword [r10], 1
    mov r8, r10
    mov r9, 4
    SYSCALL_CONV
    
    mov ax, PORT
    xchg al, ah
    mov word [rel server_addr + 2], ax ; Explicitly specify word size and rel for Mach-O
    
    mov rax, SYS_BIND
    mov rdi, qword [rel server_fd] ; Explicitly specify qword size for Mach-O
    lea rsi, [rel server_addr] 
    mov rdx, 16
    SYSCALL_CONV
    test rax, rax
    jnz .error
    mov rax, SYS_LISTEN
    mov rdi, qword [rel server_fd] ; Explicitly specify qword size for Mach-O
    mov rsi, BACKLOG
    SYSCALL_CONV
    test rax, rax
    jnz .error
%endif
    
    xor rax, rax
    jmp .exit
    
.error:
    mov rax, -1
    
.exit:
    pop rbp
    ret

start_server:
    push rbp
    mov rbp, rsp
    
    call print_listening
    
.accept_loop:
%ifdef PLATFORM_WINDOWS
    mov rcx, [server_fd]
    lea rdx, [server_addr] 
    lea r8, [addr_len] 
    mov dword [r8], 16 
    call accept
    cmp rax, -1
    je .accept_loop
%else
    mov rax, SYS_ACCEPT
    mov rdi, [server_fd]
    lea rsi, [client_addr]
    lea rdx, [rel addr_len]
    SYSCALL_CONV
    test rax, rax
    js .accept_loop

    mov qword [rel client_fd], rax ; Explicitly specify qword size for Mach-O
%endif
    
    call handle_client
    
%ifdef PLATFORM_WINDOWS
    mov rcx, [client_fd]
    call closesocket
%else
    mov rax, SYS_CLOSE
    mov rdi, [client_fd]
    SYSCALL_CONV
%endif
    
    jmp .accept_loop

handle_client:
    push rbp
    mov rbp, rsp
    
%ifdef PLATFORM_WINDOWS
    mov rcx, [client_fd]
    lea rdx, [http_buffer]
    mov r8, BUFFER_SIZE - 1
    xor r9, r9
    call recv
%else
    mov rax, SYS_RECV
    mov rdi, [client_fd]
    lea rsi, [rel http_buffer]
    mov rdx, BUFFER_SIZE - 1
    mov r10, 0
    %ifdef PLATFORM_MACOS
        xor r8, r8 ; src_addr = NULL
        xor r9, r9 ; addrlen = NULL
    %endif
    SYSCALL_CONV
%endif
    
    test rax, rax
    jle .exit
    

    mov byte [rel http_buffer + rax], 0
    call parse_request
    call process_request
    
.exit:
    pop rbp
    ret

parse_request:
    push rbp
    mov rbp, rsp
    
    lea rsi, [rel http_buffer]
    
.skip_method:
    lodsb
    cmp al, ' '
    jne .skip_method
    
    lea rdi, [rel path_buffer]
.copy_path:
    lodsb
    cmp al, ' '
    je .path_done
    cmp al, '?'
    je .path_done
    stosb
    jmp .copy_path
    
.path_done:
    mov byte [rdi], 0
    
    pop rbp
    ret

process_request:
    push rbp
    mov rbp, rsp
    
    lea rsi, [rel path_buffer]
    cmp byte [rsi], '/'
    jne .not_root
    cmp byte [rsi + 1], 0
    jne .not_root
    
    call send_sample_html
    jmp .exit
    
.not_root:
    call read_requested_file
    test rax, rax
    jz .file_not_found
    
    call send_file_response
    jmp .exit
    
.file_not_found:
    call send_404_response
    
.exit:
    pop rbp
    ret

read_requested_file:
    push rbp
    mov rbp, rsp
    
    lea rsi, [rel path_buffer]
    inc rsi
    lea rdi, [rel temp_buffer]
    mov byte [rdi], '.'
    inc rdi
    mov byte [rdi], '/'
    inc rdi
    call str_copy
    
%ifdef PLATFORM_WINDOWS
    lea rcx, [temp_buffer]
    mov rdx, GENERIC_READ
    mov r8, FILE_SHARE_READ
    xor r9, r9
    mov qword [rsp + 32], OPEN_EXISTING
    mov qword [rsp + 40], FILE_ATTRIBUTE_NORMAL
    mov qword [rsp + 48], 0
    call CreateFileA
    cmp rax, -1
    je .error
    
    mov rcx, rax
    lea rdx, [file_buffer]
    mov r8, BUFFER_SIZE - 1
    lea r9, [bytes_read]
    mov qword [rsp + 32], 0
    call ReadFile
    push rax
    call CloseHandle
    pop rax
    test rax, rax
    jz .error
    
%else
    mov rax, SYS_OPEN
    lea rdi, [rel temp_buffer]
    mov rsi, O_RDONLY
    mov rdx, 0
    SYSCALL_CONV
    test rax, rax
    js .error
    
    push rax
    mov rdi, rax
    mov rax, SYS_READ
    lea rsi, [rel file_buffer]
    mov rdx, BUFFER_SIZE - 1
    SYSCALL_CONV
    
    mov [bytes_read], rax
    mov qword [rel bytes_read], rax
    pop rdi
    push rax
    mov rax, SYS_CLOSE
    SYSCALL_CONV
    pop rax
    test rax, rax
    js .error
%endif
    
    mov rax, 1
    jmp .exit
    
.error:
    xor rax, rax                ; Error
    
.exit:
    pop rbp
    ret

send_sample_html:
    push rbp
    mov rbp, rsp
    
    call send_string_to_client
    db 'HTTP/1.1 200 OK', 13, 10
    db 'Content-Type: text/html', 13, 10
    db 'Connection: close', 13, 10
    db 'Cache-Control: no-cache', 13, 10, 13, 10, 0
    lea rdx, [sample_html]
    call send_data_to_client
    
    pop rbp
    ret

send_file_response:
    push rbp
    mov rbp, rsp
    
    call send_string_to_client
    db 'HTTP/1.1 200 OK', 13, 10
    db 'Content-Type: ', 0
    
    call get_mime_type
    mov rdx, rax
    call send_data_to_client

    call send_string_to_client ; Send remaining headers
    db 13, 10, 'Connection: close', 13, 10, 'Cache-Control: no-cache', 13, 10, 13, 10, 0
    lea rdx, [file_buffer]
    call send_data_to_client
    
    pop rbp
    ret

send_404_response:
    push rbp
    mov rbp, rsp
    
    call send_string_to_client
    db 'HTTP/1.1 404 Not Found', 13, 10
    db 'Content-Type: text/html', 13, 10
    db 'Connection: close', 13, 10, 13, 10, 0
    
    lea rdx, [error_404]
    call send_data_to_client
    
    pop rbp
    ret

get_mime_type:
    push rbp
    mov rbp, rsp
    
    lea rsi, [rel path_buffer]
    xor rdx, rdx
.find_dot:
    lodsb
    test al, al
    jz .check_ext
    cmp al, '.'
    jne .find_dot
    mov rdx, rsi
    jmp .find_dot
    
.check_ext:
    test rdx, rdx
    jz .default_mime
    
    mov rsi, rdx
    lea rdi, [rel ext_html + 1] ; This line already uses rel, if it still fails, it's a deeper issue.
    call str_compare
    test rax, rax
    jnz .check_css
    lea rax, [rel mime_html]
    jmp .exit
    
.check_css:
    mov rsi, rdx
    lea rdi, [ext_css + 1]
    call str_compare
    test rax, rax
    jnz .check_js
    lea rax, [rel mime_css]
    jmp .exit
    
.check_js:
    mov rsi, rdx
    lea rdi, [rel ext_js + 1]
    call str_compare
    test rax, rax
    jnz .default_mime
    lea rax, [rel mime_js]
    jmp .exit
    
.default_mime:
    lea rax, [mime_default]
    
.exit:
    pop rbp
    ret

; Utility functions
send_string_to_client:
    pop rdx
    push rdx
    call send_data_to_client
    
.skip_string:
    inc rdx
    cmp byte [rdx], 0
    jne .skip_string
    inc rdx
    jmp rdx

send_data_to_client:
    push rbp
    mov rbp, rsp
    
    mov rsi, rdx
    call str_length
    mov rcx, rax

%ifdef PLATFORM_WINDOWS
    mov rax, qword [client_fd] ; Explicitly specify qword size
    push rcx            ; Save length
    mov rcx, rax        ; Socket
    mov rdx, rsi        ; Buffer
    mov r8, [rsp]       ; Length from stack
    pop rcx             ; Restore rcx
    xor r9, r9          ; Flags
    call WSASend
%else
    mov rax, SYS_SEND
    mov rdi, [client_fd]
    mov rdx, rcx
    mov r10, 0
    %ifdef PLATFORM_MACOS
        xor r8, r8 ; dest_addr = NULL
        xor r9, r9 ; addrlen = 0
    %endif
 SYSCALL_CONV
%endif
    
    pop rbp
    ret

str_length:
    push rbp
    mov rbp, rsp
    
    xor rax, rax
    mov rdi, rsi
    
.count:
    cmp byte [rdi + rax], 0
    je .done
    inc rax
    jmp .count
    
.done:
    pop rbp
    ret

str_compare:
    push rbp
    mov rbp, rsp
    
.loop:
    lodsb
    mov dl, [rdi]
    inc rdi
    cmp al, dl
    jne .not_equal
    test al, al
    jnz .loop
    xor rax, rax
    jmp .exit
    
.not_equal:
    mov rax, 1
    
.exit:
    pop rbp
    ret

str_copy:
    push rbp
    mov rbp, rsp
    
.copy:
    lodsb
    stosb
    test al, al
    jnz .copy
    
    pop rbp
    ret

print_startup:
    push rbp
    mov rbp, rsp
    
    lea rdx, [rel startup_msg]
    call print_string
    
    pop rbp
    ret

print_listening:
    push rbp
    mov rbp, rsp
    
    lea rdx, [listening_msg]
    call print_string
    
    pop rbp
    ret

print_string:
    push rbp
    mov rbp, rsp
    
    mov rsi, rdx
    call str_length
    mov rcx, rax
    
%ifdef PLATFORM_WINDOWS
    push rcx
    mov rcx, STDOUT_HANDLE
    call GetStdHandle
    
    pop r8
    mov rcx, rax
    mov rdx, rsi
    xor r9, r9
    mov qword [rsp + 32], 0
    call WriteConsoleA
%else
    mov rax, SYS_WRITE
    mov rdi, STDOUT_FILENO
    mov rdx, rcx                ; length
    SYSCALL_CONV
%endif
    
    pop rbp
    ret

exit_success:
%ifdef PLATFORM_WINDOWS
    xor rcx, rcx
    call ExitProcess
%else
    mov rax, SYS_EXIT
    xor rdi, rdi
    SYSCALL_CONV
%endif

exit_error:
%ifdef PLATFORM_WINDOWS
    mov rcx, 1
    call ExitProcess
%else
    mov rax, SYS_EXIT
    mov rdi, 1
    SYSCALL_CONV
%endif