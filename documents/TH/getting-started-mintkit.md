<p align="center">
  <img src="https://camo.githubusercontent.com/4e08b18747738940c2c4c16d9e975e06098133a8c012f6176cbf22c713962d44/68747470733a2f2f64726976652e676f6f676c652e636f6d2f75633f69643d31746341455633634b6d693259434d4868417657334b6c58493662777163397579" height="150px" width="150px" alt="Mintkit Logo" />
</p>

<h1 align="center">เริ่มต้นใช้งานด้วย Mintkit</h1>

## เริ่มต้นใช้งานด้วย Mintkit

### 1. ติดตั้ง Mintkit ด้วยคำสั่ง

ถ้าเริ่มใช้งาน ก่อนหน้าให้ติดตั้ง **Node.js** และ **npm** ได้ที่นี้
สำหรับการใช้ Mintkit ด้วยคำสั่งดังนี้
[Download Node.js](https://nodejs.org/en/download)

```bash
npx create-mint-app@latest # เมื่อรันคำสั่งนี้แล้ว จะมีการถามทั้งภาษาเช่น Javascript และเครืองมืออื่นๆเช่น Vite
```

เมื่อคุณติดตั้ง Mintkit แล้ว จะมีโคตงสร้าง Folder ดังนี้

```markdown
Project Root/
src/
    ├── app.css          # ไฟล์ CSS
    └── app.js           # ไฟล์หลัก .JS
├── index.html           # หน้าเพจ HTML
├── package.json         # Module ของ Project
```

ตอนนี้หากคุณติดตั้ง Mintkit ด้วยคำสั่ง CLI แล้วตอนนี้ และต้องการวิธีอื่นในการติดตั้งมากกว่าและ Custom มากกว่า ให้ใช้ขั้นตอนนี้ คือการ CDN

### 2. ติดตั้ง Mintkit ผ่าน CDN

ติดตั้งผ่าน CDN คุณต้องสร้างไฟล์เองและตั้งค่าเอง

#### 1. เปิด text editer ของคุณและสร้างไฟล์ `index.html`

และเขียนโค้ดดังนี้

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

เมื่อคุณสร้างไฟล์และคัดลอกโค้ดนี้ไว้เรียบร้อยแล้ว ให้คุณสร้าง Folder ที่ชื่อ src และสร้างไฟล์ app.js

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
ในนี้จะเป็นการเริ่มต้นในการสร้าง Project เมื่อคุณต้องการแยกส่วนเป็น Components อื่นๆ คุณสามารถสร้างอีกไฟล์นึง และให้ไฟล์หลักเช่น src/app.js ในการ import มา แต่ต้องแน่ใจว่าไฟล์ Components ของคุณได้ Export มาแล้ว คุณสามารถเก็บ HTML หรือ CSS ได้ หากจะใช้ CSS ใช้ method Mint.injectCSS() โดยใน parameter นี้ให้เข้าถึง CSS ด้วยไฟล์ Content ของคุณ เก็บด้วย Template literal และตำแหน่งในการใส่เหมือนกับตัวอย่างที่แล้ว ที่เก็บไว้ใน Method Mint.init