// import { createState } from './lib/MintUtils.js';
import { createState } from 'https://cdn.jsdelivr.net/gh/Peakk2011/Mint_NextgenJS@main/lib/MintUtils.js';

// Custom CSS
// Throw string in CSS, no mandatory name, no special binding with injectCSS
const myCSS = `
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: system-ui; background: #f5f7fa; }
  h1 { color: #222; }
  .btn { padding: 10px 20px; background: #007bff; color: white; border-radius: 4px; cursor: pointer; }
  .btn:hover { background: #0056b3; }
`;

function injectCSS(cssString) {
    const styleEl = document.createElement('style');
    styleEl.textContent = cssString;
    document.head.appendChild(styleEl);
    return styleEl;
}

function injectHTML(targetSelector, htmlString) {
    const target = document.querySelector(targetSelector);
    if (!target) throw new Error(`No element matches selector: ${targetSelector}`);
    target.innerHTML = htmlString;
}

// inject CSS first
injectCSS(myCSS);

// Create state & subscribe
const appState = createState({ count: 0 });

// It is “binding the event listener” to the state
// Every time someone .setState(...) it will run the function inside subscribe(...)
appState.subscribe(state => {
    // render HTML after state changes
    const html = `
      <h1>Counter: ${state.count}</h1>
      <button class="btn" id="incBtn">เพิ่ม</button>
      <button class="btn" id="decBtn">ลด</button>
    `;
    injectHTML('#app', html);

    // attach event handlers after HTML is injected
    document.getElementById('incBtn').onclick = () => appState.set(s => ({ count: s.count + 1 }));
    document.getElementById('decBtn').onclick = () => appState.set(s => ({ count: s.count - 1 }));
});

// initial render
appState.set(s => s);
