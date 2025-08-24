const express = require('express');
const nodemailer = require('nodemailer');

// Ensure environment variables are loaded
require('dotenv').config();

const router = express.Router();

// Add CORS headers to all notification routes
router.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  next();
});

// Email configuration
const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASSWORD;

// Create transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASS,
  },
});

console.log("Email configuration:", {
  user: EMAIL_USER ? 'configured' : 'missing',
  pass: EMAIL_PASS ? 'configured' : 'missing'
});

// Verify email connection on startup
transporter.verify((error, success) => {
  if (error) {
    console.error('Email configuration error:', error);
  } else {
    console.log('Email server is ready to send messages');
  }
});

// Send mention notification endpoint
router.post('/send-mention', async (req, res) => {
  try {
    const {
      recipientEmail,
      mentionedByName,
      roomTitle,
      message,
      roomId
    } = req.body;

    // Validate required fields
    if (!recipientEmail || !mentionedByName || !roomTitle || !message) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['recipientEmail', 'mentionedByName', 'roomTitle', 'message']
      });
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(recipientEmail)) {
      return res.status(400).json({
        error: 'Invalid email address'
      });
    }

    console.log(`Sending mention notification to: ${recipientEmail}`);

    // Create email content
    const subject = `You were mentioned in ${roomTitle} - StudyBuddy`;
    
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 8px 8px 0 0;">
          <h1 style="color: white; margin: 0; text-align: center;">📚 StudyBuddy</h1>
        </div>
        
        <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 8px 8px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <h2 style="color: #2d3748; margin-bottom: 20px;">You were mentioned! 👋</h2>
          
          <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #667eea; margin-bottom: 20px;">
            <p style="color: #4a5568; margin: 0; font-size: 16px;">
              <strong>${mentionedByName}</strong> mentioned you in <strong>${roomTitle}</strong>
            </p>
          </div>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
            <h3 style="color: #2d3748; margin-top: 0; font-size: 16px;">Message:</h3>
            <p style="color: #4a5568; margin: 0; font-style: italic; line-height: 1.6;">
              "${message}"
            </p>
          </div>
          
          ${roomId ? `
          <div style="text-align: center;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:8081'}/study-room/${roomId}" 
               style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                      color: white; 
                      padding: 12px 24px; 
                      text-decoration: none; 
                      border-radius: 6px; 
                      display: inline-block; 
                      font-weight: bold;
                      margin-top: 10px;">
              Join the Discussion 🚀
            </a>
          </div>
          ` : ''}
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; text-align: center;">
            <p style="color: #718096; font-size: 14px; margin: 0;">
              This notification was sent because you were mentioned in a StudyBuddy study room.
            </p>
            <p style="color: #718096; font-size: 12px; margin: 5px 0 0 0;">
              StudyBuddy - Your collaborative study companion
            </p>
          </div>
        </div>
      </div>
    `;

    const textContent = `
You were mentioned in StudyBuddy!

${mentionedByName} mentioned you in "${roomTitle}"

Message: "${message}"

${roomId ? `Join the discussion: ${process.env.FRONTEND_URL || 'http://localhost:8081'}/study-room/${roomId}` : ''}

