import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail(options: EmailOptions) {
  try {
    const info = await transporter.sendMail({
      from: `Wet3 Camp <${process.env.EMAIL_USER}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
    });
    console.log('[v0] Email sent:', info.messageId);
    return true;
  } catch (error) {
    console.error('[v0] Email send error:', error);
    return false;
  }
}

export function getVerificationEmailHtml(
  username: string,
  verificationLink: string
) {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #8B0000, #FFD700); color: white; padding: 20px; text-align: center; border-radius: 5px; }
          .content { padding: 20px; background: #f5f5f5; margin-top: 20px; border-radius: 5px; }
          .button { background: #8B0000; color: white; padding: 10px 30px; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 20px; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to Wet3 Camp</h1>
          </div>
          <div class="content">
            <p>Hi ${username},</p>
            <p>Thank you for registering with Wet3 Camp! Please verify your email address to activate your account.</p>
            <a href="${verificationLink}" class="button">Verify Email</a>
            <p>Or copy this link: ${verificationLink}</p>
            <p>This link expires in 24 hours.</p>
          </div>
          <div class="footer">
            <p>&copy; 2024 Wet3 Camp. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;
}

export function getPasswordResetEmailHtml(
  username: string,
  resetLink: string
) {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #8B0000, #FFD700); color: white; padding: 20px; text-align: center; border-radius: 5px; }
          .content { padding: 20px; background: #f5f5f5; margin-top: 20px; border-radius: 5px; }
          .button { background: #8B0000; color: white; padding: 10px 30px; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 20px; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Password Reset Request</h1>
          </div>
          <div class="content">
            <p>Hi ${username},</p>
            <p>You requested to reset your password. Click the button below to create a new password.</p>
            <a href="${resetLink}" class="button">Reset Password</a>
            <p>Or copy this link: ${resetLink}</p>
            <p>This link expires in 1 hour. If you didn't request this, ignore this email.</p>
          </div>
          <div class="footer">
            <p>&copy; 2024 Wet3 Camp. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;
}
