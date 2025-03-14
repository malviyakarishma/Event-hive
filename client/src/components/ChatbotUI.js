import React, { useState, useRef, useEffect } from 'react';

export default function ChatbotUI() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 'welcome-message',
      role: 'assistant',
      content: "👋 Hi there! I'm your Event App assistant. I can help you navigate the app, find events, and answer questions about features. How can I help you today?"
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const toggleChat = () => {
    setIsOpen(!isOpen);
    setIsMinimized(false);
  };

  const toggleMinimize = () => {
    setIsMinimized(!isMinimized);
  };

  const handleInputChange = (e) => {
    setInput(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!input.trim()) return;
    
    // Add user message to chat
    const userMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    
    try {
      // Format messages for the API
      const formattedMessages = messages
        .concat(userMessage)
        .map(msg => ({
          role: msg.role,
          content: msg.content
        }));
      
      // Add the assistant's message placeholder
      const assistantMessage = {
        id: Date.now().toString() + '-assistant',
        role: 'assistant',
        content: ''
      };
      
      setMessages(prev => [...prev, assistantMessage]);
      
      // Create EventSource for SSE
      const eventSource = new EventSource(`/api/chat?messages=${encodeURIComponent(JSON.stringify(formattedMessages))}`);
      
      eventSource.onmessage = (event) => {
        if (event.data === '[DONE]') {
          eventSource.close();
          setIsLoading(false);
          return;
        }
        
        try {
          const parsedData = JSON.parse(event.data);
          
          if (parsedData.content) {
            setMessages(prev => 
              prev.map(msg => 
                msg.id === assistantMessage.id 
                  ? { ...msg, content: msg.content + parsedData.content } 
                  : msg
              )
            );
          }
        } catch (e) {
          console.error('Error parsing SSE data:', e);
        }
      };
      
      eventSource.onerror = (error) => {
        console.error('EventSource error:', error);
        eventSource.close();
        setIsLoading(false);
        
        // Add error message if needed
        setMessages(prev => 
          prev.map(msg => 
            msg.id === assistantMessage.id 
              ? { ...msg, content: msg.content || 'Sorry, I encountered an error. Please try again later.' } 
              : msg
          )
        );
      };
    } catch (error) {
      console.error('Error sending message:', error);
      
      // Add error message
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again later.'
      }]);
      
      setIsLoading(false);
    }
  };

  // Styles
  const chatButtonStyle = {
    position: 'fixed',
    bottom: '20px',
    right: '20px',
    width: '56px',
    height: '56px',
    borderRadius: '50%',
    backgroundColor: '#FF6B6B',
    color: 'white',
    border: 'none',
    boxShadow: '0 2px 10px rgba(0, 0, 0, 0.2)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    zIndex: 1000
  };

  const chatWindowStyle = {
    position: 'fixed',
    bottom: '20px',
    right: '20px',
    width: '350px',
    maxHeight: isMinimized ? '60px' : '500px',
    borderRadius: '10px',
    boxShadow: '0 5px 15px rgba(0, 0, 0, 0.2)',
    backgroundColor: 'white',
    overflow: 'hidden',
    transition: 'max-height 0.3s ease',
    zIndex: 1000
  };

  const chatHeaderStyle = {
    padding: '10px 15px',
    backgroundColor: '#001F3F',
    color: 'white',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid #e0e0e0'
  };

  const chatBodyStyle = {
    height: '350px',
    overflowY: 'auto',
    padding: '15px',
    display: isMinimized ? 'none' : 'block'
  };

  const chatFooterStyle = {
    padding: '10px 15px',
    borderTop: '1px solid #e0e0e0',
    display: isMinimized ? 'none' : 'flex'
  };

  const messageStyle = (isUser) => ({
    maxWidth: '80%',
    padding: '8px 12px',
    borderRadius: '18px',
    marginBottom: '10px',
    wordWrap: 'break-word',
    backgroundColor: isUser ? '#FF6B6B' : '#f1f1f1',
    color: isUser ? 'white' : 'black',
    alignSelf: isUser ? 'flex-end' : 'flex-start'
  });

  return (
    <div>
      {/* Chatbot Button */}
      {!isOpen && (
        <button onClick={toggleChat} style={chatButtonStyle}>
          <i className="bi bi-chat-dots-fill"></i>
        </button>
      )}

      {/* Chatbot Window */}
      {isOpen && (
        <div style={chatWindowStyle}>
          <div style={chatHeaderStyle}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <i className="bi bi-robot me-2"></i>
              <span>Event App Assistant</span>
            </div>
            <div>
              <button 
                onClick={toggleMinimize} 
                style={{ background: 'none', border: 'none', color: 'white', marginRight: '5px' }}
              >
                <i className={`bi bi-chevron-${isMinimized ? 'up' : 'down'}`}></i>
              </button>
              <button 
                onClick={toggleChat} 
                style={{ background: 'none', border: 'none', color: 'white' }}
              >
                <i className="bi bi-x-lg"></i>
              </button>
            </div>
          </div>

          <div style={chatBodyStyle}>
            {messages.map((message) => (
              <div 
                key={message.id} 
                style={{ 
                  display: 'flex', 
                  justifyContent: message.role === 'user' ? 'flex-end' : 'flex-start'
                }}
              >
                <div style={messageStyle(message.role === 'user')}>
                  {message.content}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <div style={chatFooterStyle}>
            <form onSubmit={handleSubmit} style={{ display: 'flex', width: '100%' }}>
              <input
                type="text"
                value={input}
                onChange={handleInputChange}
                placeholder="Type your message..."
                style={{ 
                  flex: 1, 
                  padding: '8px 12px', 
                  borderRadius: '20px', 
                  border: '1px solid #ccc',
                  marginRight: '8px'
                }}
                disabled={isLoading}
              />
              <button 
                type="submit" 
                style={{
                  backgroundColor: '#FF6B6B',
                  color: 'white',
                  border: 'none',
                  borderRadius: '50%',
                  width: '36px',
                  height: '36px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  opacity: isLoading || !input.trim() ? 0.7 : 1
                }}
                disabled={isLoading || !input.trim()}
              >
                <i className="bi bi-send-fill"></i>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}