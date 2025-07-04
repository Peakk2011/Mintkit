# Mintkit.js Framework Documentation

## 📚 About Mintkit

Mintkit is a comprehensive JavaScript framework designed to streamline web development by providing dynamic content management capabilities in a single, unified solution. It simplifies the website creation process while maintaining flexibility and performance, allowing you to focus on creating innovative web applications.

## 🚀 Key Features

### 🔧 Core Framework Components
- **State Management**: Reactive state system with automatic re-rendering
- **Virtual DOM**: Efficient DOM diffing and patching
- **Component System**: Modular component architecture
- **Theme System**: Built-in light/dark theme switching
- **Live Reload**: Development server with hot reloading
- **MintAssembly**: HTML-based programming language emulating Assembly

### 🎨 Design System
- **Typography**: Comprehensive font system with Google Fonts integration
- **Spacing**: Consistent spacing scale (0-32rem)
- **Colors**: Theme-aware color system
- **Shadows**: Multiple shadow presets
- **Transitions**: Smooth animation system
- **Breakpoints**: Responsive design breakpoints

## 📁 Project Structure

```
Mintkit.js Framework/
├── mintkit/                    # Core framework
│   ├── lib/                   # Library files
│   │   ├── MintUtils.js       # Core utilities
│   │   ├── HTMLInterpreter.js # MintAssembly interpreter
│   │   └── mint.js           # Main export file
│   ├── Content.js            # Content and styling
│   ├── EventHandle.js        # Event handling
│   ├── app.js               # Main application
│   ├── index.html           # Entry point
│   └── live-reload.js       # Development server
├── mintkit-electron/         # Electron desktop app
├── mintkit-purehtml/         # Pure HTML example
├── mintAssembly/            # Assembly language tools
└── documents/               # Documentation
```

## 🛠️ Getting Started

### 1. Basic Setup

Create your main HTML file:

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <div id="Title"></div>
</head>
<body>
  <div id="app"></div>
  <script src="app.js" type="module" async></script>
</body>
</html>
```

### 2. Import Framework

Create `mint.js` to import framework functions:

```javascript
import { 
    createState,
    AdjustHook, 
    injectCSS,
    injectHTML,
    injectTitle
} from './MintUtils.js';

import { MintAssembly } from './HTMLInterpreter.js';

export const Mint = {
    createState,
    AdjustHook,
    injectCSS,
    injectHTML,
    injectTitle,
    MintAssembly
};
```

### 3. Create Content

Define your content in `Content.js`:

```javascript
export const WebElements = {
    // Typography system
    StoredFontFamily: "@import url('https://fonts.googleapis.com/css2?family=Inter+Tight:wght@100..900&display=swap');",
    Typeface: [
        '"Inter Tight", sans-serif;',
        '"JetBrains Mono", monospace;'
    ],
    
    // Spacing system
    spacing: {
        0: '0',
        1: '0.25rem',     // 4px
        2: '0.5rem',      // 8px
        4: '1rem',        // 16px
        8: '2rem',        // 32px
    },
    
    // Color system
    breakpoints: { 
        sm: '450px',
        md: '768px',
        lg: '1024px',
        xl: '1280px'
    }
};

export const WebContent = {
    PageTitle: 'My Mintkit App',
    
    HTMLContent: {
        Introduce() {
            return `
                <div class="introduce">
                    <h1>Welcome to Mintkit</h1>
                    <p>Dynamic content management made simple</p>
                </div>
            `;
        }
    },
    
    ElementComponents() {
        return this.HTMLContent.Introduce();
    },
    
    StyledElementComponents() {
        return `
            .introduce {
                text-align: center;
                padding: ${WebElements.spacing[8]};
            }
            
            .introduce h1 {
                font-family: ${WebElements.Typeface[0]};
                font-size: 2rem;
                margin-bottom: ${WebElements.spacing[4]};
            }
        `;
    }
};
```

### 4. Initialize Application

Create `app.js` to start your application:

```javascript
import { Mint } from './lib/mint.js';
import { WebContent, WebElements } from './Content.js';

