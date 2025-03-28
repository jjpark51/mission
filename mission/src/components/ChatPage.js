import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/ChatStyle.css';

const ChatPage = () => {
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState(null);
  
  const messagesEndRef = useRef(null);
  const navigate = useNavigate();
  
  // Check if user is logged in
  useEffect(() => {
    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('userId');
    
    if (!token || !userId) {
      navigate('/');
      return;
    }
    
    // Fetch user data
    fetchUserData(userId, token);
    
    // Fetch user's conversations
    fetchConversations(userId, token);
  }, [navigate]);
  
  // Scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  const fetchUserData = async (userId, token) => {
    try {
      // Replace with your actual API endpoint
      const response = await fetch(`http://localhost:8000/api/users/${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch user data');
      }
      
      const userData = await response.json();
      setUser(userData);
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };
  
  const fetchConversations = async (userId, token) => {
    try {
      // Replace with your actual API endpoint
      const response = await fetch(`http://localhost:8000/api/users/${userId}/conversations`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch conversations');
      }
      
      const conversationsData = await response.json();
      setConversations(conversationsData);
      
      // If there are conversations, select the most recent one
      if (conversationsData.length > 0) {
        setSelectedConversation(conversationsData[0].id);
        fetchMessages(conversationsData[0].id, token);
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
    }
  };
  
  const fetchMessages = async (conversationId, token) => {
    try {
      // Replace with your actual API endpoint
      const response = await fetch(`http://localhost:8000/api/conversations/${conversationId}/messages`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch messages');
      }
      
      const messagesData = await response.json();
      setMessages(messagesData);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };
  
  const createNewConversation = async () => {
    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('userId');
    
    if (!token || !userId) {
      navigate('/auth');
      return;
    }
    
    try {
      // Replace with your actual API endpoint
      const response = await fetch('http://localhost:8000/api/conversations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          user_id: userId,

          title: 'New Conversation' // You can generate a title based on the first message later
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to create conversation');
      }
      
      const newConversation = await response.json();
      setConversations([newConversation, ...conversations]);
      setSelectedConversation(newConversation.id);
      setMessages([]);
    } catch (error) {
      console.error('Error creating conversation:', error);
    }
  };
  
  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!inputMessage.trim() || !selectedConversation) return;
    
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/');
      return;
    }
    
    // Add user message to UI immediately
    const userMessage = {
      id: `temp-${Date.now()}`,
      conversation_id: selectedConversation,
      content: inputMessage,
    };
    
    setMessages([...messages, userMessage]);
    setInputMessage('');
    setIsLoading(true);
    
    try {
      // 1. Save user message to your backend
      const messageResponse = await fetch('http://localhost:8000/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          conversation_id: selectedConversation,
          is_user: true,
          content: inputMessage
        })
      });
      
      if (!messageResponse.ok) {
        throw new Error('Failed to save message');
      }
      
      const savedMessage = await messageResponse.json();
      
      // 2. Get AI response using OpenAI API
      const openAIResponse = await fetch('http://localhost:8000/api/ai/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          conversation_id: selectedConversation,
          message: inputMessage
        })
      });
      
      if (!openAIResponse.ok) {
        throw new Error('Failed to get AI response');
      }
      
      const aiMessageData = await openAIResponse.json();
      
      // 3. Update messages with both user message and AI response
      setMessages(currentMessages => [
        ...currentMessages.filter(msg => msg.id !== userMessage.id),
        savedMessage,
        aiMessageData
      ]);
    } catch (error) {
      console.error('Error sending message:', error);
      // Show error in UI
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    navigate('/');
  };
  
  const selectConversation = (conversationId) => {
    setSelectedConversation(conversationId);
    const token = localStorage.getItem('token');
    fetchMessages(conversationId, token);
  };
  
  const formatDate = (dateString) => {
    const options = { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  return (
    <div className="chat-container">
      {/* Sidebar */}
      <div className="sidebar">
        <div className="sidebar-header">
          <h2>Conversations</h2>
          <button onClick={createNewConversation} className="new-chat-btn">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            New Chat
          </button>
        </div>
        
        <div className="conversations-list">
          {conversations.length === 0 ? (
            <div className="no-conversations">
              <p>No conversations yet</p>
              <button onClick={createNewConversation} className="start-chat-btn">
                Start a new chat
              </button>
            </div>
          ) : (
            conversations.map(conv => (
              <div 
                key={conv.id}
                className={`conversation-item ${selectedConversation === conv.id ? 'active' : ''}`}
                onClick={() => selectConversation(conv.id)}
              >
                <div className="conversation-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                  </svg>
                </div>
                <div className="conversation-info">
                  <div className="conversation-title">{conv.title}</div>
                </div>
              </div>
            ))
          )}
        </div>
        
        <div className="sidebar-footer">
          {user && (
            <div className="user-info">
              <div className="user-avatar">
                {user.username ? user.username.charAt(0).toUpperCase() : '?'}
              </div>
              <div className="user-name">{user.username}</div>
            </div>
          )}
          <button onClick={handleLogout} className="logout-btn">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
              <polyline points="16 17 21 12 16 7"></polyline>
              <line x1="21" y1="12" x2="9" y2="12"></line>
            </svg>
            Logout
          </button>
        </div>
      </div>
      
      {/* Main Chat Area */}
      <div className="chat-area">
        {selectedConversation ? (
          <>
            <div className="chat-messages">
              {messages.length === 0 ? (
                <div className="welcome-message">
                  <h2>Begin a new conversation</h2>
                  <p>Ask anything, get helpful answers</p>
                </div>
              ) : (
                messages.map(message => (
                  <div 
                    key={message.id} 
                    className={`message ${message.is_user ? 'user-message' : 'ai-message'}`}
                  >
                    <div className="message-avatar">
                      {message.is_user 
                        ? (user?.username.charAt(0).toUpperCase() || 'U')
                        : 'AI'}
                    </div>
                    <div className="message-content">
                      <div className="message-text">{message.content}</div>
                    </div>
                  </div>
                ))
              )}
              {isLoading && (
                <div className="message ai-message">
                  <div className="message-avatar">AI</div>
                  <div className="message-content">
                    <div className="typing-indicator">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
            
            <form onSubmit={handleSendMessage} className="message-input-container">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Type your message..."
                className="message-input"
                disabled={isLoading}
              />
              <button 
                type="submit" 
                className="send-button"
                disabled={isLoading || !inputMessage.trim()}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13"></line>
                  <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                </svg>
              </button>
            </form>
          </>
        ) : (
          <div className="empty-state">
            <h2>Select a conversation or start a new one</h2>
            <button onClick={createNewConversation} className="start-chat-btn">
              Start a new chat
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatPage;
