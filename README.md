
<p align="center">
  <img src="https://drive.google.com/uc?id=1tcAEV3cKmi2YCMHhAvW3KlXI6bwqc9uy" height="180px" width="180px"></img>
</p>

<h1 align="center">Mintkit</h1>

## 📚 About Mintkit 
Mintkit is a comprehensive JavaScript framework designed to streamline web development by providing dynamic content management capabilities in a single, unified solution.  
It simplifies the website creation process while maintaining flexibility and performance, allowing you to focus on creating innovative web applications. 🌐✨

## 💡 Why Choose Mintkit?
Mintkit eliminates the need for multiple libraries and frameworks by providing everything you need in one cohesive package.  
Whether you're building a simple website or a complex web application, Mintkit's intuitive API and powerful features make development more efficient and enjoyable. 🚀

## 🔧 Core Features

### 🎯 State Management & Virtual DOM
- **Reactive State System**: Automatic re-rendering when state changes
- **Virtual DOM**: Efficient DOM diffing and patching
- **Component Architecture**: Modular and reusable components

### 🎨 Design System
- **Typography**: Google Fonts integration with comprehensive font system
- **Spacing Scale**: Consistent spacing from 0-32rem
- **Theme System**: Automatic light/dark theme switching
- **Responsive Design**: Built-in breakpoint system
- **Animation**: Smooth transitions and keyframes

### 🛠️ Development Tools
- **Live Reload**: Hot reloading development server
- **MintAssembly**: HTML-based programming language
- **Electron Support**: Desktop application framework
- **Performance Monitoring**: Built-in performance tracking

## 🚀 Quick Start

### 1. Basic Setup
```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>
<body>
  <div id="app"></div>
  <script src="app.js" type="module" async></script>
</body>
</html>
```

### 2. Import Framework
```javascript
// mint.js
import { createState, injectCSS, injectHTML, injectTitle } from './MintUtils.js';
import { MintAssembly } from './HTMLInterpreter.js';

export const Mint = {
    createState,
    injectCSS,
    injectHTML,
    injectTitle,
    MintAssembly
};
```

### 3. Create Content
```javascript
// Content.js
export const WebContent = {
    PageTitle: 'My Mintkit App',
    
    HTMLContent: {
        Introduce() {
            return `<div class="introduce"><h1>Welcome to Mintkit</h1></div>`;
        }
    },
    
    ElementComponents() {
        return this.HTMLContent.Introduce();
    },
    
    StyledElementComponents() {
        return `
            .introduce {
                text-align: center;
                padding: 2rem;
                font-family: 'Inter Tight', sans-serif;
            }
        `;
    }
};
```

### 4. Initialize App
```javascript
// app.js
import { Mint } from './lib/mint.js';
import { WebContent } from './Content.js';

const Main = Mint.createState({});

const render = () => {
    const html = WebContent.ElementComponents();
    const css = WebContent.StyledElementComponents();
    
    Mint.injectCSS(css);
    Mint.injectHTML('#app', html);
    Mint.injectTitle(`<title>${WebContent.PageTitle}</title>`);
};

Main.subscribe(render);
Main.set({});
```

## Build-in Features

### State Management
```javascript
const state = Mint.createState({ count: 0 });

// Update state
state.set(s => ({ ...s, count: s.count + 1 }));

// Subscribe to changes
state.subscribe((newState) => {
    console.log('State updated:', newState);
});
```

### Theme System
```javascript
const lightTheme = {
    ColorPrimary: '#FFFFFF',
    TextColorPrimary: '#080707'
};

const darkTheme = {
    ColorPrimary: '#000000',
    TextColorPrimary: '#FFD9D9'
};

WebContent.initThemeSystem();
```

### MintAssembly Programming
```html
<Entry>
    <mov dst="ax" src="200"></mov>
    <mov dst="bx" src="100"></mov>
    <add dst="ax" src="bx"></add>
    <print var="ax"></print>
</Entry>
```

## 🔧 Development

### Live Reload Server
```bash
cd mintkit
./LiveServer.exe
# Open http://localhost:3000
```

### Electron App
```bash
cd mintkit-electron
npm install
npm start
```

## 📁 Project Structure
```
Mintkit.js Framework/
├── mintkit/                       # Core framework
│   ├── lib/                       # Library files
│   ├── Content.js                 # Content and styling
│   ├── app.js                     # Main application
│   └── index.html                 # Entry point
├── mintkit-electron/              # Electron desktop app
├── mintkit-purehtml/              # Pure HTML example
└── documents/                     # Documentation
```

## 📖 Documentation

For detailed documentation, examples, and advanced usage, see:
- **[Complete Documentation](documents/MintkitJS_EXPLAIN.MD)** - Comprehensive guide
- **Examples** - Check the `mintkit-purehtml/` directory
- **Electron App** - See `mintkit-electron/` for desktop applications

## 🌟 Contributing

We welcome all contributions to **Mintkit**! Here's how you can help to improve:

### 🔧 How to Contribute

1. **Fork** this repository and clone it to your local machine.
2. **Create** a new branch for your changes.
3. **Make** your changes and write tests (if applicable).
4. **Ensure** that the code passes all tests and follows the project's style guidelines.
5. **Commit** your changes with clear, concise commit messages.
6. **Push** your changes and create a pull request with a detailed explanation.

### 📋 Contribution Guidelines

- **Code Style**: Follow the existing code style and conventions
- **Documentation**: Update documentation for any new features
- **Testing**: Add tests for new functionality
- **Performance**: Consider performance implications of changes
- **Compatibility**: Ensure changes work across different browsers

## 🔗 Links

- **GitHub Repository**: https://github.com/Peakk2011/Mintkit
- **CDN**: https://cdn.jsdelivr.net/gh/Peakk2011/Mint_NextgenJS@main/lib/MintUtils.js
- **Documentation**: [Complete Guide](documents/MintkitJS_EXPLAIN.MD)

---

`npx create-mint-app` to create Mintkit project <br>
**Mintkit** - Making web development dynamic and more customizable way.
