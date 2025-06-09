export function MintAssembly() {
    const HEAP_SIZE = 65536;
    const STACK_SIZE = 8192;
    const REG_COUNT = 8;

    const regs = new Int32Array(REG_COUNT);
    const heap = new Int32Array(HEAP_SIZE >> 2);
    const stack = new Int32Array(STACK_SIZE >> 2);
    const bytecode = new Uint8Array(32768);

    const regLookup = new Map([
        ['ax', 0], ['bx', 1], ['cx', 2], ['dx', 3],
        ['ex', 4], ['fx', 5], ['gx', 6], ['hx', 7]
    ]);

    const OP = {
        NOP: 0x00, MOV: 0x01, ADD: 0x02, SUB: 0x03, MUL: 0x04, DIV: 0x05,
        CMP: 0x06, JMP: 0x07, CALL: 0x08, RET: 0x09, XOR: 0x0A, PRINT: 0x0B,
        PUSH: 0x0C, POP: 0x0D, LOAD: 0x0E, STORE: 0x0F, LABEL: 0x10
    };

    // Operand types
    const ARG = { REG: 0, IMM: 1, MEM: 2, ELEM: 3 };

    let pc = 0;           // Program counter
    let sp = 0;           // Stack pointer
    let codeSize = 0;     // Current bytecode size
    let labelTable = new Uint16Array(256);
    let labelCount = 0;

    const elementCache = new Map();

    function compileToMachineCode() {
        const container = document.querySelector("Entry");
        if (!container) {
            console.error("MintAssembly: Missing <Entry> container");
            return false;
        }

        const nodes = container.children;
        const nodeCount = nodes.length;

        for (let i = 0; i < nodeCount; i++) {
            const node = nodes[i];
            const tag = node.tagName;

            if (tag === "LABEL") {
                const name = node.getAttribute("name");
                if (name) {
                    labelTable[labelCount++] = codeSize;
                    labelTable[hashString(name) & 0xFF] = codeSize;
                }
            }
        }

        for (let i = 0; i < nodeCount; i++) {
            compileInstruction(nodes[i]);
        }

        return true;
    }

    function hashString(str) {
        let hash = 0;
        const len = str.length;
        for (let i = 0; i < len; i++) {
            hash = ((hash << 5) - hash + str.charCodeAt(i)) & 0xFFFFFFFF;
        }
        return hash >>> 0;
    }

    function compileInstruction(node) {
        const tag = node.tagName;
        const attrs = node.attributes;

        switch (tag) {
            case "MOV":
                emitByte(OP.MOV);
                emitOperand(attrs.dst?.value);
                emitOperand(attrs.src?.value || getNodeValue(node));
                break;

            case "ADD":
                emitByte(OP.ADD);
                emitOperand(attrs.dst?.value);
                emitOperand(attrs.src?.value || getNodeValue(node));
                break;

            case "SUB":
                emitByte(OP.SUB);
                emitOperand(attrs.dst?.value);
                emitOperand(attrs.src?.value || getNodeValue(node));
                break;

            case "MUL":
                emitByte(OP.MUL);
                emitOperand(attrs.dst?.value);
                emitOperand(attrs.src?.value || getNodeValue(node));
                break;

            case "DIV":
                emitByte(OP.DIV);
                emitOperand(attrs.dst?.value);
                emitOperand(attrs.src?.value || getNodeValue(node));
                break;

            case "CMP":
                emitByte(OP.CMP);
                emitOperand(attrs.a?.value);
                emitOperand(attrs.b?.value);
                emitOperand(attrs.jmp?.value);
                break;

            case "JMP":
                emitByte(OP.JMP);
                emitOperand(attrs.to?.value);
                break;

            case "XOR":
                emitByte(OP.XOR);
                emitOperand(attrs.dst?.value);
                emitOperand(attrs.src?.value || getNodeValue(node));
                break;

            case "PRINT":
                emitByte(OP.PRINT);
                emitOperand(attrs.var?.value);
                break;

            case "PUSH":
                emitByte(OP.PUSH);
                emitOperand(attrs.src?.value || getNodeValue(node));
                break;

            case "POP":
                emitByte(OP.POP);
                emitOperand(attrs.dst?.value);
                break;

            case "LABEL":
                emitByte(OP.LABEL);
                break;
        }
    }

    // Fast value extraction from DOM nodes
    function getNodeValue(node) {
        const values = node.querySelectorAll("value, text");
        if (values.length === 0) return "0";

        let sum = 0;
        for (let i = 0; i < values.length; i++) {
            sum += parseInt(values[i].textContent) || 0;
        }
        return sum.toString();
    }

    // Emit single byte to bytecode
    function emitByte(byte) {
        bytecode[codeSize++] = byte;
    }

    // Emit operand with type information
    function emitOperand(operand) {
        if (!operand) {
            emitByte(ARG.IMM);
            emitDWord(0);
            return;
        }

        // Register operand
        if (regLookup.has(operand)) {
            emitByte(ARG.REG);
            emitByte(regLookup.get(operand));
            return;
        }

        // Memory operand [reg]
        if (operand[0] === '[' && operand[operand.length - 1] === ']') {
            const reg = operand.slice(1, -1);
            emitByte(ARG.MEM);
            emitByte(regLookup.get(reg) || 0);
            return;
        }

        // Element operand #id
        if (operand[0] === '#') {
            emitByte(ARG.ELEM);
            emitDWord(hashString(operand.slice(1)));
            return;
        }

        // Label operand
        if (isNaN(operand)) {
            emitByte(ARG.IMM);
            emitDWord(labelTable[hashString(operand) & 0xFF] || 0);
            return;
        }

        // Immediate value
        emitByte(ARG.IMM);
        emitDWord(parseInt(operand) || 0);
    }

    // Emit 32-bit double word
    function emitDWord(value) {
        bytecode[codeSize++] = value & 0xFF;
        bytecode[codeSize++] = (value >> 8) & 0xFF;
        bytecode[codeSize++] = (value >> 16) & 0xFF;
        bytecode[codeSize++] = (value >> 24) & 0xFF;
    }

    function readDWord() {
        const val = bytecode[pc] | (bytecode[pc + 1] << 8) |
            (bytecode[pc + 2] << 16) | (bytecode[pc + 3] << 24);
        pc += 4;
        return val;
    }

    function resolveOperand() {
        const type = bytecode[pc++];

        switch (type) {
            case ARG.REG:
                return regs[bytecode[pc++]];

            case ARG.IMM:
                return readDWord();

            case ARG.MEM:
                const regIdx = bytecode[pc++];
                return heap[regs[regIdx]];

            case ARG.ELEM:
                const hash = readDWord();
                const cached = elementCache.get(hash);
                if (cached !== undefined) return cached;

                console.warn("MintAssembly: Element cache miss - performance degraded");
                return 0;

            default:
                return 0;
        }
    }

    function setOperand(value) {
        const type = bytecode[pc++];

        switch (type) {
            case ARG.REG:
                regs[bytecode[pc++]] = value;
                break;

            case ARG.MEM:
                const regIdx = bytecode[pc++];
                heap[regs[regIdx]] = value;
                break;

            case ARG.ELEM:
                const hash = readDWord();
                elementCache.set(hash, value);
                break;

            default:
                pc += (type === ARG.IMM) ? 4 : 1;
        }
    }

    function executeMintAssembly() {
        pc = 0;
        sp = 0;

        while (pc < codeSize) {
            const opcode = bytecode[pc++];

            switch (opcode) {
                case OP.MOV: {
                    const dst = pc;
                    pc += (bytecode[pc] === ARG.IMM) ? 5 : 2;
                    const value = resolveOperand();
                    pc = dst;
                    setOperand(value);
                    break;
                }

                case OP.ADD: {
                    const regIdx = bytecode[pc + 1];
                    pc += 2;
                    regs[regIdx] += resolveOperand();
                    break;
                }

                case OP.SUB: {
                    const regIdx = bytecode[pc + 1];
                    pc += 2;
                    regs[regIdx] -= resolveOperand();
                    break;
                }

                case OP.MUL: {
                    const regIdx = bytecode[pc + 1];
                    pc += 2;
                    regs[regIdx] = Math.imul(regs[regIdx], resolveOperand());
                    break;
                }

                case OP.DIV: {
                    const regIdx = bytecode[pc + 1];
                    pc += 2;
                    const divisor = resolveOperand();
                    regs[regIdx] = divisor ? (regs[regIdx] / divisor) | 0 : 0;
                    break;
                }

                case OP.CMP: {
                    const a = resolveOperand();
                    const b = resolveOperand();
                    const target = resolveOperand();
                    if (a === b) pc = target;
                    break;
                }

                case OP.JMP:
                    pc = resolveOperand();
                    break;

                case OP.XOR: {
                    const regIdx = bytecode[pc + 1];
                    pc += 2;
                    regs[regIdx] ^= resolveOperand();
                    break;
                }

                case OP.PUSH:
                    stack[sp++] = resolveOperand();
                    break;

                case OP.POP: {
                    const dst = pc;
                    pc += (bytecode[pc] === ARG.IMM) ? 5 : 2;
                    const value = stack[--sp];
                    pc = dst;
                    setOperand(value);
                    break;
                }

                case OP.PRINT: {
                    const regIdx = bytecode[pc + 1];
                    pc += 2;
                    console.log(`[MintASM] R${regIdx} = ${regs[regIdx]}`);
                    break;
                }

                case OP.RET:
                    return;

                case OP.LABEL:
                case OP.NOP:
                    break;

                default:
                    console.error(`MintAssembly: Invalid opcode ${opcode} at PC=${pc - 1}`);
                    return;
            }
        }
    }

    function cacheElements() {
        const elements = document.querySelectorAll("[id]");
        for (let i = 0; i < elements.length; i++) {
            const el = elements[i];
            const hash = hashString(el.id);
            const value = parseInt(el.textContent) || 0;
            elementCache.set(hash, value);
        }
    }

    function optimizeBytecode() {
        for (let i = 0; i < codeSize - 8; i++) {
            if (bytecode[i] === OP.MOV && bytecode[i + 1] === ARG.REG &&
                bytecode[i + 3] === ARG.IMM &&
                bytecode[i + 8] === OP.ADD && bytecode[i + 9] === ARG.REG &&
                bytecode[i + 11] === ARG.IMM &&
                bytecode[i + 2] === bytecode[i + 10]) {

                const imm1 = bytecode[i + 4] | (bytecode[i + 5] << 8) |
                    (bytecode[i + 6] << 16) | (bytecode[i + 7] << 24);
                const imm2 = bytecode[i + 12] | (bytecode[i + 13] << 8) |
                    (bytecode[i + 14] << 16) | (bytecode[i + 15] << 24);

                const sum = (imm1 + imm2) | 0;

                // Replace with optimized MOV
                bytecode[i + 4] = sum & 0xFF;
                bytecode[i + 5] = (sum >> 8) & 0xFF;
                bytecode[i + 6] = (sum >> 16) & 0xFF;
                bytecode[i + 7] = (sum >> 24) & 0xFF;

                // NOP the ADD instruction
                bytecode[i + 8] = OP.NOP;
                for (let j = i + 9; j < i + 16; j++) {
                    bytecode[j] = 0;
                }
            }
        }
    }

    console.time("MintAssembly Compilation");

    if (!compileToMachineCode()) {
        console.error("MintAssembly: Compilation failed");
        return;
    }

    console.timeEnd("MintAssembly Compilation");
    console.log(`MintAssembly: Generated ${codeSize} bytes of bytecode`);

    cacheElements();
    optimizeBytecode();

    console.time("MintAssembly Execution");
    executeMintAssembly();
    console.timeEnd("MintAssembly Execution");
    console.log("MintAssembly States:", {
        registers: Array.from(regs),
        stackPointer: sp,
        programCounter: pc
    });
}