import nodemailer from 'nodemailer';

interface EmailNotificationData {
  to: string;
  senderName: string;
  roomName: string;
  message: string;
  roomId: string;
}

class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER || 'your-email@gmail.com',
        pass: process.env.EMAIL_PASSWORD || 'ojlj yifv ensn ygsg'
      }
    });
  }

  async sendMentionNotification(data: EmailNotificationData): Promise<boolean> {
    try {
      const mailOptions = {
        from: `StudyBuddy <${process.env.EMAIL_USER || 'your-email@gmail.com'}>`,
        to: data.to,
        subject: `You were mentioned in ${data.roomName} - StudyBuddy`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 20px;">
              <h1 style="color: white; margin: 0; font-size: 28px;">📚 StudyBuddy</h1>
              <p style="color: white; margin: 10px 0 0 0; opacity: 0.9;">You've been mentioned!</p>
            </div>
            
            <div style="background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
              <h2 style="color: #333; margin-bottom: 20px; font-size: 24px;">💬 New Mention</h2>
              
              <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; border-left: 4px solid #667eea; margin: 20px 0;">
                <p style="margin: 0; color: #555; font-size: 16px; line-height: 1.5;">
                  <strong>${data.senderName}</strong> mentioned you in <strong>${data.roomName}</strong>:
                </p>
                <p style="margin: 15px 0 0 0; color: #333; font-size: 16px; font-style: italic;">
                  "${data.message}"
                </p>
              </div>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="https://your-domain.com/room/${data.roomId}" 
                   style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                          color: white; 
                          padding: 15px 30px; 
                          text-decoration: none; 
                          border-radius: 25px; 
                          font-weight: bold; 
                          font-size: 16px;
                          display: inline-block;
                          transition: transform 0.2s ease;">
                  🚀 Join the Discussion
                </a>
              </div>
              
              <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; text-align: center;">
                <p style="color: #999; font-size: 14px; margin: 0;">
                  Don't want these notifications? 
                  <a href="#" style="color: #667eea; text-decoration: none;">Manage your preferences</a>
                </p>
              </div>
            </div>
            
            <div style="text-align: center; margin-top: 20px;">
              <p style="color: #999; font-size: 12px; margin: 0;">
                © 2025 StudyBuddy. Made with ❤️ for better learning.
              </p>
            </div>
          </div>
        `
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log('Email sent successfully:', result.messageId);
      return true;
    } catch (error) {
      console.error('Error sending email:', error);
      return false;
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      console.log('Email service is ready');
      return true;
    } catch (error) {
      console.error('Email service connection failed:', error);
      return false;
    }
  }
}

export const emailService = new EmailService();
