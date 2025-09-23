#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { execFile } = require('child_process');

const colors = {
    reset: '\x1b[0m',
    white: '\x1b[37m',
    green: '\x1b[32m',
    lightGreen: '\x1b[92m',
    lightBlue: '\x1b[94m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}
function logSuccess(message) { log(`${message}`, 'lightGreen'); }
function logError(message) { log(`${message}`, 'white'); }
function logInfo(message) { log(`${message}`, 'white'); }

function askInput(question, defaultValue) {
    return new Promise(resolve => {
        const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
        rl.question(`${question} [${defaultValue}]: `, answer => {
            rl.close();
            resolve(answer.trim() || defaultValue);
        });
    });
}

function askYesNo(question, defaultValue = true) {
    return new Promise(resolve => {
        const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
        rl.question(`${question} (${defaultValue ? 'Y/n' : 'y/N'}): `, answer => {
            rl.close();
            answer = answer.trim().toLowerCase();
            if (answer === '') return resolve(defaultValue);
            resolve(answer === 'y');
        });
    });
}

function askList(question, choices, defaultIndex = 0) {
    return new Promise(resolve => {
        let selected = defaultIndex;
        function render() {
            process.stdout.write('\x1Bc'); // clear screen
            console.log(question + '\n');
            choices.forEach((choice, i) => {
                if (i === selected) {
                    process.stdout.write('❯ ' + choice + '\n');
                } else {
                    process.stdout.write('  ' + choice + '\n');
                }
            });
            process.stdout.write('\n(Use arrow keys and Enter)\n');
        }
        function onKey(key) {
            if (key === '\u0003') process.exit(); // ctrl+c
            if (key === '\u001B[A') { // up
                selected = (selected - 1 + choices.length) % choices.length;
                render();
            }
            if (key === '\u001B[B') { // down
                selected = (selected + 1) % choices.length;
                render();
            }
            if (key === '\r') { // enter
                process.stdin.setRawMode(false);
                process.stdin.removeListener('data', onKey);
                process.stdout.write('\n');
                resolve(choices[selected]);
            }
        }
        render();
        process.stdin.setRawMode(true);
        process.stdin.resume();
        process.stdin.setEncoding('utf8');
        process.stdin.on('data', onKey);
    });
}

function copyDirectory(src, dest, filterFn) {
    if (!fs.existsSync(dest)) {
        fs.mkdirSync(dest, { recursive: true });
    }
    const entries = fs.readdirSync(src, { withFileTypes: true });
    for (const entry of entries) {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);
        if (filterFn && !filterFn(entry, srcPath)) continue;
        if (entry.isDirectory()) {
            copyDirectory(srcPath, destPath, filterFn);
        } else {
            fs.copyFileSync(srcPath, destPath);
        }
    }
}

function getFlag(name) {
    return process.argv.includes('--' + name);
}

function getFlagValue(name) {
    const idx = process.argv.indexOf('--' + name);
    if (idx !== -1 && idx + 1 < process.argv.length) {
        return process.argv[idx + 1];
    }
    return undefined;
}

const yesFlag = getFlag('yes');

(async () => {
    console.log("Let's build your Mintkit\n");

    const projectName = yesFlag ? 'mint-ui' : await askInput('Project name:', 'mint-ui');
    const template = 'basic';
    const lang = 'en';
    let srcDir = getFlag('src');
    let includeLiveServerSource = getFlag('liveserver');
    if (!srcDir) {
        srcDir = yesFlag ? false : await askYesNo('Would you like your code inside a src/ directory?', false);
    }
    if (!includeLiveServerSource) {
        includeLiveServerSource = yesFlag ? false : await askYesNo('Would you like to include the live server source code?', false);
    }
    const startServer = yesFlag ? true : await askYesNo('Start server now?', true);

    if (!/^[a-zA-Z0-9-_]+$/.test(projectName)) {
        logError('Project name can only contain letters, numbers, hyphens, and underscores!');
        process.exit(1);
    }
    const currentDir = process.cwd();
    const projectPath = path.join(currentDir, projectName);
    if (fs.existsSync(projectPath)) {
        logError(`Directory "${projectName}" already exists!`);
        process.exit(1);
    }
    const templateDir = path.join(__dirname, 'mintkit-app');

    fs.mkdirSync(projectPath, { recursive: true });
    if (srcDir) {
        const keepAtRoot = [
            'sw.js',
            'README.html',
            'live-reload.js'
        ];
        fs.mkdirSync(path.join(projectPath, 'src'));
        copyDirectory(templateDir, path.join(projectPath, 'src'), (entry, srcPath) => {
            const rel = path.relative(templateDir, srcPath).replace(/\\/g, '/');
            if (keepAtRoot.includes(rel)) return false;
            if (rel === 'lib' || rel.startsWith('lib/')) return false;
            if (rel === 'liveserver' || rel.startsWith('liveserver/')) return false;
            if (rel === 'liveserver/LiveServer.exe') return false;
            return true;
        });
        const libSrc = path.join(templateDir, 'lib');
        const libDest = path.join(projectPath, 'src', 'lib');
        if (fs.existsSync(libSrc)) {
            copyDirectory(libSrc, libDest);
        }
        for (const rel of keepAtRoot) {
            const srcPath = path.join(templateDir, rel);
            const destPath = path.join(projectPath, path.basename(rel));
            if (fs.existsSync(srcPath)) fs.copyFileSync(srcPath, destPath);
        }
    } else {
        copyDirectory(templateDir, projectPath, (entry, srcPath) => {
            const rel = path.relative(templateDir, srcPath).replace(/\\/g, '/');
            if (rel === 'liveserver' || rel.startsWith('liveserver/')) return false;
            if (rel === 'liveserver/LiveServer.exe') return false;
            return true;
        });
    }
    const exeSrc = path.join(templateDir, 'liveserver', 'LiveServer.exe');
    const exeDest = path.join(projectPath, 'LiveServer.exe');
    if (fs.existsSync(exeSrc)) {
        fs.copyFileSync(exeSrc, exeDest);
    }
    if (includeLiveServerSource) {
        const srcLiveServer = path.join(templateDir, 'liveserver');
        const destLiveServer = path.join(projectPath, 'liveserver');
        fs.mkdirSync(destLiveServer, { recursive: true });
        copyDirectory(srcLiveServer, destLiveServer, (entry, srcPath) => {
            return path.basename(srcPath) !== 'LiveServer.exe';
        });
    }

    const packageJson = {
        name: projectName,
        version: "1.0.0",
        description: `A Mintkit.js application - ${projectName}`,
        main: srcDir ? "src/index.html" : "index.html",
        scripts: {
            "start": "src\\LiveServer.exe",
            "dev": "src\\LiveServer.exe",
            "build": "echo 'Build completed'"
        },
        keywords: ["mintkit", "vanilla-js", "web-framework"],
        author: "Created with create-mint-app",
        license: "MIT",
        template,
        lang
    };
    fs.writeFileSync(
        path.join(projectPath, 'package.json'),
        JSON.stringify(packageJson, null, 2)
    );

    logSuccess(`Mintkit with this app name: "${colors.lightBlue}${projectName}${colors.reset}" created successfully!`);
    logInfo('');
    logInfo('After installation run the following steps:');
    logInfo(`cd ${colors.lightBlue}${projectName}${colors.reset}`);
    logInfo('npm start');
    logInfo('');
    logInfo('Happy coding!');
    if (startServer) {
        logInfo('Starting server...');
        execFile('LiveServer.exe', { cwd: srcDir ? path.join(projectPath, 'src') : projectPath });
    }
})(); 