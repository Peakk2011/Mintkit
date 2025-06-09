	.file	"WebExecute.c"
	.intel_syntax noprefix
	.text
	.p2align 4
	.def	printf;	.scl	3;	.type	32;	.endef
	.seh_proc	printf
printf:
	push	rsi
	.seh_pushreg	rsi
	push	rbx
	.seh_pushreg	rbx
	sub	rsp, 56
	.seh_stackalloc	56
	.seh_endprologue
	lea	rsi, 88[rsp]
	mov	QWORD PTR 88[rsp], rdx
	mov	rbx, rcx
	mov	ecx, 1
	mov	QWORD PTR 96[rsp], r8
	mov	QWORD PTR 104[rsp], r9
	mov	QWORD PTR 40[rsp], rsi
	call	[QWORD PTR __imp___acrt_iob_func[rip]]
	mov	r8, rsi
	mov	rdx, rbx
	mov	rcx, rax
	call	__mingw_vfprintf
	add	rsp, 56
	pop	rbx
	pop	rsi
	ret
	.seh_endproc
	.p2align 4
	.def	snprintf;	.scl	3;	.type	32;	.endef
	.seh_proc	snprintf
snprintf:
	sub	rsp, 56
	.seh_stackalloc	56
	.seh_endprologue
	mov	QWORD PTR 88[rsp], r9
	lea	r9, 88[rsp]
	mov	QWORD PTR 40[rsp], r9
	call	__mingw_vsnprintf
	add	rsp, 56
	ret
	.seh_endproc
	.section .rdata,"dr"
.LC0:
	.ascii "%15s %1023s\0"
	.text
	.p2align 4
	.def	sscanf.constprop.0;	.scl	3;	.type	32;	.endef
	.seh_proc	sscanf.constprop.0
sscanf.constprop.0:
	sub	rsp, 56
	.seh_stackalloc	56
	.seh_endprologue
	lea	rdx, .LC0[rip]
	mov	QWORD PTR 80[rsp], r8
	lea	r8, 80[rsp]
	mov	QWORD PTR 88[rsp], r9
	mov	QWORD PTR 40[rsp], r8
	call	__mingw_vsscanf
	add	rsp, 56
	ret
	.seh_endproc
	.p2align 4
	.globl	enable_ansi_colors
	.def	enable_ansi_colors;	.scl	2;	.type	32;	.endef
	.seh_proc	enable_ansi_colors
enable_ansi_colors:
	push	rbx
	.seh_pushreg	rbx
	sub	rsp, 48
	.seh_stackalloc	48
	.seh_endprologue
	mov	ecx, -11
	call	[QWORD PTR __imp_GetStdHandle[rip]]
	mov	rbx, rax
	mov	rcx, rax
	lea	rdx, 44[rsp]
	mov	DWORD PTR 44[rsp], 0
	call	[QWORD PTR __imp_GetConsoleMode[rip]]
	mov	edx, DWORD PTR 44[rsp]
	mov	rcx, rbx
	or	edx, 4
	mov	DWORD PTR 44[rsp], edx
	call	[QWORD PTR __imp_SetConsoleMode[rip]]
	nop
	add	rsp, 48
	pop	rbx
	ret
	.seh_endproc
	.section .rdata,"dr"
.LC1:
	.ascii "\33[0m\0"
.LC2:
	.ascii "\33[94m\0"
	.align 8
.LC3:
	.ascii "%s[Memory Pool]%s Initialized with %d slots\12\12\0"
	.text
	.p2align 4
	.globl	init_memory_pool
	.def	init_memory_pool;	.scl	2;	.type	32;	.endef
	.seh_proc	init_memory_pool
init_memory_pool:
	push	rbp
	.seh_pushreg	rbp
	push	rdi
	.seh_pushreg	rdi
	push	rsi
	.seh_pushreg	rsi
	push	rbx
	.seh_pushreg	rbx
	sub	rsp, 56
	.seh_stackalloc	56
	.seh_endprologue
	mov	ebp, ecx
	mov	ecx, 32
	call	malloc
	mov	rbx, rax
	test	rax, rax
	je	.L7
	movsx	rsi, ebp
	sal	rsi, 3
	mov	rcx, rsi
	call	malloc
	mov	rcx, rsi
	mov	QWORD PTR [rbx], rax
	mov	rdi, rax
	call	malloc
	mov	DWORD PTR 16[rbx], 0
	mov	QWORD PTR 8[rbx], rax
	mov	DWORD PTR 20[rbx], ebp
	mov	QWORD PTR 24[rbx], 0
	test	rax, rax
	je	.L11
	test	rdi, rdi
	je	.L11
	xor	eax, eax
	mov	rcx, rsi
/APP
 # 78 "WebExecute.c" 1
	cld
	rep stosb
 # 0 "" 2
/NO_APP
	mov	rdi, QWORD PTR 8[rbx]
	mov	rcx, rsi
/APP
 # 78 "WebExecute.c" 1
	cld
	rep stosb
 # 0 "" 2
/NO_APP
	lea	r8, .LC1[rip]
	mov	r9d, ebp
	lea	rdx, .LC2[rip]
	lea	rcx, .LC3[rip]
	call	printf
.L6:
	mov	rax, rbx
	add	rsp, 56
	pop	rbx
	pop	rsi
	pop	rdi
	pop	rbp
	ret
.L11:
	mov	rcx, rdi
	mov	QWORD PTR 40[rsp], rax
	call	free
	mov	rcx, QWORD PTR 40[rsp]
	call	free
	mov	rcx, rbx
	call	free
.L7:
	xor	ebx, ebx
	jmp	.L6
	.seh_endproc
	.p2align 4
	.globl	smart_malloc
	.def	smart_malloc;	.scl	2;	.type	32;	.endef
	.seh_proc	smart_malloc
smart_malloc:
	push	r13
	.seh_pushreg	r13
	push	r12
	.seh_pushreg	r12
	push	rbp
	.seh_pushreg	rbp
	push	rdi
	.seh_pushreg	rdi
	push	rsi
	.seh_pushreg	rsi
	push	rbx
	.seh_pushreg	rbx
	sub	rsp, 40
	.seh_stackalloc	40
	.seh_endprologue
	cmp	QWORD PTR memory_pool[rip], 0
	mov	rbx, rcx
	je	.L16
.L19:
	mov	rcx, rbx
	call	malloc
	mov	rbp, rax
	test	rax, rax
	je	.L17
	mov	rsi, QWORD PTR memory_pool[rip]
	mov	eax, DWORD PTR 16[rsi]
	mov	edx, DWORD PTR 20[rsi]
	cmp	eax, edx
	jge	.L34
.L21:
	mov	rcx, QWORD PTR [rsi]
	movsx	rdx, eax
	add	eax, 1
	mov	QWORD PTR [rcx+rdx*8], rbp
	mov	rcx, QWORD PTR 8[rsi]
	mov	QWORD PTR [rcx+rdx*8], rbx
	add	QWORD PTR 24[rsi], rbx
	mov	DWORD PTR 16[rsi], eax
.L25:
	mov	rdi, rbp
	mov	rcx, rbx
	xor	eax, eax
/APP
 # 78 "WebExecute.c" 1
	cld
	rep stosb
 # 0 "" 2
/NO_APP
.L15:
	mov	rax, rbp
	add	rsp, 40
	pop	rbx
	pop	rsi
	pop	rdi
	pop	rbp
	pop	r12
	pop	r13
	ret
	.p2align 4,,10
	.p2align 3
.L34:
	lea	edi, [rdx+rdx]
	mov	rcx, QWORD PTR [rsi]
	movsx	r13, edi
	sal	r13, 3
	mov	rdx, r13
	call	realloc
	mov	rcx, QWORD PTR 8[rsi]
	mov	rdx, r13
	mov	r12, rax
	call	realloc
	test	r12, r12
	je	.L26
	test	rax, rax
	je	.L26
	mov	QWORD PTR [rsi], r12
	mov	QWORD PTR 8[rsi], rax
	mov	DWORD PTR 20[rsi], edi
