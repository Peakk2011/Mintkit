// Copyright © 2025 Mint teams
// Licensed under the MIT License

function legacyMintAssembly(opts) {
    const HEAP_SIZE = 65536;
    const STACK_SIZE = 8192;
    const REG_COUNT = 8;
    const variables = {};
    const heap = new Int32Array(HEAP_SIZE >> 2);
    const stack = new Int32Array(STACK_SIZE >> 2);
    const bytecode = new Uint8Array(32768);
    const OP = {
        NOP: 0x00, MOV: 0x01, ADD: 0x02, SUB: 0x03, MUL: 0x04, DIV: 0x05,
        CMP: 0x06, JMP: 0x07, CALL: 0x08, RET: 0x09, XOR: 0x0A, PRINT: 0x0B,
        PUSH: 0x0C, POP: 0x0D, LOAD: 0x0E, STORE: 0x0F, LABEL: 0x10
    };
    const ARG = { REG: 0, IMM: 1, MEM: 2, ELEM: 3 };
    let pc = 0;
    let sp = 0;
    let codeSize = 0;
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
        const tag = node.tagName.toLowerCase();
        const attrs = node.attributes;
        switch (tag) {
            case "set":
                variables[attrs.name.value] = parseInt(attrs.value.value);
                break;
            case "show":
                const val = variables[attrs.text.value];
                if (typeof val !== 'undefined') {
                    const out = document.createElement('div');
                    out.textContent = val;
                    node.parentNode.appendChild(out);
                }
                break;
            case "if":
                const cond = attrs.cond.value;
                const [left, op, right] = cond.split(/\s+/);
                let condResult = false;
                if (op === '==') condResult = variables[left] == variables[right];
                if (op === '!=') condResult = variables[left] != variables[right];
                if (condResult) {
                    for (let i = 0; i < node.children.length; i++) compileInstruction(node.children[i]);
                } else if (node.nextElementSibling && node.nextElementSibling.tagName.toLowerCase() === "else") {
                    for (let i = 0; i < node.nextElementSibling.children.length; i++) compileInstruction(node.nextElementSibling.children[i]);
                }
                break;
            case "else":
                break;
            case "mov":
            case "add":
            case "sub":
            case "mul":
            case "div":
            case "cmp":
            case "jmp":
            case "xor":
            case "print":
            case "push":
            case "pop":
            case "label":
                break;
        }
    }
    function getNodeValue(node) {
        const values = node.querySelectorAll("value, text");
        if (values.length === 0) return "0";
        let sum = 0;
        for (let i = 0; i < values.length; i++) {
            sum += parseInt(values[i].textContent) || 0;
        }
        return sum.toString();
    }
    function emitByte(byte) {
        bytecode[codeSize++] = byte;
    }
    function emitOperand(operand) {
        if (!operand) {
            emitByte(ARG.IMM);
            emitDWord(0);
            return;
        }
        if (regLookup.has(operand)) {
            emitByte(ARG.REG);
            emitByte(regLookup.get(operand));
            return;
        }
        if (operand[0] === '[' && operand[operand.length - 1] === ']') {
            const reg = operand.slice(1, -1);
            emitByte(ARG.MEM);
            emitByte(regLookup.get(reg) || 0);
            return;
        }
        if (operand[0] === '#') {
            emitByte(ARG.ELEM);
            emitDWord(hashString(operand.slice(1)));
            return;
        }
        if (isNaN(operand)) {
            emitByte(ARG.IMM);
            emitDWord(labelTable[hashString(operand) & 0xFF] || 0);
            return;
        }
        emitByte(ARG.IMM);
        emitDWord(parseInt(operand) || 0);
    }
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
                return 0;
        }
        return 0;
    }
    function setOperand(value) {
        // ... (implement as needed) ...
    }
    function executeMintAssembly() {
        // ... (implement as needed) ...
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
                bytecode[i + 4] = sum & 0xFF;
                bytecode[i + 5] = (sum >> 8) & 0xFF;
                bytecode[i + 6] = (sum >> 16) & 0xFF;
                bytecode[i + 7] = (sum >> 24) & 0xFF;
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
        variables: { ...variables },
        stackPointer: sp,
        programCounter: pc
    });
}

function universalTemplateEngine({ context = {}, filters = {} } = {}) {
    function hashString(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash = ((hash << 5) - hash + str.charCodeAt(i)) & 0xffffffff;
        }
        return hash >>> 0;
    }
    const templates = {};
    function evalInContext(expr, ctx) {
        try {
            return Function(...Object.keys(ctx), `return (${expr})`).apply(null, Object.values(ctx));
        } catch (e) { return undefined; }
    }
    function interpolate(str, ctx) {
        if (!str) return '';
        return str.replace(/\$\{([^}]+)\}/g, (_, expr) => {
            let [base, ...pipes] = expr.split('|').map(s => s.trim());
            let val = evalInContext(base, ctx);
            for (const pipe of pipes) {
                const [fname, ...args] = pipe.split(/\(|,|\)/).map(s => s.trim()).filter(Boolean);
                if (filters[fname]) val = filters[fname](val, ...args);
            }
            return val;
        });
    }
    function render(node, ctx) {
        if (node.nodeType === Node.TEXT_NODE) {
            node.textContent = interpolate(node.textContent, ctx);
            return;
        }
        Array.from(node.attributes || []).forEach(attr => {
            if (attr.name.startsWith('@')) {
                const event = attr.name.slice(1);
                node.addEventListener(event, e => evalInContext(attr.value, ctx));
            } else if (attr.name.startsWith(':')) {
                const prop = attr.name.slice(1);
                node[prop] = evalInContext(attr.value, ctx);
            } else {
                node.setAttribute(attr.name, interpolate(attr.value, ctx));
            }
        });
        if (node.tagName && node.tagName.toLowerCase() === 'for') {
            const item = node.getAttribute('item');
            const arr = evalInContext(node.getAttribute('in'), ctx) || [];
            arr.forEach(val => {
                Array.from(node.children).forEach(child => {
                    const clone = child.cloneNode(true);
                    render(clone, { ...ctx, [item]: val });
                    node.parentNode.insertBefore(clone, node);
                });
            });
            node.remove();
            return;
        }
        if (node.tagName && node.tagName.toLowerCase() === 'if') {
            const cond = evalInContext(node.getAttribute('condition'), ctx);
            if (cond) {
                Array.from(node.children).forEach(child => render(child, ctx));
            } else {
                const elseNode = node.nextElementSibling;
                if (elseNode && elseNode.tagName && elseNode.tagName.toLowerCase() === 'else') {
                    Array.from(elseNode.children).forEach(child => render(child, ctx));
                }
            }
            node.remove();
            return;
        }
        if (node.tagName && node.tagName.toLowerCase() === 'template') {
            const name = node.getAttribute('name');
            if (name) templates[name] = node;
            return;
        }
        Array.from(node.childNodes).forEach(child => render(child, ctx));
    }
    function mount(selector, props = {}) {
        const entry = typeof selector === 'string' ? document.querySelector(selector) : selector;
        if (!entry) return;
        render(entry, { ...context, ...props });
    }
    return { mount, templates, hashString };
}

export function MintAssembly(opts = {}) {
    if (opts && (opts.context !== undefined || opts.filters !== undefined)) {
        return universalTemplateEngine(opts);
    }
    return legacyMintAssembly(opts);
}