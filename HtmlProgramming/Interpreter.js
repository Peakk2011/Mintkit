(() => {
    const REG_COUNT = 4;
    // Int32Array ใช้แทน registers: 0=ax, 1=bx, 2=cx, 3=dx
    const regs = new Int32Array(REG_COUNT);
    const regMap = { ax: 0, bx: 1, cx: 2, dx: 3 };

    const bytecode = [];
    const labelMap = Object.create(null);
    const funcMap = Object.create(null);

    function compileAsm() {
        const container = document.querySelector("Entry");
        if (!container) throw new Error("Missing <Entry> container");

        const nodes = [...container.children];

        function compileNodes(nodesArr) {
            for (let i = 0; i < nodesArr.length; i++) {
                const node = nodesArr[i];
                const type = node.tagName.toLowerCase();
                const attrs = {};
                for (const attr of node.attributes) {
                    attrs[attr.name] = attr.value.trim();
                }

                if (type === "func") {
                    const funcEntry = {
                        type: "func",
                        name: attrs.name,
                        children: []
                    };
                    funcMap[attrs.name] = bytecode.length;

                    const subNodes = [...node.children];
                    const subCode = [];
                    compileNodes(subNodes, subCode);
                    funcEntry.children = subCode;
                    bytecode.push(funcEntry);
                } else {
                    const op = { type };

                    if (attrs.dst) op.dst = attrs.dst;
                    if (attrs.src) op.src = attrs.src;
                    if (attrs.a) op.a = attrs.a;
                    if (attrs.b) op.b = attrs.b;
                    if (attrs.jmp) op.jmp = attrs.jmp;
                    if (attrs.to) op.to = attrs.to;
                    if (attrs.var) op.var = attrs.var;
                    if (attrs.name && (type === "label" || type === "call")) op.name = attrs.name;

                    const values = [...node.querySelectorAll("value, text")];
                    if (values.length > 0) {
                        let total = 0;
                        for (let val of values) {
                            const num = Number(val.textContent.trim());
                            if (isNaN(num)) {
                                throw new Error(`Invalid value inside <${type}>: "${val.textContent.trim()}" is not a number`);
                            }
                            total += num;
                        }
                        op.src = total.toString();
                    }

                    bytecode.push(op);
                    if (type === "label" && attrs.name) {
                        labelMap[attrs.name] = bytecode.length - 1;
                    }
                }
            }
        }

        compileNodes(nodes);
    }
    compileAsm();

    function optimizeBytecode(code) {
        for (let i = 0; i < code.length - 1; i++) {
            const curr = code[i], next = code[i + 1];
            if (curr.type === "mov" && next.type === "add") {
                let movVal = Number(curr.src);
                let addVal = Number(next.src);
                if (!isNaN(movVal) && !isNaN(addVal)) {
                    curr.src = (movVal + addVal).toString();
                    next.type = "nop";
                }
            }
        }
        return code.filter(op => op.type !== "nop");
    }
    const optimizedBytecode = optimizeBytecode(bytecode);

    function resolveOperand(opStr) {
        if (opStr === undefined)
            throw new Error("Operand is undefined");

        if (!isNaN(opStr)) return Number(opStr);

        if (opStr.startsWith("[") && opStr.endsWith("]")) {
            const r = opStr.slice(1, -1);
            if (!(r in regMap))
                throw new Error(`Invalid register in memory access: [${r}]`);
            return regs[regMap[r]];
        }

        if (regMap.hasOwnProperty(opStr)) {
            return regs[regMap[opStr]];
        }

        if (opStr.startsWith("#")) {
            const el = document.getElementById(opStr.slice(1));
            if (!el) throw new Error(`Element with id ${opStr} not found`);
            // ดึง innerText แบบลึก (รวมลูก)
            const valStr = el.innerText || el.textContent || "";
            const val = Number(valStr.trim());
            if (isNaN(val)) throw new Error(`Element ${opStr} does not contain a numeric value`);
            return val;
        }

        throw new Error(`Invalid operand: ${opStr}`);
    }

    function executeBytecode(code) {
        let ip = 0;
        const callStack = [];
        while (ip < code.length) {
            const op = code[ip];
            switch (op.type) {
                case "mov":
                    if (op.dst.startsWith("#")) {
                        const el = document.getElementById(op.dst.slice(1));
                        if (!el) throw new Error(`Element with id ${op.dst} not found`);
                        el.innerText = resolveOperand(op.src);
                    } else {
                        regs[regMap[op.dst]] = resolveOperand(op.src);
                    }
                    break;
                case "add":
                    regs[regMap[op.dst]] += resolveOperand(op.src);
                    break;
                case "sub":
                    regs[regMap[op.dst]] -= resolveOperand(op.src);
                    break;
                case "mul":
                    regs[regMap[op.dst]] *= resolveOperand(op.src);
                    break;
                case "div":
                    const divisor = resolveOperand(op.src);
                    regs[regMap[op.dst]] = divisor ? (regs[regMap[op.dst]] / divisor) | 0 : 0;
                    break;
                case "cmp":
                    if (resolveOperand(op.a) === resolveOperand(op.b)) {
                        if (labelMap.hasOwnProperty(op.jmp)) {
                            ip = labelMap[op.jmp];
                            continue;
                        }
                    }
                    break;
                case "jmp":
                    if (labelMap.hasOwnProperty(op.to)) {
                        ip = labelMap[op.to];
                        continue;
                    }
                    break;
                case "print":
                    console.log(`[PRINT] ${op.var} = ${regs[regMap[op.var]]}`);
                    break;
                case "func":
                    break;
                case "call":
                    if (funcMap.hasOwnProperty(op.name)) {
                        callStack.push({ ip: ip + 1, code });
                        const funcEntry = optimizedBytecode[funcMap[op.name]];
                        executeBytecode(funcEntry.children);
                        const ret = callStack.pop();
                        ip = ret.ip;
                        code = ret.code;
                        continue;
                    }
                    break;
                case "xor":
                    if (!regMap.hasOwnProperty(op.dst))
                        throw new Error(`Unknown register in xor: ${op.dst}`);
                    regs[regMap[op.dst]] ^= resolveOperand(op.src);
                    break;
                case "ret":
                    return;
            }
            ip++;
        }
    }

    executeBytecode(optimizedBytecode);
    window.debugRegs = regs;
    console.log("Final Registers:", regs);
})();
