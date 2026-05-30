


import React, { useState, useEffect } from "react";
import axios from "axios";
// import "./ChatMessage.css";

const ChatMessage = () => {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");

  const BASE_URL = "http://127.0.0.1:8000"; // backend

  // Fetch messages from backend
  const fetchMessages = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/messages`);
      setMessages(res.data.messages);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  // Send message to backend
  const sendMessage = async () => {
    if (!text) return;

    try {
      await axios.post(`${BASE_URL}/send-message`, {
        sender: "User", // ya dynamic username
        text: text,
      });
      setText("");
      fetchMessages(); // refresh messages
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="chat-container">
      <div className="messages-list">
        {messages.map((msg, index) => (
          <div key={index} className="chat-msg">
            <strong>{msg.sender}: </strong>
            {msg.text}
          </div>
        ))}
      </div>

      <div className="chat-input">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type a message..."
        />
        <button onClick={sendMessage}>Send</button>
      </div>
    </div>
  );
};

export default ChatMessage;
