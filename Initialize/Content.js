// Content.js Example to making content inside this file
// WebElements = Custon user agent stylesheet units 
export const WebElements = {
    // Custom fonts import
    StoredFontFamily: "@import url('https://fonts.googleapis.com/css2?family=Anuphan:wght@100..700&family=Instrument+Sans:ital,wght@0,400..700;1,400..700&family=Inter+Tight:ital,wght@0,100..900;1,100..900&family=JetBrains+Mono:ital,wght@0,100..800;1,100..800&family=Manrope:wght@200..800&family=Merriweather:ital,opsz,wght@0,18..144,300..900;1,18..144,300..900&family=Source+Serif+4:ital,opsz,wght@0,8..60,200..900;1,8..60,200..900&family=Trirong:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap');",
    Typeface: [
        '"Inter Tight", sans-serif;',
        '"Merriweather", serif;',
        '"Trirong", serif;',
        '"Anuphan", sans-serif;',
        '"JetBrains Mono", monospace;',
        '"Manrope", sans-serif;',
        '"Instrument Sans", sans-serif;',
        '"Source Serif 4", serif;'
    ],
    // Fallback to
    DefaultFontFallback: '"Leelawadee UI", "Segoe UI", -apple-system, BlinkMacSystemFont, "Roboto", "Helvetica Neue", sans-serif',
    Units: {
        CSSPosition: ['static', 'relative', 'fixed', 'absolute', 'sticky'],
        CSSSize: {
            AbsoluteLengths: {
                StaticCM: 'cm',
                StaticMM: 'mm',
                StaticIN: 'in',
                StaticPT: 'pt',
                StaticPC: 'pc',
                StaticPX: 'px'
            },
            RelativeLengths: {
                RelativeEM: 'em',
                RelativeREM: 'rem',
                RelativeVW: 'vw',
                RelativeVH: 'vh',
                RelativePERCENT: '%',
                RelativeVMAX: 'vmax',
                RelativeMXCON: 'max-content',
            },
            AUTO: 'auto',
            boxSizing: 'border-box',
        },
    },
    get BorderRadius() {
        return {
            FullyRounded: `100${this.Units.CSSSize.RelativeLengths.RelativeVMAX};`,
            PrimaryRounded: `0.25${this.Units.CSSSize.RelativeLengths.RelativeREM};`,
        };
    },
    get layout() {
        return {
            zIndex: {
                Hidden: '-1',
                Base: '0',
                Dropdown: '1000',
                Modal: '1050',
                Tooltip: '1100'
            },
            Overflow: {
                Hidden: 'hidden',
                Scroll: 'scroll',
                Auto: 'auto'
            },
            MediaQuery: [
                '(min-width: 1280px)',
                '(min-width: 768px)',
                '(min-width: 576px)',
                '(min-width: 380px)',
                '(min-width: 320px)',
            ],
        };
    },
    get Transition() {
        return {
            FastEase: 'cubic-bezier(0.4, 0, 0.2, 1)',
            SmoothEase: 'cubic-bezier(0.19, 1, 0.22, 1)',
        }
    }
}

