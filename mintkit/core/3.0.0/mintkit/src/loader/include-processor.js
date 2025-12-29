import { get } from './resource-loader.js';

/**
 * Process @include directives in HTML content
 * @param {Document|Element} context - DOM context to search
 * @returns {Promise<void>} Promise that resolves when all includes are processed
 */
export async function processIncludes(context = document) {
    const includeRegex = /@include\(['"]([^'"]+)['"]\)/g;
    
    // Find all text nodes with includes
    const textNodes = [];
    const walker = document.createTreeWalker(
        context.body || context,
        NodeFilter.SHOW_TEXT,
        null,
        false
    );
    
    let node;
    while ((node = walker.nextNode())) {
        if (includeRegex.test(node.nodeValue)) {
            includeRegex.lastIndex = 0; // Reset regex
            textNodes.push(node);
        }
    }

    // Process each text node
    const tasks = [];
    
    for (const textNode of textNodes) {
        let text = textNode.nodeValue;
        let match;
        
        includeRegex.lastIndex = 0; // Reset regex
        
        while ((match = includeRegex.exec(text))) {
            const fileUrl = match[1];
            const fullMatch = match[0];
            
            tasks.push(
                (async () => {
                    try {
                        if (fileUrl.endsWith('.css')) {
                            await get(fileUrl);
                        } else if (fileUrl.endsWith('.html') || fileUrl.endsWith('.htm')) {
                            const content = await get(fileUrl);
                            
                            // Replace the @include directive with the loaded content
                            const parent = textNode.parentNode;
                            if (parent && parent.replaceChild) {
                                const tempDiv = document.createElement('div');
                                tempDiv.innerHTML = textNode.nodeValue.replace(fullMatch, content);
                                
                                // Replace text node with parsed content
                                while (tempDiv.firstChild) {
                                    parent.insertBefore(tempDiv.firstChild, textNode);
                                }
                                
                                parent.removeChild(textNode);
                            }
                        }
                    } catch (error) {
                        console.error(`Failed to process include: ${fileUrl}`, error);
                    }
                })()
            );
        }
    }

    await Promise.all(tasks);
    console.debug('All includes processed');
}

/**
 * Find include directives in string
 * @param {string} text - Text to search
 * @returns {Array<{match: string, url: string}>} Array of found includes
 */
export function findIncludes(text) {
    const includeRegex = /@include\(['"]([^'"]+)['"]\)/g;
    const includes = [];
    let match;
    
    while ((match = includeRegex.exec(text))) {
        includes.push({
            match: match[0],
            url: match[1],
            index: match.index
        });
    }
    
    return includes;
}

/**
 * Process includes in string (synchronous version for preprocessing)
 * @param {string} text - Text with includes
 * @returns {string} Text with includes replaced by placeholders
 */
export function preprocessIncludes(text) {
    const includes = findIncludes(text);
    let processed = text;
    
    includes.forEach((include, index) => {
        processed = processed.replace(include.match, `<!-- include:${index} -->`);
    });
    
    return { processed, includes };
}