import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from '../utils/toast';
import { FaUser, FaLock, FaEnvelope, FaUserAlt } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/api';
import styles from '../styles/Auth.module.css';

const RegisterPage = () => {
  const { register, handleSubmit, watch, formState: { errors } } = useForm();
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  
  const password = watch('password');

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      console.log('Registration attempt with:', data.email);
      const response = await authService.register(data);
      console.log('Registration successful, response:', response.data);
      
      // Auto-login after registration
      await login(response.data);
      toast.success('Registration successful! Welcome to StackIt!');
      
      // Navigate to home page
      navigate('/');
    } catch (error) {
      console.error('Registration error:', error);
      console.error('Error response:', error.response);
      
      // Extract error message from response
      const errorMessage = error.response?.data?.message || 'Registration failed';
      console.log('Showing error message:', errorMessage);
      
      // Show specific error messages based on backend response
      if (errorMessage.includes('already exists') || errorMessage.includes('already registered')) {
        toast.error('User already exists with this email or username');
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.authContainer}>
      <div className={styles.authForm}>
        <h2>Create an Account</h2>
        <p className={styles.authSubtitle}>
          Join the community of developers
        </p>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className={styles.formGroup}>
            <label htmlFor="username">
              <FaUser /> Username
            </label>
            <input
              type="text"
              id="username"
              placeholder="Choose a username"
              className={styles.formInput}
              {...register('username', {
                required: 'Username is required',
                minLength: {
                  value: 3,
                  message: 'Username must be at least 3 characters'
                },
                maxLength: {
                  value: 20,
                  message: 'Username cannot exceed 20 characters'
                },
                pattern: {
                  value: /^[a-zA-Z0-9_-]+$/,
                  message: 'Username can only contain letters, numbers, underscores and hyphens'
                }
              })}
            />
            {errors.username && <span className={styles.errorMessage}>{errors.username.message}</span>}
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="email">
              <FaEnvelope /> Email
            </label>
            <input
              type="email"
              id="email"
              placeholder="Enter your email"
              className={styles.formInput}
              {...register('email', {
                required: 'Email is required',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Invalid email address'
                }
              })}
            />
            {errors.email && <span className={styles.errorMessage}>{errors.email.message}</span>}
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="name">
              <FaUserAlt /> Full Name (Optional)
            </label>
            <input
              type="text"
              id="name"
              placeholder="Enter your full name"
              className={styles.formInput}
              {...register('name')}
            />
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
              {...register('password', {
                required: 'Password is required',
                minLength: {
                  value: 8,
                  message: 'Password must be at least 8 characters'
                },
                pattern: {
                  value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
                  message: 'Password must contain at least one uppercase, lowercase, number and special character'
                }
              })}
            />
            {errors.password && <span className={styles.errorMessage}>{errors.password.message}</span>}
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="confirmPassword">
              <FaLock /> Confirm Password
            </label>
            <input
              type="password"
              id="confirmPassword"
              placeholder="Confirm your password"
              className={styles.formInput}
              {...register('confirmPassword', {
                required: 'Please confirm your password',
                validate: value => value === password || 'Passwords do not match'
              })}
            />
            {errors.confirmPassword && <span className={styles.errorMessage}>{errors.confirmPassword.message}</span>}
          </div>

          <button 
            type="submit" 
            className={styles.authButton} 
            disabled={loading}
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <div className={styles.authLinks}>
          <p>
            Already have an account?{' '}
            <Link to="/login" className={styles.authLink}>
              Sign in here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
