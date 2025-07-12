import { useState } from 'react';
import { Link } from 'react-router-dom';
import toast from '../utils/toast';
import { authService } from '../services/api';
import styles from '../styles/Auth.module.css';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email) {
      toast.error('Please enter your email');
      return;
    }
    
    setLoading(true);
    
    try {
      await authService.forgotPassword({ email });
      setSuccess(true);
      toast.success('Password reset email sent successfully');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className={styles.authContainer}>
      <div className={styles.authForm}>
        <h2>Forgot Password</h2>
        
        {success ? (
          <>
            <div className={styles.successMessage}>
              <p>Password reset instructions have been sent to your email.</p>
              <p>Please check your inbox and follow the instructions to reset your password.</p>
            </div>
            <div className={styles.authLinks}>
              <Link to="/login" className={styles.authLink}>
                Back to Login
              </Link>
            </div>
          </>
        ) : (
          <>
            <p className={styles.authSubtitle}>
              Enter your email address and we'll send you a link to reset your password.
            </p>
            
            <form onSubmit={handleSubmit}>
              <div className={styles.formGroup}>
                <label htmlFor="email">Email</label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                />
              </div>
              
              <button
                type="submit"
                className={styles.authButton}
                disabled={loading}
              >
                {loading ? 'Sending...' : 'Send Reset Link'}
              </button>
            </form>
            
            <div className={styles.authLinks}>
              <Link to="/login" className={styles.authLink}>
                Back to Login
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