.L24:
	mov	eax, DWORD PTR 16[rsi]
	cmp	eax, edi
	jge	.L25
	jmp	.L21
	.p2align 4,,10
	.p2align 3
.L16:
	mov	ecx, 100
	call	init_memory_pool
	mov	QWORD PTR memory_pool[rip], rax
	test	rax, rax
	jne	.L19
.L17:
	xor	ebp, ebp
	jmp	.L15
.L26:
	mov	edi, DWORD PTR 20[rsi]
	jmp	.L24
	.seh_endproc
	.p2align 4
	.globl	smart_free
	.def	smart_free;	.scl	2;	.type	32;	.endef
	.seh_proc	smart_free
smart_free:
	push	rdi
	.seh_pushreg	rdi
	push	rsi
	.seh_pushreg	rsi
	push	rbx
	.seh_pushreg	rbx
	.seh_endprologue
	test	rcx, rcx
	je	.L35
	mov	r8, QWORD PTR memory_pool[rip]
	test	r8, r8
	je	.L35
	mov	r10d, DWORD PTR 16[r8]
	test	r10d, r10d
	jle	.L37
	mov	r9, QWORD PTR [r8]
	movsx	rdx, r10d
	xor	eax, eax
	jmp	.L42
	.p2align 4
	.p2align 4,,10
	.p2align 3
.L38:
	add	rax, 1
	cmp	rax, rdx
	je	.L37
.L42:
	cmp	QWORD PTR [r9+rax*8], rcx
	jne	.L38
	mov	rdx, QWORD PTR 8[r8]
	lea	ebx, -1[r10]
	mov	rdx, QWORD PTR [rdx+rax*8]
	sub	QWORD PTR 24[r8], rdx
	cmp	ebx, eax
	jle	.L39
	movsx	rsi, eax
	lea	r11, 1[rsi]
	mov	rdi, QWORD PTR [r9+r11*8]
	lea	rdx, 0[0+r11*8]
	mov	QWORD PTR -8[r9+rdx], rdi
	mov	r9, QWORD PTR 8[r8]
	mov	r11, QWORD PTR [r9+r11*8]
	mov	QWORD PTR -8[r9+rdx], r11
	lea	r9d, 1[rax]
	cmp	ebx, r9d
	jle	.L39
	sub	r10d, 3
	sub	r10d, eax
	lea	r11, 2[rsi+r10]
	sal	r11, 3
	.p2align 6
	.p2align 4
	.p2align 3
.L41:
	mov	r9, QWORD PTR [r8]
	mov	rax, rdx
	add	rdx, 8
	mov	r10, QWORD PTR [r9+rdx]
	mov	QWORD PTR [r9+rax], r10
	mov	r9, QWORD PTR 8[r8]
	mov	r10, QWORD PTR [r9+rdx]
	mov	QWORD PTR [r9+rax], r10
	cmp	rdx, r11
	jne	.L41
.L39:
	mov	DWORD PTR 16[r8], ebx
.L37:
	pop	rbx
	pop	rsi
	pop	rdi
	jmp	free
	.p2align 4,,10
	.p2align 3
.L35:
	pop	rbx
	pop	rsi
	pop	rdi
	ret
	.seh_endproc
	.section .rdata,"dr"
.LC4:
	.ascii "\33[93m\0"
	.align 8
.LC5:
	.ascii "\12%s[Cleanup]%s Memory pool cleanup initiated\12\0"
.LC6:
	.ascii "\33[33m\0"
.LC7:
	.ascii "\33[35m\0"
	.align 8
.LC8:
	.ascii "%s[Stats]%s Total allocations: %s%d%s blocks\12\0"
	.align 8
.LC9:
	.ascii "%s[Stats]%s Total memory: %s%zu%s bytes\12\0"
.LC10:
	.ascii "\33[92m\0"
	.align 8
.LC11:
	.ascii "%s[Success]%s Memory pool cleaned up successfully\12\12\0"
	.text
	.p2align 4
	.def	cleanup_memory_pool.part.0;	.scl	3;	.type	32;	.endef
	.seh_proc	cleanup_memory_pool.part.0
cleanup_memory_pool.part.0:
	push	rbp
	.seh_pushreg	rbp
	push	rdi
	.seh_pushreg	rdi
	push	rsi
	.seh_pushreg	rsi
	push	rbx
	.seh_pushreg	rbx
	sub	rsp, 56
	.seh_stackalloc	56
	.seh_endprologue
	lea	r8, .LC1[rip]
	lea	rdx, .LC4[rip]
	lea	rcx, .LC5[rip]
	lea	rdi, .LC1[rip]
	lea	rbx, .LC7[rip]
	call	printf
	mov	QWORD PTR 40[rsp], rdi
	mov	rdx, rbx
	mov	r8, rdi
	mov	rax, QWORD PTR memory_pool[rip]
	lea	r9, .LC6[rip]
	lea	rcx, .LC8[rip]
	mov	eax, DWORD PTR 16[rax]
	mov	DWORD PTR 32[rsp], eax
	call	printf
	mov	QWORD PTR 40[rsp], rdi
	mov	rdx, rbx
	mov	r8, rdi
	mov	rax, QWORD PTR memory_pool[rip]
	lea	r9, .LC6[rip]
	lea	rcx, .LC9[rip]
	xor	ebx, ebx
	mov	rax, QWORD PTR 24[rax]
	mov	QWORD PTR 32[rsp], rax
	call	printf
	mov	rsi, QWORD PTR memory_pool[rip]
	mov	eax, DWORD PTR 16[rsi]
	test	eax, eax
	jle	.L56
	.p2align 4
	.p2align 3
.L52:
	mov	rax, QWORD PTR [rsi]
	mov	rcx, QWORD PTR [rax+rbx*8]
	test	rcx, rcx
	je	.L55
	call	free
.L55:
	add	rbx, 1
	cmp	DWORD PTR 16[rsi], ebx
	jg	.L52
.L56:
	movsx	rax, DWORD PTR snapshot_count[rip]
	mov	rbp, QWORD PTR file_snapshots[rip]
	test	eax, eax
	jle	.L54
	lea	rdx, [rax+rax*8]
	mov	rbx, rbp
	lea	rax, [rax+rdx*4]
	lea	rdi, 0[rbp+rax*8]
	.p2align 4
	.p2align 3
.L58:
	mov	rcx, QWORD PTR 264[rbx]
	test	rcx, rcx
	je	.L57
	call	smart_free
.L57:
	add	rbx, 296
	cmp	rdi, rbx
	jne	.L58
.L54:
	mov	rcx, rbp
	call	free
	mov	rcx, QWORD PTR [rsi]
	call	free
	mov	rcx, QWORD PTR 8[rsi]
	call	free
	mov	rcx, rsi
	call	free
	lea	r8, .LC1[rip]
	lea	rdx, .LC10[rip]
	mov	QWORD PTR memory_pool[rip], 0
	lea	rcx, .LC11[rip]
	add	rsp, 56
	pop	rbx
	pop	rsi
	pop	rdi
	pop	rbp
	jmp	printf
	.seh_endproc
	.p2align 4
	.globl	cleanup_memory_pool
	.def	cleanup_memory_pool;	.scl	2;	.type	32;	.endef
	.seh_proc	cleanup_memory_pool
cleanup_memory_pool:
	.seh_endprologue
	cmp	QWORD PTR memory_pool[rip], 0
	je	.L69
	jmp	cleanup_memory_pool.part.0
	.p2align 4,,10
	.p2align 3
.L69:
	ret
	.seh_endproc
	.section .rdata,"dr"
.LC12:
	.ascii "rb\0"
	.text
	.p2align 4
	.globl	read_file_content
	.def	read_file_content;	.scl	2;	.type	32;	.endef
	.seh_proc	read_file_content
