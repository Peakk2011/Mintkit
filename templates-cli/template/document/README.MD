# Mintkit Framework

## Editing your project
Have many of custom way and more structure to build Mintkit project here by using node module by editing this file run this follow command
```bash
    # Running live server example
    ./LiveServer.exe
    # Server going to open your default browser with Mintkit build-in installed
```
Edit `./content.js` and `./app.js` about pages
Edit `lib/MintUtils.js` about Mintkit framework core
Edit `lib/HTMLInterpreter.js` about MintAssembly (Mintkit build-in plugins)

## Mintkit live server
### Usage

### Starting the Server
*For windows only* if want to using your os instend of windows you can using this command
```bash
# Chenge dir into liveserver folder
cd liveserver
# Linux
g++ -std=c++20 -O2 LiveServer.cpp -o LiveServer -lpthread
# macOS
g++ -std=c++20 -O2 LiveServer.cpp -o LiveServer
```

#### Execute this live server

```bash
# Default port as (3000)
./LiveServer.exe

# Custom port
./LiveServer.exe 8080
```

### Server Information Display

The server now shows simplified information:

```
Server Ready
Local: http://localhost:3000
Network: http://192.168.1.40:8008
Watching: HTML, CSS, JS, JSON, TS, TSX, JSX
Memory pool initialized: 100 slots
GET /
index.html (300 bytes, 0.530 ms)
```