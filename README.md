<p align="center">
  <img src="https://drive.google.com/uc?id=1tcAEV3cKmi2YCMHhAvW3KlXI6bwqc9uy" height="180px"></img>
</p>

<h1 align="center">Mintkit</h1>

## About Mintkit 
Mintkit: A Comprehensive JavaScript Framework
<br>
Design with a modern JavaScript framework designed to streamline web development by providing dynamic content management capabilities in a single, unified solution.
Built with an integrated toolkit, Mintkit simplifies the website creation process while maintaining flexibility and performance.

## Why Choose Mintkit?
Mintkit eliminates the need for multiple libraries and frameworks by providing everything you need in one cohesive package. Whether you're building a simple website or a complex web application, Mintkit's intuitive API and powerful features make development more efficient and enjoyable.

## Features
### Be warned that the code provided here cannot be placed purely because it is only included in the Featured section.
Stored data with method argument 
```Javascript
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
```

Create your own user agent stylesheet example: 

```Javascript
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
// ... Rest of Mintkit code
```

Create your own preset styling

```Javascript
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

```

Build in Theme switcher

```Javascript
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
```

Force text rendering

```Javascript
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
```

Components

```Javascript
ElementComponents() {
   return `
       ${this.HTMLContent.Introduce()}
   `;
},
```

### MintAssembly
MintAssembly is an HTML programming language that emulates Assembly language, and in this option you can turn MintAssembly on and off.

```Javascript
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
  /*
      Look like
      mov rax, 200
      mov rbx, eax
      ...system call
  */
}
```

### Usage
To execute Mintkit code for your CSS styling differently from vanila example like this
```CSS
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
```

In conclusion, using Mintkit will allow you to change the old system of making websites and create a new website that is dynamic and lightest. And you will finally see the coding that is dynamic typing. Everything is included in the Javascript file and it is better than you separate the HTML CSS file and separate the writing. Mintkit has its own live server for you to develop websites. What we create Plugins that we create from Mint Teams and our team are the most suitable to be compatible with the Mintkit Framework.
