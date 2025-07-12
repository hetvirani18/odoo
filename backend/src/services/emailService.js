const nodemailer = require('nodemailer');

// Create transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || 'gmail',
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT || '587', 10),
    secure: process.env.EMAIL_PORT === '465',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

// Send OTP email
exports.sendOTPEmail = async (email, otp, username) => {
  try {
    const transporter = createTransporter();
    
    // Verify transporter connection
    await transporter.verify();
    
    const message = {
      from: process.env.EMAIL_FROM || `StackIt <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'StackIt - Verify Your Email',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <h2 style="color: #333; text-align: center;">Welcome to StackIt!</h2>
          <p>Hello ${username},</p>
          <p>Thank you for registering with StackIt. To complete your registration, please verify your email using the following OTP:</p>
          <div style="background-color: #f5f5f5; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px; border-radius: 4px; margin: 20px 0;">
            ${otp}
          </div>
          <p>This OTP is valid for 10 minutes. If you didn't request this verification, please ignore this email.</p>
          <p>Best regards,<br>The StackIt Team</p>
        </div>
      `,
    };

    const info = await transporter.sendMail(message);
    console.log('Email sent:', info.messageId);
    return true;
  } catch (error) {
    console.error('Email sending error:', error);
    return false;
  }
};

// Send password reset email
exports.sendPasswordResetEmail = async (email, resetToken, username) => {
  try {
    const transporter = createTransporter();
    
    // Verify transporter connection
    await transporter.verify();
    
    const resetUrl = `${process.env.CORS_ORIGIN}/reset-password/${resetToken}`;
    
    const message = {
      from: process.env.EMAIL_FROM || `StackIt <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'StackIt - Reset Your Password',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <h2 style="color: #333; text-align: center;">Reset Your Password</h2>
          <p>Hello ${username},</p>
          <p>You requested to reset your password. Please click the button below to reset your password:</p>
          <div style="text-align: center; margin: 25px 0;">
            <a href="${resetUrl}" style="background-color: #4a6cf7; color: white; padding: 12px 25px; text-decoration: none; border-radius: 4px; font-weight: bold;">Reset Password</a>
          </div>
          <p>This link is valid for 1 hour. If you didn't request a password reset, please ignore this email.</p>
          <p>If the button above doesn't work, you can also copy and paste the following link into your browser:</p>
          <p style="word-break: break-all; font-size: 12px; color: #666;">${resetUrl}</p>
          <p>Best regards,<br>The StackIt Team</p>
        </div>
      `,
    };

    const info = await transporter.sendMail(message);
    console.log('Password reset email sent:', info.messageId);
    return true;
  } catch (error) {
    console.error('Password reset email sending error:', error);
    return false;
  }
};

module.exports = {
  sendOTPEmail: exports.sendOTPEmail,
  sendPasswordResetEmail: exports.sendPasswordResetEmail,
};
