const User = require('../models/User');
const { sendOTPEmail } = require('../services/emailService');

// Verify OTP
exports.verifyOTP = async (req, res) => {
  try {
    console.log('OTP verification request:', req.body);
    const { userId, otp } = req.body;

    // Check if required fields are provided
    if (!userId || !otp) {
      console.log('Missing required OTP verification fields:', { userId: !!userId, otp: !!otp });
      return res.status(400).json({
        success: false,
        message: 'User ID and OTP are required',
      });
    }

    // Find user
    const user = await User.findById(userId);
    if (!user) {
      console.log('User not found for OTP verification, ID:', userId);
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    console.log('User found for OTP verification:', {
      userId: user._id,
      hasOtpCode: !!user.otp.code,
      hasOtpExpiry: !!user.otp.expiresAt,
      isExpired: user.otp.expiresAt && new Date() > user.otp.expiresAt
    });

    // Check if OTP is valid
    const isValid = user.verifyOTP(otp);
    if (!isValid) {
      console.log('Invalid or expired OTP for user ID:', user._id);
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired OTP',
      });
    }

    console.log('OTP verified successfully for user ID:', user._id);

    // Mark user as verified and clear OTP
    user.isVerified = true;
    user.clearOTP();

    // Generate tokens
    const token = user.generateToken();
    const refreshToken = user.generateRefreshToken();
    
    // Save user with refresh token
    await user.save();
    console.log('User marked as verified and tokens generated');

    res.status(200).json({
      success: true,
      message: 'Email verified successfully',
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
    console.error('OTP verification error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Resend OTP
exports.resendOTP = async (req, res) => {
  try {
    console.log('Resend OTP request:', req.body);
    const { userId, email } = req.body;

    // Find user by ID or email
    let user;
    if (userId) {
      user = await User.findById(userId);
    } else if (email) {
      user = await User.findOne({ email });
    } else {
      console.log('No userId or email provided for resend OTP');
      return res.status(400).json({
        success: false,
        message: 'User ID or email is required',
      });
    }

    if (!user) {
      console.log('User not found for resend OTP');
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    console.log('User found for resend OTP:', { userId: user._id, email: user.email });

    // Check if user is already verified
    if (user.isVerified) {
      console.log('User is already verified:', user._id);
      return res.status(400).json({
        success: false,
        message: 'User is already verified',
      });
    }

    // Generate new OTP
    const otp = user.generateOTP();
    await user.save();
    console.log('New OTP generated for user:', user._id);

    // Send OTP email
    try {
      console.log('Sending OTP email to:', user.email);
      const emailSent = await sendOTPEmail(user.email, otp, user.username);

      if (!emailSent) {
        console.log('Failed to send OTP email');
        return res.status(500).json({
          success: false,
          message: 'Failed to send verification email',
        });
      }
      console.log('OTP email sent successfully');
    } catch (emailError) {
      console.error('Email error:', emailError);
      return res.status(500).json({
        success: false,
        message: 'Failed to send verification email: ' + emailError.message,
      });
    }

    res.status(200).json({
      success: true,
      message: 'OTP sent successfully',
      userId: user._id,
    });
  } catch (error) {
    console.error('Resend OTP error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
