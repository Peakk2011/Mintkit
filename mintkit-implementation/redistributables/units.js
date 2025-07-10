/**
 * Mintkit units user-agent-stylesheet
 * Redistributables folder stored web data,design,units here 
 */

// Typography Configuration
const typography = {
    fontImport: "@import url('https://fonts.googleapis.com/css2?family=Anuphan:wght@100..700&family=Instrument+Sans:ital,wght@0,400..700;1,400..700&family=Inter+Tight:ital,wght@0,100..900;1,100..900&family=JetBrains+Mono:ital,wght@0,100..800;1,100..800&family=Manrope:wght@200..800&family=Merriweather:ital,opsz,wght@0,18..144,300..900;1,18..144,300..900&family=Source+Serif+4:ital,opsz,wght@0,8..60,200..900;1,8..60,200..900&family=Trirong:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap');",

    families: {
        sans: {
            interTight: '"Inter Tight", sans-serif',
            anuphan: '"Anuphan", sans-serif',
            manrope: '"Manrope", sans-serif',
            instrumentSans: '"Instrument Sans", sans-serif',
        },
        serif: {
            merriweather: '"Merriweather", serif',
            trirong: '"Trirong", serif',
            sourceSerif: '"Source Serif 4", serif',
        },
        mono: {
            jetbrains: '"JetBrains Mono", monospace',
        }
    },

    systemFallback: '"Leelawadee UI", "Segoe UI", -apple-system, BlinkMacSystemFont, "Roboto", "Helvetica Neue", sans-serif',

    weights: {
        light: '300',
        normal: '400',
        medium: '500',
        semibold: '600',
        bold: '700',
        extrabold: '800'
    }
};

// Spacing Configuration
const spacing = {
    0: '0',
    px: '1px',
    0.5: '0.125rem',    // 2px
    1: '0.25rem',       // 4px
    1.5: '0.375rem',    // 6px
    2: '0.5rem',        // 8px
    2.5: '0.625rem',    // 10px
    3: '0.75rem',       // 12px
    3.5: '0.875rem',    // 14px
    4: '1rem',          // 16px
    5: '1.25rem',       // 20px
    6: '1.5rem',        // 24px
    7: '1.75rem',       // 28px
    8: '2rem',          // 32px
    10: '2.5rem',       // 40px
    12: '3rem',         // 48px
    16: '4rem',         // 64px
    20: '5rem',         // 80px
    24: '6rem',         // 96px
    32: '8rem',         // 128px
};

// Layout Configuration
const layout = {
    position: ['static', 'relative', 'fixed', 'absolute', 'sticky'],
    boxSizing: 'border-box',

    zIndex: {
        hidden: '-1',
        base: '0',
        dropdown: '1000',
        modal: '1050',
        tooltip: '1100'
    },

    overflow: {
        hidden: 'hidden',
        scroll: 'scroll',
        auto: 'auto'
    }
};

const breakpoints = {
    mobile: '320px',
    mobileLarge: '380px',
    tablet: '576px',
    tabletLarge: '768px',
    desktop: '1024px',
    desktopLarge: '1280px',
    ultrawide: '1536px',

    // Legacy
    mb: '411px',
    sm: '450px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px'
};

const mediaQueries = {
    darkMode: '(prefers-color-scheme: dark)',
    lightMode: '(prefers-color-scheme: light)',
    reducedMotion: '(prefers-reduced-motion: reduce)',

    mobile: `(min-width: ${breakpoints.mobile})`,
    mobileLarge: `(min-width: ${breakpoints.mobileLarge})`,
    tablet: `(min-width: ${breakpoints.tablet})`,
    tabletLarge: `(min-width: ${breakpoints.tabletLarge})`,
    desktop: `(min-width: ${breakpoints.desktop})`,
    desktopLarge: `(min-width: ${breakpoints.desktopLarge})`,
    ultrawide: `(min-width: ${breakpoints.ultrawide})`
};

const borderRadius = {
    none: '0',
    sm: '0.125rem',     // 2px
    base: '0.25rem',    // 4px
    md: '0.375rem',     // 6px
    lg: '0.5rem',       // 8px
    xl: '0.75rem',      // 12px
    '2xl': '1rem',      // 16px
    '3xl': '1.5rem',    // 24px
    full: '100vmax'
};

const shadows = {
    none: 'none',
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    base: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
    '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
    inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)'
};

