import React, { useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../helpers/AuthContext";
import ChatbotUI from "../components/ChatbotUI";

export default function Chatbot() {
  const { authState } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (!authState.status) {
      navigate("/login");
    }
  }, [authState, navigate]);

  return (
    <div className="container" style={{ paddingTop: "40px" }}>
      <div className="row">
        <div className="col-md-8 mx-auto">
          <div className="card shadow-sm">
            <div className="card-header text-white" style={{ backgroundColor: "#001F3F" }}>
              <h2 className="mb-0">
                <i className="bi bi-chat-dots me-2"></i>
                Event App Assistant
              </h2>
            </div>
            <div className="card-body p-4">
              <p className="lead">
                Welcome to the Event App Assistant! This AI-powered chatbot can help you:
              </p>
              <ul className="list-group list-group-flush mb-4">
                <li className="list-group-item">
                  <i className="bi bi-arrow-right-circle-fill me-2" style={{ color: "#FF6B6B" }}></i>
                  Navigate through the application
                </li>
                <li className="list-group-item">
                  <i className="bi bi-arrow-right-circle-fill me-2" style={{ color: "#FF6B6B" }}></i>
                  Learn how to use features effectively
                </li>
                <li className="list-group-item">
                  <i className="bi bi-arrow-right-circle-fill me-2" style={{ color: "#FF6B6B" }}></i>
                  Get answers about events and reviews
                </li>
                <li className="list-group-item">
                  <i className="bi bi-arrow-right-circle-fill me-2" style={{ color: "#FF6B6B" }}></i>
                  Contact admins when needed
                </li>
              </ul>
              
              <div className="alert" style={{ backgroundColor: "#F8F9FA" }}>
                <div className="d-flex">
                  <div className="me-3">
                    <i className="bi bi-info-circle-fill fs-3" style={{ color: "#001F3F" }}></i>
                  </div>
                  <div>
                    <h5>Try asking questions like:</h5>
                    <ul className="mb-0">
                      <li>"How do I find events near me?"</li>
                      <li>"How can I leave a review for an event?"</li>
                      <li>"Where can I see my notifications?"</li>
                      <li>"How do I contact an admin?"</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Add this line to render the ChatbotUI component */}
      <ChatbotUI />
    </div>
  );
}