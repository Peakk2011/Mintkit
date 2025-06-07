import { Mint } from './lib/mint.js';
import { Webfunctions } from './EventHandle.js';
import { WebContent, WebElements } from './Content.js';

const SetHTMLtitle = `
    <title>${WebContent.PageTitle}</title>
`

const MainStylesheet = `
    ${WebContent.StyledElementComponents()};
    body {
        background-color: ${WebContent.CSScolor.ColorPrimary};
    }
`;

const Main = Mint.createState({});

Main.subscribe(state => {
    const html = `
        <div id="el1">
            ${WebContent.ElementComponents()}
            ${WebContent.ElementComponents2()}
        </div>
    `;
    Mint.injectHTML('#app', html);
    Mint.executeMintAssembly?.();
});

const InitialMintkit = () => {
    Mint.injectCSS(WebElements.StoredFontFamily + MainStylesheet);
    Mint.injectTitle(SetHTMLtitle);
    Main.set(s => s);
}

Mint.AdjustHook();
InitialMintkit();
Webfunctions(Main);