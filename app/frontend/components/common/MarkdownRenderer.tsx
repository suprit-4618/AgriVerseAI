import React from 'react';
import { Language } from '../../types';

const processInlines = (line: string): string => {
    return line
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Bold
        .replace(/\*(.*?)\*/g, '<em>$1</em>');       // Italic
};

const parseMarkdownToHtml = (text: string): string => {
    if (!text) return '';

    // Split by blocks of text separated by one or more empty lines
    const blocks = text.split(/\n\s*\n/);
    let html = '';
    
    for (const block of blocks) {
        const trimmedBlock = block.trim();
        if (!trimmedBlock) continue;

        const lines = trimmedBlock.split('\n');
        
        // Check for headings
        if (lines.length === 1 && lines[0].startsWith('#')) {
            const line = lines[0];
            if (line.startsWith('### ')) {
                html += `<h3 class="text-lg font-semibold mt-3 mb-1">${processInlines(line.substring(4))}</h3>`;
            } else if (line.startsWith('## ')) {
                html += `<h2 class="text-xl font-bold mt-4 mb-2">${processInlines(line.substring(3))}</h2>`;
            } else if (line.startsWith('# ')) {
                html += `<h1 class="text-2xl font-extrabold mt-4 mb-2">${processInlines(line.substring(2))}</h1>`;
            } else {
                html += `<p class="my-2">${processInlines(trimmedBlock.replace(/\n/g, '<br/>'))}</p>`;
            }
            continue;
        }

        // Check for lists
        const isUl = lines.every(line => /^\s*[\-\*] /.test(line));
        const isOl = lines.every(line => /^\s*\d+\. /.test(line));
        
        if (isUl) {
            html += '<ul class="list-disc list-inside space-y-1 my-2">';
            lines.forEach(line => {
                html += `<li>${processInlines(line.replace(/^\s*[\-\*] /, ''))}</li>`;
            });
            html += '</ul>';
        } else if (isOl) {
            html += '<ol class="list-decimal list-inside space-y-1 my-2">';
            lines.forEach(line => {
                html += `<li>${processInlines(line.replace(/^\s*\d+\. /, ''))}</li>`;
            });
            html += '</ol>';
        } else {
            // It's a paragraph
            html += `<p class="my-2">${processInlines(trimmedBlock.replace(/\n/g, '<br/>'))}</p>`;
        }
    }
    
    return html;
};


interface MarkdownRendererProps {
    content: string;
    language: Language;
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, language }) => {
    const htmlContent = parseMarkdownToHtml(content);
    
    return (
        <div 
            className={`text-sm md:text-base leading-relaxed ${language === Language.KN ? 'font-kannada' : ''}`}
            dangerouslySetInnerHTML={{ __html: htmlContent }}
        />
    );
};

export default MarkdownRenderer;