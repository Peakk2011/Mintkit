import { Mint } from './lib/mint.js';
import { Webfunctions } from './EventHandle.js';
import { WebContent, WebElements } from './Content.js';

const SetHTMLtitle = `
    <title>${WebContent.PageTitle}</title>
`
 
const MainStylesheet = `
    ${WebContent.StyledElementComponents?.() || ''}
    body {
        background-color: ${WebContent.CSScolor.ColorPrimary};
    }
`;

const Main = Mint.createState({});

Main.subscribe(state => {
    Mint.PerformanceTracking({
        // mainDescription = Hook rendering
        mainDescription: "Main.subscribe rendering",
        genHTML: () => {
            return `
                <div id="el1">
                    ${WebContent.ElementComponents()}
                    ${WebContent.ElementComponents2()}
                </div>
            `;
        },
        injectHTML: (htmlString) => {
            Mint.injectHTML('#app', htmlString);
        },
        runMintAssembly: () => {
            // Accept mintAssembly installation
            // Inject mintAssembly to ${WebContent.ElementComponents2()}
            if (Mint && Mint.executeMintAssembly) {
                const MintAssembly = Mint.executeMintAssembly();
                if (MintAssembly && typeof MintAssembly.RUN === 'function') {
                    MintAssembly.RUN();
                }
            }
        }
    });
});

const InitialMintkit = () => {
    Mint.injectCSS(WebElements.StoredFontFamily + MainStylesheet);
    Mint.injectTitle(SetHTMLtitle);
    Main.set(s => s);
}

Mint.AdjustHook();
InitialMintkit();
Webfunctions(Main);
