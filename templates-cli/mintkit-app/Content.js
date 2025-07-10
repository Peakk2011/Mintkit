export const WebElements = {
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
        weights: { // Added
            light: '300',
            normal: '400',
            medium: '500',
            semibold: '600',
            bold: '700',
            extrabold: '800'
        },
    },
    DirectThemes: [
        '(prefers-color-scheme: dark)',
        '(prefers-color-scheme: light)'
    ],
    get BorderRadius() {
        return {}; 
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
        return {};
    },
    spacing: {
        0: '0',
        px: '1px',
        0.5: '0.125rem',  // 2px
        1: '0.25rem',     // 4px
        1.5: '0.375rem',  // 6px
        2: '0.5rem',      // 8px
        2.5: '0.625rem',  // 10px
        3: '0.75rem',     // 12px
        3.5: '0.875rem',  // 14px
        4: '1rem',        // 16px
        5: '1.25rem',     // 20px
        6: '1.5rem',      // 24px
        7: '1.75rem',     // 28px
        8: '2rem',        // 32px
        10: '2.5rem',     // 40px
        12: '3rem',       // 48px
        16: '4rem',       // 64px
        20: '5rem',       // 80px
        24: '6rem',       // 96px
        32: '8rem',       // 128px
    },
    borderRadius: { 
        none: '0',
        sm: '0.125rem',          // 2px
        DEFAULT: '0.25rem',      // 4px
        md: '0.375rem',          // 6px
        lg: '0.5rem',            // 8px
        xl: '0.75rem',           // 12px
        '2xl': '1rem',           // 16px
        '3xl': '1.5rem',         // 24px
        full: '100vmax'
    },
    shadows: {
        sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
        DEFAULT: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
        md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
        lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
        xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
        '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
        inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
        none: 'none'
    },
    transitions: { 
        none: 'none',
        all: 'all 150ms cubic-bezier(0.4, 0, 0.2, 1)',
        DEFAULT: 'color, background-color, border-color, text-decoration-color, fill, stroke, opacity, box-shadow, transform, filter, backdrop-filter 150ms cubic-bezier(0.4, 0, 0.2, 1)',
        colors: 'color, background-color, border-color, text-decoration-color, fill, stroke 150ms cubic-bezier(0.4, 0, 0.2, 1)',
        opacity: 'opacity 150ms cubic-bezier(0.4, 0, 0.2, 1)',
        shadow: 'box-shadow 150ms cubic-bezier(0.4, 0, 0.2, 1)',
        transform: 'transform 150ms cubic-bezier(0.4, 0, 0.2, 1)',
    },
    easings: { 
        linear: 'linear',
        in: 'cubic-bezier(0.4, 0, 1, 1)',
        out: 'cubic-bezier(0, 0, 0.2, 1)',
        'in-out': 'cubic-bezier(0.4, 0, 0.2, 1)',
        bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        smooth: 'cubic-bezier(0.19, 1, 0.22, 1)', 
    },
    breakpoints: { 
        mb: '411px',
        sm: '450px',
        md: '768px',
        lg: '1024px',
        xl: '1280px',
        '2xl': '1536px'
    }
}

const lightThemeColors = {
    ColorPrimary: '#FFFFFF;',
    TextColorPrimaryDisplay: '#080707;',
    TextColorPrimaryText: '#333333;',
    HighlightPrimary: '#ffe9e9;',
};

const darkThemeColors = {
    ColorPrimary: '#000000;',
    TextColorPrimaryDisplay: '#FFD9D9;',
    TextColorPrimaryText: '#d0bec1;',
    HighlightPrimary: '#413c3c;',
};