read_file_content:
	push	rdi
	.seh_pushreg	rdi
	push	rsi
	.seh_pushreg	rsi
	push	rbx
	.seh_pushreg	rbx
	sub	rsp, 32
	.seh_stackalloc	32
	.seh_endprologue
	mov	rsi, rdx
	lea	rdx, .LC12[rip]
	call	fopen
	mov	rbx, rax
	test	rax, rax
	je	.L72
	mov	r8d, 2
	xor	edx, edx
	mov	rcx, rax
	call	fseek
	mov	rcx, rbx
	call	ftell
	mov	rcx, rbx
	cdqe
	mov	QWORD PTR [rsi], rax
	call	rewind
	mov	rax, QWORD PTR [rsi]
	lea	rcx, 1[rax]
	call	smart_malloc
	mov	rdi, rax
	test	rax, rax
	je	.L78
	mov	r8, QWORD PTR [rsi]
	mov	r9, rbx
	mov	edx, 1
	mov	rcx, rax
	call	fread
	mov	rax, QWORD PTR [rsi]
	mov	rcx, rbx
	mov	BYTE PTR [rdi+rax], 0
	call	fclose
	mov	rax, rdi
	add	rsp, 32
	pop	rbx
	pop	rsi
	pop	rdi
	ret
	.p2align 4,,10
	.p2align 3
.L78:
	mov	rcx, rbx
	call	fclose
.L72:
	xor	edi, edi
	mov	rax, rdi
	add	rsp, 32
	pop	rbx
	pop	rsi
	pop	rdi
	ret
	.seh_endproc
	.p2align 4
	.globl	count_lines
	.def	count_lines;	.scl	2;	.type	32;	.endef
	.seh_proc	count_lines
count_lines:
	.seh_endprologue
	mov	edx, 1
	movzx	eax, BYTE PTR [rcx]
	test	al, al
	je	.L79
	.p2align 5
	.p2align 4
	.p2align 3
.L82:
	cmp	al, 10
	sete	al
	add	rcx, 1
	movzx	eax, al
	add	edx, eax
	movzx	eax, BYTE PTR [rcx]
	test	al, al
	jne	.L82
.L79:
	mov	eax, edx
	ret
	.seh_endproc
	.section .rdata,"dr"
.LC13:
	.ascii "\33[36m\0"
.LC14:
	.ascii "\12%s[File Changed]%s %s%s%s\12\0"
.LC15:
	.ascii "\33[2m\0"
	.align 8
.LC16:
	.ascii "%s\342\224\200\342\224\200\342\224\200\342\224\200\342\224\200\342\224\200\342\224\200\342\224\200\342\224\200\342\224\200\342\224\200\342\224\200\342\224\200\342\224\200\342\224\200\342\224\200\342\224\200\342\224\200\342\224\200\342\224\200\342\224\200\342\224\200\342\224\200\342\224\200\342\224\200\342\224\200\342\224\200\342\224\200\342\224\200\342\224\200\342\224\200\342\224\200\342\224\200\342\224\200\342\224\200\342\224\200\342\224\200\342\224\200\342\224\200\342\224\200\342\224\200\342\224\200\342\224\200\342\224\200\342\224\200%s\12\0"
.LC17:
	.ascii "%s+ %s%d%s: %s%s%s\12\0"
.LC18:
	.ascii "\33[32m\0"
.LC19:
	.ascii "\33[31m\0"
.LC20:
	.ascii "%s- %s%d%s: %s%s%s\12\0"
.LC21:
	.ascii "%s~ %s%d%s: %s%s%s\12\0"
.LC22:
	.ascii "\33[96m\0"
	.align 8
.LC23:
	.ascii "%sNo line changes detected (possibly metadata only)%s\12\0"
	.align 8
.LC24:
	.ascii "%s\342\224\200\342\224\200\342\224\200\342\224\200\342\224\200\342\224\200\342\224\200\342\224\200\342\224\200\342\224\200\342\224\200\342\224\200\342\224\200\342\224\200\342\224\200\342\224\200\342\224\200\342\224\200\342\224\200\342\224\200\342\224\200\342\224\200\342\224\200\342\224\200\342\224\200\342\224\200\342\224\200\342\224\200\342\224\200\342\224\200\342\224\200\342\224\200\342\224\200\342\224\200\342\224\200\342\224\200\342\224\200\342\224\200\342\224\200\342\224\200\342\224\200\342\224\200\342\224\200\342\224\200\342\224\200%s\12\12\0"
	.text
	.p2align 4
	.globl	compare_and_show_changes
	.def	compare_and_show_changes;	.scl	2;	.type	32;	.endef
	.seh_proc	compare_and_show_changes
compare_and_show_changes:
	push	r15
	.seh_pushreg	r15
	push	r14
	.seh_pushreg	r14
	push	r13
	.seh_pushreg	r13
	push	r12
	.seh_pushreg	r12
	push	rbp
	.seh_pushreg	rbp
	push	rdi
	.seh_pushreg	rdi
	push	rsi
	.seh_pushreg	rsi
	push	rbx
	.seh_pushreg	rbx
	sub	rsp, 72
	.seh_stackalloc	72
	.seh_endprologue
	mov	rbp, rcx
	mov	ecx, 1024
	mov	rsi, rdx
	mov	rbx, r8
	call	smart_malloc
	mov	ecx, 1024
	mov	rdi, rax
	call	smart_malloc
	mov	QWORD PTR 32[rsp], rbp
	lea	r9, .LC13[rip]
	lea	rdx, .LC4[rip]
	mov	r15, rax
	lea	rax, .LC1[rip]
	lea	rcx, .LC14[rip]
	mov	QWORD PTR 40[rsp], rax
	mov	r8, rax
	call	printf
	lea	rdx, .LC15[rip]
	lea	r8, .LC1[rip]
	lea	rcx, .LC16[rip]
	call	printf
	movzx	edx, BYTE PTR [rsi]
	test	dl, dl
	jne	.L145
	xor	r12d, r12d
	cmp	BYTE PTR [rbx], 0
	mov	ebp, 1
	je	.L108
	.p2align 4
	.p2align 3
.L107:
	mov	rax, rdi
	xor	r14d, r14d
.L90:
	mov	BYTE PTR [rax], 0
	xor	eax, eax
	movzx	edx, BYTE PTR [rbx]
	cmp	BYTE PTR [rsi], 10
	sete	al
	add	rsi, rax
	test	dl, dl
	je	.L110
	cmp	dl, 10
	je	.L110
	mov	eax, 1
	jmp	.L95
	.p2align 4,,10
	.p2align 3
.L147:
	cmp	dl, 10
	je	.L113
	add	rax, 1
	cmp	rax, 1024
	je	.L146
.L95:
	mov	BYTE PTR -1[r15+rax], dl
	movzx	edx, BYTE PTR [rbx+rax]
	lea	r13, [rbx+rax]
	test	dl, dl
	jne	.L147
.L113:
	mov	ebx, eax
	cdqe
	add	rax, r15
.L92:
	mov	BYTE PTR [rax], 0
	xor	eax, eax
	cmp	BYTE PTR 0[r13], 10
	mov	rdx, r15
	sete	al
	mov	rcx, rdi
	add	r13, rax
	call	strcmp
	test	eax, eax
	je	.L97
	test	r14d, r14d
	jne	.L143
	test	ebx, ebx
	je	.L98
	lea	rax, .LC1[rip]
	lea	rbx, .LC18[rip]
	mov	QWORD PTR 48[rsp], r15
	mov	r9d, ebp
	mov	QWORD PTR 56[rsp], rax
	lea	r8, .LC6[rip]
	lea	rdx, .LC10[rip]
	mov	QWORD PTR 40[rsp], rbx
	lea	rcx, .LC17[rip]
	mov	QWORD PTR 32[rsp], rax
	call	printf
