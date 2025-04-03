import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/ChatStyle.css';

const ChatPage = () => {
  const [conversations, setConversations] = useState([]); // ALL user convos
  const [selectedConversation, setSelectedConversation] = useState(null); // active convos
  const [messages, setMessages] = useState([]); // holds mssgs of current convo
  const [inputMessage, setInputMessage] = useState(''); // tracks user's input
  const [isLoading, setIsLoading] = useState(false); // loading animation for AI response
  const [user, setUser] = useState(null); // store the logged-in user's info
  
  const messagesEndRef = useRef(null); 
  const navigate = useNavigate();
  
  // check if user is logged in
  useEffect(() => {
    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('userId');
    
    // if user isn't logged in -> back to login page
    if (!token || !userId) {
      navigate('/');
      return;
    }
    
    // fetch user data
    fetchUserData(userId, token);
    
    // fetch user's conversations
    fetchConversations(userId, token);
  }, [navigate]);
  
  // scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  const fetchUserData = async (userId, token) => {
    try {
      // replace with your actual API endpoint
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
      console.log('User data:', userData);
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };
  
  const fetchConversations = async (userId, token) => {
    try {
      // replace with your actual API endpoint
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
      console.log('Conversations:', conversationsData)
      console.log(conversationsData)
      
      // if there are conversations -> select the most recent one
      if (conversationsData.length > 0) {
        console.log("Conversations Data length: ", conversationsData.length)

        setSelectedConversation(conversationsData[conversationsData.length - 1].id);
        fetchMessages(conversationsData[conversationsData.length - 1].id, token);
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
    }
  };
  
  const fetchMessages = async (conversationId, token) => {
    try {
      // replace with your actual API endpoint
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
      console.log("Messages:", messagesData);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };
  
  const createNewConversation = async () => {
    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('userId');
    
    if (!token || !userId) {
      navigate('/');
      return;
    }
    
    try {
      const response = await fetch('http://localhost:8000/api/conversations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          user_id: userId,

          title: 'New Convo' 
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to create conversation');
      }
      
      const newConversation = await response.json();
      // append new convo to the conversation list
      setConversations([ ...conversations, newConversation]);
      setSelectedConversation(newConversation.id);
      setMessages([]);
      console.log('New conversation created:', newConversation);
      console.log(conversations);
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
    
    // add user message to UI immediately
    const userMessage = {
      id: `temp-${Date.now()}`,
      conversation_id: selectedConversation,
      content: inputMessage,
      is_user: true,
    };
    
    setMessages([...messages, userMessage]);
    setInputMessage('');
    setIsLoading(true);
    
    try {
      // 1. save user message to your backend
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
      
      // 2. get AI response using OpenAI API
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
      
      // 3. update messages with both user message and AI response
      setMessages(currentMessages => [
        ...currentMessages.filter(msg => msg.id !== userMessage.id),
        savedMessage,
        aiMessageData
      ]);
    } catch (error) {
      console.error('Error sending message:', error);
      // show error in UI
    } finally {
      setIsLoading(false);
    }
  };
  

  const selectConversation = (conversationId) => {
    setSelectedConversation(conversationId);
    const token = localStorage.getItem('token');
    fetchMessages(conversationId, token);
  };

  const deleteConversation = async (e, conversationId) => {
    // stop event propagation to prevent selecting the conversation when deleting
    e.stopPropagation();
    
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/');
      return;
    }
    
    try {
      // call the API to delete the conversation
      const response = await fetch(`http://localhost:8000/api/conversations/${conversationId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete conversation');
      }
      
      // update the state to remove the deleted conversation
      setConversations(conversations.filter(conv => conv.id !== conversationId));
      
      // if the deleted conversation was selected, clear the selection and messages
      if (selectedConversation === conversationId) {
        setSelectedConversation(null);
        setMessages([]);
      }
    } catch (error) {
      console.error('Error deleting conversation:', error);
    }
  };


  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    navigate('/');
  };
  
  return (
    <div className="chat-container">
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
            // Hee we map through the conversations in reverse order to show the most recent
            [...conversations].reverse().map(conv => (
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
                <button 
                  className="delete-conversation-btn"
                  onClick={(e) => deleteConversation(e, conv.id)}
                  title="Delete conversation"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    <line x1="10" y1="11" x2="10" y2="17"></line>
                    <line x1="14" y1="11" x2="14" y2="17"></line>
                  </svg>
                </button>
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
      
      <div className="chat-area">
        {selectedConversation ? (
          <>
            <div className="chat-messages">
              {messages.length === 0 ? (
                <div className="welcome-message">
                  <h2>Begin a new conversation</h2>
                  <p>Ask anything!</p>
                </div>
              ) : (
                messages.map(message => (
                  <div 
                    key={message.id} 
                    className={`message ${message.is_user ? 'user-message' : 'ai-message'}`}
                  >
                   
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
