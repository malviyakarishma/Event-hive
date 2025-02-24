import React, { useState } from "react";
import axios from "axios";
import "../App.css";
import "bootstrap/dist/css/bootstrap.min.css";

export default function Chatbot() {
  const [userMessage, setUserMessage] = useState("");
  const [chatHistory, setChatHistory] = useState([]);

  const handleSend = async () => {
    if (!userMessage.trim()) return;

    const userChat = { role: "user", content: userMessage };
    setChatHistory([...chatHistory, userChat]);

    try {
      const response = await axios.post("http://localhost:3001/chatbot", { message: userMessage });

      setChatHistory([...chatHistory, userChat, { role: "bot", content: response.data.reply }]);
    } catch (error) {
      console.error("Chatbot error:", error);
    }

    setUserMessage("");
  };

  return (
    <div className="container mt-5" >
      <div className="card shadow">
        <div className="card-header bg-primary text-white text-center">
          <h4>Event Assistant Chatbot</h4>
        </div>
        <div className="card-body">
          <div className="chatbox border rounded p-3 mb-3" style={{ height: "300px", overflowY: "auto" }}>
            {chatHistory.map((msg, index) => (
              <div
                key={index}
                className={`alert ${msg.role === "user" ? "alert-info text-end" : "alert-success text-start"}`}
              >
                <strong>{msg.role === "user" ? "You: " : "Bot: "}</strong> {msg.content}
              </div>
            ))}
          </div>
          <div className="input-group">
            <input
              type="text"
              className="form-control"
              placeholder="Ask about events..."
              value={userMessage}
              onChange={(e) => setUserMessage(e.target.value)}
            />
            <button className="btn btn-primary" onClick={handleSend}>
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
