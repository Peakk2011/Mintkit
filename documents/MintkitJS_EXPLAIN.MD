# Get Started with MintKit

## MintKit Framework that make you<br>Adjust content on<br>Your webpage more dynamic.
**Create Essentials file (`mint.js`) to import function on MintUtils.js.**
**If you want to import as jsdelivr you can import https://cdn.jsdelivr.net/gh/Peakk2011/Mint_NextgenJS@main/lib/MintUtils.js into `mint.js`**

Create file `mint.js` inject to MintUtils.js & Function that needed:

```javascript
import { 
    createState,
    AdjustHook, 
    injectCSS,
    injectHTML,
    injectTitle
} from 'https://cdn.jsdelivr.net/gh/Peakk2011/Mint_NextgenJS@main/lib/MintUtils.js';

import { executeMintAssembly } from './HTMLInterpreter.js';

export const Mint = {
    createState,
    AdjustHook,
    injectCSS,
    injectHTML,
    injectTitle,
    executeMintAssembly
};

#### Running Mintkit.js

Open ./ExecuteMintkit/
Than open command prompt than run ./WebExecute.exe
And goto web browser than type this http:/localhost:3000