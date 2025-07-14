import { useState, useEffect } from 'react';
import './RichTextEditor.css';
import MarkdownPreview from './MarkdownPreview';

const RichTextEditor = ({ value, onChange, disabled }) => {
  const [editorValue, setEditorValue] = useState(value || '');
  const [isPreview, setIsPreview] = useState(false);

  // Update internal state when value prop changes
  useEffect(() => {
    setEditorValue(value || '');
  }, [value]);

  const handleChange = (event) => {
    const content = event.target.value;
    setEditorValue(content);
    if (onChange) {
      // Ensure we're passing a valid string to the parent component
      onChange(content || '');
    }
  };

  const togglePreview = () => {
    setIsPreview(!isPreview);
  };

  return (
    <div className="rich-text-editor">
      <div className="editor-toolbar">
        <button 
          type="button" 
          onClick={togglePreview} 
          className={`editor-view-toggle ${isPreview ? 'active' : ''}`}
          style={{
            marginBottom: '10px',
            padding: '5px 10px',
            background: isPreview ? '#0a95ff' : '#f1f2f3',
            color: isPreview ? 'white' : '#3b4045',
            border: '1px solid #d6d9dc',
            borderRadius: '3px',
            cursor: 'pointer'
          }}
        >
          {isPreview ? 'Edit' : 'Preview'}
        </button>
      </div>
      
      {isPreview ? (
        <MarkdownPreview markdown={editorValue} />
      ) : (
        <textarea
          value={editorValue}
          onChange={handleChange}
          placeholder="Describe your question in detail... You can use Markdown formatting."
          rows="10"
          className="editor-textarea"
          disabled={disabled}
          style={{
            width: '100%',
            minHeight: '200px',
            padding: '12px',
            border: '1px solid #ddd',
            borderRadius: '4px',
            fontSize: '14px',
            fontFamily: 'Arial, sans-serif',
            resize: 'vertical',
            outline: 'none',
            opacity: disabled ? '0.7' : '1',
            backgroundColor: disabled ? '#f9f9f9' : '#fff'
          }}
        />
      )}
      
      <div className="editor-help">
        <small>
          💡 Tip: You can use Markdown formatting. For example: **bold**, *italic*, `code`, etc.
        </small>
      </div>
    </div>
  );
};

export default RichTextEditor;
