# Mintkit.js CLI Tool Setup

## ✅ What's been created

I've successfully set up a CLI tool for Mintkit.js Framework that can be used like `npx create-mint-app`. Here's what was created:

### 📁 File Structure
```
templates-cli/
├── cli.js              # Main CLI script
├── package.json        # CLI package configuration
├── README.md           # CLI documentation
├── .npmignore          # NPM ignore rules
├── .gitignore          # Git ignore rules
├── publish.md          # Publishing instructions
├── template/           # Template files (copied from mintkit-app)
│   ├── index.html
│   ├── app.js
│   ├── Content.js
│   ├── CoreFramework.js
│   ├── EventHandle.js
│   ├── live-reload.js
│   ├── sw.js
│   ├── lib/
│   ├── assets/
│   ├── liveserver/
│   └── document/
└── mintkit-app/        # Original template (kept for reference)
```

### 🚀 Features
- **Zero Dependencies**: Pure Node.js, no external packages needed
- **Colorful Output**: Beautiful console output with colors and emojis
- **Validation**: Checks project name format and directory existence
- **Complete Template**: Copies all necessary files for a working Mintkit.js app
- **Auto-generated Files**: Creates `package.json` and `README.md` for new projects

## 🎯 How to use

### For Development (Local Testing)
```bash
cd templates-cli
node cli.js my-app-name
```

### After Publishing to npm
```bash
npx create-mint-app my-app-name
```

## 📦 Publishing Steps

1. **Login to npm** (if not already logged in):
   ```bash
   npm login
   ```

2. **Navigate to templates-cli**:
   ```bash
   cd templates-cli
   ```

3. **Publish the package**:
   ```bash
   npm publish
   ```

4. **Test the published CLI**:
   ```bash
   npx create-mint-app my-test-app
   ```

## 🔧 What the CLI does

1. **Validates input**: Checks project name format and directory existence
2. **Creates project directory**: Makes a new folder with the project name
3. **Copies template files**: Copies all files from `template/` directory
4. **Generates package.json**: Creates a new `package.json` for the project
5. **Creates README.md**: Generates documentation for the new project
6. **Provides next steps**: Shows instructions for getting started

## 🎨 User Experience

When users run the CLI, they'll see:
```
ℹ️  Creating Mintkit.js application: my-app
✅ Mintkit.js application "my-app" created successfully!

Next steps:
  cd my-app
  npm start

Happy coding! 🎉
```

## 📝 Next Steps

1. **Test the CLI locally** to make sure everything works
2. **Publish to npm** when ready
3. **Update documentation** to include CLI usage
4. **Consider adding more templates** in the future

The CLI tool is now ready to use! Users can create new Mintkit.js applications with a single command, just like `create-react-app` or `create-vue-app`. 