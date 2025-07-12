import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  FaArrowUp,
  FaArrowDown,
  FaCheck,
  FaBookmark,
  FaRegBookmark,
  FaEdit,
  FaTrash,
  FaReply
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
  const [error, setError] = useState(null);
  const [sortOrder, setSortOrder] = useState('votes'); // 'votes', 'newest', 'oldest'
  
  useEffect(() => {
    const fetchQuestionAndAnswers = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const questionResponse = await questionService.getQuestion(id);
        setQuestion(questionResponse.data.question);
        
        const answersResponse = await answerService.getAnswers(id, { sort: sortOrder });
        setAnswers(answersResponse.data.answers);
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
    if (!isAuthenticated) {
      toast.error('Please login to vote');
      return;
    }
    
    try {
      const response = await questionService.voteQuestion(id, voteType);
      setQuestion({
        ...question,
        votes: response.data.votes,
        userVote: response.data.userVote
      });
      toast.success(`Question ${voteType === 'up' ? 'upvoted' : 'downvoted'} successfully`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to vote');
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
          ? { ...answer, votes: response.data.votes, userVote: response.data.userVote } 
          : answer
      ));
      toast.success(`Answer ${voteType === 'up' ? 'upvoted' : 'downvoted'} successfully`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to vote');
    }
  };
  
  const handleBookmarkQuestion = async () => {
    if (!isAuthenticated) {
      toast.error('Please login to bookmark');
      return;
    }
    
    try {
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
      toast.error(err.response?.data?.message || 'Failed to bookmark');
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
    
    if (!newAnswer.trim()) {
      toast.error('Answer cannot be empty');
      return;
    }
    
    try {
      const response = await answerService.createAnswer(id, newAnswer);
      setAnswers([...answers, response.data.answer]);
      setNewAnswer('');
      toast.success('Answer submitted successfully');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit answer');
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
            >
              {question.isBookmarked ? <FaBookmark /> : <FaRegBookmark />}
              {question.isBookmarked ? 'Bookmarked' : 'Bookmark'}
            </button>
          </div>
        </div>
      </div>
      
      <div className="question-container">
        <div className="vote-controls">
          <button 
            className={`vote-btn ${question.userVote === 'up' ? 'voted' : ''}`}
            onClick={() => handleVoteQuestion('up')}
            aria-label="Upvote"
          >
            <FaArrowUp />
          </button>
          <span className="vote-count">{question.votes}</span>
          <button 
            className={`vote-btn ${question.userVote === 'down' ? 'voted' : ''}`}
            onClick={() => handleVoteQuestion('down')}
            aria-label="Downvote"
          >
            <FaArrowDown />
          </button>
        </div>
        
        <div className="question-content">
          <div 
            className="content-body" 
            dangerouslySetInnerHTML={{ __html: question.content }}
          />
          
          <div className="tags-container">
            {question.tags.map(tag => (
              <Link key={tag} to={`/?tag=${tag}`} className="tag">
                {tag}
              </Link>
            ))}
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
            {answers.map(answer => (
              <div 
                key={answer._id} 
                className={`answer-container ${answer.isAccepted ? 'accepted' : ''}`}
              >
                <div className="vote-controls">
                  <button 
                    className={`vote-btn ${answer.userVote === 'up' ? 'voted' : ''}`}
                    onClick={() => handleVoteAnswer(answer._id, 'up')}
                    aria-label="Upvote"
                  >
                    <FaArrowUp />
                  </button>
                  <span className="vote-count">{answer.votes}</span>
                  <button 
                    className={`vote-btn ${answer.userVote === 'down' ? 'voted' : ''}`}
                    onClick={() => handleVoteAnswer(answer._id, 'down')}
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
          </div>
        )}
      </div>
      
      <div className="your-answer-section">
        <h2>Your Answer</h2>
        
        {isAuthenticated ? (
          <form onSubmit={handleSubmitAnswer}>
            <RichTextEditor value={newAnswer} onChange={setNewAnswer} />
            
            <button type="submit" className="submit-answer-btn">
              <FaReply /> Post Your Answer
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
