import { useState, useContext, useEffect, useRef } from 'react';
import { Search, Send, MoreVertical, Phone, Video } from 'lucide-react';
import { TravelContext } from '../context.jsx';
import { supabase } from '../supabase';

export default function Messages() {
  const { chats, setChats, currentUserEmail, registeredUsers, currentUserId } = useContext(TravelContext);
  const messagesEndRef = useRef(null);
  
  // Resolve participant details dynamically based on the active user profile
  const visibleChats = chats
    .filter(chat => chat.participants.includes(currentUserEmail))
    .map(chat => {
      const otherEmail = chat.participants.find(email => email !== currentUserEmail);
      const otherUser = registeredUsers.find(u => u.email === otherEmail);
      
      return {
        ...chat,
        name: otherUser ? otherUser.profile.name : (chat.name || "Travel Buddy"),
        avatar: otherUser ? otherUser.profile.avatar : (chat.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80"),
        lastMsg: chat.messages[chat.messages.length - 1]?.text || "Start chatting!",
        messages: chat.messages.map(msg => ({
          ...msg,
          sender: msg.senderEmail === currentUserEmail ? 'me' : 'them'
        }))
      };
    });

  const [activeChat, setActiveChat] = useState(visibleChats[0]?.id || null);
  const [message, setMessage] = useState('');

  // Auto-select first chat if activeChat is invalid or null
  useEffect(() => {
    if (visibleChats.length > 0 && (!activeChat || !visibleChats.some(c => c.id === activeChat))) {
      setActiveChat(visibleChats[0].id);
    }
  }, [visibleChats, activeChat]);

  const activeChatData = visibleChats.find(c => c.id === activeChat);

  // Auto-scroll to the bottom of the chat on select and new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
  }, [activeChatData?.messages]);

  const handleChatSelect = (id) => {
    setActiveChat(id);
    setChats(chats.map(chat => 
      chat.id === id ? { ...chat, unread: 0 } : chat
    ));
  };

  const handleSend = async () => {
    if (!message.trim() || !activeChat) return;
    
    const isSupabaseChat = typeof activeChat === 'string' && activeChat.includes('-');
    
    if (isSupabaseChat) {
      try {
        const { error } = await supabase
          .from('messages')
          .insert({
            chat_id: activeChat,
            sender_id: currentUserId,
            text: message
          });
        if (error) {
          console.error("Error sending message to Supabase:", error.message);
        }
      } catch (err) {
        console.error("Send message exception:", err);
      }
    } else {
      setChats(chats.map(chat => {
        if (chat.id === activeChat) {
          return {
            ...chat,
            messages: [...chat.messages, { id: Date.now(), senderEmail: currentUserEmail, text: message }]
          };
        }
        return chat;
      }));
    }
    setMessage('');
  };

  if (visibleChats.length === 0) {
    return (
      <div className="animate-fade-in" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
        <h3>No conversations yet</h3>
        <p style={{ color: 'var(--text-muted)' }}>Send a join request or connect with buddies to start chatting!</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <h1 className="page-title" style={{ marginBottom: '2rem' }}>Messages</h1>
      
      <div className="chat-container">
        {/* Sidebar (Chat List) */}
        <div className="chat-sidebar">
          <div className="chat-sidebar-header">
            <div className="chat-search">
              <Search size={18} />
              <input type="text" placeholder="Search messages..." />
            </div>
          </div>
          
          <div className="chat-list">
            {visibleChats.map(chat => (
              <div 
                key={chat.id} 
                className={`chat-contact ${activeChat === chat.id ? 'active' : ''}`}
                onClick={() => handleChatSelect(chat.id)}
              >
                <img src={chat.avatar} alt={chat.name} className="chat-contact-avatar" />
                <div className="chat-contact-info">
                  <div className="chat-contact-name">
                    {chat.name}
                    <span className="chat-contact-time">{chat.time}</span>
                  </div>
                  <div className="chat-contact-msg" style={{ 
                    color: chat.unread ? 'var(--text-main)' : 'var(--text-muted)',
                    fontWeight: chat.unread ? '600' : '400'
                  }}>
                    {chat.lastMsg}
                  </div>
                </div>
                {chat.unread > 0 && (
                  <div style={{
                    background: 'var(--primary)',
                    color: 'white',
                    fontSize: '0.75rem',
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 'bold'
                  }}>
                    {chat.unread}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Main Chat Area */}
        {activeChatData ? (
          <div className="chat-main">
            <div className="chat-header">
              <div className="chat-header-user">
                <img src={activeChatData.avatar} alt="User" style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} />
                <div>
                  <h4 style={{ fontSize: '1.1rem' }}>{activeChatData.name}</h4>
                  <p style={{ fontSize: '0.8rem', color: 'var(--success)' }}>Online</p>
                </div>
              </div>
              
              <div style={{ display: 'flex', gap: '1rem', color: 'var(--text-muted)' }}>
                <button style={{ color: 'inherit' }}><Phone size={20} /></button>
                <button style={{ color: 'inherit' }}><Video size={20} /></button>
                <button style={{ color: 'inherit' }}><MoreVertical size={20} /></button>
              </div>
            </div>

            <div className="chat-messages">
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem', margin: '1rem 0' }}>
                Today
              </div>
              {activeChatData.messages.map(msg => (
                <div key={msg.id} className={`message ${msg.sender === 'me' ? 'sent' : 'received'}`}>
                  {msg.text}
                </div>
              ))}
              {/* Invisible scroll anchor */}
              <div ref={messagesEndRef} />
            </div>

            <div className="chat-input-area">
              <input 
                type="text" 
                className="chat-input" 
                placeholder="Type a message..." 
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              />
              <button className="chat-send-btn" onClick={handleSend}>
                <Send size={20} style={{ marginLeft: '-2px' }} />
              </button>
            </div>
          </div>
        ) : (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--background)', color: 'var(--text-muted)' }}>
            Select a contact to start chatting!
          </div>
        )}
      </div>
    </div>
  );
}
