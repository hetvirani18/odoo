const User = require('../models/UserNew');
const jwt = require('jsonwebtoken');

// Register a new user
exports.register = async (req, res) => {
  try {
    console.log('Registration request:', req.body);
    const { username, email, password, name } = req.body;

    // Validate required fields
    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username, email, and password are required',
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ 
      $or: [{ email }, { username }] 
    });

    if (existingUser) {
      let message = 'User already exists';
      if (existingUser.email === email && existingUser.username === username) {
        message = 'Both email and username are already taken';
      } else if (existingUser.email === email) {
        message = 'Email is already registered';
      } else {
        message = 'Username is already taken';
      }

      return res.status(400).json({
        success: false,
        message,
      });
    }

    // Create new user
    const user = await User.create({
      username,
      email,
      password,
      name: name || '',
    });

    console.log('User created successfully:', user._id);

    // Generate tokens
    const token = user.generateToken();
    const refreshToken = user.generateRefreshToken();
    
    // Save user with refresh token
    await user.save();

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      token,
      refreshToken,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        name: user.name,
        role: user.role,
        avatar: user.avatar,
        bio: user.bio,
        reputation: user.reputation,
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Registration failed',
    });
  }
};

// Login user
exports.login = async (req, res) => {
  try {
    console.log('Login request:', req.body);
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required',
      });
    }

    // Find user and include password
    const user = await User.findOne({
      $or: [
        { email: email.toLowerCase() },
        { username: email } // Allow login with username
      ]
    }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'No account found with this email or username',
      });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid password',
      });
    }

    console.log('Login successful for user:', user._id);

    // Clean up expired refresh tokens
    user.cleanupRefreshTokens();

    // Generate tokens
    const token = user.generateToken();
    const refreshToken = user.generateRefreshToken();
    
    // Save user with refresh token
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      refreshToken,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        name: user.name,
        role: user.role,
        avatar: user.avatar,
        bio: user.bio,
        reputation: user.reputation,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Login failed',
    });
  }
};

// Refresh token
exports.refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token is required',
      });
    }

    // Verify refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    
    // Find user and check if token exists
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid refresh token',
      });
    }

    // Check if refresh token exists in user's tokens
    const tokenExists = user.refreshTokens.some(t => t.token === refreshToken);
    if (!tokenExists) {
      return res.status(401).json({
        success: false,
        message: 'Invalid refresh token',
      });
    }

    // Generate new tokens
    const newToken = user.generateToken();
    const newRefreshToken = user.generateRefreshToken();
    
    // Remove old refresh token
    user.refreshTokens = user.refreshTokens.filter(t => t.token !== refreshToken);
    
    // Save user
    await user.save();

    res.status(200).json({
      success: true,
      token: newToken,
      refreshToken: newRefreshToken,
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(401).json({
      success: false,
      message: 'Invalid refresh token',
    });
  }
};

// Get current user
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        name: user.name,
        role: user.role,
        avatar: user.avatar,
        bio: user.bio,
        reputation: user.reputation,
      },
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get user',
    });
  }
};

// Logout user
exports.logout = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    
    if (refreshToken) {
      const user = await User.findById(req.user.id);
      if (user) {
        // Remove refresh token
        user.refreshTokens = user.refreshTokens.filter(t => t.token !== refreshToken);
        await user.save();
      }
    }

    res.status(200).json({
      success: true,
      message: 'Logout successful',
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Logout failed',
    });
  }
};
