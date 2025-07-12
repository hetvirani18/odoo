import { useState } from 'react';
import './RichTextEditor.css';

const RichTextEditor = ({ value, onChange }) => {
  const [editorValue, setEditorValue] = useState(value || '');

  const handleChange = (event) => {
    const content = event.target.value;
    setEditorValue(content);
    if (onChange) {
      onChange(content);
    }
  };

  return (
    <div className="rich-text-editor">
      <textarea
        value={editorValue}
        onChange={handleChange}
        placeholder="Describe your question in detail... You can use Markdown formatting."
        rows="10"
        className="editor-textarea"
        style={{
          width: '100%',
          minHeight: '200px',
          padding: '12px',
          border: '1px solid #ddd',
          borderRadius: '4px',
          fontSize: '14px',
          fontFamily: 'Arial, sans-serif',
          resize: 'vertical',
          outline: 'none'
        }}
      />
      <div className="editor-help">
        <small>
          💡 Tip: You can use Markdown formatting. For example: **bold**, *italic*, `code`, etc.
        </small>
      </div>
    </div>
  );
};

export default RichTextEditor;
