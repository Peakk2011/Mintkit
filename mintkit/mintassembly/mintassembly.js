// MintAssembly
// Copyright © 2025 Mint teams
// Licensed under the MIT License

const defaultFilters = {
  currency: val => `$${parseFloat(val).toFixed(2)}`,
  truncate: (val, len = 100) => val.length > len ? val.slice(0, len) + '...' : val,
  uppercase: val => String(val).toUpperCase(),
  lowercase: val => String(val).toLowerCase(),
  capitalize: val => String(val).charAt(0).toUpperCase() + String(val).slice(1),
  date: val => new Date(val).toLocaleDateString(),
  json: val => JSON.stringify(val, null, 2),
  length: val => Array.isArray(val) ? val.length : String(val).length,
  reverse: val => Array.isArray(val) ? val.reverse() : String(val).split('').reverse().join(''),
  join: (val, separator = ', ') => Array.isArray(val) ? val.join(separator) : val,
  default: (val, fallback = '') => val ?? fallback
};

export function MintAssembly({ context = {}, filters = {}, debug = false, template } = {}) {
  const templates = new Map();
  const components = new Map();
  const duplicateElements = new Map();
  const allFilters = { ...defaultFilters, ...filters };
  let templateRoot = null;

  if (template && typeof template === 'string') {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(`<div>${template}</div>`, 'text/html');
      if (doc.body.firstChild) {
        templateRoot = doc.body.firstChild;
      } else if (debug) {
        console.warn('[MintAssembly] Provided template string is empty or invalid.');
      }
    } catch (error) {
      console.error('[MintAssembly] Error parsing template string:', error);
    }
  }

  const reactiveData = new Proxy({}, {
    set(target, prop, value) {
      target[prop] = value;
      if (debug) console.log(`[MintAssembly] Data changed: ${prop} = ${value}`);
      return true;
    }
  });

  function evalExpr(expr, ctx) {
    if (!expr || typeof expr !== 'string') return expr;

    try {
      const safeContext = { ...ctx };
      delete safeContext.window;
      delete safeContext.document;
      delete safeContext.eval;
      delete safeContext.Function;

      const fn = new Function(...Object.keys(safeContext), `"use strict"; return (${expr});`);
      return fn(...Object.values(safeContext));
    } catch (error) {
      if (debug) console.warn(`[MintAssembly] Expression error: ${expr}`, error);
      return undefined;
    }
  }

  // Interpolation with nested object support
  function interpolate(str, ctx) {
    if (!str || typeof str !== 'string') return str;

    return str.replace(/\$\{([^}]+)\}/g, (match, expr) => {
      try {
        let [base, ...pipes] = expr.split('|').map(s => s.trim());
        let val = evalExpr(base, ctx);

        for (const pipe of pipes) {
          const [fname, ...args] = pipe.split(/\(|,|\)/).map(s => s.trim()).filter(Boolean);
          if (fname in allFilters) {
            const filterArgs = args.map(arg => {
              // Try to evaluate arguments as expressions
              const evaluated = evalExpr(arg, ctx);
              return evaluated !== undefined ? evaluated : arg.replace(/['"]/g, '');
            });
            val = allFilters[fname](val, ...filterArgs);
          }
        }

        return val ?? '';
      } catch (error) {
        if (debug) console.warn(`[MintAssembly] Interpolation error: ${match}`, error);
        return match;
      }
    });
  }

  // Element duplication system
  function registerDuplicateElement(name, element) {
    duplicateElements.set(name.toLowerCase(), element);
  }

  function createDuplicateElement(name, props = {}) {
    const template = duplicateElements.get(name.toLowerCase());
    if (!template) {
      if (debug) console.warn(`[MintAssembly] Duplicate element not found: ${name}`);
      return null;
    }

    const cloned = template.cloneNode(true);

    // Apply props to the cloned element
    Object.entries(props).forEach(([key, value]) => {
      if (key.startsWith('@')) {
        const eventName = key.slice(1);
        cloned.addEventListener(eventName, value);
      } else if (key.startsWith(':')) {
        const propName = key.slice(1);
        cloned[propName] = value;
      } else {
        cloned.setAttribute(key, value);
      }
    });

    return cloned;
  }

  function registerComponent(name, template) {
    components.set(name.toLowerCase(), template);
  }

  // Node rendering with better performance
  function renderNode(node, ctx, container) {
    if (node.nodeType === Node.TEXT_NODE) {
      const interpolated = interpolate(node.textContent, ctx);
      if (interpolated !== node.textContent) {
        const txt = document.createTextNode(interpolated);
        container.appendChild(txt);
      } else {
        container.appendChild(node.cloneNode(true));
      }
      return;
    }

    if (node.nodeType !== Node.ELEMENT_NODE) return;

    const tag = node.tagName.toLowerCase();

    // Duplicate element registration
    if (tag === 'duplicate') {
      const name = node.getAttribute('name');
      const source = node.getAttribute('source');

      if (name && source) {
        const sourceElement = document.querySelector(source);
        if (sourceElement) {
          registerDuplicateElement(name, sourceElement);
          if (debug) console.log(`[MintAssembly] Registered duplicate element: ${name} from ${source}`);
        }
      }
      return;
    }

    // Duplicate element usage
    if (tag === 'use') {
      const name = node.getAttribute('name');
      const times = parseInt(node.getAttribute('times')) || 1;

      if (name) {
        for (let i = 0; i < times; i++) {
          const props = {};
          [...node.attributes].forEach(attr => {
            if (attr.name !== 'name' && attr.name !== 'times') {
              props[attr.name] = evalExpr(attr.value, ctx) ?? attr.value;
            }
          });

          // Add loop context for multiple uses
          const loopCtx = { ...ctx, $index: i, $first: i === 0, $last: i === times - 1 };

          const duplicated = createDuplicateElement(name, props);
          if (duplicated) {
            const tempContainer = document.createElement('div');
            tempContainer.appendChild(duplicated);

            [...tempContainer.children].forEach(child => {
              renderNode(child, loopCtx, container);
            });
          }
        }
      }
      return;
    }

    // Conditional rendering
    if (tag === 'if') {
      const condition = node.getAttribute('condition');
      const cond = evalExpr(condition, ctx);

      if (cond) {
        [...node.children].forEach(child => renderNode(child, ctx, container));
      } else {
        let nextSibling = node.nextElementSibling;
        while (nextSibling) {
          const siblingTag = nextSibling.tagName.toLowerCase();

          if (siblingTag === 'elseif') {
            const elseifCondition = nextSibling.getAttribute('condition');
            if (evalExpr(elseifCondition, ctx)) {
              [...nextSibling.children].forEach(child => renderNode(child, ctx, container));
              break;
            }
          } else if (siblingTag === 'else') {
            [...nextSibling.children].forEach(child => renderNode(child, ctx, container));
            break;
          } else {
            break;
          }

          nextSibling = nextSibling.nextElementSibling;
        }
      }
      return;
    }

    // Skip else/elseif as handled by if
    if (tag === 'else' || tag === 'elseif') return;

    if (tag === 'for') {
      const itemName = node.getAttribute('item');
      const indexName = node.getAttribute('index') || 'index';
      const arrExpr = node.getAttribute('in');
      const arr = evalExpr(arrExpr, ctx) || [];

      if (Array.isArray(arr)) {
        arr.forEach((item, index) => {
          const loopCtx = {
            ...ctx,
            [itemName]: item,
            [indexName]: index,
            $first: index === 0,
            $last: index === arr.length - 1,
            $odd: index % 2 === 1,
            $even: index % 2 === 0
          };
          [...node.children].forEach(child => renderNode(child, loopCtx, container));
        });
      }
      return;
    }

    // Switch statement support
    if (tag === 'switch') {
      const switchValue = evalExpr(node.getAttribute('value'), ctx);
      let matched = false;

      [...node.children].forEach(child => {
        if (child.nodeType !== Node.ELEMENT_NODE) return;

        const childTag = child.tagName.toLowerCase();
        if (childTag === 'case') {
          const caseValue = evalExpr(child.getAttribute('value'), ctx);
          if (!matched && switchValue === caseValue) {
            matched = true;
            [...child.children].forEach(grandchild => renderNode(grandchild, ctx, container));
          }
        } else if (childTag === 'default' && !matched) {
          [...child.children].forEach(grandchild => renderNode(grandchild, ctx, container));
        }
      });
      return;
    }

    if (templates.has(tag)) {
      const templateNode = templates.get(tag);
      const content = templateNode.content || templateNode;

      const props = {};
      [...node.attributes].forEach(attr => {
        props[attr.name] = evalExpr(attr.value, ctx) ?? attr.value;
      });

      const componentCtx = { ...ctx, ...props };
      [...content.children].forEach(child => renderNode(child, componentCtx, container));
      return;
    }

    // Regular element rendering
    const el = node.cloneNode(false);

    // Attribute handling
    [...node.attributes].forEach(attr => {
      const attrName = attr.name;
      const attrValue = attr.value;

      if (attrName.startsWith('@')) {
        const eventName = attrName.slice(1);
        el.addEventListener(eventName, (e) => {
          const extendedCtx = { ...ctx, $event: e, $el: el };
          if (attrValue.trim().endsWith(")")) {
            evalExpr(attrValue, extendedCtx);
          } else {
            const handler = evalExpr(attrValue, extendedCtx);
            if (typeof handler === 'function') {
              handler.call(el, e);
            }
          }
        });
      } else if (attrName.startsWith(':')) {
        const propName = attrName.slice(1);
        const propValue = evalExpr(attrValue, ctx);

        if (propName in el) {
          el[propName] = propValue;
        } else {
          el.setAttribute(propName, propValue);
        }
      } else if (attrName === 'v-show') {
        const show = evalExpr(attrValue, ctx);
        el.style.display = show ? '' : 'none';
      } else if (attrName === 'v-if') {
        const condition = evalExpr(attrValue, ctx);
        if (!condition) return;
      } else {
        el.setAttribute(attrName, interpolate(attrValue, ctx));
      }
    });

    [...node.childNodes].forEach(child => renderNode(child, ctx, el));
    container.appendChild(el);
  }

  function mount(selector, props = {}) {
    const container = typeof selector === 'string' ? document.querySelector(selector) : selector;
    if (!container) {
      console.error(`[MintAssembly] Container not found: ${selector}`);
      return;
    }

    if (context.beforeMount) context.beforeMount();

    if (context.beforeRender) context.beforeRender();

    container.innerHTML = '';
    const entry = templateRoot || document.querySelector('entry');
    if (!entry) {
      console.error('[MintAssembly] Missing <Entry> root element or a valid template string in the constructor.');
      return;
    }

    const finalContext = { ...context, ...props, ...reactiveData };

    try {
      [...entry.childNodes].forEach(child => renderNode(child, finalContext, container));

      if (context.mounted) context.mounted();

      if (debug) console.log('[MintAssembly] Mount completed successfully');
    } catch (error) {
      console.error('[MintAssembly] Mount error:', error);
    }
  }

  function render(props = {}) {
    if (context.beforeRender) context.beforeRender();

    const tempContainer = document.createElement('div');
    const entry = templateRoot;

    if (!entry) {
      if (debug) console.error('[MintAssembly] Missing a valid template string in the constructor for render().');
      return '';
    }

    const finalContext = { ...context, ...props, ...reactiveData };

    try {
      const entryClone = entry.cloneNode(true);
      [...entryClone.childNodes].forEach(child => renderNode(child, finalContext, tempContainer));
      return tempContainer.innerHTML;
    } catch (error) {
      console.error('[MintAssembly] Render error:', error);
      return '';
    }
  }

  function setData(key, value) {
    reactiveData[key] = value;
  }

  function getData(key) {
    return reactiveData[key];
  }

  function compileTemplate(templateString) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(`<div>${templateString}</div>`, 'text/html');
    return doc.body.firstChild;
  }

  return {
    mount,
    render,
    templates,
    components,
    duplicateElements,
    setData,
    getData,
    registerComponent,
    registerDuplicateElement,
    createDuplicateElement,
    compileTemplate,
    filters: allFilters,
    addFilter: (name, fn) => { allFilters[name] = fn; },
    debug: (enabled) => { debug = enabled; }
  };
}