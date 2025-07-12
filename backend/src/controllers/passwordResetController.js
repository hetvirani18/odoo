const User = require('../models/User');
const { sendPasswordResetEmail } = require('../services/emailService');

// Forgot password - request reset
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    
    console.log('Password reset requested for email:', email);

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required',
      });
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      console.log('User not found for email:', email);
      return res.status(404).json({
        success: false,
        message: 'User with that email does not exist',
      });
    }

    console.log('User found, generating reset token for user ID:', user._id);
    
    // Generate reset token
    const resetToken = user.generateResetToken();
    await user.save();

    // Send reset email
    try {
      console.log('Sending reset email to:', user.email);
      const emailSent = await sendPasswordResetEmail(
        user.email,
        resetToken,
        user.username
      );

      if (!emailSent) {
        console.log('Email sending failed without exception');
        user.clearResetToken();
        await user.save();
        
        return res.status(500).json({
          success: false,
          message: 'Failed to send reset email',
        });
      }
      console.log('Reset email sent successfully');
    } catch (emailError) {
      console.error('Email error:', emailError);
      user.clearResetToken();
      await user.save();
      
      return res.status(500).json({
        success: false,
        message: 'Failed to send reset email: ' + emailError.message,
      });
    }

    res.status(200).json({
      success: true,
      message: 'Password reset email sent',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Reset password
exports.resetPassword = async (req, res) => {
  try {
    const { resetToken, password } = req.body;
    
    console.log('Password reset attempt with token:', resetToken ? 'provided' : 'missing');

    if (!resetToken || !password) {
      return res.status(400).json({
        success: false,
        message: 'Reset token and new password are required',
      });
    }

    // Find user with this token
    const user = await User.findOne({
      'resetPassword.token': { $exists: true },
    }).select('+resetPassword.token +resetPassword.expiresAt');

    if (!user) {
      console.log('No user found with an active reset token');
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token',
      });
    }

    // Verify token
    const isValid = user.verifyResetToken(resetToken);
    if (!isValid) {
      console.log('Reset token verification failed for user ID:', user._id);
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token',
      });
    }

    console.log('Reset token verified for user ID:', user._id);
    
    // Set new password and clear reset token
    user.password = password;
    user.clearResetToken();
    
    // Clean up refresh tokens for security
    user.refreshTokens = [];
    
    await user.save();
    console.log('Password updated successfully for user ID:', user._id);

    res.status(200).json({
      success: true,
      message: 'Password reset successful',
    });
  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
