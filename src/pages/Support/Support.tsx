import React, { useState } from 'react';
import axios from 'axios';
import { Typography, Input, Button, Spin } from 'antd';
import './Support.css';

const { Title, Text } = Typography;
const { TextArea } = Input;

interface Message {
  sender: 'user' | 'bot';
  text: string;
}

const Support = () => {
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    { sender: 'bot', text: 'Welcome to the HappyMed AI support. How can I help you today?' },
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    const newMessages = [...messages, { sender: 'user', text: query }];
    setMessages(newMessages);
    setQuery('');
    setLoading(true);
    setError('');

    try {
        console.log('query:', query);
      const res = await axios.post('https://happymedkz.serveo.net/answer_query', { query });

      if (res.status === 200 && res.data.answer) {
        setMessages([...newMessages, { sender: 'bot', text: res.data.answer }]);
      } else {
        setError('No answer available.');
      }
    } catch (err) {
      console.error(err);
      setError('An error occurred while fetching the response.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="support-container-with-sidebar">
      <div className="support-chat-container">
        <div className="chat-header">
          <Title level={3}>AI Support</Title>
        </div>
        <div className="chat-messages">
          {messages.map((message, index) => (
            <div 
              key={index} 
              className={`chat-message ${message.sender === 'user' ? 'user' : 'bot'}`}
            >
              <div className="message-bubble">
                <Text>{message.text}</Text>
              </div>
            </div>
          ))}
          {loading && (
            <div className="chat-message bot">
              <div className="message-bubble">
                <Spin /> <Text style={{ marginLeft: '8px' }}>Thinking...</Text>
              </div>
            </div>
          )}
        </div>
        {error && <Text type="danger" className="error-text">{error}</Text>}
        <form onSubmit={handleSubmit} className="chat-input-form">
          <TextArea
            rows={2}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type your question here..."
            required
            className="chat-textarea"
          />
          <Button 
            type="primary" 
            htmlType="submit" 
            className="chat-send-button"
            disabled={loading}
            
          >
            Send
          </Button>
        </form>
      </div>
    </div>
  );
};

export default Support;
