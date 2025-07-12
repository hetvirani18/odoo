import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { userService, questionService } from '../../services/api';
import { Link, useNavigate } from 'react-router-dom';
import { 
  FaUser, 
  FaQuestion, 
  FaBookmark, 
  FaEdit, 
  FaTrash, 
  FaEye,
  FaArrowUp,
  FaArrowDown,
  FaCalendarAlt,
  FaStar
} from 'react-icons/fa';
import toast from '../../utils/toast';
import './ProfilePage.css';

const ProfilePage = () => {
  const { currentUser, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState('questions');
  const [userQuestions, setUserQuestions] = useState([]);
  const [userBookmarks, setUserBookmarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    
    fetchUserData();
  }, [isAuthenticated, navigate]);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      
      // Fetch user questions
      const questionsResponse = await userService.getUserQuestions(currentUser.username);
      setUserQuestions(questionsResponse.data.questions);
      
      // Fetch user bookmarks
      const bookmarksResponse = await userService.getUserBookmarks(currentUser.username);
      setUserBookmarks(bookmarksResponse.data.bookmarks);
      
    } catch (err) {
      console.error('Error fetching user data:', err);
      setError('Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteQuestion = async (questionId) => {
    if (!window.confirm('Are you sure you want to delete this question?')) {
      return;
    }

    try {
      await questionService.deleteQuestion(questionId);
      setUserQuestions(userQuestions.filter(q => q._id !== questionId));
      toast.success('Question deleted successfully');
    } catch (err) {
      console.error('Error deleting question:', err);
      toast.error(err.response?.data?.message || 'Failed to delete question');
    }
  };

  const handleRemoveBookmark = async (questionId) => {
    try {
      await questionService.bookmarkQuestion(questionId);
      setUserBookmarks(userBookmarks.filter(q => q._id !== questionId));
      toast.success('Bookmark removed');
    } catch (err) {
      console.error('Error removing bookmark:', err);
      toast.error('Failed to remove bookmark');
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

  if (!isAuthenticated) {
    return null;
  }

  if (loading) {
    return <div className="profile-loading">Loading profile...</div>;
  }

  if (error) {
    return <div className="profile-error">{error}</div>;
  }

  return (
    <div className="profile-page">
      <div className="profile-header">
        <div className="profile-info">
          <div className="profile-avatar">
            {currentUser.avatar ? (
              <img src={currentUser.avatar} alt={currentUser.username} />
            ) : (
              <FaUser />
            )}
          </div>
          <div className="profile-details">
            <h1>{currentUser.username}</h1>
            <div className="profile-stats">
              <div className="stat">
                <FaStar className="stat-icon" />
                <span>{currentUser.reputation || 0} reputation</span>
              </div>
              <div className="stat">
                <FaCalendarAlt className="stat-icon" />
                <span>Member since {formatDate(currentUser.createdAt)}</span>
              </div>
            </div>
            {currentUser.bio && (
              <div className="profile-bio">
                <p>{currentUser.bio}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="profile-content">
        <div className="profile-tabs">
          <button
            className={`tab-button ${activeTab === 'questions' ? 'active' : ''}`}
            onClick={() => setActiveTab('questions')}
          >
            <FaQuestion />
            Your Questions ({userQuestions.length})
          </button>
          <button
            className={`tab-button ${activeTab === 'bookmarks' ? 'active' : ''}`}
            onClick={() => setActiveTab('bookmarks')}
          >
            <FaBookmark />
            Bookmarks ({userBookmarks.length})
          </button>
        </div>

        <div className="profile-tab-content">
          {activeTab === 'questions' && (
            <div className="questions-tab">
              <div className="tab-header">
                <h2>Your Questions</h2>
                <Link to="/ask" className="ask-button">
                  Ask New Question
                </Link>
              </div>
              
              {userQuestions.length === 0 ? (
                <div className="empty-state">
                  <FaQuestion size={48} />
                  <h3>No questions yet</h3>
                  <p>Start by asking your first question!</p>
                  <Link to="/ask" className="ask-button">
                    Ask Question
                  </Link>
                </div>
              ) : (
                <div className="questions-list">
                  {userQuestions.map(question => (
                    <div key={question._id} className="question-item">
                      <div className="question-stats">
                        <div className="stat">
                          <FaArrowUp />
                          <span>{question.upvotes?.length || 0}</span>
                        </div>
                        <div className="stat">
                          <FaArrowDown />
                          <span>{question.downvotes?.length || 0}</span>
                        </div>
                        <div className="stat">
                          <FaEye />
                          <span>{question.views || 0}</span>
                        </div>
                      </div>
                      
                      <div className="question-content">
                        <h3>
                          <Link to={`/questions/${question._id}`}>
                            {question.title}
                          </Link>
                        </h3>
                        <div className="question-excerpt">
                          {question.description?.substring(0, 150)}...
                        </div>
                        <div className="question-tags">
                          {question.tags?.map(tag => (
                            <span key={tag._id || tag} className="tag">
                              {typeof tag === 'string' ? tag : tag.name}
                            </span>
                          ))}
                        </div>
                        <div className="question-meta">
                          <span className="date">
                            Asked {formatDate(question.createdAt)}
                          </span>
                          <div className="question-actions">
                            <Link 
                              to={`/questions/${question._id}/edit`} 
                              className="action-button edit"
                            >
                              <FaEdit /> Edit
                            </Link>
                            <button 
                              onClick={() => handleDeleteQuestion(question._id)}
                              className="action-button delete"
                            >
                              <FaTrash /> Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'bookmarks' && (
            <div className="bookmarks-tab">
              <div className="tab-header">
                <h2>Your Bookmarks</h2>
              </div>
              
              {userBookmarks.length === 0 ? (
                <div className="empty-state">
                  <FaBookmark size={48} />
                  <h3>No bookmarks yet</h3>
                  <p>Save interesting questions to access them later!</p>
                  <Link to="/" className="browse-button">
                    Browse Questions
                  </Link>
                </div>
              ) : (
                <div className="bookmarks-list">
                  {userBookmarks.map(question => (
                    <div key={question._id} className="bookmark-item">
                      <div className="question-stats">
                        <div className="stat">
                          <FaArrowUp />
                          <span>{question.upvotes?.length || 0}</span>
                        </div>
                        <div className="stat">
                          <FaArrowDown />
                          <span>{question.downvotes?.length || 0}</span>
                        </div>
                        <div className="stat">
                          <FaEye />
                          <span>{question.views || 0}</span>
                        </div>
                      </div>
                      
                      <div className="question-content">
                        <h3>
                          <Link to={`/questions/${question._id}`}>
                            {question.title}
                          </Link>
                        </h3>
                        <div className="question-excerpt">
                          {question.description?.substring(0, 150)}...
                        </div>
                        <div className="question-tags">
                          {question.tags?.map(tag => (
                            <span key={tag._id || tag} className="tag">
                              {typeof tag === 'string' ? tag : tag.name}
                            </span>
                          ))}
                        </div>
                        <div className="question-meta">
                          <span className="author">
                            by {question.author?.username || 'Unknown'}
                          </span>
                          <span className="date">
                            {formatDate(question.createdAt)}
                          </span>
                          <button 
                            onClick={() => handleRemoveBookmark(question._id)}
                            className="remove-bookmark-button"
                          >
                            <FaBookmark /> Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
