import React, { useEffect, useState } from 'react';
import axios from 'axios';

const Sidebar = ({ onSelectChat, refresh }) => {
  const [chats, setChats] = useState([]);

  useEffect(() => {
    const fetchChats = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get('http://localhost:5000/chats', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setChats(res.data);
      } catch (error) {
        console.error(error);
      }
    };
    fetchChats();
  }, [refresh]);

  return (
    <div className="sidebar">
      <h3>Chat History</h3>
      <button onClick={() => onSelectChat(null)} style={{ width: '100%', marginBottom: '1rem', padding: '0.5rem', background: '#667eea', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>New Chat</button>
      <ul>
        {chats.map((chat, index) => (
          <li key={index} onClick={() => onSelectChat(chat)}>
            <strong>{chat.question.substring(0, 30)}...</strong>
            <br />
            <small>{new Date(chat.createdAt).toLocaleDateString()}</small>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Sidebar;