export const WebContent = {
    // Create cache css
    // Create PageTitle for page title
    _cachedCSS: null,
    PageTitle: 'MintKit',

    HTMLContent: {
        Name: 'MintKit',
        PathFile: './lib/content.js',
        Introduce() {
            return `
                <div class="IntroduceContent">
                    <img src="/assists/MintLogoPage.svg" alt="Mintkit MintLogo MintTeamsLogo">
                    <h1>
                        Hello this is, <strong>${this.Name}</strong> <br>
                        Framework that make you <br>
                        Adjust content on<br>
                        Your webpage more dynamic.
                    </h1>
                    <p>Edit <code>${this.PathFile}</code> to see chenges</p>
                </div>
            `
        },
        MintAssemblySimpleAddition() {
            return `
                <Entry>
                    <mov dst="ax" src="200"></mov>
                    <mov dst="bx" src="ax"></mov>
                    <print var="ax"></print>
                    <print var="bx"></print>
                </Entry>
            `;
        }
    },

    StaticCSSvalues: {
        // Put CSS Element here
        // Position Preset Layout
        CenterPositions: {
            CALL: `${WebElements.Units.CSSPosition[3]}`,
            PositionY: `
                top: 50%;
                transform: translateY(-50%);
            `,
            PositionX: `
                left: 50%;
                transform: translateX(-50%);
            `,
            get CALLPosition() {
                return `
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                `;
            }
        },
        // Interface preset example
        get KeyframeIntroduceAnim() {
            const animationName = 'IntroduceAnimation'; 
            return `
            @keyframes ${animationName} {
                0% {
                    opacity: 0;
                }
                100% {
                    opacity: 1;
                }
            }
        `
        },
        IntroduceAnimationName: 'IntroduceAnimation',
    },

    // Reset default CSS preset styling
    Normalize: {
        CALL: `${WebElements.Units.CSSSize.boxSizing};`,
        Unset: `
            margin: 0;
            padding: 0;
        `,
        get CALLReset() {
            return `
                ${WebElements.Units.CSSSize.boxSizing};
                margin: 0;
                padding: 0;
            `;
        }
    },

    // Force rendering
    TextRendering: {
        ForceGrayStyleRendering: `
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
            font-smooth: never;
            text-rendering: geometricPrecision;
            -webkit-text-size-adjust: none;
            -moz-text-size-adjust: none;
            text-size-adjust: none;
            font-feature-settings: "kern" 1;
            font-synthesis: none;
        `,
        SpecificTargetingRendering: `
            html, body, h1, h2, h3, h4, h5, h6, p, span, div, a, button, input, textarea, label {
                -webkit-font-smoothing: antialiased;
                -moz-osx-font-smoothing: grayscale;
                font-smooth: never;
                text-rendering: geometricPrecision;
            }

            input, textarea, button, select {
                -webkit-font-smoothing: antialiased;
                -moz-osx-font-smoothing: grayscale;
                font-smooth: never;
            }
        `,
    },

    // Colors
    CSScolor: {
        ColorPrimary: '#0D0D0D;',
        TextColorPrimaryDisplay: '#f9e3e7;',
        TextColorPrimaryText: '#b8a8ab;',
        HighlightPrimary: '#413c3c',
    },

    // CALL into app.js
    ElementComponents() {
        return `
            ${this.HTMLContent.Introduce()}
        `;
    },

    ElementComponents2() {
        return `
            ${ /* Simple Addition values using MintAssembly */''}
            ${this.HTMLContent.MintAssemblySimpleAddition()}
        `;
    },

    // CSS Styling
    StyledElementComponents() {
        if (this._cachedCSS) return this._cachedCSS;
        const DefaultFontsfallback = WebElements.DefaultFontFallback;
        const GlobalCSS = `
            * {
                ${WebElements.layout.Normalize};
                ${this.TextRendering.ForceGrayStyleRendering};
            }

            body {
                font-family: ${DefaultFontsfallback};
                background-color: ${this.CSScolor.ColorPrimary};
            }

            .IntroduceContent {
                ${this.StaticCSSvalues.CenterPositions.CALLPosition};
                position: ${this.StaticCSSvalues.CenterPositions.CALL};
                max-width: ${WebElements.Units.CSSSize.RelativeLengths.RelativeMXCON};
                min-width: ${WebElements.Units.CSSSize.RelativeLengths.RelativeMXCON};
                animation: ${this.StaticCSSvalues.IntroduceAnimationName} ${WebElements.Transition.SmoothEase} 1200ms;
            }

            .IntroduceContent img {
                height: ${WebElements.Units.CSSSize.AUTO};
                width: 60${WebElements.Units.CSSSize.AbsoluteLengths.StaticPX};
                margin-top: 1.5${WebElements.Units.CSSSize.RelativeLengths.RelativeREM};
            }

            ${this.StaticCSSvalues.KeyframeIntroduceAnim}

            .IntroduceContent p {
                color: ${this.CSScolor.TextColorPrimaryText};
                font-family: ${WebElements.Typeface[4]};
                margin-top: 1.75${WebElements.Units.CSSSize.RelativeLengths.RelativeREM};
            } 

            .IntroduceContent p code {
                padding: 0.45${WebElements.Units.CSSSize.RelativeLengths.RelativeREM} 0.6${WebElements.Units.CSSSize.RelativeLengths.RelativeREM};
                background-color: ${this.CSScolor.HighlightPrimary};
                border-radius: ${WebElements.BorderRadius.PrimaryRounded};
            }

            .IntroduceContent h1 {
                color: ${this.CSScolor.TextColorPrimaryDisplay};
                line-height: 1.55;
                font-family: ${WebElements.Typeface[0]};
                font-weight: 500;
                font-size: 30${WebElements.Units.CSSSize.AbsoluteLengths.StaticPX};
            }

            .IntroduceContent h1 strong {
                padding: 0.2${WebElements.Units.CSSSize.RelativeLengths.RelativeREM} 1.25${WebElements.Units.CSSSize.RelativeLengths.RelativeREM};
                background-color: ${this.CSScolor.HighlightPrimary};
                border-radius: ${WebElements.BorderRadius.FullyRounded};
                font-family: ${WebElements.Typeface[4]};
                font-weight: 650;
            }

            ${this.TextRendering.SpecificTargetingRendering}; // Apply specific text rendering
            ${this.StaticCSSvalues.KeyframeIntroduceAnim}; // Include the keyframes definition
        `;
        this._cachedCSS = GlobalCSS;
        return GlobalCSS;
    }

}