.L102:
	movzx	edx, BYTE PTR [rsi]
	mov	r12d, 1
	test	dl, dl
	jne	.L100
	cmp	BYTE PTR 0[r13], 0
	je	.L103
	mov	r12d, 1
.L104:
	add	ebp, 1
	mov	rbx, r13
	jmp	.L107
	.p2align 4,,10
	.p2align 3
.L97:
	movzx	edx, BYTE PTR [rsi]
	test	dl, dl
	jne	.L100
	cmp	BYTE PTR 0[r13], 0
	jne	.L104
	test	r12d, r12d
	je	.L108
.L103:
	lea	r8, .LC1[rip]
	lea	rdx, .LC15[rip]
	lea	rcx, .LC24[rip]
	call	printf
	mov	rcx, rdi
	call	smart_free
	mov	rcx, r15
	add	rsp, 72
	pop	rbx
	pop	rsi
	pop	rdi
	pop	rbp
	pop	r12
	pop	r13
	pop	r14
	pop	r15
	jmp	smart_free
	.p2align 4,,10
	.p2align 3
.L100:
	add	ebp, 1
	mov	rbx, r13
	mov	rcx, rsi
.L86:
	cmp	dl, 10
	je	.L107
	mov	eax, 1
	jmp	.L89
	.p2align 4,,10
	.p2align 3
.L149:
	cmp	dl, 10
	je	.L88
	add	rax, 1
	cmp	rax, 1024
	je	.L148
.L89:
	mov	BYTE PTR -1[rdi+rax], dl
	movzx	edx, BYTE PTR [rcx+rax]
	lea	rsi, [rcx+rax]
	test	dl, dl
	jne	.L149
.L88:
	mov	r14d, eax
	cdqe
	add	rax, rdi
	jmp	.L90
	.p2align 4,,10
	.p2align 3
.L143:
	test	ebx, ebx
	jne	.L101
	lea	rax, .LC1[rip]
	lea	rdx, .LC19[rip]
	mov	QWORD PTR 48[rsp], rdi
	mov	r9d, ebp
	mov	QWORD PTR 56[rsp], rax
	lea	r8, .LC6[rip]
	lea	rcx, .LC20[rip]
	mov	QWORD PTR 40[rsp], rdx
	mov	QWORD PTR 32[rsp], rax
	call	printf
	jmp	.L102
	.p2align 4,,10
	.p2align 3
.L98:
	test	r14d, r14d
	jne	.L143
.L101:
	lea	rax, .LC1[rip]
	lea	rcx, .LC22[rip]
	mov	QWORD PTR 48[rsp], r15
	mov	r9d, ebp
	mov	QWORD PTR 40[rsp], rcx
	lea	r8, .LC6[rip]
	lea	rdx, .LC4[rip]
	mov	QWORD PTR 56[rsp], rax
	lea	rcx, .LC21[rip]
	mov	QWORD PTR 32[rsp], rax
	call	printf
	jmp	.L102
.L148:
	lea	rax, 1023[rdi]
	mov	r14d, 1023
	jmp	.L90
.L146:
	lea	rax, 1023[r15]
	mov	ebx, 1023
	jmp	.L92
.L110:
	mov	r13, rbx
	mov	rax, r15
	xor	ebx, ebx
	jmp	.L92
.L108:
	lea	r8, .LC1[rip]
	lea	rdx, .LC15[rip]
	lea	rcx, .LC23[rip]
	call	printf
	jmp	.L103
.L145:
	mov	rcx, rsi
	xor	r12d, r12d
	mov	ebp, 1
	jmp	.L86
	.seh_endproc
	.section .rdata,"dr"
	.align 8
.LC25:
	.ascii "%s[New File Tracked]%s %s%s%s\12\12\0"
	.text
	.p2align 4
	.globl	update_file_snapshot
	.def	update_file_snapshot;	.scl	2;	.type	32;	.endef
	.seh_proc	update_file_snapshot
update_file_snapshot:
	push	r15
	.seh_pushreg	r15
	push	r14
	.seh_pushreg	r14
	push	r13
	.seh_pushreg	r13
	push	r12
	.seh_pushreg	r12
	push	rbp
	.seh_pushreg	rbp
	push	rdi
	.seh_pushreg	rdi
	push	rsi
	.seh_pushreg	rsi
	push	rbx
	.seh_pushreg	rbx
	sub	rsp, 72
	.seh_stackalloc	72
	.seh_endprologue
	mov	QWORD PTR 152[rsp], rdx
	lea	rdx, 56[rsp]
	mov	rdi, rcx
	call	read_file_content
	mov	r13, rax
	test	rax, rax
	je	.L150
	mov	r14d, DWORD PTR snapshot_count[rip]
	mov	r15, QWORD PTR file_snapshots[rip]
	movsx	r12, r14d
	test	r14d, r14d
	jle	.L152
	movsx	r12, r14d
	mov	rbx, r15
	lea	rax, [r12+r12*8]
	lea	rax, [r12+rax*4]
	lea	rbp, [r15+rax*8]
	jmp	.L154
	.p2align 4,,10
	.p2align 3
.L172:
	add	rbx, 296
	cmp	rbp, rbx
	je	.L152
.L154:
	mov	rdx, rdi
	mov	rcx, rbx
	mov	rsi, rbx
	call	strcmp
	test	eax, eax
	jne	.L172
	mov	rdx, QWORD PTR 264[rbx]
	test	rdx, rdx
	je	.L157
	mov	rcx, rdi
	mov	r8, r13
	call	compare_and_show_changes
	mov	rcx, QWORD PTR 264[rsi]
	call	smart_free
.L158:
	mov	rax, QWORD PTR 56[rsp]
	mov	QWORD PTR 264[rsi], r13
	mov	edx, 1
	mov	QWORD PTR 272[rsi], rax
	mov	rax, QWORD PTR 152[rsp]
	mov	rax, QWORD PTR [rax]
	mov	QWORD PTR 280[rsi], rax
	movzx	eax, BYTE PTR 0[r13]
	test	al, al
	je	.L159
	.p2align 5
	.p2align 4
	.p2align 3
.L161:
	cmp	al, 10
	sete	al
	add	r13, 1
	movzx	eax, al
	add	edx, eax
	movzx	eax, BYTE PTR 0[r13]
	test	al, al
	jne	.L161
.L159:
	mov	DWORD PTR 288[rsi], edx
.L150:
	add	rsp, 72
	pop	rbx
	pop	rsi
	pop	rdi
	pop	rbp
	pop	r12
	pop	r13
	pop	r14
	pop	r15
	ret
	.p2align 4,,10
	.p2align 3
.L152:
	mov	eax, DWORD PTR snapshot_capacity[rip]
	cmp	eax, r14d
	jg	.L155
	test	eax, eax
	je	.L163
	add	eax, eax
	movsx	rdx, eax
	lea	rcx, [rdx+rdx*8]
	lea	rdx, [rdx+rcx*4]
	sal	rdx, 3
.L156:
	mov	rcx, r15
	mov	DWORD PTR snapshot_capacity[rip], eax
	call	realloc
	mov	QWORD PTR file_snapshots[rip], rax
	mov	r15, rax
.L155:
	lea	rax, [r12+r12*8]
	add	r14d, 1
	mov	rdx, rdi
	lea	rax, [r12+rax*4]
	mov	DWORD PTR snapshot_count[rip], r14d
	lea	rsi, [r15+rax*8]
	mov	rcx, rsi
	call	strcpy
	mov	QWORD PTR 264[rsi], 0
.L157:
	lea	rax, .LC1[rip]
	mov	QWORD PTR 32[rsp], rdi
	lea	r9, .LC13[rip]
	mov	QWORD PTR 40[rsp], rax
	mov	r8, rax
	lea	rdx, .LC10[rip]
	lea	rcx, .LC25[rip]
	call	printf
	jmp	.L158
.L163:
	mov	edx, 2960
	mov	eax, 10
	jmp	.L156
	.seh_endproc
	.section .rdata,"dr"