export const WebContent = {
    _cachedCSS: null,
    PageTitle: 'MintKit',
    CSScolor: {},
    _themeChangeCallback: null,

    setThemeChangeCallback(callback) {
        this._themeChangeCallback = callback;
    },

    _updateCurrentColors(isDarkMode) {
        const themeToApply = isDarkMode ? darkThemeColors : lightThemeColors;
        Object.keys(themeToApply).forEach(key => {
            this.CSScolor[key] = themeToApply[key];
        });
        this._cachedCSS = null;
    },

    initThemeSystem() {
        if (typeof window !== 'undefined' && window.matchMedia) {
            const darkModeMatcher = window.matchMedia('(prefers-color-scheme: dark)');
            const applyTheme = (isDark) => {
                this._updateCurrentColors(isDark);
                if (typeof this._themeChangeCallback === 'function') this._themeChangeCallback();
            };
            applyTheme(darkModeMatcher.matches);
            darkModeMatcher.addEventListener('change', e => applyTheme(e.matches));
        } else {
            this._updateCurrentColors(true);
        }
    },

    HTMLContent: {
        Name: 'MintKit',
        PathFile: './content.js',
        Introduce(name, pathFile) {
            const displayName = name || this.Name;            // parameter this.Name into default
            const displayPath = pathFile || this.PathFile;    // parameter this.PathFile into default
            return `
                <div class="IntroduceContent">
                    <img src="/assets/MintLogoPage.svg" alt="Mintkit MintLogo MintTeamsLogo">
                    <h1>
                        This is, <strong>${this.Name}</strong> <br>
                        Framework that make you <br>
                        Adjust content your<br>
                        Webpage more dynamic.
                    </h1>
                    <p>Edit <code>${displayPath}</code> to see chenges</p>
                </div>
            `
        },
        // parameters values for MintAssembly
        MintAssemblySimpleAddition(variableAX = 200, variableBX = 'ax') {
            return `
                <Entry>
                    <mov dst="ax" src="${variableAX}"></mov>
                    <mov dst="bx" src="${variableBX}"></mov>
                    <print var="ax"></print>
                    <print var="bx"></print>
                </Entry>
            `;
        }
    },

    StaticCSSvalues: {
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
            },
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

    // Reset ค่าเรื่มต้นเป็น CSS preset styling
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

    // Force สำหรับการ rendering ข้อความในเเว็บ
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

    StyledElementComponents() {
        if (this._cachedCSS) return this._cachedCSS;

        const {
            DefaultFontFallback,
            Typeface,
            Units,
            spacing,
            borderRadius,
            easings,
            breakpoints,
        } = WebElements;
        const { weights } = Units;

        // Hoist properties
        const normalizeCallReset = this.Normalize.CALLReset;
        const textRenderForce = this.TextRendering.ForceGrayStyleRendering;
        const textRenderSpecific = this.TextRendering.SpecificTargetingRendering;
        const keyframeIntroduceAnim = this.StaticCSSvalues.KeyframeIntroduceAnim;
        const introduceAnimationName = this.StaticCSSvalues.IntroduceAnimationName;
        const centerPosCall = this.StaticCSSvalues.CenterPositions.CALL;
        const centerPosCallPosition = this.StaticCSSvalues.CenterPositions.CALLPosition;

        const colorPrimary = this.CSScolor.ColorPrimary || '#000000';
        const textColorPrimaryDisplay = this.CSScolor.TextColorPrimaryDisplay;
        const textColorPrimaryText = this.CSScolor.TextColorPrimaryText;
        const highlightPrimary = this.CSScolor.HighlightPrimary;

        const GlobalCSS = `
            * {
                ${normalizeCallReset};
                ${textRenderForce};
            }

            body {
                font-family: ${DefaultFontFallback};
                background-color: ${colorPrimary};
            }

            .IntroduceContent {
                ${centerPosCallPosition};
                position: ${centerPosCall};
                max-width: 100${WebElements.Units.CSSSize.RelativeLengths.RelativePERCENT};
                min-width: max-content;
                padding: 0 ${spacing[4]}; 
                animation: ${introduceAnimationName} ${easings.smooth} 1200ms;
                transition: 500ms ${WebElements.easings.bounce};
            }

            .IntroduceContent img {
                height: ${WebElements.Units.CSSSize.AUTO};
                width: 60${WebElements.Units.CSSSize.AbsoluteLengths.StaticPX};
                margin-bottom: ${spacing[6]};              /* 1.5rem */
            }

            ${keyframeIntroduceAnim}

            .IntroduceContent p {
                color: ${textColorPrimaryText};
                font-family: ${Typeface[4]};
                margin-top: ${spacing[7]};                 /* 1.75rem */
            } 

            .IntroduceContent p code {
                padding: ${spacing[2]} ${spacing[2.5]};    /* 0.5rem 0.625rem */
                background-color: ${highlightPrimary};
                border-radius: ${borderRadius.DEFAULT};    /* 0.25rem */
            }

            .IntroduceContent h1 {
                color: ${textColorPrimaryDisplay};
                line-height: 1.55;
                font-family: ${Typeface[0]};
                font-weight: ${weights.medium}; 
                font-size: 32${Units.CSSSize.AbsoluteLengths.StaticPX}; 
                transition: 400ms ${WebElements.easings.smooth};
            }

            .IntroduceContent h1 strong {
                padding: ${spacing[1]} ${spacing[5]}; 
                background-color: ${highlightPrimary};
                border-radius: ${borderRadius.full}; 
                font-family: ${Typeface[4]};
                font-weight: ${weights.semibold}; 
            }            

            /* Responsive adjustments */
            @media (max-width: ${breakpoints.mb}), (max-width: ${breakpoints.sm}) {
                .IntroduceContent {
                    transform: translate(-50%, -50%) scale(0.85);
                }
            }

            @media (max-width: ${breakpoints.md}) {
                .IntroduceContent {
                    max-width: ${Units.CSSSize.RelativeLengths.RelativeMXCON}; 
                    min-width: ${Units.CSSSize.RelativeLengths.RelativeMXCON}; 
                    padding: 0;
                }
                .IntroduceContent h1 {
                    font-size: 28${Units.CSSSize.AbsoluteLengths.StaticPX};
                }
            }

            @media (min-width: ${breakpoints.lg}) {
                .IntroduceContent h1 {
                    font-size: 30${Units.CSSSize.AbsoluteLengths.StaticPX};
                }
            }

            @media (min-width: ${breakpoints.xl}) {
                .IntroduceContent h1 {
                    font-size: 32${Units.CSSSize.AbsoluteLengths.StaticPX};
                }
            }
            
            @media ${WebElements.DirectThemes[1]} {
                .IntroduceContent img {
                    filter: invert(100%);
                }
            }

            ${textRenderSpecific}; 
        `;
        this._cachedCSS = GlobalCSS;
        return GlobalCSS;
    }

};

WebContent.initThemeSystem();