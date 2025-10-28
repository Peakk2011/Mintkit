<p align="center">
  <img src="https://camo.githubusercontent.com/4e08b18747738940c2c4c16d9e975e06098133a8c012f6176cbf22c713962d44/68747470733a2f2f64726976652e676f6f676c652e636f6d2f75633f69643d31746341455633634b6d693259434d4868417657334b6c58493662777163397579" height="150px" width="150px" alt="Mintkit Logo" />
</p>

<h1 align="center">Mintkit Getting Started</h1>

## Getting Started with Mintkit

### 1. Install Mintkit to your computer

To process and install Mintkit
you need to install **Node.js** and **npm** here
[Download Node.js](https://nodejs.org/en/download)

```bash
npx create-mint-app@latest # Install Mintkit it will be ask question to your requirement
```

This is Mintkit structure when you install via cli without any option

```markdown
Project Root/
src/
	├── app.css        # CSS File
    └── app.js         # Main App Logic
├── index.html         # HTML Page
├── package.json       # Project Dependencies
```

Now installing with CLI works fine and Mintkit in CLI still imports code with URL, the next method is easier.

### 2. Install Mintkit via CDN

Install with CDN, you can customize it yourself and set the files yourself.

#### 1. Open your text editer and create `index.html`

And write code like this

```html
<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />

	<!-- SEO -->
    <meta name="description"
        content="Mintkit is a web framework designed to deliver efficient, scalable, and maintainable web development experiences.">
    <meta name="keywords" content="Mintkit, JavaScript, framework, web development">

	<!-- Main script logic -->
    <script type="module" src="./src/app.js"></script>
</head>

<body>
	<!--
		This is a entry point
		Where Mintkit will create content here 
	-->
    <div id="app"></div>
</body>

</html> 
```

Once you have created the index.html file and copied the contents as follows, create a `src` folder and create an `app.js` file.

```js
// src/app.js
// Import Mintkit
import { Mint } from "https://mint-teams.web.app/Mintkit/mint.js";
const rootPath = '#app';

const App = () => {
	const root = {
		// HTML File
		html: `
			<!-- Your HTML Content -->
			<h1>
                Hello, Mintkit!
            </h1>
		`
	};

	Mint.init(() => {
		Mint.injectHTML(rootPath, root.html)
	});
};

App();

```

This is where you start building this project. When you want to split it into different components, you can create another file and have the main file like src/app.js import it, but make sure your Components file is exported. You can store HTML or CSS. If you want to use CSS, use the Mint.injectCSS() method. In this parameter, access the CSS with your Content file, store it with a Template literal, and the insertion location is the same as the previous example, stored in the Mint.init method.
