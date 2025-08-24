import { db } from '../lib/firebase';
import { doc, getDoc, collection, getDocs, query, where } from 'firebase/firestore';

interface User {
  uid: string;
  email: string;
  displayName: string;
}

interface MentionNotificationRequest {
  mentionedUserEmail: string;
  senderName: string;
  roomName: string;
  message: string;
  roomId: string;
}

class MentionService {
  // Extract mentions from message text (e.g., @john, @mary)
  extractMentions(message: string): string[] {
    const mentionRegex = /@(\w+)/g;
    const mentions: string[] = [];
    let match;
    
    while ((match = mentionRegex.exec(message)) !== null) {
      mentions.push(match[1].toLowerCase()); // Extract username without @
    }
    
    return [...new Set(mentions)]; // Remove duplicates
  }

  // Get room participants with their user details
  async getRoomParticipants(roomId: string): Promise<User[]> {
    try {
      // Get the study room
      const roomRef = doc(db, 'studyRooms', roomId);
      const roomDoc = await getDoc(roomRef);
      
      if (!roomDoc.exists()) {
        throw new Error('Room not found');
      }
      
      const roomData = roomDoc.data();
      const participantIds = roomData.participants || [];
      
      // Fetch user details for each participant
      const participants: User[] = [];
      
      for (const userId of participantIds) {
        try {
          const userRef = doc(db, 'users', userId);
          const userDoc = await getDoc(userRef);
          
          if (userDoc.exists()) {
            const userData = userDoc.data();
            participants.push({
              uid: userId,
              email: userData.email || 'No email',
              displayName: userData.displayName || userData.name || userData.email?.split('@')[0] || 'Anonymous'
            });
          } else {
            // If user document doesn't exist, try to get basic info from the room
            const participantName = userId === roomData.createdBy ? roomData.creatorName : 'Unknown User';
            participants.push({
              uid: userId,
              email: 'No email available',
              displayName: participantName || 'Anonymous'
            });
          }
        } catch (error) {
          console.error(`Error fetching user ${userId}:`, error);
          // Add a fallback user entry
          participants.push({
            uid: userId,
            email: 'No email available',
            displayName: 'Unknown User'
          });
        }
      }
      
      return participants;
    } catch (error) {
      console.error('Error fetching room participants:', error);
      return [];
    }
  }

  // Find mentioned users from the participants list
  findMentionedUsers(mentions: string[], participants: User[]): User[] {
    const mentionedUsers: User[] = [];
    
    for (const mention of mentions) {
      // Try to match by display name (case insensitive)
      const user = participants.find(p => 
        p.displayName.toLowerCase().includes(mention) ||
        p.displayName.toLowerCase().replace(/\s/g, '') === mention ||
        p.email.toLowerCase().split('@')[0] === mention
      );
      
      if (user) {
        mentionedUsers.push(user);
      }
    }
    
    return mentionedUsers;
  }

  // Send notification via API call to backend
  async sendMentionNotification(data: MentionNotificationRequest): Promise<boolean> {
    try {
      console.log('Sending mention notification:', data);
      
      // Get API URL from environment variables
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
      
      // Call backend-render API endpoint for notifications
      const response = await fetch(`${apiUrl}/notifications/send-mention`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recipientEmail: data.mentionedUserEmail,
          mentionedByName: data.senderName,
          roomTitle: data.roomName,
          message: data.message,
          roomId: data.roomId
        }),
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('Mention notification sent successfully:', result.messageId);
        return true;
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('Failed to send mention notification:', errorData.error || response.statusText);
        return false;
      }
    } catch (error) {
      console.error('Error sending mention notification:', error);
      return false;
    }
  }

  // Main function to process mentions in a message
  async processMentions(
    message: string, 
    roomId: string, 
    roomName: string,
    senderName: string
  ): Promise<void> {
    try {
      // Extract mentions from message
      const mentions = this.extractMentions(message);
      
      if (mentions.length === 0) {
        return; // No mentions found
      }
      
      // Get room participants
      const participants = await this.getRoomParticipants(roomId);
      
      // Find mentioned users
      const mentionedUsers = this.findMentionedUsers(mentions, participants);
      
      // Send notifications to mentioned users
      for (const user of mentionedUsers) {
        await this.sendMentionNotification({
          mentionedUserEmail: user.email,
          senderName,
          roomName,
          message,
          roomId
        });
      }
      
      if (mentionedUsers.length > 0) {
        console.log(`Sent ${mentionedUsers.length} mention notifications`);
      }
    } catch (error) {
      console.error('Error processing mentions:', error);
    }
  }
}

export const mentionService = new MentionService();
