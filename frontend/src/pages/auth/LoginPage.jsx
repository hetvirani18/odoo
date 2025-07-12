import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from '../../utils/toast';
import { FaUser, FaLock } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import { authService } from '../../services/api';
import './Auth.css';

const LoginPage = () => {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      console.log('Login attempt with:', data.email);
      const response = await authService.login(data);
      
      // Check if the account needs verification
      if (response.data.needsVerification) {
        console.log('Account needs verification, redirecting to OTP page');
        toast.info('Please verify your email address');
        
        // Include both userId and email in state
        navigate('/verify-otp', { 
          state: { 
            userId: response.data.userId,
            email: response.data.email || data.email
          } 
        });
        return;
      }
      
      // Normal login flow
      console.log('Login successful, processing token');
      await login(response.data);
      toast.success('Login successful!');
      
      // Add a small delay before navigation to ensure context is updated
      setTimeout(() => {
        navigate('/');
      }, 100);
    } catch (error) {
      console.error('Login error:', error);
      toast.error(error.response?.data?.message || 'Failed to login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <h1 className="auth-title">Login to StackIt</h1>
        <p className="auth-subtitle">
          Join the community of developers and help each other solve problems
        </p>

        <form className="auth-form" onSubmit={handleSubmit(onSubmit)}>
          <div className="form-group">
            <label htmlFor="email">
              <FaUser /> Email
            </label>
            <input
              type="email"
              id="email"
              placeholder="Enter your email"
              {...register('email', {
                required: 'Email is required',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Invalid email address'
                }
              })}
            />
            {errors.email && <span className="error-message">{errors.email.message}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="password">
              <FaLock /> Password
            </label>
            <input
              type="password"
              id="password"
              placeholder="Enter your password"
              {...register('password', { required: 'Password is required' })}
            />
            {errors.password && <span className="error-message">{errors.password.message}</span>}
          </div>

          <button type="submit" className="auth-button" disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <div className="auth-links">
          <p>
            Don't have an account? <Link to="/register">Sign up</Link>
          </p>
          <p>
            <Link to="/forgot-password">Forgot password?</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
