import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import toast from '../utils/toast';
import { authService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import OtpInput from 'react-otp-input';
import styles from '../styles/Auth.module.css';

const VerifyOTPPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  
  // Get state from location
  const locationState = location.state || {};
  const [userId, setUserId] = useState(locationState.userId || null);
  const [email, setEmail] = useState(locationState.email || null);
  
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);
  
  console.log('VerifyOTPPage mounted with state:', { userId, email });
  
  // Redirect if no verification info
  useEffect(() => {
    if (!userId && !email) {
      console.log('Missing verification info, redirecting to register');
      toast.error('Missing verification information. Please try registering again.');
      navigate('/register');
    }
  }, [userId, email, navigate]);
  
  // Handle countdown timer
  useEffect(() => {
    let timer;
    if (countdown > 0 && !canResend) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    } else {
      setCanResend(true);
    }
    
    return () => clearTimeout(timer);
  }, [countdown, canResend]);
  
  // Handle OTP verification
  const handleVerifyOTP = useCallback(async (e) => {
    e.preventDefault();
    
    if (otp.length !== 6) {
      toast.error('Please enter a valid 6-digit OTP');
      return;
    }
    
    setLoading(true);
    
    try {
      console.log('Verifying OTP with:', { userId, otp });
      const response = await authService.verifyOTP({ userId, otp });
      console.log('OTP verification successful');
      
      // If successful, set auth context with user data
      const { token, refreshToken, user } = response.data;
      await login({ token, refreshToken, user });
      
      toast.success('Email verified successfully');
      
      // Add a small delay before navigation
      setTimeout(() => {
        navigate('/', { replace: true });
      }, 1000);
    } catch (error) {
      console.error('Verification error:', error);
      const errorMessage = error.response?.data?.message || 'Failed to verify OTP';
      toast.error(errorMessage);
      
      // If OTP is invalid, clear the input
      if (errorMessage.includes('Invalid') || errorMessage.includes('expired')) {
        setOtp('');
      }
    } finally {
      setLoading(false);
    }
  }, [userId, otp, login, navigate]);
  
  // Handle resend OTP
  const handleResendOTP = useCallback(async () => {
    if (!canResend) return;
    
    setLoading(true);
    setCanResend(false);
    
    try {
      // Send userId or email, depending on what we have
      const payload = userId ? { userId } : { email };
      console.log('Resending OTP with:', payload);
      
      const response = await authService.resendOTP(payload);
      
      // Update userId if returned in response
      if (response.data && response.data.userId && !userId) {
        setUserId(response.data.userId);
        console.log('Updated userId from response:', response.data.userId);
      }
      
      // Reset countdown
      setCountdown(60);
      
      toast.success('OTP has been resent to your email');
    } catch (error) {
      console.error('Resend error:', error);
      toast.error(error.response?.data?.message || 'Failed to resend OTP');
      setCanResend(true); // Allow retry immediately if failed
    } finally {
      setLoading(false);
    }
  }, [canResend, userId, email]);
  
  // If no verification info, render nothing (redirect happens in useEffect)
  if (!userId && !email) {
    return null;
  }
  
  return (
    <div className={styles.authContainer}>
      <div className={styles.authForm}>
        <h2>Verify Your Email</h2>
        <p className={styles.authSubtitle}>
          Enter the 6-digit OTP sent to your email
          {email && <span className={styles.emailHighlight}> {email}</span>}
        </p>
        
        <form onSubmit={handleVerifyOTP}>
          <div className={styles.otpContainer}>
            <OtpInput
              value={otp}
              onChange={setOtp}
              numInputs={6}
              renderSeparator={<span className={styles.otpSeparator}>-</span>}
              renderInput={(props) => <input {...props} />}
              inputStyle={styles.otpInputStyle}
            />
          </div>
          
          <button
            type="submit"
            className={styles.authButton}
            disabled={loading || otp.length !== 6}
          >
            {loading ? 'Verifying...' : 'Verify OTP'}
          </button>
        </form>
        
        <div className={styles.authLinks}>
          <p>
            Didn't receive the OTP?{' '}
            <button
              onClick={handleResendOTP}
              className={styles.textButton}
              disabled={loading || !canResend}
            >
              {canResend ? 'Resend OTP' : `Resend OTP (${countdown}s)`}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default VerifyOTPPage;