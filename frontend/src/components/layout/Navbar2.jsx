import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaSearch, FaUser, FaSignOutAlt, FaBookmark, FaQuestion } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import './Navbar.css';

// Use named export instead of default export
export const Navbar = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  
  const { currentUser, isAuthenticated, logout } = useAuth();
  
  const navigate = useNavigate();

  // Handle search submit
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/?search=${searchQuery}`);
      setSearchQuery('');
    }
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <nav className="navbar">
      <div className="nav-container">
        <Link to="/" className="nav-logo">
          <FaQuestion className="logo-icon" />
          <span>StackIt</span>
        </Link>

        <form className="search-form" onSubmit={handleSearchSubmit}>
          <div className="search-container">
            <FaSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search questions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>
        </form>

        <div className="nav-actions">
          {isAuthenticated ? (
            <>
              <Link to="/ask" className="ask-question-btn">
                Ask Question
              </Link>

              <div className="nav-user-menu">
                <div 
                  className="user-avatar"
                  onClick={() => setShowDropdown(!showDropdown)}
                >
                  <FaUser className="avatar-icon" />
                  <span className="username">{currentUser?.username}</span>
                </div>

                {showDropdown && (
                  <div className="dropdown-menu">
                    <Link to="/profile" className="dropdown-item">
                      <FaUser className="dropdown-icon" />
                      Profile
                    </Link>
                    <Link to="/bookmarks" className="dropdown-item">
                      <FaBookmark className="dropdown-icon" />
                      Bookmarks
                    </Link>
                    <div className="dropdown-divider"></div>
                    <button 
                      onClick={handleLogout}
                      className="dropdown-item logout-btn"
                    >
                      <FaSignOutAlt className="dropdown-icon" />
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="auth-buttons">
              <Link to="/login" className="login-btn">
                Login
              </Link>
              <Link to="/register" className="register-btn">
                Sign Up
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

// Also include a default export for backward compatibility
export default Navbar;
