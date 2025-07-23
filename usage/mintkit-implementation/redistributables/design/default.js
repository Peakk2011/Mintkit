import { WebElements } from './units.js';
import { Design } from './units.js';

let _cachedDesign = null;
export function design() {
    if (_cachedDesign) return _cachedDesign;
    _cachedDesign = new Proxy(Design, {
        get(target, prop) {
            if (prop in target) return target[prop];
            throw new ReferenceError(`Design config '${prop}' does not exist`);
        }
    });
    return _cachedDesign;
}

const d = design();
const { layout, units, spacing, typography, mediaQueries, designConfig } = d;

export const WebConfig = {
    cssReset: `
        *,
        *::before,
        *::after {
            box-sizing: ${layout.boxSizing};
            -webkit-font-smoothing: ${designConfig.fontSmoothingWebkit};
            -moz-osx-font-smoothing: ${designConfig.fontSmoothingMoz};
            text-rendering: ${designConfig.textRendering};
            font-smooth: ${designConfig.fontSmooth};
        }

        * {
            margin: 0${units.absolute.px};
            padding: 0${units.absolute.px};
        }

        html {
            -webkit-text-size-adjust: ${designConfig.textSizeAdjust};
            -moz-tab-size: ${designConfig.tabSize};
            tab-size: ${designConfig.tabSize};
        }

        body {
            font-family: ${designConfig.fontFamily};
            line-height: ${designConfig.lineHeight};
            -webkit-font-smoothing: ${designConfig.fontSmoothingWebkit};
            -moz-osx-font-smoothing: ${designConfig.fontSmoothingMoz};
            text-rendering: ${designConfig.textRendering};
            font-smooth: ${designConfig.fontSmooth};
            -webkit-font-feature-settings: ${designConfig.fontFeatureSettingsWebkit};
            -moz-font-feature-settings: ${designConfig.fontFeatureSettingsMoz};
            -o-font-feature-settings: ${designConfig.fontFeatureSettingsO};
            font-feature-settings: ${designConfig.fontFeatureSettings};
            font-kerning: ${designConfig.fontKerning};
        }

        img, picture, video, canvas, svg {
            display: ${designConfig.displayBlock};
            max-width: ${designConfig.maxWidth};
            height: ${designConfig.heightAuto};
        }

        input, button, textarea, select {
            font: ${designConfig.fontInherit};
            color: ${designConfig.colorInherit};
        }

        button {
            border: ${designConfig.borderNone};
            background: ${designConfig.backgroundNone};
            cursor: ${designConfig.cursorPointer};
        }

        ul, ol {
            list-style: ${designConfig.listStyleNone};
        }

        a {
            color: ${designConfig.colorInherit};
            text-decoration: ${designConfig.textDecorationNone};
        }

        table {
            border-collapse: ${designConfig.borderCollapse};
            border-spacing: ${designConfig.borderSpacing};
        }

        h1 { font-size: ${spacing[16]}; font-weight: ${typography.weights.extrabold}; }
        h2 { font-size: ${spacing[12]}; font-weight: ${typography.weights.bold}; }
        h3 { font-size: ${spacing[10]}; font-weight: ${typography.weights.semibold}; }
        h4 { font-size: ${spacing[8]};  font-weight: ${typography.weights.medium}; }
        h5 { font-size: ${spacing[6]};  font-weight: ${typography.weights.medium}; }
        h6 { font-size: ${spacing[4]};  font-weight: ${typography.weights.normal}; }

        h1, h2, h3, h4, h5, h6 {
            line-height: ${designConfig.headingLineHeight};
            font-kerning: ${designConfig.fontKerning};
            font-feature-settings: ${designConfig.fontFeatureSettings};
        }

        fieldset {
            border: ${designConfig.borderNone};
        }

        blockquote, q {
            quotes: ${designConfig.quotesNone};
        }

        blockquote::before, blockquote::after, q::before, q::after {
            content: ${designConfig.contentNone};
        }

        :focus-visible {
            outline: ${designConfig.outlineFocus};
            outline-offset: ${designConfig.outlineOffset};
        }

        :focus:not(:focus-visible) {
            outline: ${designConfig.outlineNone};
        }

        @media ${mediaQueries.reducedMotion} {
            *, *::before, *::after {
                animation-duration: ${designConfig.animationDurationReduce};
                animation-iteration-count: ${designConfig.animationIterationCountReduce};
                transition-duration: ${designConfig.transitionDurationReduce};
                scroll-behavior: ${designConfig.scrollBehaviorAuto};
            }
        }

        @media ${mediaQueries.darkMode} {
            html {
                color-scheme: ${designConfig.colorSchemeDark};
            }
        }

        @media ${mediaQueries.contrastHigh} {
            * {
                outline: ${designConfig.outlineContrast};
            }
        }

        @media ${mediaQueries.reducedMotionNoPreference} {
            html {
                scroll-behavior: ${designConfig.scrollBehaviorSmooth};
            }
        }

        @media print {
            *, *::before, *::after {
                background: ${designConfig.backgroundTransparent};
                color: ${designConfig.colorBlack};
                box-shadow: ${designConfig.boxShadowNone};
                text-shadow: ${designConfig.textShadowNone};
            }

            a, a:visited {
                text-decoration: ${designConfig.textDecorationUnderline};
            }

            abbr[title]::after {
                content: ${designConfig.contentAbbrTitle};
            }

            pre, blockquote {
                border: ${designConfig.borderPrint};
                page-break-inside: ${designConfig.pageBreakInsideAvoid};
            }

            thead {
                display: ${designConfig.displayTableHeaderGroup};
            }

            tr, img {
                page-break-inside: ${designConfig.pageBreakInsideAvoid};
            }

            img {
                max-width: ${designConfig.maxWidthPrint};
            }

            p, h2, h3 {
                orphans: ${designConfig.orphansPrint};
                widows: ${designConfig.widowsPrint};
            }

            h2, h3 {
                page-break-after: ${designConfig.pageBreakAfterAvoid};
            }
        }
    `
};

// apply cssReset to WebElements
Object.keys(WebElements).forEach(key => {
    WebElements[key].cssReset = {
        template: WebConfig.cssReset,
        units: units
    };
});