.LC26:
	.ascii "*.html\0"
.LC27:
	.ascii "*.css\0"
.LC28:
	.ascii "*.js\0"
.LC29:
	.ascii "*.json\0"
.LC30:
	.ascii "*.tsx\0"
.LC31:
	.ascii "*.jsx\0"
.LC32:
	.ascii "*.ts\0"
	.align 8
.LC33:
	.ascii "%s[Hot Reload]%s %s%02d:%02d:%02d%s - Changes detected, reloading...\12\12\0"
	.align 8
.LC34:
	.ascii "%s[Performance]%s File scan completed in %s%llu%s CPU cycles\12\12\0"
	.text
	.p2align 4
	.globl	check_files_modified
	.def	check_files_modified;	.scl	2;	.type	32;	.endef
	.seh_proc	check_files_modified
check_files_modified:
	push	r15
	.seh_pushreg	r15
	push	r14
	.seh_pushreg	r14
	push	r13
	.seh_pushreg	r13
	push	r12
	.seh_pushreg	r12
	push	rbp
	.seh_pushreg	rbp
	push	rdi
	.seh_pushreg	rdi
	push	rsi
	.seh_pushreg	rsi
	push	rbx
	.seh_pushreg	rbx
	sub	rsp, 520
	.seh_stackalloc	520
	.seh_endprologue
/APP
 # 306 "WebExecute.c" 1
	rdtsc
	shl $32, %rdx
	or %rdx, %rax
 # 0 "" 2
/NO_APP
	mov	QWORD PTR 80[rsp], rax
	lea	rcx, 104[rsp]
	xor	r15d, r15d
	mov	rax, QWORD PTR __imp_GetSystemTimeAsFileTime[rip]
	lea	r14, 128[rsp]
	lea	rdi, 192[rsp]
	mov	QWORD PTR 88[rsp], rax
	call	rax
	lea	rax, .LC27[rip]
	mov	r13, QWORD PTR __imp_CompareFileTime[rip]
	movq	xmm0, QWORD PTR .LC35[rip]
	movq	xmm1, rax
	lea	rax, .LC29[rip]
	punpcklqdq	xmm0, xmm1
	movq	xmm2, rax
	lea	rax, .LC31[rip]
	movaps	XMMWORD PTR 128[rsp], xmm0
	movq	xmm3, rax
	movq	xmm0, QWORD PTR .LC36[rip]
	lea	rax, .LC32[rip]
	mov	QWORD PTR 176[rsp], rax
	lea	rax, 184[rsp]
	punpcklqdq	xmm0, xmm2
	mov	QWORD PTR 72[rsp], rax
	lea	rax, 236[rsp]
	movaps	XMMWORD PTR 144[rsp], xmm0
	movq	xmm0, QWORD PTR .LC37[rip]
	mov	QWORD PTR 64[rsp], rax
	punpcklqdq	xmm0, xmm3
	movaps	XMMWORD PTR 160[rsp], xmm0
	jmp	.L177
	.p2align 4,,10
	.p2align 3
.L174:
	add	r14, 8
	cmp	QWORD PTR 72[rsp], r14
	je	.L185
.L177:
	mov	rcx, QWORD PTR [r14]
	mov	rdx, rdi
	call	[QWORD PTR __imp_FindFirstFileA[rip]]
	mov	rbx, rax
	cmp	rax, -1
	je	.L174
	mov	rbp, QWORD PTR __imp_FindNextFileA[rip]
	lea	rsi, 212[rsp]
	lea	r12, last_check_time[rip]
	.p2align 4
	.p2align 3
.L176:
	mov	rdx, r12
	mov	rcx, rsi
	call	r13
	test	eax, eax
	jle	.L175
	mov	rcx, QWORD PTR 64[rsp]
	mov	rdx, rsi
	mov	r15d, 1
	call	update_file_snapshot
.L175:
	mov	rdx, rdi
	mov	rcx, rbx
	call	rbp
	test	eax, eax
	jne	.L176
	mov	rcx, rbx
	add	r14, 8
	call	[QWORD PTR __imp_FindClose[rip]]
	cmp	QWORD PTR 72[rsp], r14
	jne	.L177
.L185:
	test	r15d, r15d
	jne	.L178
/APP
 # 306 "WebExecute.c" 1
	rdtsc
	shl $32, %rdx
	or %rdx, %rax
 # 0 "" 2
/NO_APP
.L173:
	mov	eax, r15d
	add	rsp, 520
	pop	rbx
	pop	rsi
	pop	rdi
	pop	rbp
	pop	r12
	pop	r13
	pop	r14
	pop	r15
	ret
	.p2align 4,,10
	.p2align 3
.L178:
	mov	rax, QWORD PTR 88[rsp]
	lea	rcx, last_check_time[rip]
	lea	rdi, .LC1[rip]
	call	rax
	lea	rcx, 112[rsp]
	mov	DWORD PTR files_changed[rip], 1
	call	[QWORD PTR __imp_GetLocalTime[rip]]
	movzx	eax, WORD PTR 124[rsp]
	mov	QWORD PTR 56[rsp], rdi
	mov	r8, rdi
	lea	r9, .LC2[rip]
	lea	rdx, .LC10[rip]
	mov	DWORD PTR 48[rsp], eax
	movzx	eax, WORD PTR 122[rsp]
	lea	rcx, .LC33[rip]
	mov	DWORD PTR 40[rsp], eax
	movzx	eax, WORD PTR 120[rsp]
	mov	DWORD PTR 32[rsp], eax
	call	printf
/APP
 # 306 "WebExecute.c" 1
	rdtsc
	shl $32, %rdx
	or %rdx, %rax
 # 0 "" 2
/NO_APP
	mov	rsi, QWORD PTR 80[rsp]
	cmp	rsi, rax
	jnb	.L173
	sub	rax, rsi
	mov	QWORD PTR 40[rsp], rdi
	mov	r8, rdi
	lea	r9, .LC6[rip]
	mov	QWORD PTR 32[rsp], rax
	lea	rdx, .LC7[rip]
	lea	rcx, .LC34[rip]
	call	printf
	jmp	.L173
	.seh_endproc
	.section .rdata,"dr"
.LC38:
	.ascii "text/plain\0"
.LC39:
	.ascii "text/html\0"
.LC40:
	.ascii "application/javascript\0"
.LC41:
	.ascii "text/css\0"
.LC42:
	.ascii "image/png\0"
.LC43:
	.ascii "image/jpeg\0"
.LC44:
	.ascii "image/svg+xml\0"
.LC45:
	.ascii "application/json\0"
.LC46:
	.ascii "image/x-icon\0"
	.align 8
.LC47:
	.ascii "HTTP/1.1 404 Not Found\15\12Content-Type: text/html\15\12Content-Length: 47\15\12\15\12<h1>404 Not Found</h1><p>File not found</p>\0"
	.align 8
.LC48:
	.ascii "%s[404 Error]%s File not found: %s%s%s\12\0"
.LC49:
	.ascii ".html\0"
.LC50:
	.ascii ".js\0"
.LC51:
	.ascii ".css\0"
.LC52:
	.ascii ".png\0"
.LC53:
	.ascii ".jpg\0"
.LC54:
	.ascii ".jpeg\0"
.LC55:
	.ascii ".svg\0"
.LC56:
	.ascii ".json\0"
.LC57:
	.ascii ".ico\0"
.LC58:
	.ascii ".tsx\0"
.LC59:
	.ascii ".jsx\0"
.LC60:
	.ascii ".ts\0"
	.align 8
.LC61:
	.ascii "HTTP/1.1 500 Internal Server Error\15\12\15\12Memory allocation failed\0"
	.align 8
.LC62:
	.ascii "%s[Memory Error]%s Failed to allocate memory for: %s%s%s\12\0"
	.align 8
.LC63:
	.ascii "HTTP/1.1 500 Internal Server Error\15\12\15\12Failed to read file\0"
	.align 8
