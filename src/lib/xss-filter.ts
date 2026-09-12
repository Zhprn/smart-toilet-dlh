import xss from 'xss';

// Define interface for XSS filter options
interface IXSSFilterOptions {
    whiteList: Record<string, string[]>;
    onTagAttr?: (tag: string, name: string, value: string) => string | undefined;
    onTag?: (tag: string) => string | undefined;
    escapeHtml?: (str: string) => string;
}

// Configure XSS filter options to allow safe HTML tags while removing dangerous ones
const xssOptions: IXSSFilterOptions = {
    // Allow common HTML tags used in rich text editors
    whiteList: {
        // Text formatting
        p: ['class', 'style'],
        br: [],
        strong: ['class', 'style'],
        b: ['class', 'style'],
        em: ['class', 'style'],
        i: ['class', 'style'],
        u: ['class', 'style'],
        s: ['class', 'style'],
        del: ['class', 'style'],
        mark: ['class', 'style'],

        // Headings
        h1: ['class', 'style'],
        h2: ['class', 'style'],
        h3: ['class', 'style'],
        h4: ['class', 'style'],
        h5: ['class', 'style'],
        h6: ['class', 'style'],

        // Lists
        ul: ['class', 'style'],
        ol: ['class', 'style'],
        li: ['class', 'style'],

        // Links (but remove javascript: URLs)
        a: ['href', 'title', 'target', 'rel', 'class', 'style'],

        // Block elements
        blockquote: ['class', 'style'],
        code: ['class', 'style'],
        pre: ['class', 'style'],

        // Tables (basic support)
        table: ['class', 'style'],
        thead: ['class', 'style'],
        tbody: ['class', 'style'],
        tr: ['class', 'style'],
        td: ['class', 'style', 'colspan', 'rowspan'],
        th: ['class', 'style', 'colspan', 'rowspan'],
    },

    // Remove dangerous protocols in href attributes
    onTagAttr: (name: string, value: string) => {
        // Block javascript: URLs and other dangerous protocols
        if (name === 'href') {
            const lowerValue = value.toLowerCase().trim();
            if (
                lowerValue.startsWith('javascript:') ||
                lowerValue.startsWith('vbscript:') ||
                lowerValue.startsWith('data:') ||
                lowerValue.startsWith('file:')
            ) {
                return ''; // Remove the attribute
            }
        }

        // Remove event handlers (onclick, onload, etc.)
        if (name.startsWith('on')) {
            return ''; // Remove the attribute
        }

        return undefined; // Keep other attributes
    },

    // Remove dangerous tags entirely
    onTag: (tag: string) => {
        // Block script tags and other dangerous elements
        const dangerousTags = [
            'script',
            'iframe',
            'object',
            'embed',
            'form',
            'input',
            'button',
            'select',
            'textarea',
            'meta',
            'link',
            'style',
            'base',
            'head',
            'html',
            'body',
            'frame',
            'frameset',
            'noscript',
            'applet',
            'canvas',
            'svg',
            'math',
            'video',
            'audio',
            'source',
            'track'
        ];

        if (dangerousTags.includes(tag)) {
            return ''; // Remove the entire tag
        }

        return undefined; // Keep other tags
    },

    // Escape HTML entities in attribute values
    escapeHtml: (str: string) => {
        return str
            .replace(/&/g, '&')
            .replace(/</g, '<')
            .replace(/>/g, '>')
            .replace(/"/g, '"')
            .replace(/'/g, '&#x27;');
    }
};

/**
 * Sanitizes HTML content to prevent XSS attacks while preserving safe formatting
 * @param html - The HTML content to sanitize
 * @returns Sanitized HTML string
 */
export function sanitizeHtml(html: string): string {
    if (!html || typeof html !== 'string') {
        return '';
    }

    return xss(html, xssOptions);
}

/**
 * Validates if a URL is safe for use in links
 * @param url - The URL to validate
 * @returns true if the URL is safe, false otherwise
 */
export function isSafeUrl(url: string): boolean {
    if (!url || typeof url !== 'string') {
        return false;
    }

    const trimmedUrl = url.trim().toLowerCase();

    // Block dangerous protocols
    const dangerousProtocols = [
        'javascript:',
        'vbscript:',
        'data:',
        'file:',
        'about:',
        'chrome:',
        'chrome-extension:',
        'moz-extension:',
        'ms-appx:',
        'ms-appx-web:',
        'webcal:',
        'ftp:'
    ];

    return !dangerousProtocols.some(protocol => trimmedUrl.startsWith(protocol));
}