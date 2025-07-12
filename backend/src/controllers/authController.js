const User = require('../models/User');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { sendOTPEmail, sendPasswordResetEmail } = require('../services/emailService');

// Register a new user
exports.register = async (req, res) => {
  try {
    console.log('Registration request received:', req.body);
    const { username, email, password, name } = req.body;

    // Check if required fields are provided
    if (!username || !email || !password) {
      console.log('Missing required fields:', { username: !!username, email: !!email, password: !!password });
      return res.status(400).json({
        success: false,
        message: 'Please provide username, email and password',
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      console.log('User already exists:', { email: existingUser.email === email, username: existingUser.username === username });
      
      // Provide specific error message
      let errorMessage;
      if (existingUser.email === email && existingUser.username === username) {
        errorMessage = 'Both email and username are already registered. Please use different credentials or try to login.';
      } else if (existingUser.email === email) {
        errorMessage = 'This email is already registered. Please use a different email or try to login.';
      } else {
        errorMessage = 'This username is already taken. Please choose a different username.';
      }
        
      return res.status(400).json({
        success: false,
        message: errorMessage,
        isRegistered: true,
        emailExists: existingUser.email === email,
        usernameExists: existingUser.username === username
      });
    }

    // Create new user (not verified yet)
    const user = await User.create({
      username,
      email,
      password,
      isVerified: false,
      name: name || '', // Add optional name field
    });

    console.log('User created with ID:', user._id);

    // Generate OTP
    const otp = user.generateOTP();
    await user.save();
    console.log('OTP generated successfully');

    // Send OTP email
    try {
      console.log('Attempting to send email to:', email);
      const emailSent = await sendOTPEmail(email, otp, username);

      if (!emailSent) {
        console.log('Email sending failed with no exception');
        return res.status(500).json({
          success: false,
          message: 'Failed to send verification email',
        });
      }
      console.log('Email sent successfully');
    } catch (emailError) {
      console.error('Email error:', emailError);
      return res.status(500).json({
        success: false,
        message: 'Failed to send verification email: ' + emailError.message,
      });
    }

    res.status(201).json({
      success: true,
      message: 'Registration successful. Please verify your email with the OTP sent to your email address.',
      userId: user._id,
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Login user
exports.login = async (req, res) => {
  try {
    console.log('Login attempt:', req.body);
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required',
      });
    }

    // Check if user exists (allow login with email or username)
    const user = await User.findOne({
      $or: [
        { email: email.toLowerCase() },
        { username: email } // Allow login with username too
      ]
    }).select('+password');
    
    if (!user) {
      console.log('User not found for login:', email);
      return res.status(401).json({
        success: false,
        message: 'No account found with this email. Please check your email or register first.',
      });
    }

    console.log('User found, checking password for user ID:', user._id);
    
    // Check if password matches
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      console.log('Password mismatch for user ID:', user._id);
      return res.status(401).json({
        success: false,
        message: 'Wrong password. Please check your password and try again.',
      });
    }

    // Check if user is verified
    if (!user.isVerified) {
      console.log('Unverified user attempt to login, user ID:', user._id);
      
      // Generate new OTP for unverified user
      const otp = user.generateOTP();
      await user.save();
      
      // Send OTP email
      try {
        console.log('Sending verification OTP to:', user.email);
        const emailSent = await sendOTPEmail(user.email, otp, user.username);
        
        if (!emailSent) {
          console.log('Failed to send OTP email');
        } else {
          console.log('OTP email sent successfully');
        }
      } catch (emailError) {
        console.error('Error sending OTP email:', emailError);
      }

      return res.status(403).json({
        success: false,
        message: 'Email not verified. A new OTP has been sent to your email.',
        userId: user._id,
        needsVerification: true,
        email: user.email
      });
    }

    // Clean up expired refresh tokens
    user.cleanupRefreshTokens();

    // Generate tokens
    const token = user.generateToken();
    const refreshToken = user.generateRefreshToken();
    
    // Save user with refresh token
    await user.save();

    res.status(200).json({
      success: true,
      token,
      refreshToken,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        bio: user.bio,
        reputation: user.reputation,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get current user (profile)
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .populate('tags', 'name')
      .populate('following', 'username avatar')
      .populate('followers', 'username avatar')
      .populate({
        path: 'bookmarks',
        select: 'title tags createdAt',
        populate: {
          path: 'tags',
          select: 'name',
        },
      });

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
        role: user.role,
        avatar: user.avatar,
        bio: user.bio,
        reputation: user.reputation,
        tags: user.tags,
        following: user.following,
        followers: user.followers,
        bookmarks: user.bookmarks,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Refresh access token
exports.refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: 'Refresh token is required',
      });
    }

    // Verify the refresh token without JWT verification first
    let decoded;
    try {
      decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired refresh token',
      });
    }

    // Find the user and verify the token is in their list
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found',
      });
    }

    // Verify that this refresh token is still valid for this user
    const isValid = user.verifyRefreshToken(refreshToken);
    if (!isValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired refresh token',
      });
    }

    // Token is valid, remove the old token
    user.removeRefreshToken(refreshToken);

    // Generate new tokens
    const newToken = user.generateToken();
    const newRefreshToken = user.generateRefreshToken();

    // Save user with new refresh token
    await user.save();

    // Send new tokens
    return res.status(200).json({
      success: true,
      token: newToken,
      refreshToken: newRefreshToken,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Logout user
exports.logout = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    // If no refresh token, just return success (client-side cleanup)
    if (!refreshToken) {
      return res.status(200).json({
        success: true,
        message: 'Logged out successfully',
      });
    }

    // Find user by token
    try {
      const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
      const user = await User.findById(decoded.id);

      if (user) {
        // Remove the refresh token
        user.removeRefreshToken(refreshToken);
        await user.save();
      }
    } catch (error) {
      // Token is invalid, just continue
    }

    res.status(200).json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
