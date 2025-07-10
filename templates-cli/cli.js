#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSuccess(message) {
    log(`${message}`, 'green');
}

function logError(message) {
    log(`${message}`, 'red');
}

function logInfo(message) {
    log(`${message}`, 'blue');
}

function logWarning(message) {
    log(`${message}`, 'yellow');
}

const projectName = process.argv[2];

if (!projectName) {
    logError('Please provide a project name!');
    logInfo('Usage: npx create-mint-app <project-name>');
    process.exit(1);
}

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
const templateDir = path.join(__dirname, 'template');

function copyDirectory(src, dest) {
    if (!fs.existsSync(dest)) {
        fs.mkdirSync(dest, { recursive: true });
    }

    const entries = fs.readdirSync(src, { withFileTypes: true });

    for (const entry of entries) {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);

        if (entry.isDirectory()) {
            copyDirectory(srcPath, destPath);
        } else {
            fs.copyFileSync(srcPath, destPath);
        }
    }
}

try {
    logInfo(`Creating Mintkit.js application: ${projectName}`);

    fs.mkdirSync(projectPath, { recursive: true });
    copyDirectory(templateDir, projectPath);

    const packageJson = {
        name: projectName,
        version: "1.0.0",
        description: `A Mintkit.js application - ${projectName}`,
        main: "index.html",
        scripts: {
            "start": "node liveserver/LiveServer.exe",
            "dev": "node liveserver/LiveServer.exe",
            "build": "echo 'Build completed'"
        },
        keywords: ["mintkit", "vanilla-js", "web-framework"],
        author: "Created with create-mint-app",
        license: "MIT"
    };

    fs.writeFileSync(
        path.join(projectPath, 'package.json'),
        JSON.stringify(packageJson, null, 2)
    );

    const readmeContent = `# ${projectName}

A Mintkit.js application created with \`create-mint-app\`.

## Getting Started

1. Open \`index.html\` in your browser
2. Or run the live server: \`npm start\`

## Project Structure

- \`index.html\` - Main HTML file
- \`app.js\` - Main application logic
- \`Content.js\` - Content management
- \`CoreFramework.js\` - Core framework
- \`EventHandle.js\` - Event handling
- \`lib/\` - Framework libraries
- \`assets/\` - Static assets
- \`liveserver/\` - Live server executable

Visit [Mintkit.js Documentation](https://github.com/Peakk2011/Mintkit) for more information.
`;

    fs.writeFileSync(path.join(projectPath, 'README.md'), readmeContent);

    logSuccess(`Mintkit.js application "${projectName}" created successfully!`);
    logInfo('');
    logInfo('Next steps:');
    logInfo(`cd ${projectName}`);
    logInfo('npm start');
    logInfo('');
    logInfo('Happy coding!');

} catch (error) {
    logError(`Failed to create project: ${error.message}`);
    process.exit(1);
} 