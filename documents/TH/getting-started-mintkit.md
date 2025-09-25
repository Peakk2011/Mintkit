---
title: เริ่มต้นใช้งาน Mintkit แบบง่าย ๆ
description: คู่มือเริ่มต้นใช้งาน Mintkit Framework สำหรับสร้างเว็บไซต์ด้วย HTML และ JavaScript อย่างรวดเร็ว
---

<p align="center">
  <img src="https://camo.githubusercontent.com/4e08b18747738940c2c4c16d9e975e06098133a8c012f6176cbf22c713962d44/68747470733a2f2f64726976652e676f6f676c652e636f6d2f75633f69643d31746341455633634b6d693259434d4868417657334b6c58493662777163397579" height="150px" width="150px" alt="Mintkit Logo" />
</p>

<h1 align="center">Mintkit เริ่มต้นใช้งาน</h1>

## ขั้นตอนเริ่มต้นใช้งาน Mintkit

### 1. สร้างหน้า HTML เบื้องต้น

```html
<!-- index.html -->

<!DOCTYPE html>
<html lang="th">
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

### 2. เพิ่มเนื้อหาแบบแยกไฟล์

สร้างไฟล์ **`content.js`** สำหรับเขียน HTML และ CSS ของคุณแยกต่างหาก

```js
// content.js

export const Content = {
  components: `
    <!-- เขียน HTML ของคุณที่นี่ -->
    <button>สวัสดี Mintkit</button>
  `,
  stylesheet: `
    /* เขียน CSS ของคุณที่นี่ */
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

กลับไปที่ **`index.html`** แล้วแก้ไข script เพื่อโหลดเนื้อหาจาก `content.js` ดังนี้:

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

### 3. ใช้งาน CSS จาก Mintkit

คุณสามารถรวมไฟล์ CSS ของ Mintkit สำหรับระบบดีไซน์ได้โดยใช้คำสั่งนี้:

```js
Mint.include("./redistributables/design/mint-uas.css");
```

---

## ฟีเจอร์เสริม (Optional)

### การจัดการ State

```js
const state = Mint.createState({ count: 0 });

// อัปเดต State
state.set((s) => ({ ...s, count: s.count + 1 }));

// Subscribe เมื่อ State เปลี่ยน
state.subscribe((newState) => {
  console.log("อัปเดตแล้ว:", newState);
});
```

---

### ระบบธีม

```js
const lightTheme = {
  ColorPrimary: "#FFFFFF",
  TextColorPrimary: "#080707",
};

const darkTheme = {
  ColorPrimary: "#000000",
  TextColorPrimary: "#FFD9D9",
};

// เรียกใช้ระบบธีม
WebContent.initThemeSystem();
```

---

## Development Tools

### เปิด Live Reload Server

```bash
cd mintkit
./LiveServer.exe
# แล้วเปิดที่ http://localhost:3000
```

---

## โครงสร้างโปรเจกต์ Mintkit (เบื้องต้น)

```
Mintkit.js Framework/
├── src/
│   ├── lib/               # ไฟล์หลักของ Mintkit
│   ├── Content.js         # HTML และ CSS ของคุณ
│   ├── App.js             # แกนหลักของแอป
│   ├── EventHandle.js     # จัดการอีเวนต์
│   ├── index.html         # จุดเริ่มต้น
│   └── LiveServer.exe     # Live reload server
├── live-reload.js         # Hook สำหรับ live reload
├── package.json           # คอนฟิกโปรเจกต์
├── README.html            # เอกสาร
└── sw.js                  # Service worker
```

---

## สร้างโปรเจกต์ด้วยคำสั่งเดียว

```bash
npx create-mint-app
```