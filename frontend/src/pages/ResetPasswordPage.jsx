import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import toast from '../utils/toast';
import { authService } from '../services/api';
import styles from '../styles/Auth.module.css';

const ResetPasswordPage = () => {
  const { resetToken } = useParams();
  const navigate = useNavigate();
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [tokenValid, setTokenValid] = useState(true);
  
  // Password validation
  const [passwordError, setPasswordError] = useState('');
  const validatePassword = (pass) => {
    if (pass.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      return false;
    }
    setPasswordError('');
    return true;
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate password
    if (!validatePassword(password)) {
      return;
    }
    
    // Check if passwords match
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    
    setLoading(true);
    
    try {
      await authService.resetPassword({ resetToken, password });
      setSuccess(true);
      toast.success('Password reset successful');
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to reset password');
      if (error.response?.status === 400) {
        setTokenValid(false);
      }
    } finally {
      setLoading(false);
    }
  };
  
  // Check if token is missing
  useEffect(() => {
    if (!resetToken) {
      setTokenValid(false);
    }
  }, [resetToken]);
  
  if (!tokenValid) {
    return (
      <div className={styles.authContainer}>
        <div className={styles.authForm}>
          <h2>Invalid Reset Link</h2>
          <p className={styles.errorMessage}>
            The password reset link is invalid or has expired.
          </p>
          <div className={styles.authLinks}>
            <Link to="/forgot-password" className={styles.authButton}>
              Request New Reset Link
            </Link>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className={styles.authContainer}>
      <div className={styles.authForm}>
        <h2>Reset Password</h2>
        
        {success ? (
          <>
            <div className={styles.successMessage}>
              <p>Your password has been reset successfully!</p>
              <p>You will be redirected to the login page in a few seconds...</p>
            </div>
            <div className={styles.authLinks}>
              <Link to="/login" className={styles.authLink}>
                Go to Login
              </Link>
            </div>
          </>
        ) : (
          <>
            <p className={styles.authSubtitle}>
              Enter your new password below.
            </p>
            
            <form onSubmit={handleSubmit}>
              <div className={styles.formGroup}>
                <label htmlFor="password">New Password</label>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    validatePassword(e.target.value);
                  }}
                  placeholder="Enter new password"
                  required
                />
                {passwordError && (
                  <p className={styles.fieldError}>{passwordError}</p>
                )}
              </div>
              
              <div className={styles.formGroup}>
                <label htmlFor="confirmPassword">Confirm Password</label>
                <input
                  type="password"
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  required
                />
                {password && confirmPassword && password !== confirmPassword && (
                  <p className={styles.fieldError}>Passwords do not match</p>
                )}
              </div>
              
              <button
                type="submit"
                className={styles.authButton}
                disabled={loading || !password || !confirmPassword}
              >
                {loading ? 'Resetting...' : 'Reset Password'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default ResetPasswordPage;