const ROOT = '#app';
const cache = {
    target: document.querySelector(ROOT),
    css: null,
    html: null
};

// Generate stylesheet
const generateStylesheet = () => {
    if (!cache.css) {
        cache.css = WebContent.StyledElementComponents();
    }
    return cache.css;
};

// Main state
const Main = Mint.createState({});

// Render function
const render = () => {
    const html = WebContent.ElementComponents();
    const css = generateStylesheet();
    
    Mint.injectCSS(css);
    Mint.injectHTML(ROOT, html);
    Mint.injectTitle(`<title>${WebContent.PageTitle}</title>`);
};

// Subscribe to state changes
Main.subscribe(render);

// Initialize
const init = () => {
    // Inject fonts
    if (WebElements.StoredFontFamily) {
        const fontStyle = document.createElement('style');
        fontStyle.textContent = WebElements.StoredFontFamily;
        document.head.appendChild(fontStyle);
    }
    
    Main.set({});
};

// Start when DOM is ready
if (document.readyState === 'complete') {
    init();
} else {
    document.addEventListener('DOMContentLoaded', init);
}
```

## 🎨 Advanced Features

### State Management

```javascript
const state = Mint.createState({
    count: 0,
    user: { name: 'John' }
});

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
    TextColorPrimary: '#080707',
    HighlightPrimary: '#ffe9e9'
};

const darkTheme = {
    ColorPrimary: '#000000',
    TextColorPrimary: '#FFD9D9',
    HighlightPrimary: '#413c3c'
};

// Theme automatically switches based on system preference
WebContent.initThemeSystem();
```

### MintAssembly Programming

MintAssembly is an HTML-based programming language that emulates Assembly

```html
<Entry>
    <set name="number1" value="200"></set>
    <set name="number2" value="400"></set>
    <show text="number1"></show>
    <show text="number2"></show>
    <if cond="number1 == number2">
        <show text="equal"></show>
    </if>
    <else>
        <show text="not equal"></show>
    </else>
</Entry>
```

Call `Mint.MintAssembly()` after rendering the Entry block to execute.

### Component System

```javascript
const Component = {
    render(props) {
        return `
            <div class="component">
                <h2>${props.title}</h2>
                <p>${props.content}</p>
            </div>
        `;
    },
    
    styles() {
        return `
            .component {
                padding: ${WebElements.spacing[4]};
                border: 1px solid #ccc;
                border-radius: ${WebElements.borderRadius.DEFAULT};
            }
        `;
    }
};
```

## 🔧 Development Tools

### Live Reload Server

Run the development server for hot reloading:

```bash
# Navigate to mintkit directory
cd mintkit

# Start live server
./LiveServer.exe
# or
node live-reload.js
```

Then open `http://localhost:3000` in your browser.

### Electron Desktop App

For desktop applications:

```bash
cd mintkit-electron
npm install
npm start
```

## 📱 Responsive Design

Use the built-in breakpoint system:

```css
.introduce {
    padding: ${WebElements.spacing[4]};
}

@media (max-width: ${WebElements.breakpoints.md}) {
    .introduce {
        padding: ${WebElements.spacing[2]};
    }
}
```

## 🎯 Best Practices

1. **Component Organization**: Keep components modular and reusable
2. **State Management**: Use the reactive state system for dynamic content
3. **Styling**: Leverage the design system for consistency
4. **Performance**: Use the virtual DOM for efficient updates
5. **Development**: Use live reload for faster development cycles

## 🌟 Contributing

We welcome contributions to Mintkit! Here's how you can help:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details.

## 🔗 Links

- **GitHub**: https://github.com/Peakk2011/Mintkit
- **CDN**: https://cdn.jsdelivr.net/gh/Peakk2011/Mint_NextgenJS@main/lib/MintUtils.js
- **Documentation**: This file and README.md

---

**Mintkit** - Making web development dynamic and enjoyable! 🚀