// Animation & Transitions
const animation = {
    transitions: {
        none: 'none',
        all: 'all 150ms cubic-bezier(0.4, 0, 0.2, 1)',
        base: 'color, background-color, border-color, text-decoration-color, fill, stroke, opacity, box-shadow, transform, filter, backdrop-filter 150ms cubic-bezier(0.4, 0, 0.2, 1)',
        colors: 'color, background-color, border-color, text-decoration-color, fill, stroke 150ms cubic-bezier(0.4, 0, 0.2, 1)',
        opacity: 'opacity 150ms cubic-bezier(0.4, 0, 0.2, 1)',
        shadow: 'box-shadow 150ms cubic-bezier(0.4, 0, 0.2, 1)',
        transform: 'transform 150ms cubic-bezier(0.4, 0, 0.2, 1)'
    },

    easings: {
        linear: 'linear',
        in: 'cubic-bezier(0.4, 0, 1, 1)',
        out: 'cubic-bezier(0, 0, 0.2, 1)',
        inOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
        bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        smooth: 'cubic-bezier(0.19, 1, 0.22, 1)'
    },

    duration: {
        fast: '100ms',
        base: '150ms',
        slow: '300ms',
        slower: '500ms'
    }
};

const units = {
    // Absolute Units
    absolute: {
        px: 'px',
        pt: 'pt',
        pc: 'pc',
        in: 'in',
        cm: 'cm',
        mm: 'mm'
    },

    // Relative Units
    relative: {
        em: 'em',
        rem: 'rem',
        percent: '%',
        vw: 'vw',
        vh: 'vh',
        vmin: 'vmin',
        vmax: 'vmax',
        maxContent: 'max-content',
        minContent: 'min-content',
        fitContent: 'fit-content'
    },

    // Special Values
    auto: 'auto',
    inherit: 'inherit',
    initial: 'initial',
    unset: 'unset'
};

export const WebElements = {
    typography,
    spacing,
    layout,
    breakpoints,
    mediaQueries,
    borderRadius,
    shadows,
    animation,
    units,

    utils: {
        generateCSSVars: (prefix = '--') => {
            const vars = {};

            Object.entries(spacing).forEach(([key, value]) => {
                vars[`${prefix}spacing-${key}`] = value;
            });

            Object.entries(borderRadius).forEach(([key, value]) => {
                vars[`${prefix}radius-${key}`] = value;
            });

            Object.entries(shadows).forEach(([key, value]) => {
                vars[`${prefix}shadow-${key}`] = value;
            });

            Object.entries(typography.weights).forEach(([key, value]) => {
                vars[`${prefix}font-weight-${key}`] = value;
            });

            vars[`${prefix}color-scheme`] = 'light dark';

            return vars;
        },

        responsive: (values) => {
            const breakpointKeys = Object.keys(breakpoints);
            return breakpointKeys.reduce((acc, bp, index) => {
                if (values[bp]) {
                    const query = index === 0 ? '' : `@media ${mediaQueries[bp]}`;
                    acc[query] = values[bp];
                }
                return acc;
            }, {});
        },

        createTransition: (property, duration = 'base', easing = 'inOut') => {
            return `${property} ${animation.duration[duration]} ${animation.easings[easing]}`;
        },

        getSpacing: (value, fallback = '0') => {
            return spacing[value] || fallback;
        },

        getShadow: (shadowKey, opacity = 1) => {
            const shadow = shadows[shadowKey];
            if (!shadow || shadow === 'none') return shadow;

            return shadow.replace(/rgb\(0 0 0 \/ ([\d.]+)\)/g, (match, currentOpacity) => {
                const newOpacity = parseFloat(currentOpacity) * opacity;
                return `rgb(0 0 0 / ${newOpacity})`;
            });
        },

        createMediaQuery: (breakpoint, type = 'min') => {
            const size = breakpoints[breakpoint];
            if (!size) return '';

            return `@media (${type}-width: ${size})`;
        },

        getFontStack: (category, font, withFallback = true) => {
            const fontFamily = typography.families[category]?.[font];
            if (!fontFamily) return typography.systemFallback;

            return withFallback ? `${fontFamily}, ${typography.systemFallback}` : fontFamily;
        },

        createKeyframes: (name, keyframes) => {
            const keyframeString = Object.entries(keyframes)
                .map(([key, value]) => {
                    const rules = Object.entries(value)
                        .map(([prop, val]) => `${prop}: ${val};`)
                        .join(' ');
                    return `${key} { ${rules} }`;
                })
                .join(' ');

            return `@keyframes ${name} { ${keyframeString} }`;
        },

        getSpacingMultiple: (...values) => {
            return values.map(value => spacing[value] || '0').join(' ');
        }
    },

    legacy: {
        StoredFontFamily: typography.fontImport,
        Typeface: [
            typography.families.sans.interTight,
            typography.families.serif.merriweather,
            typography.families.serif.trirong,
            typography.families.sans.anuphan,
            typography.families.mono.jetbrains,
            typography.families.sans.manrope,
            typography.families.sans.instrumentSans,
            typography.families.serif.sourceSerif
        ],
        DefaultFontFallback: typography.systemFallback,
        DirectThemes: [mediaQueries.darkMode, mediaQueries.lightMode]
    }
};

export default WebElements;