const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const sendOTPEmail = async (email, otp, name) => {
  const mailOptions = {
    from: `"AI Career Advisor" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Your OTP for AI Career Advisor',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: 'Segoe UI', Arial, sans-serif; background: #f0f4ff; margin: 0; padding: 0; }
          .container { max-width: 480px; margin: 40px auto; background: #fff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(37,99,235,0.10); }
          .header { background: linear-gradient(135deg, #1e40af 0%, #2563eb 100%); padding: 36px 32px 28px; text-align: center; }
          .header h1 { color: #fff; margin: 0; font-size: 24px; letter-spacing: -0.5px; }
          .header p { color: #bfdbfe; margin: 8px 0 0; font-size: 14px; }
          .body { padding: 36px 32px; }
          .otp-box { background: #eff6ff; border: 2px solid #2563eb; border-radius: 12px; text-align: center; padding: 20px; margin: 24px 0; }
          .otp { font-size: 42px; font-weight: 800; color: #1e40af; letter-spacing: 12px; }
          .note { color: #64748b; font-size: 13px; margin-top: 8px; }
          .footer { background: #f8faff; padding: 20px 32px; text-align: center; color: #94a3b8; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🚀 AI Career Advisor</h1>
            <p>Your personalized tech career mentor</p>
          </div>
          <div class="body">
            <p style="color:#1e293b; font-size:16px;">Hi <strong>${name}</strong>,</p>
            <p style="color:#475569; font-size:14px;">Use the OTP below to verify your email address. This code is valid for <strong>10 minutes</strong>.</p>
            <div class="otp-box">
              <div class="otp">${otp}</div>
              <div class="note">Do not share this code with anyone</div>
            </div>
            <p style="color:#94a3b8; font-size:13px;">If you didn't request this, please ignore this email.</p>
          </div>
          <div class="footer">
            © 2025 AI Career Advisor · All rights reserved
          </div>
        </div>
      </body>
      </html>
    `
  };

  await transporter.sendMail(mailOptions);
};

module.exports = { generateOTP, sendOTPEmail };
