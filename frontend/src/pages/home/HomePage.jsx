import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { FaPlus, FaFilter, FaSortAmountDown, FaSortAmountUp } from 'react-icons/fa';
import { questionService, tagService } from '../../services/api';
import './HomePage.css';

const HomePage = () => {
  const [questions, setQuestions] = useState([]);
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const [sortOrder, setSortOrder] = useState('newest');
  const [selectedTags, setSelectedTags] = useState([]);
  
  // Get query parameters
  const searchQuery = searchParams.get('search') || '';
  const tagFilter = searchParams.get('tag') || '';
  
  useEffect(() => {
    // Load tags
    const loadTags = async () => {
      try {
        const response = await tagService.getTags();
        setTags(response.data.tags);
      } catch (err) {
        console.error('Error loading tags:', err);
      }
    };
    
    loadTags();
  }, []);
  
  useEffect(() => {
    // Load questions with filters
    const loadQuestions = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Prepare query parameters
        const params = {
          sort: sortOrder,
        };
        
        if (searchQuery) {
          params.search = searchQuery;
        }
        
        if (selectedTags.length > 0) {
          params.tag = selectedTags.join(',');
        } else if (tagFilter) {
          params.tag = tagFilter;
        }
        
        const response = await questionService.getQuestions(params);
        setQuestions(response.data.questions);
      } catch (err) {
        setError('Error loading questions. Please try again later.');
        console.error('Error loading questions:', err);
      } finally {
        setLoading(false);
      }
    };
    
    loadQuestions();
  }, [searchQuery, tagFilter, sortOrder, selectedTags]);
  
  const handleSortChange = (order) => {
    setSortOrder(order);
  };
  
  const handleTagSelect = (tag) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };
  
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="home-page">
      <div className="home-header">
        <h1>Top Questions</h1>
        <Link to="/ask" className="ask-question-btn">
          <FaPlus /> Ask Question
        </Link>
      </div>
      
      <div className="home-filters">
        <div className="filter-tags">
          <div className="filter-label">
            <FaFilter /> Filter by Tags:
          </div>
          <div className="tags-container">
            {tags.slice(0, 10).map(tag => (
              <button
                key={tag._id}
                className={`tag-btn ${selectedTags.includes(tag.name) ? 'selected' : ''}`}
                onClick={() => handleTagSelect(tag.name)}
              >
                {tag.name}
              </button>
            ))}
            {tags.length > 10 && (
              <Link to="/tags" className="more-tags-link">
                More...
              </Link>
            )}
          </div>
        </div>
        
        <div className="sort-options">
          <div className="sort-label">
            Sort by:
          </div>
          <button
            className={`sort-btn ${sortOrder === 'newest' ? 'active' : ''}`}
            onClick={() => handleSortChange('newest')}
          >
            <FaSortAmountDown /> Newest
          </button>
          <button
            className={`sort-btn ${sortOrder === 'most_voted' ? 'active' : ''}`}
            onClick={() => handleSortChange('most_voted')}
          >
            <FaSortAmountUp /> Most Votes
          </button>
          <button
            className={`sort-btn ${sortOrder === 'most_answered' ? 'active' : ''}`}
            onClick={() => handleSortChange('most_answered')}
          >
            <FaSortAmountDown /> Most Answers
          </button>
        </div>
      </div>
      
      {loading ? (
        <div className="loading">Loading questions...</div>
      ) : error ? (
        <div className="error-message">{error}</div>
      ) : questions.length === 0 ? (
        <div className="no-questions">
          <p>No questions found.</p>
          {(searchQuery || selectedTags.length > 0) && (
            <p>Try removing some filters or search terms.</p>
          )}
          <Link to="/ask" className="ask-question-btn">
            Be the first to ask a question
          </Link>
        </div>
      ) : (
        <div className="questions-list">
          {questions.map(question => (
            <div key={question._id} className="question-card">
              <div className="question-stats">
                <div className="stat">
                  <span className="stat-value">{question.voteCount || (question.upvotes?.length - question.downvotes?.length) || 0}</span>
                  <span className="stat-label">votes</span>
                </div>
                <div className="stat">
                  <span className="stat-value">{question.answers?.length || 0}</span>
                  <span className="stat-label">answers</span>
                </div>
                <div className="stat">
                  <span className="stat-value">{question.views}</span>
                  <span className="stat-label">views</span>
                </div>
              </div>
              
              <div className="question-content">
                <h3 className="question-title">
                  <Link to={`/questions/${question._id}`}>{question.title}</Link>
                </h3>
                <div className="question-excerpt">
                  {question.description ? question.description.substring(0, 150) + '...' : 
                   'No content available'}
                </div>
                
                <div className="question-meta">
                  <div className="question-tags">
                    {question.tags && question.tags.length > 0 ? question.tags.map(tag => {
                      // Handle both string tags and object tags
                      const tagName = typeof tag === 'string' ? tag : tag.name;
                      const tagId = typeof tag === 'string' ? tag : tag._id || tag.name;
                      
                      return (
                        <Link
                          key={tagId}
                          to={`/?tag=${tagName}`}
                          className="question-tag"
                        >
                          {tagName}
                        </Link>
                      );
                    }) : <span className="no-tags">No tags</span>}
                  </div>
                  
                  <div className="question-author">
                    <span className="author-info">
                      Asked by <Link to={`/users/${question.author?.username}`}>{question.author?.username}</Link>
                    </span>
                    <span className="question-date">
                      on {formatDate(question.createdAt)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default HomePage;
