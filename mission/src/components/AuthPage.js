import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/AuthStyles.css';

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true); // a check mark for toggle between login and signup forms
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  // login form state
  const [loginData, setLoginData] = useState({
    username: '',
    password: '',
  });

  // signup form state
  const [signupData, setSignupData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
  });

  const handleLoginChange = (e) => {
    const { name, value } = e.target;
    setLoginData({ ...loginData, [name]: value });
  };

  const handleSignupChange = (e) => {
    const { name, value } = e.target;
    setSignupData({ ...signupData, [name]: value });
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:8000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(loginData),
      });
      // in backend, we check to see if the username and password match
      // when they do, we will get a token back from the server

      const data = await response.json();

      // Here we will handle the error responses
      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      // login Succeed!!! //
      // store token in localStorage
      localStorage.setItem('token', data.token);
      localStorage.setItem('userId', data.userId);

      // redirect to chat page
      navigate('/chat');
    } catch (err) {
      setError(err.message || 'An error occurred during login');
    } finally {
      setIsLoading(false);
    }
  };

  // we make an API call to the server to create a new user
  const handleSignupSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // basic check in frontend before sending to server
    if (signupData.password !== signupData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }


    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:8000/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: signupData.username,
          password: signupData.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Signup failed');
      }

      // auto-login after successful signup
      localStorage.setItem('token', data.token);
      localStorage.setItem('userId', data.userId);

      //rdirect to chat page
      navigate('/chat');
    } catch (err) {
      setError(err.message || 'An error occurred during signup');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    // same for both formats
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-toggle">
          <button 
            className={`toggle-btn ${isLogin ? 'active' : ''}`} 
            onClick={() => setIsLogin(true)}
          >
            Login
          </button>
          <button 
            className={`toggle-btn ${!isLogin ? 'active' : ''}`} 
            onClick={() => setIsLogin(false)}
          >
            Sign Up
          </button>
        </div>

        <h1 className="auth-title">
          {isLogin ? 'Welcome Back' : 'Create Account'}
        </h1>

        {error && <div className="auth-error">{error}</div>}

      
        {isLogin ? (
          // login Form
          <form onSubmit={handleLoginSubmit} className="auth-form">
            <div className="form-group">
              <label htmlFor="login-email">Username</label>
              <input
                type="text"
                id="username"
                name="username"
                value={loginData.username}
                onChange={handleLoginChange}
                required
                placeholder="Enter your username"
              />
            </div>

            <div className="form-group">
              <label htmlFor="login-password">Password</label>
              <input
                type="password"
                id="login-password"
                name="password"
                value={loginData.password}
                onChange={handleLoginChange}
                required
                placeholder="Enter your password"
              />
            </div>

            <button 
              type="submit" 
              className="auth-button" 
              disabled={isLoading}
            >
              {isLoading ? 'Logging in...' : 'Log In'}
            </button>
          </form>
        ) : (
          // signup form when isLogin is false
          <form onSubmit={handleSignupSubmit} className="auth-form">
            <div className="form-group">
              <label htmlFor="signup-username">Username</label>
              <input
                type="text"
                id="signup-username"
                name="username"
                value={signupData.username}
                onChange={handleSignupChange}
                required
                placeholder="Choose a username"
              />
            </div>

            <div className="form-group">
              <label htmlFor="signup-password">Password</label>
              <input
                type="password"
                id="signup-password"
                name="password"
                value={signupData.password}
                onChange={handleSignupChange}
                required
                placeholder="Create a password"
              />
            </div>

            <div className="form-group">
              <label htmlFor="signup-confirm-password">Confirm Password</label>
              <input
                type="password"
                id="signup-confirm-password"
                name="confirmPassword"
                value={signupData.confirmPassword}
                onChange={handleSignupChange}
                required
                placeholder="Confirm your password"
              />
            </div>

            <button 
              type="submit" 
              className="auth-button" 
              disabled={isLoading}
            >
              {isLoading ? 'Creating Account...' : 'Sign Up'}
            </button>
          </form>
        )}
      
      </div>
    </div>
  );
};

export default AuthPage;