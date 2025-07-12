import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import toast from '../../utils/toast';
import {
  FaArrowUp,
  FaArrowDown,
  FaCheck,
  FaBookmark,
  FaRegBookmark,
  FaEdit,
  FaTrash,
  FaReply,
  FaChevronDown,
  FaChevronUp
} from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import { questionService, answerService } from '../../services/api';
import RichTextEditor from '../../components/questions/RichTextEditor';
import './QuestionDetailPage.css';

const QuestionDetailPage = () => {
  const { id } = useParams();
  const { currentUser, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  
  const [question, setQuestion] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [newAnswer, setNewAnswer] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [sortOrder, setSortOrder] = useState('votes'); // 'votes', 'newest', 'oldest'
  const [showAllAnswers, setShowAllAnswers] = useState(false);
  
  useEffect(() => {
    const fetchQuestionAndAnswers = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const questionResponse = await questionService.getQuestion(id);
        const questionData = questionResponse.data.question;
        
        // Process question data to include vote count and user vote status
        const processedQuestion = {
          ...questionData,
          votes: questionData.voteCount || (questionData.upvotes?.length || 0) - (questionData.downvotes?.length || 0),
          userVote: questionData.isUpvoted ? 'up' : (questionData.isDownvoted ? 'down' : null)
        };
        
        setQuestion(processedQuestion);
        
        const answersResponse = await answerService.getAnswers(id, { sort: sortOrder });
        const processedAnswers = answersResponse.data.answers.map(answer => ({
          ...answer,
          votes: answer.voteCount || (answer.upvotes?.length || 0) - (answer.downvotes?.length || 0),
          userVote: answer.isUpvoted ? 'up' : (answer.isDownvoted ? 'down' : null)
        }));
        
        setAnswers(processedAnswers);
      } catch (err) {
        setError('Error loading question. It might have been removed or you may not have permission to view it.');
        console.error('Error fetching question:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchQuestionAndAnswers();
  }, [id, sortOrder]);
  
  const handleVoteQuestion = async (voteType) => {
    console.log('Vote attempt:', { 
      isAuthenticated, 
      currentUser, 
      token: localStorage.getItem('token'),
      refreshToken: localStorage.getItem('refreshToken')
    });
    
    if (!isAuthenticated) {
      toast.error('Please login to vote');
      return;
    }
    
    console.log('Voting on question:', { id, voteType, isAuthenticated, currentUser });
    
    try {
      const response = await questionService.voteQuestion(id, voteType);
      console.log('Vote response:', response.data);
      
      setQuestion({
        ...question,
        votes: response.data.upvotes - response.data.downvotes, // Calculate vote count
        upvotes: response.data.upvotes,
        downvotes: response.data.downvotes,
        userVote: response.data.isUpvoted ? 'up' : (response.data.isDownvoted ? 'down' : null)
      });
      toast.success(`Question ${voteType === 'upvote' ? 'upvoted' : 'downvoted'} successfully`);
    } catch (err) {
      console.error('Error voting on question:', err);
      console.error('Error response:', err.response?.data);
      
      // Check if it's an authentication error
      if (err.response?.status === 401) {
        toast.error('Your session has expired. Please login again.');
        // You might want to redirect to login page here
        // navigate('/login');
      } else {
        toast.error(err.response?.data?.message || 'Failed to vote');
      }
    }
  };
  
  const handleVoteAnswer = async (answerId, voteType) => {
    if (!isAuthenticated) {
      toast.error('Please login to vote');
      return;
    }
    
    try {
      const response = await answerService.voteAnswer(answerId, voteType);
      setAnswers(answers.map(answer => 
        answer._id === answerId 
          ? { 
              ...answer, 
              votes: response.data.voteCount,
              userVote: response.data.upvoted ? 'up' : (response.data.downvoted ? 'down' : null)
            } 
          : answer
      ));
      toast.success(`Answer ${voteType === 'upvote' ? 'upvoted' : 'downvoted'} successfully`);
    } catch (err) {
      console.error('Error voting on answer:', err);
      
      // Check if it's an authentication error
      if (err.response?.status === 401) {
        toast.error('Your session has expired. Please login again.');
        // You might want to redirect to login page here
        // navigate('/login');
      } else {
        toast.error(err.response?.data?.message || 'Failed to vote');
      }
    }
  };
  
  const handleBookmarkQuestion = async () => {
    if (!isAuthenticated) {
      toast.error('Please login to bookmark');
      return;
    }
    
    try {
      setLoading(true);
      const response = await questionService.bookmarkQuestion(id);
      setQuestion({
        ...question,
        isBookmarked: response.data.isBookmarked
      });
      toast.success(response.data.isBookmarked 
        ? 'Question bookmarked successfully' 
        : 'Bookmark removed successfully'
      );
    } catch (err) {
      console.error('Bookmark error:', err);
      if (err.message === 'Authentication required') {
        toast.error('Please login to bookmark this question');
      } else {
        toast.error(err.response?.data?.message || 'Failed to bookmark');
      }
    } finally {
      setLoading(false);
    }
  };
  
  const handleAcceptAnswer = async (answerId) => {
    if (!isAuthenticated || !question || question.author._id !== currentUser?._id) {
      toast.error('Only the question author can accept an answer');
      return;
    }
    
    try {
      const response = await answerService.acceptAnswer(answerId);
      
      // Update accepted answer in the question
      setQuestion({
        ...question,
        acceptedAnswer: response.data.accepted ? answerId : null
      });
      
      // Update the answer in the answers list
      setAnswers(answers.map(answer => 
        answer._id === answerId 
          ? { ...answer, isAccepted: response.data.accepted } 
          : { ...answer, isAccepted: false }
      ));
      
      toast.success(response.data.accepted 
        ? 'Answer accepted successfully' 
        : 'Answer unmarked as accepted'
      );
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to accept answer');
    }
  };
  
  const handleSubmitAnswer = async (e) => {
    e.preventDefault();
    
    if (!isAuthenticated) {
      toast.error('Please login to submit an answer');
      return;
    }
    
    if (!newAnswer || !newAnswer.trim()) {
      toast.error('Answer cannot be empty');
      return;
    }
    
    const sanitizedContent = newAnswer.trim();
    if (sanitizedContent.length < 20) {
      toast.error('Answer must be at least 20 characters long');
      return;
    }
    
    try {
      setSubmitting(true);
      
      const response = await answerService.createAnswer(id, sanitizedContent);
      
      // Add the new answer to the state with proper structure
      if (response.data && response.data.answer) {
        const newAnswerObj = response.data.answer;
        setAnswers([...answers, newAnswerObj]);
        setNewAnswer('');
        toast.success('Answer submitted successfully');
        
        // If showing only top answers, switch to showing all answers
        if (!showAllAnswers) {
          setShowAllAnswers(true);
          toast.info('Showing all answers including your new answer');
        }
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err) {
      console.error('Error submitting answer:', err);
      if (err.message === 'Authentication required') {
        toast.error('Please login to submit an answer');
      } else {
        toast.error(err.response?.data?.message || 'Failed to submit answer');
      }
    } finally {
      setSubmitting(false);
    }
  };
  
  const handleDeleteQuestion = async () => {
    if (!isAuthenticated || !question || question.author._id !== currentUser?._id) {
      toast.error('Only the question author can delete the question');
      return;
    }
    
    if (window.confirm('Are you sure you want to delete this question? This action cannot be undone.')) {
      try {
        await questionService.deleteQuestion(id);
        toast.success('Question deleted successfully');
        navigate('/');
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to delete question');
      }
    }
  };
  
  const handleEditQuestion = () => {
    navigate(`/questions/${id}/edit`);
  };
  
  const handleDeleteAnswer = async (answerId) => {
    if (!isAuthenticated) return;
    
    const answer = answers.find(a => a._id === answerId);
    if (!answer || answer.author._id !== currentUser?._id) {
      toast.error('Only the answer author can delete the answer');
      return;
    }
    
    if (window.confirm('Are you sure you want to delete this answer? This action cannot be undone.')) {
      try {
        await answerService.deleteAnswer(answerId);
        setAnswers(answers.filter(a => a._id !== answerId));
        toast.success('Answer deleted successfully');
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to delete answer');
      }
    }
  };
  
  const handleEditAnswer = (answerId) => {
    navigate(`/answers/${answerId}/edit`);
  };
  
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  if (loading) {
    return <div className="loading">Loading question...</div>;
  }
  
  if (error) {
    return <div className="error-message">{error}</div>;
  }
  
  if (!question) {
    return <div className="error-message">Question not found</div>;
  }

  return (
    <div className="question-detail-page">
      <div className="question-header">
        <h1 className="question-title">{question.title}</h1>
        <div className="question-meta">
          <div>
            <span className="meta-item">
              Asked {formatDate(question.createdAt)}
            </span>
            <span className="meta-item">
              Views {question.views}
            </span>
          </div>
          <div className="question-actions">
            {isAuthenticated && question.author._id === currentUser?._id && (
              <>
                <button className="action-btn edit" onClick={handleEditQuestion}>
                  <FaEdit /> Edit
                </button>
                <button className="action-btn delete" onClick={handleDeleteQuestion}>
                  <FaTrash /> Delete
                </button>
              </>
            )}
            <button 
              className={`action-btn bookmark ${question.isBookmarked ? 'active' : ''}`}
              onClick={handleBookmarkQuestion}
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner"></span> Processing...
                </>
              ) : (
                <>
                  {question.isBookmarked ? <FaBookmark /> : <FaRegBookmark />}
                  {question.isBookmarked ? 'Bookmarked' : 'Bookmark'}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
      
      <div className="question-container">
        <div className="vote-controls">
          <button 
            className={`vote-btn ${question.userVote === 'up' ? 'voted' : ''}`}
            onClick={() => handleVoteQuestion('upvote')}
            aria-label="Upvote"
          >
            <FaArrowUp />
          </button>
          <span className="vote-count">{question.votes}</span>
          <button 
            className={`vote-btn ${question.userVote === 'down' ? 'voted' : ''}`}
            onClick={() => handleVoteQuestion('downvote')}
            aria-label="Downvote"
          >
            <FaArrowDown />
          </button>
        </div>
        
        <div className="question-content">
          <div 
            className="content-body" 
            dangerouslySetInnerHTML={{ __html: question.description }}
          />
          
          <div className="tags-container">
            {question.tags.map(tag => {
              // Handle both string tags and object tags
              const tagName = typeof tag === 'string' ? tag : tag.name;
              const tagId = typeof tag === 'string' ? tag : tag._id || tag.name;
              
              return (
                <Link key={tagId} to={`/?tag=${tagName}`} className="tag">
                  {tagName}
                </Link>
              );
            })}
          </div>
          
          <div className="author-info">
            <span className="asked-by">
              Asked by <Link to={`/users/${question.author.username}`}>
                {question.author.username}
              </Link>
            </span>
          </div>
        </div>
      </div>
      
      <div className="answers-section">
        <div className="answers-header">
          <h2>{answers.length} {answers.length === 1 ? 'Answer' : 'Answers'}</h2>
          <div className="sort-options">
            <span>Sort by:</span>
            <button 
              className={`sort-btn ${sortOrder === 'votes' ? 'active' : ''}`}
              onClick={() => setSortOrder('votes')}
            >
              Votes
            </button>
            <button 
              className={`sort-btn ${sortOrder === 'newest' ? 'active' : ''}`}
              onClick={() => setSortOrder('newest')}
            >
              Newest
            </button>
            <button 
              className={`sort-btn ${sortOrder === 'oldest' ? 'active' : ''}`}
              onClick={() => setSortOrder('oldest')}
            >
              Oldest
            </button>
          </div>
        </div>
        
        {answers.length === 0 ? (
          <div className="no-answers">
            <p>There are no answers yet. Be the first to answer this question!</p>
          </div>
        ) : (
          <div className="answers-list">
            {/* Show either just the top answer or all answers based on state */}
            {(showAllAnswers ? answers : answers.slice(0, 1)).map(answer => (
              <div 
                key={answer._id} 
                className={`answer-container ${answer.isAccepted ? 'accepted' : ''}`}
              >
                <div className="vote-controls">
                  <button 
                    className={`vote-btn ${answer.userVote === 'up' ? 'voted' : ''}`}
                    onClick={() => handleVoteAnswer(answer._id, 'upvote')}
                    aria-label="Upvote"
                  >
                    <FaArrowUp />
                  </button>
                  <span className="vote-count">{answer.votes}</span>
                  <button 
                    className={`vote-btn ${answer.userVote === 'down' ? 'voted' : ''}`}
                    onClick={() => handleVoteAnswer(answer._id, 'downvote')}
                    aria-label="Downvote"
                  >
                    <FaArrowDown />
                  </button>
                  {question.author._id === currentUser?._id && (
                    <button 
                      className={`accept-btn ${answer.isAccepted ? 'accepted' : ''}`}
                      onClick={() => handleAcceptAnswer(answer._id)}
                      aria-label={answer.isAccepted ? 'Unmark as accepted' : 'Mark as accepted'}
                    >
                      <FaCheck />
                    </button>
                  )}
                </div>
                
                <div className="answer-content">
                  {answer.isAccepted && (
                    <div className="accepted-badge">
                      <FaCheck /> Accepted Answer
                    </div>
                  )}
                  
                  <div 
                    className="content-body" 
                    dangerouslySetInnerHTML={{ __html: answer.content }}
                  />
                  
                  <div className="answer-actions">
                    {isAuthenticated && answer.author._id === currentUser?._id && (
                      <>
                        <button 
                          className="action-btn edit" 
                          onClick={() => handleEditAnswer(answer._id)}
                        >
                          <FaEdit /> Edit
                        </button>
                        <button 
                          className="action-btn delete" 
                          onClick={() => handleDeleteAnswer(answer._id)}
                        >
                          <FaTrash /> Delete
                        </button>
                      </>
                    )}
                  </div>
                  
                  <div className="author-info">
                    <span className="answered-by">
                      Answered by <Link to={`/users/${answer.author.username}`}>
                        {answer.author.username}
                      </Link>
                    </span>
                    <span className="answer-date">
                      on {formatDate(answer.createdAt)}
                    </span>
                  </div>
                </div>
              </div>
            ))}

            {/* Toggle button to show/hide all answers */}
            {answers.length > 1 && (
              <button 
                className="toggle-answers-btn" 
                onClick={() => setShowAllAnswers(!showAllAnswers)}
              >
                {showAllAnswers ? (
                  <>
                    <FaChevronUp /> Show Less Answers
                  </>
                ) : (
                  <>
                    <FaChevronDown /> Show All {answers.length} Answers
                  </>
                )}
              </button>
            )}
          </div>
        )}
      </div>
      
      <div className="your-answer-section">
        <h2>Your Answer</h2>
        
        {isAuthenticated ? (
          <form onSubmit={handleSubmitAnswer}>
            <RichTextEditor value={newAnswer} onChange={setNewAnswer} disabled={submitting} />
            
            <button 
              type="submit" 
              className="submit-answer-btn" 
              disabled={submitting || !newAnswer.trim()}
            >
              {submitting ? (
                <>
                  <span className="spinner"></span> Submitting...
                </>
              ) : (
                <>
                  <FaReply /> Post Your Answer
                </>
              )}
            </button>
          </form>
        ) : (
          <div className="login-prompt">
            <p>
              You need to <Link to="/login">log in</Link> to post an answer.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuestionDetailPage;
