# create-mint-app

CLI tool to quickly create a new Mintkit application.

## Installation

```bash
npx create-mint-app your-app
```

## Usage

```bash
npx create-mint-app <project-name>
```

### Examples

```bash
# Create a new project
npx create-mint-app my-awesome-app

# Create a project with a specific name
npx create-mint-app todo-app
```

## What it creates

This tool creates a complete Mintkit application with the following structure:

```
your-app/
├── index.html          # Main HTML file
├── app.js             # Main application logic
├── Content.js         # Content management
├── CoreFramework.js   # Core framework
├── EventHandle.js     # Event handling
├── live-reload.js     # Live reload functionality
├── sw.js              # Service worker
├── package.json       # Project configuration
├── README.md          # Project documentation
├── lib/               # Framework libraries
│   ├── mint.js
│   ├── HTMLInterpreter.js
│   └── MintUtils.js
├── assets/            # Static assets
│   ├── FavIcons/
│   └── MintLogoPage.svg
├── liveserver/        # Live server executable
└── document/          # Documentation
```

## Getting Started

After creating your project:

```bash
cd your-app
npm start
```

Then open your browser and navigate to the displayed URL.

## Development

To run the live server during development:

```bash
npm run dev
```

## Learn More

- [Mintkit.js Documentation](https://github.com/Peakk2011/Mintkit)
- [Framework Features](./document/README.MD)