---
This notification was sent because you were mentioned in a StudyBuddy study room.
StudyBuddy - Your collaborative study companion
    `;

    // Send email
    const mailOptions = {
      from: `"StudyBuddy" <${EMAIL_USER}>`,
      to: recipientEmail,
      subject: subject,
      text: textContent,
      html: htmlContent,
    };

    const info = await transporter.sendMail(mailOptions);
    
    console.log('Mention notification sent successfully:', info.messageId);

    res.json({
      success: true,
      message: 'Mention notification sent successfully',
      messageId: info.messageId,
      recipient: recipientEmail
    });

  } catch (error) {
    console.error('Error sending mention notification:', error);
    res.status(500).json({
      error: 'Failed to send notification',
      message: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Send general notification endpoint
router.post('/send-notification', async (req, res) => {
  try {
    const {
      recipientEmail,
      subject,
      message,
      senderName,
      notificationType = 'general'
    } = req.body;

    // Validate required fields
    if (!recipientEmail || !subject || !message) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['recipientEmail', 'subject', 'message']
      });
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(recipientEmail)) {
      return res.status(400).json({
        error: 'Invalid email address'
      });
    }

    console.log(`Sending ${notificationType} notification to: ${recipientEmail}`);

    // Create email content
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 8px 8px 0 0;">
          <h1 style="color: white; margin: 0; text-align: center;">📚 StudyBuddy</h1>
        </div>
        
        <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 8px 8px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <h2 style="color: #2d3748; margin-bottom: 20px;">${subject}</h2>
          
          ${senderName ? `
          <div style="background: white; padding: 15px; border-radius: 8px; border-left: 4px solid #667eea; margin-bottom: 20px;">
            <p style="color: #4a5568; margin: 0; font-size: 14px;">
              From: <strong>${senderName}</strong>
            </p>
          </div>
          ` : ''}
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
            <div style="color: #4a5568; line-height: 1.6;">
              ${message.replace(/\n/g, '<br>')}
            </div>
          </div>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; text-align: center;">
            <p style="color: #718096; font-size: 14px; margin: 0;">
              This notification was sent from StudyBuddy.
            </p>
            <p style="color: #718096; font-size: 12px; margin: 5px 0 0 0;">
              StudyBuddy - Your collaborative study companion
            </p>
          </div>
        </div>
      </div>
    `;

    const textContent = `
${subject}

${senderName ? `From: ${senderName}\n` : ''}
${message}

---
This notification was sent from StudyBuddy.
StudyBuddy - Your collaborative study companion
    `;

    // Send email
    const mailOptions = {
      from: `"StudyBuddy" <${EMAIL_USER}>`,
      to: recipientEmail,
      subject: `${subject} - StudyBuddy`,
      text: textContent,
      html: htmlContent,
    };

    const info = await transporter.sendMail(mailOptions);
    
    console.log('Notification sent successfully:', info.messageId);

    res.json({
      success: true,
      message: 'Notification sent successfully',
      messageId: info.messageId,
      recipient: recipientEmail
    });

  } catch (error) {
    console.error('Error sending notification:', error);
    res.status(500).json({
      error: 'Failed to send notification',
      message: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Test endpoint
router.post('/test', async (req, res) => {
  try {
    const { recipientEmail } = req.body;

    if (!recipientEmail) {
      return res.status(400).json({
        error: 'recipientEmail is required for testing'
      });
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(recipientEmail)) {
      return res.status(400).json({
        error: 'Invalid email address'
      });
    }

    console.log(`Sending test email to: ${recipientEmail}`);

    const mailOptions = {
      from: `"StudyBuddy" <${EMAIL_USER}>`,
      to: recipientEmail,
      subject: 'StudyBuddy Email Test - Success! 🎉',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; text-align: center; padding: 20px;">
          <h1 style="color: #667eea;">✅ Email Test Successful!</h1>
          <p style="color: #4a5568; font-size: 18px;">StudyBuddy email notifications are working perfectly!</p>
          <p style="color: #718096;">Sent at: ${new Date().toLocaleString()}</p>
        </div>
      `,
      text: `✅ Email Test Successful!\n\nStudyBuddy email notifications are working perfectly!\nSent at: ${new Date().toLocaleString()}`
    };

    const info = await transporter.sendMail(mailOptions);
    
    console.log('Test email sent successfully:', info.messageId);

    res.json({
      success: true,
      message: 'Test email sent successfully',
      messageId: info.messageId,
      recipient: recipientEmail,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error sending test email:', error);
    res.status(500).json({
      error: 'Failed to send test email',
      message: error.message
    });
  }
});

module.exports = router;
