import { useState, useEffect, useRef } from 'react';
import { tagService } from '../../services/api';
import './TagInput.css';

const TagInput = ({ selectedTags, onChange }) => {
  const [tags, setTags] = useState(selectedTags || []);
  const [inputValue, setInputValue] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);
  const suggestionsRef = useRef(null);

  // Fetch tag suggestions when input changes
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (inputValue.trim().length < 2) {
        setSuggestions([]);
        return;
      }

      setLoading(true);
      try {
        const response = await tagService.getTags({ search: inputValue, limit: 10 });
        setSuggestions(response.data.tags);
      } catch (error) {
        console.error('Error fetching tag suggestions:', error);
      } finally {
        setLoading(false);
      }
    };

    const timeoutId = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(timeoutId);
  }, [inputValue]);

  // Handle clicks outside the suggestions box
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target) &&
        !inputRef.current.contains(event.target)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Add a tag
  const addTag = (tag) => {
    const tagName = typeof tag === 'string' ? tag : tag.name;
    const tagId = typeof tag === 'string' ? null : tag._id;
    
    // Check if tag already exists
    const tagExists = tags.some(t => 
      (typeof t === 'string' ? t === tagName : t.name === tagName)
    );
    
    if (tagName.trim() && !tagExists) {
      const newTags = [...tags, tagId ? { _id: tagId, name: tagName } : tagName];
      setTags(newTags);
      if (onChange) {
        onChange(newTags);
      }
    }
    
    setInputValue('');
    setShowSuggestions(false);
  };

  // Remove a tag
  const removeTag = (index) => {
    const newTags = [...tags];
    newTags.splice(index, 1);
    setTags(newTags);
    if (onChange) {
      onChange(newTags);
    }
  };

  // Handle key press events
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      e.preventDefault();
      addTag(inputValue);
    } else if (e.key === 'Backspace' && !inputValue && tags.length > 0) {
      removeTag(tags.length - 1);
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  // Handle input focus
  const handleFocus = () => {
    if (inputValue.trim().length >= 2) {
      setShowSuggestions(true);
    }
  };

  return (
    <div className="tag-input-container">
      <div className="tag-input">
        {tags.map((tag, index) => (
          <div key={index} className="tag-item">
            <span className="tag-text">{typeof tag === 'string' ? tag : tag.name}</span>
            <button
              type="button"
              className="tag-remove"
              onClick={() => removeTag(index)}
            >
              &times;
            </button>
          </div>
        ))}
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          onClick={() => inputValue.trim().length >= 2 && setShowSuggestions(true)}
          placeholder={tags.length === 0 ? "Add tags..." : ""}
          className="tag-input-field"
        />
      </div>
      
      {showSuggestions && (
        <div ref={suggestionsRef} className="tag-suggestions">
          {loading ? (
            <div className="suggestion-loading">Loading...</div>
          ) : suggestions.length > 0 ? (
            suggestions.map((tag) => (
              <div
                key={tag._id}
                className="suggestion-item"
                onClick={() => addTag(tag)}
              >
                {tag.name}
                {tag.questionCount && (
                  <span className="suggestion-count">({tag.questionCount})</span>
                )}
              </div>
            ))
          ) : inputValue.trim().length >= 2 ? (
            <div className="suggestion-message">
              No tags found. Press Enter to create a new tag.
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
};

export default TagInput;
