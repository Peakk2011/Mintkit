#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

// ANSI Color
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

const askInput = (question) => {
    return new Promise(resolve => {
        const rl = require('readline').createInterface({
            input: process.stdin,
            output: process.stdout
        });
        rl.question(`${colors.lightBlue}${question}${colors.reset} `, (answer) => {
            rl.close();
            resolve(answer);
        });
    });
};

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
            process.stdout.write('\x1Bc');
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
            if (key === '\u0003') process.exit();
            if (key === '\u001B[A') {
                selected = (selected - 1 + choices.length) % choices.length;
                render();
            }
            if (key === '\u001B[B') {
                selected = (selected + 1) % choices.length;
                render();
            }
            if (key === '\r') {
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

const runCommand = (command, args, options) => {
    return new Promise((resolve, reject) => {
        const child = spawn(command, args, { stdio: 'inherit', shell: true, ...options });
        child.on('close', code => {
            if (code !== 0) {
                reject({ command: `${command} ${args.join(' ')}` });
                return;
            }
            resolve();
        });
    });
};

const runMintkitElectron = (command, args, options) => {
    return new Promise((resolve, reject) => {
        const child = spawn(command, args, { stdio: 'pipe', shell: true, ...options });
        child.on('close', code => {
            if (code !== 0) {
                reject({ command: `${command} ${args.join(' ')}` });
                return;
            }
            resolve();
        });
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

const processTemplateFile = (srcPath, destPath, replacements) => {
    let content = fs.readFileSync(srcPath, 'utf8');
    for (const [key, value] of Object.entries(replacements)) {
        content = content.replace(key, value);
    }
    fs.writeFileSync(destPath, content);
};

const copyAndProcessDirectory = (src, dest, replacements) => {
    fs.mkdirSync(dest, { recursive: true });
    const entries = fs.readdirSync(src, { withFileTypes: true });
    entries.forEach(entry => {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);
        entry.isDirectory() ? copyAndProcessDirectory(srcPath, destPath, replacements) : processTemplateFile(srcPath, destPath, replacements);
    });
};

const mintkitElectron = async (projectName, repoUrl) => {
    const currentDir = process.cwd();
    const projectPath = path.join(currentDir, projectName);

    if (fs.existsSync(projectPath)) {
        logError(`Directory "${projectName}" already exists!`);
        process.exit(1);
    }

    console.log('\nCreating your Mintkit Electron application');
    const spinner = showSpinner('Cloning repository');

    try {
        await runMintkitElectron('git', ['clone', repoUrl, projectName], { cwd: currentDir });

        // Remove .git folder
        const gitFolder = path.join(projectPath, '.git');
        if (fs.existsSync(gitFolder)) {
            fs.rmSync(gitFolder, { recursive: true, force: true });
        }

        stopSpinner(spinner);
        logSuccess(`\nMintkit Electron application ${colors.lightBlue}${projectName}${colors.reset} created successfully!`);
        logInfo('');
        logInfo('Next steps:');
        logInfo(`   cd ${projectName}`);
        logInfo('   npm install');
        logInfo('   npm start');
        logInfo('');
        process.exit();
    } catch (error) {
        stopSpinner(spinner);
        logError('Failed to clone repository.');
        logError('Please make sure git is installed and the repository URL is correct.');
        process.exit(1);
    }
};

(async () => {
    console.log("Let's build your Mintkit application\n");

    const args = process.argv.slice(2);
    let projectName = args.find(arg => !arg.startsWith('--'));
    const flags = new Set(args.filter(arg => arg.startsWith('--')));

    // Check for Electron flag first
    if (flags.has('--electron')) {
        if (!projectName) {
            projectName = await askInput('What is your project name?');
            if (!projectName) {
                logError('Project name cannot be empty.');
                process.exit(1);
            }
        }

        if (!/^[a-zA-Z0-9-_]+$/.test(projectName)) {
            logError('Project name can only contain letters, numbers, hyphens, and underscores!');
            process.exit(1);
        }

        // Clone Mintkit with Electron
        const electronRepoUrl = 'https://github.com/Peakk2011/MintkitWithElectron.git';
        await mintkitElectron(projectName, electronRepoUrl);
        return;
    }

    // Original flow for non-Electron projects
    if (!projectName) {
        projectName = await askInput('What is your project name?');
        if (!projectName) {
            logError('Project name cannot be empty.');
            process.exit(1);
        }
    }

    if (!/^[a-zA-Z0-9-_]+$/.test(projectName)) {
        logError('Project name can only contain letters, numbers, hyphens, and underscores!');
        process.exit(1);
    }

    let lang;
    if (flags.has('--typescript')) {
        lang = 'typescript';
    } else if (flags.has('--javascript')) {
        lang = 'javascript';
    } else {
        lang = (await askList('Which language would you like to use?', ['JavaScript', 'TypeScript'])).toLowerCase();
    }

    let useVite;
    if (flags.has('--vite')) {
        useVite = true;
    } else if (flags.has('--no-vite')) {
        useVite = false;
    } else {
        const useViteAnswer = await askList('Do you want to use Vite for development?', ['Yes', 'No']);
        useVite = useViteAnswer === 'Yes';
    }

    let useLinter;
    if (flags.has('--lint')) {
        useLinter = true;
    } else if (flags.has('--no-lint')) {
        useLinter = false;
    } else {
        const useLinterAnswer = await askList('Do you want to add ESLint and Prettier for code quality?', ['Yes', 'No']);
        useLinter = useLinterAnswer === 'Yes';
    }

    console.log('\nCreating your Mintkit application...');
    const spinner = showSpinner('Setting up project files');

    const currentDir = process.cwd();
    const projectPath = path.join(currentDir, projectName);

    if (fs.existsSync(projectPath)) {
        stopSpinner(spinner);
        logError(`Directory "${projectName}" already exists!`);
        process.exit(1);
    }

    // Find template directory
    let templateDir = path.join(__dirname, 'mintkit-app');
    if (!fs.existsSync(templateDir)) {
        templateDir = path.join(__dirname, 'template');
    }

    if (!fs.existsSync(templateDir)) {
        stopSpinner(spinner);
        logError('Template directory not found.');
        logError(`Searched: ${path.join(__dirname, 'mintkit-app')}`);
        logError(`Also tried: ${path.join(__dirname, 'template')}`);
        process.exit(1);
    }

    // Create project directory
    fs.mkdirSync(projectPath, { recursive: true });

    // Copy common files (exclude language folders and unwanted files)
    copyDirectory(templateDir, projectPath, (entry, srcPath) => {
        const rel = path.relative(templateDir, srcPath).replace(/\\/g, '/');
        const excludeDirs = [
            'liveserver/',
            'node_modules/',
            'javascript/',
            'typescript/',
            '.git/',
            'dist/',
            'package-lock.json',
            'package.json',
            'tsconfig.json',
            'vite.config.js'
        ];
        return !excludeDirs.some(dir =>
            rel.startsWith(dir) || rel === dir.replace('/', '')
        );
    });

    // Copy language-specific src files
    const langSourceDir = path.join(templateDir, lang, 'src');
    const projectSrcDir = path.join(projectPath, 'src');

    const replacements = {};
    if (useVite) {
        replacements['// Import app.css'] = '// Import app.css for Vite';
        replacements[/await Mint\.include\((['"]).*?app\.css\1\);/] = `import './app.css';`;
    } else {
        // Adjust path for non-vite setup if needed, but seems correct as is.
        // The original template has the correct path for non-vite.
    }

    if (fs.existsSync(langSourceDir)) {
        copyAndProcessDirectory(langSourceDir, projectSrcDir, replacements);
    } else {
        stopSpinner(spinner);
        logError(`${lang} source directory not found!`);
        logError(`Expected: ${langSourceDir}`);
        process.exit(1);
    }

    // Copy index.html from language folder
    const langIndexHtml = path.join(templateDir, lang, 'index.html');
    if (fs.existsSync(langIndexHtml)) {
        fs.copyFileSync(langIndexHtml, path.join(projectPath, 'index.html'));
    } else {
        stopSpinner(spinner);
        logError(`index.html not found in ${lang} template!`);
        logError(`Expected: ${langIndexHtml}`);
        process.exit(1);
    }

    // Create package.json
    const packageJson = {
        name: projectName,
        version: "1.0.0",
        description: `A Mintkit framework application - ${projectName}`,
        main: "index.html",
        keywords: ["mintkit", "vanilla-js", "web-framework"],
        author: "Created with create-mint-app",
        license: "MIT",
    };

    // Vite configuration
    if (useVite) {
        const viteConfigContent = `import { defineConfig } from 'vite';

export default defineConfig({
    server: {
        open: true,
    },
});
`;
        fs.writeFileSync(path.join(projectPath, 'vite.config.js'), viteConfigContent);

        packageJson.scripts = {
            "dev": "vite",
            "build": "vite build",
            "preview": "vite preview"
        };
        packageJson.devDependencies = {
            "vite": "^5.3.5"
        };
    }

    // TypeScript configuration
    if (useVite && lang === 'typescript') {
        const tsConfigContent = `{
  "compilerOptions": {
    "target": "ESNext",
    "useDefineForClassFields": true,
    "module": "ESNext",
    "lib": ["ESNext", "DOM", "DOM.Iterable"],
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src"]
}`;
        fs.writeFileSync(path.join(projectPath, 'tsconfig.json'), tsConfigContent);
        packageJson.devDependencies.typescript = "^5.5.3";
        packageJson.scripts['type-check'] = "tsc --noEmit";
    }

    // ESLint and Prettier
    if (useLinter) {
        if (!packageJson.scripts) packageJson.scripts = {};
        if (!packageJson.devDependencies) packageJson.devDependencies = {};

        Object.assign(packageJson.devDependencies, {
            "eslint": "^8.57.0",
            "prettier": "^3.3.3",
            "eslint-config-prettier": "^9.1.0"
        });

        const lintExtensions = lang === 'typescript' ? '{js,ts}' : 'js';
        packageJson.scripts.lint = `eslint "src/**/*.${lintExtensions}"`;
        packageJson.scripts.format = `prettier --write "src/**/*.{js,ts,html,css}"`;

        const prettierrcContent = `{
  "semi": true,
  "tabWidth": 4,
  "singleQuote": true,
  "trailingComma": "es5"
}`;
        fs.writeFileSync(path.join(projectPath, '.prettierrc'), prettierrcContent);

        const prettierignoreContent = `node_modules\ndist\n`;
        fs.writeFileSync(path.join(projectPath, '.prettierignore'), prettierignoreContent);

        let eslintrcContent;
        if (lang === 'typescript') {
            Object.assign(packageJson.devDependencies, {
                "@typescript-eslint/eslint-plugin": "^7.17.0",
                "@typescript-eslint/parser": "^7.17.0"
            });
            eslintrcContent = {
                "parser": "@typescript-eslint/parser",
                "extends": ["eslint:recommended", "plugin:@typescript-eslint/recommended", "prettier"],
                "plugins": ["@typescript-eslint"],
                "env": { "browser": true, "es2021": true, "node": true },
                "parserOptions": { "ecmaVersion": "latest", "sourceType": "module" },
                "rules": {}
            };
        } else {
            eslintrcContent = {
                "extends": ["eslint:recommended", "prettier"],
                "env": { "browser": true, "es2021": true, "node": true },
                "parserOptions": { "ecmaVersion": "latest", "sourceType": "module" },
                "rules": {}
            };
        }
        fs.writeFileSync(
            path.join(projectPath, '.eslintrc.json'),
            JSON.stringify(eslintrcContent, null, 2)
        );
    }

    // Write package.json
    fs.writeFileSync(
        path.join(projectPath, 'package.json'),
        JSON.stringify(packageJson, null, 2)
    );

    stopSpinner(spinner);

    logSuccess(`\nMintkit application ${colors.lightBlue}${projectName}${colors.reset} created successfully!`);
    logInfo('');

    if (useVite) {
        logInfo('Installing dependencies...');
        try {
            await runCommand('npm', ['install'], { cwd: projectPath });
            logSuccess('Dependencies installed successfully!');

            let startDevServer = flags.has('--live');
            if (!startDevServer) {
                const runDevAnswer = await askList('Do you want to start the development server now?', ['Yes', 'No']);
                if (runDevAnswer === 'Yes') {
                    startDevServer = true;
                }
            }

            if (startDevServer) {
                logInfo('\nStarting development server...');
                await runCommand('npm', ['run', 'dev'], { cwd: projectPath });
            } else {
                logInfo('\nNext steps:');
                logInfo(`   cd ${projectName}`);
                logInfo('   npm run dev');
            }
        } catch (error) {
            logError('Failed to install dependencies.\nRun "npm install" manually.');
            process.exit();
        }
    } else {
        logInfo('Next steps:');
        logInfo(`   cd ${projectName}`);
        logInfo('   code .');
        logInfo('   Right-click in VS Code and select "Open with Live Server"');
    }
    logInfo('');
    process.exit();
})();

/*
    # To create Mintkit framework follow this instruction

    > Create Javascript + Vite with ESLint & Prettier
    npx create-mint-app my-mintkit-application --javascript --vite --lint

    > Create TypeScript + Vite with ESLint & Prettier
    npx create-mint-app my-mintkit-application --typescript --vite --lint

    > Create Electron application (clones from git repository)
    npx create-mint-app my-electron-app --electron

    # Install Mintkit with just your 1 command
    
    > With lint and Vite
    npx create-mint-app my-mintkit-application --typescript --vite --lint --live

    > Without lint and Vite
    npx create-mint-app my-mintkit-application --typescript --no-vite --no-lint --live

    All flags
    | --vite
    | --typescript
    | --javascript
    | --live
    | --lint
    | --no-vite
    | --no-lint
    | --electron

    > Default Mintkit install
    npx create-mint-app@latest
*/