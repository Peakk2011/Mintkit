import { WebElements } from './units.js';
import { Design } from './units.js';

export function design() {
    return new Proxy(Design, {
        get(target, prop) {
            if (prop in target) return target[prop];
            throw new ReferenceError(`Design config '${prop}' does not exist`);
        }
    });
}

export const WebConfig = {
    cssReset: `
        *,
        *::before,
        *::after {
            box-sizing: ${design().layout.boxSizing};
            -webkit-font-smoothing: ${design().designConfig.fontSmoothingWebkit};
            -moz-osx-font-smoothing: ${design().designConfig.fontSmoothingMoz};
            text-rendering: ${design().designConfig.textRendering};
            font-smooth: ${design().designConfig.fontSmooth};
        }

        * {
            margin: 0${design().units.absolute.px};
            padding: 0${design().units.absolute.px};
        }

        html {
            -webkit-text-size-adjust: ${design().designConfig.textSizeAdjust};
            -moz-tab-size: ${design().designConfig.tabSize};
            tab-size: ${design().designConfig.tabSize};
        }

        body {
            font-family: ${design().designConfig.fontFamily};
            line-height: ${design().designConfig.lineHeight};
            -webkit-font-smoothing: ${design().designConfig.fontSmoothingWebkit};
            -moz-osx-font-smoothing: ${design().designConfig.fontSmoothingMoz};
            text-rendering: ${design().designConfig.textRendering};
            font-smooth: ${design().designConfig.fontSmooth};
            -webkit-font-feature-settings: ${design().designConfig.fontFeatureSettingsWebkit};
            -moz-font-feature-settings: ${design().designConfig.fontFeatureSettingsMoz};
            -o-font-feature-settings: ${design().designConfig.fontFeatureSettingsO};
            font-feature-settings: ${design().designConfig.fontFeatureSettings};
            font-kerning: ${design().designConfig.fontKerning};
        }

        img,
        picture,
        video,
        canvas,
        svg {
            display: ${design().designConfig.displayBlock};
            max-width: ${design().designConfig.maxWidth};
            height: ${design().designConfig.heightAuto};
        }

        input,
        button,
        textarea,
        select {
            font: ${design().designConfig.fontInherit};
            color: ${design().designConfig.colorInherit};
        }

        button {
            border: ${design().designConfig.borderNone};
            background: ${design().designConfig.backgroundNone};
            cursor: ${design().designConfig.cursorPointer};
        }

        ul,
        ol {
            list-style: ${design().designConfig.listStyleNone};
        }

        a {
            color: ${design().designConfig.colorInherit};
            text-decoration: ${design().designConfig.textDecorationNone};
        }

        table {
            border-collapse: ${design().designConfig.borderCollapse};
            border-spacing: ${design().designConfig.borderSpacing};
        }

        h1 { font-size: ${design().spacing[16]}; font-weight: ${design().typography.weights.extrabold};  }
        h2 { font-size: ${design().spacing[12]}; font-weight: ${design().typography.weights.bold};       }
        h3 { font-size: ${design().spacing[10]}; font-weight: ${design().typography.weights.semibold};   }
        h4 { font-size: ${design().spacing[8]};  font-weight: ${design().typography.weights.medium};     }
        h5 { font-size: ${design().spacing[6]};  font-weight: ${design().typography.weights.medium};     }
        h6 { font-size: ${design().spacing[4]};  font-weight: ${design().typography.weights.normal};     }

        h1, h2, h3, h4, h5, h6 {
            line-height: ${design().designConfig.headingLineHeight};
            font-kerning: ${design().designConfig.fontKerning};
            font-feature-settings: ${design().designConfig.fontFeatureSettings};
        }

        fieldset {
            border: ${design().designConfig.borderNone};
        }

        blockquote,
        q {
            quotes: ${design().designConfig.quotesNone};
        }

        blockquote::before,
        blockquote::after,
        q::before,
        q::after {
            content: ${design().designConfig.contentNone};
        }

        :focus-visible {
            outline: ${design().designConfig.outlineFocus};
            outline-offset: ${design().designConfig.outlineOffset};
        }

        :focus:not(:focus-visible) {
            outline: ${design().designConfig.outlineNone};
        }

        @media ${design().mediaQueries.reducedMotion} {
            *,
            *::before,
            *::after {
                animation-duration: ${design().designConfig.animationDurationReduce};
                animation-iteration-count: ${design().designConfig.animationIterationCountReduce};
                transition-duration: ${design().designConfig.transitionDurationReduce};
                scroll-behavior: ${design().designConfig.scrollBehaviorAuto};
            }
        }

        @media ${design().mediaQueries.darkMode} {
            html {
                color-scheme: ${design().designConfig.colorSchemeDark};
            }
        }

        @media ${design().mediaQueries.contrastHigh} {
            * {
                outline: ${design().designConfig.outlineContrast};
            }
        }

        @media ${design().mediaQueries.reducedMotionNoPreference} {
            html {
                scroll-behavior: ${design().designConfig.scrollBehaviorSmooth};
            }
        }

        @media print {

            *,
            *::before,
            *::after {
                background: ${design().designConfig.backgroundTransparent};
                color: ${design().designConfig.colorBlack};
                box-shadow: ${design().designConfig.boxShadowNone};
                text-shadow: ${design().designConfig.textShadowNone};
            }

            a,
            a:visited {
                text-decoration: ${design().designConfig.textDecorationUnderline};
            }

            abbr[title]::after {
                content: ${design().designConfig.contentAbbrTitle};
            }

            pre,
            blockquote {
                border: ${design().designConfig.borderPrint};
                page-break-inside: ${design().designConfig.pageBreakInsideAvoid};
            }

            thead {
                display: ${design().designConfig.displayTableHeaderGroup};
            }

            tr,
            img {
                page-break-inside: ${design().designConfig.pageBreakInsideAvoid};
            }

            img {
                max-width: ${design().designConfig.maxWidthPrint};
            }

            p,
            h2,
            h3 {
                orphans: ${design().designConfig.orphansPrint};
                widows: ${design().designConfig.widowsPrint};
            }

            h2,
            h3 {
                page-break-after: ${design().designConfig.pageBreakAfterAvoid};
            }
        }
    `
}

Object.keys(WebElements).forEach(key => {
    WebElements[key].cssReset = {
        template: WebConfig.cssReset,
        units: design().units
    };
});