.LC64:
	.ascii "%s[Read Error]%s Failed to read file: %s%s%s\12\0"
	.align 8
.LC65:
	.ascii "HTTP/1.1 500 Internal Server Error\15\12\15\12Header allocation failed\0"
	.align 8
.LC66:
	.ascii "HTTP/1.1 200 OK\15\12Content-Type: %s\15\12Content-Length: %zu\15\12Cache-Control: no-cache\15\12Access-Control-Allow-Origin: *\15\12X-Memory-Pool: %zu bytes allocated\15\12\15\12\0"
	.align 8
.LC67:
	.ascii "%s[Request Served]%s %s%s%s (%s%zu%s bytes) - %s%llu%s cycles\12\0"
	.text
	.p2align 4
	.globl	serve_file
	.def	serve_file;	.scl	2;	.type	32;	.endef
	.seh_proc	serve_file
serve_file:
	push	r14
	.seh_pushreg	r14
	push	r13
	.seh_pushreg	r13
	push	r12
	.seh_pushreg	r12
	push	rbp
	.seh_pushreg	rbp
	push	rdi
	.seh_pushreg	rdi
	push	rsi
	.seh_pushreg	rsi
	push	rbx
	.seh_pushreg	rbx
	sub	rsp, 96
	.seh_stackalloc	96
	.seh_endprologue
	mov	rbp, rcx
	mov	rdi, rdx
/APP
 # 306 "WebExecute.c" 1
	rdtsc
	shl $32, %rdx
	or %rdx, %rax
 # 0 "" 2
/NO_APP
	lea	rdx, .LC12[rip]
	mov	rcx, rdi
	mov	r13, rax
	call	fopen
	mov	rbx, rax
	test	rax, rax
	je	.L222
	mov	edx, 46
	mov	rcx, rdi
	lea	r12, .LC38[rip]
	call	strrchr
	mov	rsi, rax
	test	rax, rax
	je	.L189
	lea	rdx, .LC49[rip]
	mov	rcx, rax
	lea	r12, .LC39[rip]
	call	strcmp
	test	eax, eax
	jne	.L223
.L189:
	mov	r8d, 2
	xor	edx, edx
	mov	rcx, rbx
	call	fseek
	mov	rcx, rbx
	call	ftell
	mov	rcx, rbx
	movsx	rsi, eax
	call	rewind
	mov	rcx, rsi
	call	smart_malloc
	mov	r14, rax
	test	rax, rax
	je	.L224
	mov	r8, rsi
	mov	rcx, rax
	mov	r9, rbx
	mov	edx, 1
	call	fread
	mov	rcx, rbx
	mov	rsi, rax
	call	fclose
	test	rsi, rsi
	je	.L225
	mov	ecx, 512
	call	smart_malloc
	mov	rbx, rax
	test	rax, rax
	je	.L226
	mov	rdx, QWORD PTR memory_pool[rip]
	xor	eax, eax
	test	rdx, rdx
	je	.L193
	mov	rax, QWORD PTR 24[rdx]
.L193:
	mov	QWORD PTR 40[rsp], rax
	mov	r9, r12
	mov	rcx, rbx
	mov	edx, 512
	mov	QWORD PTR 32[rsp], rsi
	lea	r8, .LC66[rip]
	call	snprintf
	xor	r9d, r9d
	mov	rdx, rbx
	mov	rcx, rbp
	mov	r12, QWORD PTR __imp_send[rip]
	mov	r8d, eax
	call	r12
	xor	r9d, r9d
	mov	r8d, esi
	mov	rdx, r14
	mov	rcx, rbp
	call	r12
	mov	rcx, r14
	call	smart_free
	mov	rcx, rbx
	call	smart_free
/APP
 # 306 "WebExecute.c" 1
	rdtsc
	shl $32, %rdx
	or %rdx, %rax
 # 0 "" 2
/NO_APP
	cmp	r13, rax
	jb	.L227
.L186:
	add	rsp, 96
	pop	rbx
	pop	rsi
	pop	rdi
	pop	rbp
	pop	r12
	pop	r13
	pop	r14
	ret
	.p2align 4,,10
	.p2align 3
.L223:
	lea	rdx, .LC50[rip]
	mov	rcx, rsi
	lea	r12, .LC40[rip]
	call	strcmp
	test	eax, eax
	je	.L189
	lea	rdx, .LC51[rip]
	mov	rcx, rsi
	lea	r12, .LC41[rip]
	call	strcmp
	test	eax, eax
	je	.L189
	lea	rdx, .LC52[rip]
	mov	rcx, rsi
	lea	r12, .LC42[rip]
	call	strcmp
	test	eax, eax
	je	.L189
	lea	rdx, .LC53[rip]
	mov	rcx, rsi
	lea	r12, .LC43[rip]
	call	strcmp
	test	eax, eax
	je	.L189
	lea	rdx, .LC54[rip]
	mov	rcx, rsi
	call	strcmp
	test	eax, eax
	je	.L189
	lea	rdx, .LC55[rip]
	mov	rcx, rsi
	lea	r12, .LC44[rip]
	call	strcmp
	test	eax, eax
	je	.L189
	lea	rdx, .LC56[rip]
	mov	rcx, rsi
	lea	r12, .LC45[rip]
	call	strcmp
	test	eax, eax
	je	.L189
	lea	rdx, .LC57[rip]
	mov	rcx, rsi
	lea	r12, .LC46[rip]
	call	strcmp
	test	eax, eax
	je	.L189
	lea	rdx, .LC58[rip]
	mov	rcx, rsi
	lea	r12, .LC40[rip]
	call	strcmp
	test	eax, eax
	je	.L189
	lea	rdx, .LC59[rip]
	mov	rcx, rsi
	call	strcmp
	test	eax, eax
	je	.L189
	lea	rdx, .LC60[rip]
	mov	rcx, rsi
	call	strcmp
	test	eax, eax
	je	.L189
	lea	r12, .LC38[rip]
	jmp	.L189
	.p2align 4,,10
	.p2align 3
.L225:
	xor	r9d, r9d
	mov	r8d, 57
	lea	rdx, .LC63[rip]
	mov	rcx, rbp
	call	[QWORD PTR __imp_send[rip]]
	mov	rcx, r14
	call	smart_free
	lea	rax, .LC1[rip]
	mov	QWORD PTR 32[rsp], rdi
	lea	r9, .LC13[rip]
	mov	QWORD PTR 40[rsp], rax
	mov	r8, rax
	lea	rdx, .LC19[rip]
	lea	rcx, .LC64[rip]
	call	printf
	nop
	add	rsp, 96
	pop	rbx
	pop	rsi
	pop	rdi
	pop	rbp
	pop	r12
	pop	r13
	pop	r14
	ret
	.p2align 4,,10
	.p2align 3
.L224:
	xor	r9d, r9d
	mov	r8d, 62
	lea	rdx, .LC61[rip]
	mov	rcx, rbp
	call	[QWORD PTR __imp_send[rip]]
	mov	rcx, rbx
	call	fclose
	lea	rax, .LC1[rip]
	mov	QWORD PTR 32[rsp], rdi
	lea	r9, .LC13[rip]
	mov	QWORD PTR 40[rsp], rax
	mov	r8, rax
	lea	rdx, .LC19[rip]
	lea	rcx, .LC62[rip]
	call	printf
	nop
	add	rsp, 96
	pop	rbx
	pop	rsi
	pop	rdi
	pop	rbp
	pop	r12
	pop	r13
	pop	r14
	ret
	.p2align 4,,10
	.p2align 3
