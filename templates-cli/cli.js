#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execFile } = require('child_process');

const colors = {
    reset: '\x1b[0m',
    white: '\x1b[37m',
    lightGreen: '\x1b[92m',
    lightBlue: '\x1b[94m'
};

const log = (message, color = 'reset') => {
    console.log(`${colors[color]}${message}${colors.reset}`);
};

const logSuccess = message => log(`${message}`, 'lightGreen');
const logError = message => log(`${message}`, 'white');
const logInfo = message => log(`${message}`, 'white');

const showSpinner = message => {
    const frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
    let i = 0;
    return setInterval(() => {
        process.stdout.write(`\r${colors.lightBlue}${frames[i]} ${message}${colors.reset}`);
        i = (i + 1) % frames.length;
    }, 80);
};

const stopSpinner = spinner => {
    clearInterval(spinner);
    process.stdout.write('\r' + ' '.repeat(50) + '\r');
};

const askList = (question, choices, defaultIndex = 0) => {
    return new Promise(resolve => {
        let selected = defaultIndex;

        const render = () => {
            process.stdout.write('\x1Bc'); // clear
            console.log(`${colors.lightBlue}${question}${colors.reset}\n`);
            choices.forEach((choice, i) => {
                if (i === selected) {
                    process.stdout.write(`${colors.lightGreen}❯ ${choice}${colors.reset}\n`);
                } else {
                    process.stdout.write(`  ${choice}\n`);
                }
            });
            process.stdout.write('\n(Use arrow keys and Enter)\n');
        };

        const onKey = key => {
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
        };

        render();
        process.stdin.setRawMode(true);
        process.stdin.resume();
        process.stdin.setEncoding('utf8');
        process.stdin.on('data', onKey);
    });
};

const copyDirectory = (src, dest, filterFn) => {
    if (!fs.existsSync(dest)) {
        fs.mkdirSync(dest, { recursive: true });
    }
    const entries = fs.readdirSync(src, { withFileTypes: true });

    entries.forEach(entry => {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);
        if (filterFn && !filterFn(entry, srcPath)) return;

        if (entry.isDirectory()) {
            copyDirectory(srcPath, destPath, filterFn);
        } else {
            fs.copyFileSync(srcPath, destPath);
        }
    });
};

(async () => {
    console.log("Let's build your Mintkit\n");

    const projectName = process.argv[2];

    if (!projectName) {
        logInfo('Usage: node cli.js <project-name>');
        process.exit(1);
    }

    if (!/^[a-zA-Z0-9-_]+$/.test(projectName)) {
        logError('Project name can only contain letters, numbers, hyphens, and underscores!');
        process.exit(1);
    }

    const lang = (await askList('Which language would you like to use?', ['JavaScript', 'TypeScript'])).toLowerCase();

    console.log('\nCreating your Mintkit application...');
    const spinner = showSpinner('Setting up project files');

    const currentDir = process.cwd();
    const projectPath = path.join(currentDir, projectName);

    if (fs.existsSync(projectPath)) {
        stopSpinner(spinner);
        logError(`Directory "${projectName}" already exists!`);
        process.exit(1);
    }

    const templateDir = path.join(__dirname, 'mintkit-app', lang);

    if (!fs.existsSync(templateDir)) {
        stopSpinner(spinner);
        logError(`Template for "${lang}" is not available yet.`);
        process.exit(1);
    }

    fs.mkdirSync(projectPath, { recursive: true });
    copyDirectory(templateDir, projectPath, (entry, srcPath) => {
        const rel = path.relative(templateDir, srcPath).replace(/\\/g, '/');
        return !rel.startsWith('liveserver/');
    });

    const packageJson = {
        name: projectName,
        version: "1.0.0",
        description: `A Mintkit.js application - ${projectName}`,
        main: "index.html",
        keywords: ["mintkit", "vanilla-js", "web-framework"],
        author: "Created with create-mint-app",
        license: "MIT",
        template: 'basic',
        lang
    };

    fs.writeFileSync(
        path.join(projectPath, 'package.json'),
        JSON.stringify(packageJson, null, 2)
    );

    stopSpinner(spinner);

    logSuccess(`\nMintkit application ${colors.lightBlue}${projectName}${colors.reset} created successfully!`);
    logInfo('');
    logInfo('Next steps:');
    logInfo('   cd ' + projectName);
    logInfo('   code .');
    logInfo('   Right-click in VS Code and select "Open with Live Server"');
    logInfo('   Note: You need the Live Server extension for the best development experience');
    logInfo('');
    logInfo('Happy coding with the Mintkit framework!');
    process.exit();
})();