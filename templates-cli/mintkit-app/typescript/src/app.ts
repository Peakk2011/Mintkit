/**
 * @file Main application script for the Mintkit boilerplate.
 * @description This script sets up the main content, styles
 */

// Import Mintkit utilities and the application's

import { Mint } from "https://mint-teams.web.app/Mintkit/mint.js";
// Import app.css
await Mint.include("./app.css");

/**
 * The root DOM element selector where the application will be mounted.
 */

const rootPath: string = "#app";

/**
 * Defines the structure for the page's content and metadata.
 */

interface IContent {
  title: string;
  description: string;
  keywords: string;
  edit: string;
}

/**
 * Configuration object holding all the content and metadata for the page.
 */

const content: IContent = {
  title: "Mintkit",
  description: `
        Mintkit is a web framework<br>
        designed to deliver efficient,<br>
        scalable, and maintainable<br>
        web development experiences.
    `,
  keywords: "Mintkit, JavaScript, framework, web development",
  edit: "Edit <code>index.html</code> to changes.",
};

/**
 * The main HTML structure.
 */

const html: string = `
    <div class="card">
        <h1 class="card-title">
            <svg width="384" height="383" viewBox="0 0 384 383" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="153" y="343" width="79" height="40" fill="black"/>
                <rect x="153" width="79" height="40" fill="black"/>
                <rect x="230" y="305" width="41" height="40" fill="black"/>
                <rect x="307" y="229" width="39" height="40" fill="black"/>
                <rect x="269" y="267" width="40" height="40" fill="black"/>
                <rect x="344" y="154" width="40" height="76" fill="black"/>
                <rect y="153" width="40" height="77" fill="black"/>
                <rect x="306" y="116" width="40" height="39" fill="black"/>
                <rect width="40" height="39" transform="matrix(-1 0 0 1 78 116)" fill="black"/>
                <rect width="40" height="39" transform="matrix(-1 0 0 1 78 229)" fill="black"/>
                <rect width="40" height="39" transform="matrix(-1 0 0 1 116 268)" fill="black"/>
                <rect width="40" height="39" transform="matrix(-1 0 0 1 153 306)" fill="black"/>
                <rect x="268" y="77" width="41" height="40" fill="black"/>
                <rect width="41" height="40" transform="matrix(-1 0 0 1 116 77)" fill="black"/>
                <rect x="230" y="40" width="41" height="39" fill="black"/>
                <rect width="41" height="39" transform="matrix(-1 0 0 1 154 40)" fill="black"/>
                <path d="M172.5 268.5H211V229.5H230.5V191.5H209.5V213H177.5V191.5H153V229.5H172.5V268.5Z" fill="black" stroke="black"/>
                <path d="M152.5 153.5H114.5V191.5H152.5V153.5Z" fill="black"/>
                <path d="M230.5 191.5H269.5V153.5H230.5V191.5Z" fill="black"/>
                <path d="M230.5 153.5V116H152.5V153.5H230.5Z" fill="black"/>
                <path d="M230.5 153.5H269.5V191.5H230.5V153.5ZM230.5 153.5V116H152.5V153.5M230.5 153.5H152.5M152.5 153.5H114.5V191.5H152.5V153.5Z" stroke="black"/>
            </svg>
            ${content.title}
        </h1>
        <p>${content.description}</p>
        <span>${content.edit}</span>
    </div>
`;

// Application Initialization

Mint.injectTitle(`<title>${content.title}</title>`);

Mint.init(() => {
  Mint.inject({
    html: {
      id: rootPath,
      location() {
        return html;
      },
    },
  });
});

// SEO Meta Tag Injection

/**
 * Creates and injects a meta tag into the document's <head>.
 * @param {string} name - The name attribute of the meta tag
 * @param {string} content - The content attribute of the meta tag.
 */

const injectMeta = (name: string, content: string): void => {
  const meta = document.createElement("meta");
  meta.name = name;
  meta.content = content;
  document.head.appendChild(meta);
};

injectMeta("description", content.description.replace(/<br\s*\/?>/g, " "));
injectMeta("keywords", content.keywords);
