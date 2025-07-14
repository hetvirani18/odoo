const { marked } = require('marked');

// Configure marked options
marked.setOptions({
  breaks: true, // Convert line breaks to <br>
  gfm: true,    // Enable GitHub Flavored Markdown
  silent: true, // Ignore errors
});

/**
 * Convert markdown content to HTML
 * @param {string} markdown - The markdown content to convert
 * @returns {string} - The HTML content
 */
const markdownToHtml = (markdown) => {
  if (!markdown) return '';
  
  try {
    return marked.parse(markdown);
  } catch (error) {
    console.error('Error parsing markdown:', error);
    return '<p>Error rendering content</p>';
  }
};

module.exports = {
  markdownToHtml
};
