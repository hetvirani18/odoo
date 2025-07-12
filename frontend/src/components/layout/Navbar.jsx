import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaBell, FaSearch, FaUser, FaSignOutAlt, FaBookmark, FaQuestion } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import './Navbar.css';

const Navbar = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  
  const { currentUser, isAuthenticated, logout } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  
  const navigate = useNavigate();

  // Handle search submit
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/?search=${searchQuery}`);
      setSearchQuery('');
    }
  };

  // Handle notification click
  const handleNotificationClick = (notification) => {
    markAsRead(notification._id);
    
    // Navigate to the relevant page based on notification type
    switch (notification.type) {
      case 'question_answer':
        navigate(`/questions/${notification.question._id}`);
        break;
      case 'answer_comment':
      case 'answer_accepted':
        navigate(`/questions/${notification.question._id}`);
        break;
      case 'mention':
        navigate(`/questions/${notification.question._id}`);
        break;
      default:
        navigate('/');
    }
    
    setShowNotifications(false);
  };

  // Format notification text
  const formatNotification = (notification) => {
    const sender = notification.sender.username;
    
    switch (notification.type) {
      case 'question_answer':
        return `${sender} answered your question: "${notification.question.title}"`;
      case 'answer_comment':
        return `${sender} commented on your answer`;
      case 'answer_accepted':
        return `${sender} accepted your answer`;
      case 'mention':
        return `${sender} mentioned you in a comment`;
      default:
        return 'New notification';
    }
  };

  // Format notification time
  const formatTime = (timestamp) => {
    const now = new Date();
    const date = new Date(timestamp);
    const diff = now - date;
    
    // Less than a minute
    if (diff < 60000) {
      return 'just now';
    }
    
    // Less than an hour
    if (diff < 3600000) {
      const minutes = Math.floor(diff / 60000);
      return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`;
    }
    
    // Less than a day
    if (diff < 86400000) {
      const hours = Math.floor(diff / 3600000);
      return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
    }
    
    // Less than a week
    if (diff < 604800000) {
      const days = Math.floor(diff / 86400000);
      return `${days} ${days === 1 ? 'day' : 'days'} ago`;
    }
    
    // Format as date
    return date.toLocaleDateString();
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-left">
          <Link to="/" className="navbar-logo">
            StackIt
          </Link>
        </div>

        <div className="navbar-center">
          <form onSubmit={handleSearchSubmit} className="search-form">
            <input
              type="text"
              placeholder="Search questions, tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
            <button type="submit" className="search-button">
              <FaSearch />
            </button>
          </form>
        </div>

        <div className="navbar-right">
          {isAuthenticated ? (
            <>
              <Link to="/ask" className="ask-button">
                Ask Question
              </Link>

              <div className="notification-container">
                <button
                  className="notification-button"
                  onClick={() => {
                    setShowNotifications(!showNotifications);
                    setShowDropdown(false);
                  }}
                >
                  <FaBell />
                  {unreadCount > 0 && (
                    <span className="notification-badge">{unreadCount}</span>
                  )}
                </button>

                {showNotifications && (
                  <div className="notification-dropdown">
                    <div className="notification-header">
                      <h3>Notifications</h3>
                      {unreadCount > 0 && (
                        <button
                          className="mark-all-read"
                          onClick={markAllAsRead}
                        >
                          Mark all as read
                        </button>
                      )}
                    </div>

                    <div className="notification-list">
                      {notifications.length > 0 ? (
                        notifications.map((notification) => (
                          <div
                            key={notification._id}
                            className={`notification-item ${
                              !notification.read ? 'unread' : ''
                            }`}
                            onClick={() => handleNotificationClick(notification)}
                          >
                            <div className="notification-content">
                              <p>{formatNotification(notification)}</p>
                              <span className="notification-time">
                                {formatTime(notification.createdAt)}
                              </span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="no-notifications">
                          No notifications yet
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="profile-container">
                <button
                  className="profile-button"
                  onClick={() => {
                    setShowDropdown(!showDropdown);
                    setShowNotifications(false);
                  }}
                >
                  {currentUser?.avatar ? (
                    <img
                      src={currentUser.avatar}
                      alt={currentUser.username}
                      className="avatar"
                    />
                  ) : (
                    <FaUser />
                  )}
                </button>

                {showDropdown && (
                  <div className="profile-dropdown">
                    <Link
                      to={`/users/${currentUser.username}`}
                      className="dropdown-item"
                      onClick={() => setShowDropdown(false)}
                    >
                      <FaUser /> Profile
                    </Link>
                    <Link
                      to="/bookmarks"
                      className="dropdown-item"
                      onClick={() => setShowDropdown(false)}
                    >
                      <FaBookmark /> Bookmarks
                    </Link>
                    <Link
                      to={`/users/${currentUser.username}?tab=questions`}
                      className="dropdown-item"
                      onClick={() => setShowDropdown(false)}
                    >
                      <FaQuestion /> My Questions
                    </Link>
                    <button
                      className="dropdown-item logout"
                      onClick={() => {
                        logout();
                        setShowDropdown(false);
                        navigate('/');
                      }}
                    >
                      <FaSignOutAlt /> Logout
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="auth-buttons">
              <Link to="/login" className="login-button">
                Log in
              </Link>
              <Link to="/register" className="register-button">
                Sign up
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
