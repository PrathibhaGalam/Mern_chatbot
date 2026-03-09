import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import Sidebar from './Sidebar';
import { FaMicrophone, FaPaperPlane, FaImage, FaRobot } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

const Chat = () => {
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState([]);
  const [image, setImage] = useState(null);
  const [isListening, setIsListening] = useState(false);
  const [selectedChat, setSelectedChat] = useState(null);
  const [refreshSidebar, setRefreshSidebar] = useState(false);
  const recognitionRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/');
    }
  }, [navigate]);

  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setQuestion(transcript);
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
  }, []);

  const sendMessage = async () => {
    if (!question.trim() && !image) return;

    let messageData = { question };

    if (image) {
      // For simplicity, assume image is base64 or handle upload
      messageData.image = image;
    }

    try {
      const token = localStorage.getItem('token');
      const res = await axios.post('http://localhost:5000/chat', messageData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessages([...messages, { q: question, a: res.data.answer, image }]);
      setQuestion('');
      setImage(null);
      setRefreshSidebar(prev => !prev);
    } catch (error) {
      console.error(error);
      alert('Error sending message: ' + (error.response?.data?.error || error.message));
    }
  };

  const generateImage = async () => {
    if (!question.trim()) return;

    try {
      const token = localStorage.getItem('token');
      const res = await axios.post('http://localhost:5000/generate-image', { prompt: question }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessages([...messages, { q: question, a: '', imageUrl: res.data.imageUrl }]);
      setQuestion('');
      setRefreshSidebar(prev => !prev);
    } catch (error) {
      console.error(error);
      alert('Error generating image: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleVoiceInput = () => {
    if (recognitionRef.current) {
      setIsListening(true);
      recognitionRef.current.start();
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSelectChat = (chat) => {
    if (chat) {
      setMessages([{ q: chat.question, a: chat.answer }]);
    } else {
      setMessages([]);
    }
    setSelectedChat(chat);
  };

  return (
    <div className="chat-container">
      <Sidebar onSelectChat={handleSelectChat} refresh={refreshSidebar} />
      <div className="chat-main">
        <div className="chat-header">
          <FaRobot className="chatbot-icon" />
          <h2>AI Chatbot</h2>
          <div>
            <button onClick={() => navigate('/profile')}>Profile</button>
            <button onClick={() => { localStorage.removeItem('token'); navigate('/'); }} style={{ marginLeft: '0.5rem', background: '#dc3545' }}>Logout</button>
          </div>
        </div>
        <div className="chat-messages">
          {messages.map((msg, index) => (
            <div key={index}>
              <div className="message user">
                <div className="message-bubble">
                  {msg.q}
                  {msg.image && <img src={msg.image} alt="Uploaded" className="chat-image" />}
                </div>
              </div>
              <div className="message bot">
                <div className="message-bubble">
                  {msg.a}
                  {msg.imageUrl && <img src={msg.imageUrl} alt="Generated" className="chat-image" />}
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="chat-input">
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Type your message..."
          />
          <input type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} id="image-upload" />
          <label htmlFor="image-upload"><FaImage /></label>
          <button onClick={handleVoiceInput} disabled={isListening}>
            <FaMicrophone />
          </button>
          <button onClick={sendMessage}><FaPaperPlane /></button>
          <button onClick={generateImage}>Generate Image</button>
        </div>
      </div>
    </div>
  );
};

export default Chat;