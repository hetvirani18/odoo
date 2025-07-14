import { useEffect, useState } from 'react';
import { marked } from 'marked';
import './MarkdownPreview.css';

const MarkdownPreview = ({ markdown }) => {
  const [html, setHtml] = useState('');
  
  useEffect(() => {
    if (markdown) {
      // Configure marked options if needed
      marked.setOptions({
        breaks: true, // Convert line breaks to <br>
        gfm: true,    // Enable GitHub Flavored Markdown
      });
      
      // Convert markdown to HTML
      try {
        const renderedHtml = marked.parse(markdown);
        setHtml(renderedHtml);
      } catch (error) {
        console.error('Error parsing markdown:', error);
        setHtml('<p>Error rendering content</p>');
      }
    } else {
      setHtml('');
    }
  }, [markdown]);
  
  return (
    <div 
      className="markdown-preview" 
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
};

export default MarkdownPreview;