.L227:
	sub	rax, r13
	lea	rbx, .LC1[rip]
	mov	QWORD PTR 56[rsp], rsi
	lea	r9, .LC13[rip]
	mov	QWORD PTR 80[rsp], rax
	lea	rax, .LC6[rip]
	mov	r8, rbx
	lea	rdx, .LC18[rip]
	mov	QWORD PTR 88[rsp], rbx
	lea	rcx, .LC67[rip]
	mov	QWORD PTR 72[rsp], rax
	mov	QWORD PTR 64[rsp], rbx
	mov	QWORD PTR 48[rsp], rax
	mov	QWORD PTR 40[rsp], rbx
	mov	QWORD PTR 32[rsp], rdi
	call	printf
	nop
	add	rsp, 96
	pop	rbx
	pop	rsi
	pop	rdi
	pop	rbp
	pop	r12
	pop	r13
	pop	r14
	ret
	.p2align 4,,10
	.p2align 3
.L222:
	xor	r9d, r9d
	mov	rcx, rbp
	mov	r8d, 114
	lea	rdx, .LC47[rip]
	call	[QWORD PTR __imp_send[rip]]
	lea	rax, .LC1[rip]
	mov	QWORD PTR 32[rsp], rdi
	lea	r9, .LC13[rip]
	mov	QWORD PTR 40[rsp], rax
	mov	r8, rax
	lea	rdx, .LC19[rip]
	lea	rcx, .LC48[rip]
	call	printf
	jmp	.L186
	.p2align 4,,10
	.p2align 3
.L226:
	mov	rcx, rbp
	xor	r9d, r9d
	mov	r8d, 62
	lea	rdx, .LC65[rip]
	call	[QWORD PTR __imp_send[rip]]
	mov	rcx, r14
	add	rsp, 96
	pop	rbx
	pop	rsi
	pop	rdi
	pop	rbp
	pop	r12
	pop	r13
	pop	r14
	jmp	smart_free
	.seh_endproc
	.section .rdata,"dr"
.LC68:
	.ascii "true\0"
.LC69:
	.ascii "false\0"
	.align 8
.LC70:
	.ascii "HTTP/1.1 200 OK\15\12Content-Type: application/json\15\12Access-Control-Allow-Origin: *\15\12Cache-Control: no-cache\15\12\15\12{\"reload\":%s,\"timestamp\":%ld,\"memory_usage\":%zu}\0"
	.text
	.p2align 4
	.globl	serve_reload
	.def	serve_reload;	.scl	2;	.type	32;	.endef
	.seh_proc	serve_reload
serve_reload:
	push	rdi
	.seh_pushreg	rdi
	push	rsi
	.seh_pushreg	rsi
	push	rbx
	.seh_pushreg	rbx
	sub	rsp, 304
	.seh_stackalloc	304
	.seh_endprologue
	mov	edx, DWORD PTR files_changed[rip]
	mov	rax, QWORD PTR memory_pool[rip]
	mov	rbx, rcx
	test	edx, edx
	jne	.L229
	test	rax, rax
	je	.L233
	mov	rdi, QWORD PTR 24[rax]
	xor	ecx, ecx
	call	[QWORD PTR __imp__time64[rip]]
	lea	r9, .LC69[rip]
	jmp	.L231
	.p2align 4,,10
	.p2align 3
.L229:
	mov	DWORD PTR files_changed[rip], 0
	test	rax, rax
	je	.L232
	mov	rdi, QWORD PTR 24[rax]
	xor	ecx, ecx
	call	[QWORD PTR __imp__time64[rip]]
	lea	r9, .LC68[rip]
.L231:
	mov	QWORD PTR 40[rsp], rdi
	lea	rsi, 48[rsp]
	lea	r8, .LC70[rip]
	mov	edx, 256
	mov	DWORD PTR 32[rsp], eax
	mov	rcx, rsi
	call	snprintf
	xor	r9d, r9d
	mov	rdx, rsi
	mov	rcx, rbx
	mov	r8d, eax
	call	[QWORD PTR __imp_send[rip]]
	nop
	add	rsp, 304
	pop	rbx
	pop	rsi
	pop	rdi
	ret
	.p2align 4,,10
	.p2align 3
.L233:
	xor	ecx, ecx
	xor	edi, edi
	call	[QWORD PTR __imp__time64[rip]]
	lea	r9, .LC69[rip]
	jmp	.L231
	.p2align 4,,10
	.p2align 3
.L232:
	xor	ecx, ecx
	xor	edi, edi
	call	[QWORD PTR __imp__time64[rip]]
	lea	r9, .LC68[rip]
	jmp	.L231
	.seh_endproc
	.section .rdata,"dr"
.LC71:
	.ascii "live-reload.js\0"
	.text
	.p2align 4
	.globl	serve_live_script
	.def	serve_live_script;	.scl	2;	.type	32;	.endef
	.seh_proc	serve_live_script
serve_live_script:
	.seh_endprologue
	lea	rdx, .LC71[rip]
	jmp	serve_file
	.seh_endproc
	.section .rdata,"dr"
.LC72:
	.ascii "index.html\0"
	.align 8
.LC73:
	.ascii "%s[Error]%s Bind failed with error: %d\12\0"
	.align 8
.LC74:
	.ascii "%s[Server Ready]%s %shttp://localhost:3000%s\12\0"
	.align 8
.LC75:
	.ascii "%s[Watching]%s HTML, CSS, JS, JSON, TS, TSX, JSX files\12\12\0"
.LC76:
	.ascii "/reload\0"
.LC77:
	.ascii "/live-reload.js\0"
.LC78:
	.ascii "%s[%s]%s %s%s%s\12\0"
.LC79:
	.ascii "/memory-stats\0"
	.align 8
.LC80:
	.ascii "HTTP/1.1 200 OK\15\12Content-Type: application/json\15\12Access-Control-Allow-Origin: *\15\12\15\12{\"total_allocated\":%zu,\"active_blocks\":%d,\"pool_capacity\":%d,\"tracked_files\":%d}\0"
	.section	.text.startup,"x"
	.p2align 4
	.globl	main
	.def	main;	.scl	2;	.type	32;	.endef
	.seh_proc	main
main:
	push	r15
	.seh_pushreg	r15
	push	r14
	.seh_pushreg	r14
	push	r13
	.seh_pushreg	r13
	push	r12
	.seh_pushreg	r12
	push	rbp
	.seh_pushreg	rbp
	push	rdi
	.seh_pushreg	rdi
	push	rsi
	.seh_pushreg	rsi
	push	rbx
	.seh_pushreg	rbx
	sub	rsp, 1608
	.seh_stackalloc	1608
	movaps	XMMWORD PTR 1584[rsp], xmm6
	.seh_savexmm	xmm6, 1584
	.seh_endprologue
	call	__main
	call	enable_ansi_colors
	lea	rdx, 144[rsp]
	mov	ecx, 514
	call	[QWORD PTR __imp_WSAStartup[rip]]
	xor	r8d, r8d
	mov	edx, 1
	mov	ecx, 2
	call	[QWORD PTR __imp_socket[rip]]
	mov	r8d, 4
	mov	edx, 65535
	lea	r9, 108[rsp]
	mov	r12, rax
	mov	rcx, rax
	mov	DWORD PTR 108[rsp], 1
	mov	DWORD PTR 32[rsp], 4
	call	[QWORD PTR __imp_setsockopt[rip]]
	mov	eax, 2
	mov	ecx, 3000
	mov	WORD PTR 112[rsp], ax
	call	[QWORD PTR __imp_htons[rip]]
	mov	DWORD PTR 116[rsp], 0
	lea	rdx, 112[rsp]
	mov	rcx, r12
	mov	WORD PTR 114[rsp], ax
	mov	r8d, 16
	call	[QWORD PTR __imp_bind[rip]]
	cmp	eax, -1
	je	.L256
	mov	edx, 5
	mov	rcx, r12
	lea	rbp, 560[rsp]
	call	[QWORD PTR __imp_listen[rip]]
	lea	rcx, last_check_time[rip]
	pxor	xmm6, xmm6
	call	[QWORD PTR __imp_GetSystemTimeAsFileTime[rip]]
	lea	rax, .LC1[rip]
	lea	r9, .LC2[rip]
	mov	QWORD PTR 32[rsp], rax
	mov	r8, rax
	lea	rdx, .LC10[rip]
	lea	rcx, .LC74[rip]
	call	printf
	lea	r8, .LC1[rip]
	lea	rdx, .LC6[rip]
	lea	rcx, .LC75[rip]
	call	printf
	lea	rdx, cleanup_memory_pool[rip]
	mov	ecx, 2
	call	signal
	lea	rax, 128[rsp]
	mov	r13, QWORD PTR __imp_accept[rip]
	mov	r15, QWORD PTR __imp_recv[rip]
	mov	QWORD PTR 72[rsp], rax
	lea	rax, 561[rsp]
	mov	r14, QWORD PTR __imp_closesocket[rip]
	mov	QWORD PTR 80[rsp], rax
	.p2align 4
	.p2align 3
