import { useState, useContext, useEffect, useRef } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Search, Send, MoreVertical, Phone, Video, ChevronLeft } from 'lucide-react';
import { TravelContext } from '../context.jsx';
import { supabase } from '../supabase';
import { getFallbackAvatar } from '../utils/avatars';

export default function Messages() {
  const { chats, setChats, currentUserEmail, registeredUsers, currentUserId, fetchChatsAndMessages } = useContext(TravelContext);
  const messagesEndRef = useRef(null);
  
  // Resolve participant details dynamically based on the active user profile
  const visibleChats = chats
    .filter(chat => 
      chat.participants.includes(currentUserId) || 
      (currentUserEmail && chat.participants.includes(currentUserEmail)) ||
      chat.participants.some(p => p && typeof p === 'string' && currentUserEmail && p.toLowerCase() === currentUserEmail.toLowerCase())
    )
    .map(chat => {
      const otherParticipant = chat.participants.find(p => 
        p !== currentUserId && 
        p !== currentUserEmail && 
        (p && typeof p === 'string' && currentUserEmail && p.toLowerCase() !== currentUserEmail.toLowerCase())
      );
      
      const otherUser = registeredUsers.find(u => 
        u.id === otherParticipant || 
        (u.email && otherParticipant && u.email.toLowerCase() === otherParticipant.toLowerCase())
      );
      
      return {
        ...chat,
        participantId: otherParticipant,
        name: otherUser ? otherUser.profile.name : (chat.name || "Travel Buddy"),
        avatar: otherUser ? getFallbackAvatar(otherUser.profile.gender, otherUser.profile.avatar) : getFallbackAvatar('Male', chat.avatar),
        lastMsg: chat.messages[chat.messages.length - 1]?.text || "Start chatting!",
        messages: chat.messages.map(msg => ({
          ...msg,
          sender: (msg.sender_id === currentUserId || (msg.senderEmail && currentUserEmail && msg.senderEmail.toLowerCase() === currentUserEmail.toLowerCase())) ? 'me' : 'them'
        }))
      };
    });

  const location = useLocation();
  const selectUserEmail = location.state?.selectUserEmail;

  const [activeChat, setActiveChat] = useState(visibleChats[0]?.id || null);
  const [message, setMessage] = useState('');
  const [mobileShowChat, setMobileShowChat] = useState(false);

  // Fetch latest chats and messages from Supabase on mount and poll every 3 seconds for instant updates
  useEffect(() => {
    fetchChatsAndMessages();
    const interval = setInterval(() => {
      fetchChatsAndMessages();
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Auto-select chat matching selectUserEmail/ID if passed in state, otherwise fallback to first chat
  useEffect(() => {
    if (selectUserEmail && visibleChats.length > 0) {
      const match = visibleChats.find(c => 
        c.participants.includes(selectUserEmail) || 
        c.participants.some(p => p && typeof p === 'string' && p.toLowerCase() === selectUserEmail.toLowerCase())
      );
      if (match) {
        setActiveChat(match.id);
        return;
      }
    }
    if (visibleChats.length > 0 && (!activeChat || !visibleChats.some(c => c.id === activeChat))) {
      setActiveChat(visibleChats[0].id);
    }
  }, [visibleChats, activeChat, selectUserEmail]);

  const activeChatData = visibleChats.find(c => c.id === activeChat);

  // Auto-scroll to the bottom of the chat on select and new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
  }, [activeChatData?.messages]);

  const handleChatSelect = (id) => {
    setActiveChat(id);
    setMobileShowChat(true);
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
        } else {
          fetchChatsAndMessages();
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
        <div className={`chat-sidebar ${mobileShowChat ? 'hidden-mobile' : ''}`}>
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
          <div className={`chat-main ${mobileShowChat ? 'active-mobile' : ''}`}>
            <div className="chat-header">
              <div className="chat-header-user">
                <button 
                  className="mobile-back-btn"
                  onClick={() => setMobileShowChat(false)}
                  style={{ 
                    display: 'none', 
                    marginRight: '0.75rem', 
                    color: 'var(--text-main)', 
                    cursor: 'pointer',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '4px',
                    borderRadius: '50%',
                    background: 'var(--background)'
                  }}
                >
                  <ChevronLeft size={24} />
                </button>
                <Link to={`/profile/${activeChatData.participantId}`} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', textDecoration: 'none', color: 'inherit' }}>
                  <img src={activeChatData.avatar} alt="User" style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} />
                  <div>
                    <h4 style={{ fontSize: '1.1rem', margin: 0 }}>{activeChatData.name}</h4>
                    <p style={{ fontSize: '0.8rem', color: 'var(--success)', margin: 0 }}>Online</p>
                  </div>
                </Link>
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
