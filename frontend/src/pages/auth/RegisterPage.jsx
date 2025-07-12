import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from '../../utils/toast';
import { FaUser, FaLock, FaEnvelope, FaUserAlt } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import { authService } from '../../services/api';
import './Auth.css';

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
      toast.error(error.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <h1 className="auth-title">Create an Account</h1>
        <p className="auth-subtitle">
          Join the community of developers and help each other solve problems
        </p>

        <form className="auth-form" onSubmit={handleSubmit(onSubmit)}>
          <div className="form-group">
            <label htmlFor="username">
              <FaUser /> Username
            </label>
            <input
              type="text"
              id="username"
              placeholder="Choose a username"
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
            {errors.username && <span className="error-message">{errors.username.message}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="email">
              <FaEnvelope /> Email
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
              placeholder="Create a password"
              {...register('password', {
                required: 'Password is required',
                minLength: {
                  value: 8,
                  message: 'Password must be at least 8 characters'
                },
                pattern: {
                  value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
                  message: 'Password must contain at least one uppercase letter, one lowercase letter, one number and one special character'
                }
              })}
            />
            {errors.password && <span className="error-message">{errors.password.message}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">
              <FaLock /> Confirm Password
            </label>
            <input
              type="password"
              id="confirmPassword"
              placeholder="Confirm your password"
              {...register('confirmPassword', {
                required: 'Please confirm your password',
                validate: value => value === password || 'Passwords do not match'
              })}
            />
            {errors.confirmPassword && <span className="error-message">{errors.confirmPassword.message}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="name">
              <FaUserAlt /> Full Name (Optional)
            </label>
            <input
              type="text"
              id="name"
              placeholder="Enter your full name"
              {...register('name')}
            />
          </div>

          <button type="submit" className="auth-button" disabled={loading}>
            {loading ? 'Registering...' : 'Sign Up'}
          </button>
        </form>

        <div className="auth-links">
          <p>
            Already have an account? <Link to="/login">Log in</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