.L238:
	xor	r8d, r8d
	xor	edx, edx
	mov	rcx, r12
	call	r13
	mov	rbx, rax
	cmp	rax, -1
	je	.L238
	mov	ecx, 2048
	call	smart_malloc
	mov	ecx, 2048
	mov	rsi, rax
	mov	rdi, rax
	xor	eax, eax
/APP
 # 78 "WebExecute.c" 1
	cld
	rep stosb
 # 0 "" 2
/NO_APP
	xor	r9d, r9d
	mov	r8d, 2047
	mov	rdx, rsi
	mov	rcx, rbx
	call	r15
	test	eax, eax
	jg	.L257
.L239:
	mov	rcx, rsi
	call	smart_free
	mov	rcx, rbx
	call	r14
	jmp	.L238
	.p2align 4,,10
	.p2align 3
.L257:
	xor	eax, eax
	mov	r8, QWORD PTR 72[rsp]
	mov	ecx, 128
	mov	rdi, rbp
	rep stosq
	lea	rdx, .LC0[rip]
	mov	rcx, rsi
	mov	r9, rbp
	movaps	XMMWORD PTR [r8], xmm6
	call	sscanf.constprop.0
	lea	rdx, .LC76[rip]
	mov	rcx, rbp
	call	strcmp
	test	eax, eax
	je	.L258
	lea	rdx, .LC77[rip]
	mov	rcx, rbp
	call	strcmp
	test	eax, eax
	je	.L259
	lea	rdx, .LC79[rip]
	mov	rcx, rbp
	call	strcmp
	mov	edi, eax
	test	eax, eax
	je	.L260
	lea	rax, .LC1[rip]
	mov	QWORD PTR 40[rsp], rbp
	cmp	BYTE PTR 561[rsp], 0
	lea	rdi, .LC72[rip]
	mov	r8, QWORD PTR 72[rsp]
	mov	QWORD PTR 48[rsp], rax
	lea	rax, .LC13[rip]
	lea	r9, .LC1[rip]
	mov	QWORD PTR 32[rsp], rax
	cmovne	rdi, QWORD PTR 80[rsp]
	lea	rdx, .LC2[rip]
	lea	rcx, .LC78[rip]
	call	printf
	call	check_files_modified
	mov	rdx, rdi
	mov	rcx, rbx
	call	serve_file
	jmp	.L239
	.p2align 4,,10
	.p2align 3
.L258:
	call	check_files_modified
	mov	rcx, rbx
	call	serve_reload
	jmp	.L239
	.p2align 4,,10
	.p2align 3
.L259:
	lea	rax, .LC1[rip]
	mov	QWORD PTR 40[rsp], rbp
	mov	r8, QWORD PTR 72[rsp]
	lea	r9, .LC1[rip]
	mov	QWORD PTR 48[rsp], rax
	lea	rax, .LC13[rip]
	lea	rdx, .LC2[rip]
	mov	QWORD PTR 32[rsp], rax
	lea	rcx, .LC78[rip]
	call	printf
	call	check_files_modified
	lea	rdx, .LC71[rip]
	mov	rcx, rbx
	call	serve_file
	jmp	.L239
	.p2align 4,,10
	.p2align 3
.L260:
	mov	ecx, 512
	call	smart_malloc
	mov	r10, rax
	test	rax, rax
	je	.L244
	mov	rax, QWORD PTR memory_pool[rip]
	mov	edx, DWORD PTR snapshot_count[rip]
	test	rax, rax
	je	.L248
	mov	edi, DWORD PTR 20[rax]
	mov	ecx, DWORD PTR 16[rax]
	mov	r9, QWORD PTR 24[rax]
.L245:
	mov	DWORD PTR 48[rsp], edx
	lea	r8, .LC80[rip]
	mov	edx, 512
	mov	DWORD PTR 32[rsp], ecx
	mov	rcx, r10
	mov	DWORD PTR 40[rsp], edi
	mov	QWORD PTR 88[rsp], r10
	call	snprintf
	mov	rcx, rbx
	mov	rdx, QWORD PTR 88[rsp]
	xor	r9d, r9d
	mov	r8d, eax
	call	[QWORD PTR __imp_send[rip]]
	mov	rcx, QWORD PTR 88[rsp]
	call	smart_free
.L244:
	lea	rax, .LC1[rip]
	mov	QWORD PTR 40[rsp], rbp
	mov	r8, QWORD PTR 72[rsp]
	lea	r9, .LC1[rip]
	mov	QWORD PTR 48[rsp], rax
	lea	rax, .LC13[rip]
	lea	rdx, .LC2[rip]
	mov	QWORD PTR 32[rsp], rax
	lea	rcx, .LC78[rip]
	call	printf
	jmp	.L239
.L248:
	xor	ecx, ecx
	xor	r9d, r9d
	jmp	.L245
.L256:
	call	[QWORD PTR __imp_WSAGetLastError[rip]]
	lea	r8, .LC1[rip]
	lea	rdx, .LC19[rip]
	mov	r9d, eax
	lea	rcx, .LC73[rip]
	call	printf
	cmp	QWORD PTR memory_pool[rip], 0
	je	.L252
	call	cleanup_memory_pool.part.0
	nop
.L252:
	movaps	xmm6, XMMWORD PTR 1584[rsp]
	mov	eax, 1
	add	rsp, 1608
	pop	rbx
	pop	rsi
	pop	rdi
	pop	rbp
	pop	r12
	pop	r13
	pop	r14
	pop	r15
	ret
	.seh_endproc
.lcomm snapshot_capacity,4,4
.lcomm snapshot_count,4,4
.lcomm file_snapshots,8,8
.lcomm files_changed,4,4
.lcomm last_check_time,8,8
.lcomm memory_pool,8,8
	.section .rdata,"dr"
	.align 8
.LC35:
	.quad	.LC26
	.align 8
.LC36:
	.quad	.LC28
	.align 8
.LC37:
	.quad	.LC30
	.def	__main;	.scl	2;	.type	32;	.endef
	.ident	"GCC: (GNU) 14.2.0"
	.def	__mingw_vfprintf;	.scl	2;	.type	32;	.endef
	.def	__mingw_vsnprintf;	.scl	2;	.type	32;	.endef
	.def	__mingw_vsscanf;	.scl	2;	.type	32;	.endef
	.def	malloc;	.scl	2;	.type	32;	.endef
	.def	free;	.scl	2;	.type	32;	.endef
	.def	realloc;	.scl	2;	.type	32;	.endef
	.def	fopen;	.scl	2;	.type	32;	.endef
	.def	fseek;	.scl	2;	.type	32;	.endef
	.def	ftell;	.scl	2;	.type	32;	.endef
	.def	rewind;	.scl	2;	.type	32;	.endef
	.def	fread;	.scl	2;	.type	32;	.endef
	.def	fclose;	.scl	2;	.type	32;	.endef
	.def	strcmp;	.scl	2;	.type	32;	.endef
	.def	strcpy;	.scl	2;	.type	32;	.endef
	.def	strrchr;	.scl	2;	.type	32;	.endef
	.def	signal;	.scl	2;	.type	32;	.endef
