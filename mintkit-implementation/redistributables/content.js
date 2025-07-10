import { WebElements } from './design/units.js';
import { WebConfig } from './design/default.js';

export const WebContent = {
    components: `
        <!-- Enter html code here -->
    `,
    stylesheet: `
        /*
            Enter your CSS code here 
            With Mintkit user-agent-stylesheet build-in
        */
        ${WebConfig.cssReset}
    `
}