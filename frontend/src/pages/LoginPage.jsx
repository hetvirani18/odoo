import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from '../utils/toast';
import { FaUser, FaLock } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/api';
import styles from '../styles/Auth.module.css';

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
      
      console.log('Login successful, processing token');
      const loginSuccess = await login(response.data);
      
      if (loginSuccess) {
        // Show success toast
        toast.success('Login successful!');
        
        // Small delay to allow toast to show before navigation
        setTimeout(() => {
          navigate('/');
        }, 100);
      }
    } catch (error) {
      console.error('Login error:', error);
      console.error('Error response:', error.response);
      
      // Extract error message from response
      const errorMessage = error.response?.data?.message || 'Login failed';
      console.log('Showing error message:', errorMessage);
      
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.authContainer}>
      <div className={styles.authForm}>
        <h2>Login to StackIt</h2>
        <p className={styles.authSubtitle}>
          Welcome back! Please sign in to your account
        </p>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className={styles.formGroup}>
            <label htmlFor="email">
              <FaUser /> Email or Username
            </label>
            <input
              type="text"
              id="email"
              placeholder="Enter your email or username"
              className={styles.formInput}
              {...register('email', {
                required: 'Email or username is required',
              })}
            />
            {errors.email && <span className={styles.errorMessage}>{errors.email.message}</span>}
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="password">
              <FaLock /> Password
            </label>
            <input
              type="password"
              id="password"
              placeholder="Enter your password"
              className={styles.formInput}
              {...register('password', { required: 'Password is required' })}
            />
            {errors.password && <span className={styles.errorMessage}>{errors.password.message}</span>}
          </div>

          <button 
            type="submit" 
            className={styles.authButton} 
            disabled={loading}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <div className={styles.authLinks}>
          <p>
            Don't have an account?{' '}
            <Link to="/register" className={styles.authLink}>
              Sign up here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
