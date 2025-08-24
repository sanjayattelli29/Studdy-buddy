import express from 'express';
import { emailService } from '../services/emailService';

const router = express.Router();

interface MentionNotificationRequest {
  mentionedUserEmail: string;
  senderName: string;
  roomName: string;
  message: string;
  roomId: string;
}

// POST /api/send-mention-notification
router.post('/send-mention-notification', async (req, res) => {
  try {
    const {
      mentionedUserEmail,
      senderName,
      roomName,
      message,
      roomId
    }: MentionNotificationRequest = req.body;

    // Validate required fields
    if (!mentionedUserEmail || !senderName || !roomName || !message || !roomId) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['mentionedUserEmail', 'senderName', 'roomName', 'message', 'roomId']
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(mentionedUserEmail)) {
      return res.status(400).json({
        error: 'Invalid email format'
      });
    }

    // Send the email notification
    const success = await emailService.sendMentionNotification({
      to: mentionedUserEmail,
      senderName,
      roomName,
      message,
      roomId
    });

    if (success) {
      res.status(200).json({
        success: true,
        message: 'Mention notification sent successfully'
      });
    } else {
      res.status(500).json({
        error: 'Failed to send email notification'
      });
    }
  } catch (error) {
    console.error('Error in mention notification endpoint:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

// GET /api/test-email
router.get('/test-email', async (req, res) => {
  try {
    const isConnected = await emailService.testConnection();
    
    if (isConnected) {
      res.status(200).json({
        success: true,
        message: 'Email service is working correctly'
      });
    } else {
      res.status(500).json({
        error: 'Email service connection failed'
      });
    }
  } catch (error) {
    console.error('Error testing email service:', error);
    res.status(500).json({
      error: 'Failed to test email service'
    });
  }
});

export default router;
