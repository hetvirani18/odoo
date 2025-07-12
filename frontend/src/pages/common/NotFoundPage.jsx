import { Link } from 'react-router-dom';
import { FaExclamationTriangle, FaArrowLeft, FaHome, FaSearch } from 'react-icons/fa';
import './NotFoundPage.css';

const NotFoundPage = () => {
  return (
    <div className="not-found-page">
      <div className="not-found-container">
        <div className="error-icon">
          <FaExclamationTriangle />
        </div>
        <h1>404 - Page Not Found</h1>
        <p className="error-message">
          The page you are looking for might have been removed, had its name changed,
          or is temporarily unavailable.
        </p>
        
        <div className="suggestion-box">
          <h2>Here are some helpful links:</h2>
          <ul className="suggestion-links">
            <li>
              <Link to="/" className="suggestion-link">
                <FaHome /> Go to Home Page
              </Link>
            </li>
            <li>
              <Link to="/" className="suggestion-link">
                <FaSearch /> Search for Questions
              </Link>
            </li>
            <li>
              <button 
                onClick={() => window.history.back()} 
                className="suggestion-link back-button"
              >
                <FaArrowLeft /> Go Back
              </button>
            </li>
          </ul>
        </div>
        
        <div className="ask-question-prompt">
          <p>Can't find what you're looking for?</p>
          <Link to="/ask" className="ask-question-btn">
            Ask a New Question
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;
