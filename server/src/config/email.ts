import nodemailer from "nodemailer";
import { config } from "dotenv";

config();

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

export const sendEmail = async (to: string, subject: string, html: string) => {
  try {
    const info = await transporter.sendMail({
      from: `"AI Code Platform" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });

    console.log("Email sent:", info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("Error sending email:", error);
    return { success: false, error };
  }
};

export const emailTemplates = {
  welcome: (username: string) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Welcome to AI Code Generation Platform!</h2>
      <p>Hello ${username},</p>
      <p>Thank you for joining our platform. We're excited to help you generate code with AI.</p>
      <p>Get started by creating your first project and exploring our features.</p>
      <p>If you have any questions, please don't hesitate to contact our support team.</p>
      <p>Happy coding!</p>
      <p>The AI Code Platform Team</p>
    </div>
  `,
  loginAlert: (username: string, time: string, ip: string) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>New Login Detected</h2>
      <p>Hello ${username},</p>
      <p>We detected a new login to your AI Code Platform account:</p>
      <p><strong>Time:</strong> ${time}</p>
      <p><strong>IP Address:</strong> ${ip}</p>
      <p>If this was you, you can ignore this email. If you didn't log in at this time, please secure your account immediately.</p>
      <p>The AI Code Platform Team</p>
    </div>
  `,
  passwordReset: (username: string, resetLink: string) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Password Reset Request</h2>
      <p>Hello ${username},</p>
      <p>We received a request to reset your password. Please click the link below to create a new password:</p>
      <p><a href="${resetLink}" style="display: inline-block; background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">Reset Password</a></p>
      <p>This link will expire in 1 hour.</p>
      <p>If you didn't request this change, please ignore this email or contact support.</p>
      <p>The AI Code Platform Team</p>
    </div>
  `,
  subscriptionConfirmation: (username: string, planName: string) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Subscription Confirmed</h2>
      <p>Hello ${username},</p>
      <p>Thank you for subscribing to our ${planName} plan!</p>
      <p>You now have access to all premium features:</p>
      <ul>
        <li>Unlimited code generations</li>
        <li>Access to advanced templates</li>
        <li>Priority access to GPT-4 and Claude</li>
        <li>And more!</li>
      </ul>
      <p>If you have any questions about your subscription, please contact our support team.</p>
      <p>Happy coding!</p>
      <p>The AI Code Platform Team</p>
    </div>
  `,
};
