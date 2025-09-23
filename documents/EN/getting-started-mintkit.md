---
title: Getting Started with Mintkit Made Easy
description: A beginner's guide to using the Mintkit Framework for quickly building websites with HTML and JavaScript.
---

<p align="center">
  <img src="https://camo.githubusercontent.com/4e08b18747738940c2c4c16d9e975e06098133a8c012f6176cbf22c713962d44/68747470733a2f2f64726976652e676f6f676c652e636f6d2f75633f69643d31746341455633634b6d693259434d4868417657334b6c58493662777163397579" height="150px" width="150px" alt="Mintkit Logo" />
</p>

<h1 align="center">Mintkit Getting Started</h1>

## Getting Started with Mintkit

### 1. Create a Basic HTML Page

```html
<!-- index.html -->

<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Hello Mintkit</title>

    <link rel="dns-prefetch" href="//mint-teams.web.app" />
    <link rel="preconnect" href="https://mint-teams.web.app" crossorigin />
    <link
      rel="modulepreload"
      href="https://mint-teams.web.app/Mintkit/mint.js"
    />
  </head>
  <body>
    <div id="app"></div>

    <script type="module">
      import { Mint } from "https://mint-teams.web.app/Mintkit/mint.js";

      const app = `
                <h1>Hello, Mintkit!</h1>
            `;

      queueMicrotask(() => Mint.injectHTML("#app", app));
    </script>
  </body>
</html>
```

---

### 2. Add Content in Separate Files

Create a file **`content.js`** to write your HTML and CSS separately.

```js
// content.js

export const Content = {
  components: `
    <!-- Write your HTML here -->
    <button>Hello Mintkit</button>
  `,
  stylesheet: `
    /* Write your CSS here */
    button {
      padding: 1rem 2rem;
      background-color: #34d399;
      color: white;
      border: none;
      border-radius: 8px;
      cursor: pointer;
    }
  `,
};
```

Go back to **`index.html`** and modify the script to load content from `content.js` as follows:

```html
<script type="module">
  import { Mint } from "https://mint-teams.web.app/Mintkit/mint.js";
  import { Content } from "./content.js";

  const App = () => {
    const root = {
      html: Content.components,
      css: Content.stylesheet,
    };

    queueMicrotask(() => {
      Mint.injectHTML("#app", root.html);
    });
  };

  App();
</script>
```

---

### 3. Use Mintkit’s CSS

You can include Mintkit's design system CSS with this command:

```js
Mint.include("./redistributables/design/mint-uas.css");
```

---

## Additional Features (Optional)

### State Management

```js
const state = Mint.createState({ count: 0 });

// Update State
state.set((s) => ({ ...s, count: s.count + 1 }));

// Subscribe to State changes
state.subscribe((newState) => {
  console.log("Updated:", newState);
});
```

---

### Theme System

```js
const lightTheme = {
  ColorPrimary: "#FFFFFF",
  TextColorPrimary: "#080707",
};

const darkTheme = {
  ColorPrimary: "#000000",
  TextColorPrimary: "#FFD9D9",
};

// Initialize Theme System
WebContent.initThemeSystem();
```

---

## Development Tools

### Launch Live Reload Server

```bash
cd mintkit
./LiveServer.exe
# Then open at http://localhost:3000
```

---

## Mintkit Project Structure (Basic)

```
Mintkit.js Framework/
├── src/
│   ├── lib/               # Mintkit Core Files
│   ├── Content.js         # Your HTML and CSS
│   ├── App.js             # Main App Logic
│   ├── EventHandle.js     # Event Handling
│   ├── index.html         # Entry point
│   └── LiveServer.exe     # Live reload server
├── live-reload.js         # Hook for live reload
├── package.json           # Project configuration
├── README.html            # Documentation
└── sw.js                  # Service worker
```

---

## Create a Project with One Command

```bash
npx create-mint-app
```
