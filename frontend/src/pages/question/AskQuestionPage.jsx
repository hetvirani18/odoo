import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from '../../utils/toast';
import { FaSpinner, FaRobot } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import { questionService, aiService } from '../../services/api';
import RichTextEditor from '../../components/questions/RichTextEditor';
import TagInput from '../../components/questions/TagInput';
import './AskQuestionPage.css';

const AskQuestionPage = () => {
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  
  const [content, setContent] = useState('');
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  
  const title = watch('title', '');

  // Handle AI-generated content
  const handleGenerateContent = async () => {
    if (!title.trim()) {
      toast.error('Please provide a title first');
      return;
    }
    
    setAiLoading(true);
    try {
      const response = await aiService.generateDescription({ 
        title, 
        tags: tags.length > 0 ? tags : ['general'] 
      });
      setContent(response.data.description);
      toast.success('AI-generated content created! Feel free to edit it.');
    } catch (err) {
      toast.error('Failed to generate AI content. Please try again or write your own.');
      console.error('AI generation error:', err);
    } finally {
      setAiLoading(false);
    }
  };
  // Handle form submission
  const onSubmit = async (data) => {
    if (!isAuthenticated) {
      toast.error('Please login to ask a question');
      navigate('/login');
      return;
    }
    
    if (tags.length === 0) {
      toast.error('Please add at least one tag');
      return;
    }
    
    if (!content.trim()) {
      toast.error('Question content cannot be empty');
      return;
    }

    const questionData = {
      ...data,
      description: content,
      tags: tags.map(tag => typeof tag === 'string' ? tag : tag.name)
    };

    console.log('Submitting question data:', questionData);

    setLoading(true);
    try {
      const response = await questionService.createQuestion(questionData);
      console.log('Question created successfully:', response.data);
      toast.success('Question posted successfully!');
      
      // Instead of navigating directly, use window.location to perform a full page reload
      // This helps avoid any state-related issues
      window.location.href = `/questions/${response.data.question._id}`;
    } catch (err) {
      console.error('Question submission error:', err);
      toast.error(err.response?.data?.message || 'Failed to post question');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ask-question-page">
      <div className="ask-question-header">
        <h1>Ask a Question</h1>
        <p>
          Be specific and imagine you're asking a question to another person.
          Include all the information someone would need to answer your question.
        </p>
      </div>

      <form className="ask-question-form" onSubmit={handleSubmit(onSubmit)}>
        <div className="form-section">
          <div className="form-group">
            <label htmlFor="title">Title</label>
            <p className="form-hint">
              Be specific and summarize your problem. Imagine you're talking to another programmer.
            </p>
            <input
              type="text"
              id="title"
              placeholder="e.g. How to center a div with CSS?"
              {...register('title', {
                required: 'Title is required',
                minLength: {
                  value: 15,
                  message: 'Title must be at least 15 characters'
                },
                maxLength: {
                  value: 150,
                  message: 'Title cannot exceed 150 characters'
                }
              })}
            />
            {errors.title && <span className="error-message">{errors.title.message}</span>}
          </div>
        </div>

        <div className="form-section">
          <div className="form-group">
            <label htmlFor="content">Body</label>
            <p className="form-hint">
              Include all the information someone would need to answer your question. You can use Markdown for formatting.
            </p>
            <div className="ai-assist-container">
              <button 
                type="button" 
                className="ai-assist-btn" 
                onClick={handleGenerateContent}
                disabled={aiLoading || !title.trim()}
              >
                {aiLoading ? <FaSpinner className="spinner" /> : <FaRobot />}
                {aiLoading ? 'Generating...' : 'Generate with AI'}
              </button>
              <p className="ai-hint">
                Let AI help draft your question based on the title
              </p>
            </div>
            <RichTextEditor value={content} onChange={setContent} />
            {!content.trim() && <span className="error-message">Content is required</span>}
          </div>
        </div>

        <div className="form-section">
          <div className="form-group">
            <label htmlFor="tags">Tags</label>
            <p className="form-hint">
              Add up to 5 tags to describe what your question is about. Start typing to see suggestions.
            </p>
            <TagInput 
              selectedTags={tags} 
              onChange={setTags} 
              maxTags={5} 
            />
            {tags.length === 0 && <span className="error-message">At least one tag is required</span>}
          </div>
        </div>

        <div className="form-actions">
          <button 
            type="submit" 
            className="submit-question-btn"
            disabled={loading}
          >
            {loading ? <FaSpinner className="spinner" /> : 'Post Your Question'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AskQuestionPage;
