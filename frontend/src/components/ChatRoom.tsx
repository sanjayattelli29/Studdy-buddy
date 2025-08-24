import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  collection, 
  addDoc, 
  serverTimestamp, 
  query, 
  orderBy, 
  onSnapshot, 
  limit, 
  Timestamp,
  doc,
  setDoc
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { mentionService } from '../services/mentionService';
import './ChatRoom.css';
import { Video, Image, Phone, Users } from 'lucide-react';
import VideoCallComponent from './VideoCall';

interface Message {
  id: string;
  text: string;
  userId: string;
  userName: string;
  userPhotoURL: string | null;
  createdAt: Timestamp;
  imageUrl?: string;
}

interface ChatRoomProps {
  roomId: string;
  roomName?: string;
}

const ChatRoom: React.FC<ChatRoomProps> = ({ roomId, roomName }) => {
  const { currentUser, userProfile } = useAuth();
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [showVideoCall, setShowVideoCall] = useState(false);
  const [isInVideoCall, setIsInVideoCall] = useState(false);
  const [hasActiveCall, setHasActiveCall] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  
  // Mention autocomplete states
  const [showMentionDropdown, setShowMentionDropdown] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [roomParticipants, setRoomParticipants] = useState<{uid: string, displayName: string, email: string}[]>([]);
  const [filteredParticipants, setFilteredParticipants] = useState<{uid: string, displayName: string, email: string}[]>([]);
  const [selectedMentionIndex, setSelectedMentionIndex] = useState(0);
  const [showMentionHelp, setShowMentionHelp] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Load room participants for mention autocomplete
  useEffect(() => {
    if (!roomId) return;

    const loadParticipants = async () => {
      try {
        const participants = await mentionService.getRoomParticipants(roomId);
        // Filter out current user from mentions
        const otherParticipants = participants.filter(p => p.uid !== currentUser?.uid);
        setRoomParticipants(otherParticipants);
      } catch (error) {
        console.error('Error loading room participants:', error);
      }
    };

    loadParticipants();
  }, [roomId, currentUser?.uid]);

  // Check for active calls in the room
  useEffect(() => {
    if (!roomId) return;
    
    // Import dynamically to avoid circular dependencies
    import('./VideoCall/VideoCallService').then(({ VideoCallService }) => {
      // Initial check - silently handle errors
      VideoCallService.hasActiveCall(roomId)
        .then(hasCall => setHasActiveCall(hasCall))
        .catch(err => {
          console.error('Error checking for active calls:', err);
          // Keep hasActiveCall as false and continue
        });
      
      // Try to subscribe to active callers
      try {
        const unsubscribe = VideoCallService.subscribeToActiveCallers(
          roomId,
          (activeCallers) => {
            setHasActiveCall(activeCallers.length > 0);
          }
        );
        
        return () => {
          try {
            unsubscribe();
          } catch (err) {
            console.error('Error unsubscribing from active callers:', err);
          }
        };
      } catch (err) {
        console.error('Error subscribing to active callers:', err);
        // Return empty cleanup function if subscription fails
        return () => {};
      }
    });
  }, [roomId]);

  // Load messages
  useEffect(() => {
    if (!roomId) return;

    setIsLoading(true);
    const messagesRef = collection(db, 'studyRooms', roomId, 'messages');
    const q = query(messagesRef, orderBy('createdAt', 'asc'), limit(100));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      try {
        const loadedMessages: Message[] = [];
        snapshot.forEach((doc) => {
          loadedMessages.push({
            id: doc.id,
            ...doc.data()
          } as Message);
        });
        setMessages(loadedMessages);
        setIsLoading(false);
      } catch (err) {
        console.error('Error loading messages:', err);
        setError('Failed to load messages');
        setIsLoading(false);
      }
    }, (err) => {
      console.error('Error subscribing to messages:', err);
      setError('Failed to subscribe to chat messages');
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [roomId]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim() || !currentUser || !roomId) return;
    
    try {
      const messagesRef = collection(db, 'studyRooms', roomId, 'messages');
      await addDoc(messagesRef, {
        text: message,
        userId: currentUser.uid,
        userName: userProfile?.displayName || 'Anonymous',
        userPhotoURL: userProfile?.photoURL || null,
        createdAt: serverTimestamp()
      });
      
      // Process mentions for email notifications
      const senderName = userProfile?.displayName || 'Anonymous';
      const currentRoomName = roomName || 'Study Room';
      
      // Process mentions asynchronously (don't block message sending)
      mentionService.processMentions(message, roomId, currentRoomName, senderName)
        .catch(error => console.error('Error processing mentions:', error));
      
      setMessage('');
    } catch (err) {
      console.error('Error sending message:', err);
      setError('Failed to send message');
    }
  };

  const formatTime = (timestamp: Timestamp) => {
    if (!timestamp) return '';
    
    const date = timestamp.toDate();
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const renderMessageWithMentions = (text: string) => {
    const mentionRegex = /@(\w+)/g;
    const parts = text.split(mentionRegex);
    
    return parts.map((part, index) => {
      if (index % 2 === 1) {
        // This is a mention (every odd index after split)
        return (
          <span key={index} className="mention">
            @{part}
          </span>
        );
      }
      return part;
    });
  };

  // Handle message input changes and mention detection
  const handleMessageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setMessage(value);

    // Check for mention trigger (@)
    const cursorPosition = e.target.selectionStart || 0;
    const textBeforeCursor = value.substring(0, cursorPosition);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');
    
    if (lastAtIndex !== -1) {
      const textAfterAt = textBeforeCursor.substring(lastAtIndex + 1);
      
      // Check if we're in a mention (no spaces after @)
      if (!textAfterAt.includes(' ') && textAfterAt.length >= 0) {
        setMentionQuery(textAfterAt.toLowerCase());
        setSelectedMentionIndex(0);
        
        // Filter participants based on query
        const filtered = roomParticipants.filter(participant =>
          participant.displayName.toLowerCase().includes(textAfterAt.toLowerCase()) ||
          participant.email.toLowerCase().includes(textAfterAt.toLowerCase())
        );
        setFilteredParticipants(filtered);
        
        // Show dropdown if we have participants or show help if no participants
        if (filtered.length > 0 || roomParticipants.length === 0) {
          setShowMentionDropdown(true);
          setShowMentionHelp(roomParticipants.length === 0);
        } else {
          setShowMentionDropdown(false);
          setShowMentionHelp(false);
        }
      } else {
        setShowMentionDropdown(false);
        setShowMentionHelp(false);
      }
    } else {
      setShowMentionDropdown(false);
      setShowMentionHelp(false);
    }
  };

  // Handle keyboard navigation in mention dropdown
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showMentionDropdown) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedMentionIndex(prev => 
          prev < filteredParticipants.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedMentionIndex(prev => 
          prev > 0 ? prev - 1 : filteredParticipants.length - 1
        );
        break;
      case 'Enter':
        if (filteredParticipants.length > 0) {
          e.preventDefault();
          selectMention(filteredParticipants[selectedMentionIndex]);
        }
        break;
      case 'Escape':
        setShowMentionDropdown(false);
        break;
    }
  };

  // Select a user from mention dropdown
  const selectMention = (participant: {uid: string, displayName: string, email: string}) => {
    const input = inputRef.current;
    if (!input) return;

    const cursorPosition = input.selectionStart || 0;
    const textBeforeCursor = message.substring(0, cursorPosition);
    const textAfterCursor = message.substring(cursorPosition);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');
    
    if (lastAtIndex !== -1) {
      const beforeAt = textBeforeCursor.substring(0, lastAtIndex);
      const newMessage = beforeAt + `@${participant.displayName} ` + textAfterCursor;
      setMessage(newMessage);
      
      // Set cursor position after the mention
      setTimeout(() => {
        const newCursorPos = beforeAt.length + participant.displayName.length + 2;
        input.setSelectionRange(newCursorPos, newCursorPos);
        input.focus();
      }, 0);
    }
    
    setShowMentionDropdown(false);
  };

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentUser || !roomId) return;
    
    // Only accept images
    if (!file.type.startsWith('image/')) {
      setError('Only image files are supported.');
      return;
    }
    
    try {
      setUploadingImage(true);
      
      // Simple placeholder for upload - in a real app, upload to Cloudinary or Firebase Storage
      // For now we'll use a data URL for the demo
      const reader = new FileReader();
      reader.onload = async (event) => {
        const imageUrl = event.target?.result as string;
        
        // Send message with image
        const messagesRef = collection(db, 'studyRooms', roomId, 'messages');
        await addDoc(messagesRef, {
          text: message || '📷 Image',
          userId: currentUser.uid,
          userName: userProfile?.displayName || 'Anonymous',
          userPhotoURL: userProfile?.photoURL || null,
          createdAt: serverTimestamp(),
          imageUrl
        });
        
        setMessage('');
        setUploadingImage(false);
      };
      
      reader.readAsDataURL(file);
    } catch (err) {
      console.error('Error uploading image:', err);
      setError('Failed to upload image');
      setUploadingImage(false);
    }
  };

  const handleVideoCall = () => {
    setIsInVideoCall(true);
    setShowVideoCall(true);
  };

  const endVideoCall = () => {
    setIsInVideoCall(false);
    setShowVideoCall(false);
  };

  return (
    <div className="chat-container">
      <div className="chat-header">
        <h2>Group Chat</h2>
        <div className="chat-actions">
          <button 
            className={`chat-action-btn ${hasActiveCall && !isInVideoCall ? 'active-call' : ''}`}
            onClick={handleVideoCall}
            title={hasActiveCall ? "Join active video call" : "Start video call"}
          >
            {hasActiveCall && !isInVideoCall ? (
              <>
                <span className="call-indicator"></span>
                <Video size={18} />
              </>
            ) : (
              <Video size={18} />
            )}
          </button>
        </div>
      </div>
      
      {/* Video Call Overlay */}
      {isInVideoCall && (
        <div className="video-call-wrapper">
          <VideoCallComponent 
            roomId={roomId} 
            onEndCall={endVideoCall}
          />
        </div>
      )}
      
      {!isInVideoCall && (
        <>
          <div className="chat-messages">
            {isLoading ? (
              <div className="chat-loading">Loading messages...</div>
            ) : error ? (
              <div className="chat-error">{error}</div>
            ) : messages.length === 0 ? (
              <div className="chat-empty">No messages yet. Start the conversation!</div>
            ) : (
              messages.map((msg) => (
                <div 
                  key={msg.id} 
                  className={`chat-message ${msg.userId === currentUser?.uid ? 'own-message' : ''}`}
                >
                  <div className="message-avatar">
                    {msg.userPhotoURL ? (
                      <img src={msg.userPhotoURL} alt={msg.userName} />
                    ) : (
                      <div className="default-avatar">
                        {msg.userName.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div className="message-content">
                    <div className="message-header">
                      <span className="message-author">{msg.userName}</span>
                      <span className="message-time">{formatTime(msg.createdAt)}</span>
                    </div>
                    <div className="message-text">{renderMessageWithMentions(msg.text)}</div>
                    {msg.imageUrl && (
                      <div className="message-image">
                        <img src={msg.imageUrl} alt="Shared" />
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>
          
          <form className="chat-input-form" onSubmit={handleSendMessage}>
            <button 
              className="chat-action-btn attach-button"
              onClick={handleImageClick}
              title="Attach image"
              type="button"
            >
              <Image size={20} />
            </button>
            <div className="input-container">
              <input
                ref={inputRef}
                type="text"
                value={message}
                onChange={handleMessageChange}
                onKeyDown={handleKeyDown}
                placeholder="Type your message... Use @ to mention users"
                disabled={!currentUser || uploadingImage}
                title="Type @ to mention other participants in the room"
              />
              
              {/* Mention Dropdown */}
              {showMentionDropdown && (
                <div className="mention-dropdown">
                  {showMentionHelp ? (
                    <div className="mention-help">
                      <div className="mention-help-icon">💬</div>
                      <div className="mention-help-text">
                        <div className="mention-help-title">No other participants yet</div>
                        <div className="mention-help-subtitle">Invite others to join this room to mention them!</div>
                      </div>
                    </div>
                  ) : filteredParticipants.length > 0 ? (
                    filteredParticipants.map((participant, index) => (
                      <div
                        key={participant.uid}
                        className={`mention-item ${index === selectedMentionIndex ? 'selected' : ''}`}
                        onClick={() => selectMention(participant)}
                      >
                        <div className="mention-avatar">
                          {participant.displayName.charAt(0).toUpperCase()}
                        </div>
                        <div className="mention-info">
                          <div className="mention-name">{participant.displayName}</div>
                          <div className="mention-email">{participant.email}</div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="mention-help">
                      <div className="mention-help-icon">🔍</div>
                      <div className="mention-help-text">
                        <div className="mention-help-title">No matches found</div>
                        <div className="mention-help-subtitle">Try typing a different name</div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
            <input 
              type="file" 
              ref={fileInputRef} 
              style={{ display: 'none' }} 
              accept="image/*"
              onChange={handleFileChange}
            />
            <button 
              className="chat-action-btn emoji-button"
              title="Emoji"
              type="button"
            >
              😀
            </button>
            <button 
              type="submit" 
              disabled={!message.trim() || !currentUser || uploadingImage}
            >
              {uploadingImage ? 'Uploading...' : 'Send'}
            </button>
          </form>
        </>
      )}
    </div>
  );
};

export default ChatRoom; 