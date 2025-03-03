import React from 'react';
import { useNavigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import eventImage from "../images/flex.jpg";

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="d-flex flex-column min-vh-100">
      {/* Hero Section */}
      <section className="flex-grow-1 d-flex flex-column align-items-center justify-content-center py-5 text-center">
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-lg-8">
              <h1 className="display-4 fw-bold mb-4">
                Experience Events Through <span className="text-primary">AI-Powered</span> Intelligence
              </h1>
              
              <p className="lead text-secondary mb-5">
                EventAI transforms how you discover, experience, and remember events with cutting-edge artificial intelligence that personalizes every moment.
              </p>
              
              {/* Updated Get Started Button */}
              <button 
                className="btn btn-primary btn-lg px-5 py-3 shadow-sm"
                onClick={() => navigate('/login')} // Redirects to login page
              >
                Get Started
              </button>
            </div>
          </div>
          
          {/* Hero Image */}
          <div className="mt-5">
             <img 
                        src={eventImage} 
                        alt="Event Banner" 
                        className="img-fluid rounded" 
                        style={{ maxHeight: "400px", width: "100%", objectFit: "cover" }} 
                      />
          </div>
        </div>
      </section>
      
      {/* Features Section */}
      <section className="bg-light py-5">
        <div className="container">
          <div className="text-center mb-5">
            <h2 className="fw-bold mb-3">Intelligent Features</h2>
            <p className="text-secondary">Discover how our AI enhances your event experience</p>
          </div>
          
          <div className="row g-4">
            <div className="col-md-4">
              <div className="card h-100 border-0 shadow-sm">
                <div className="card-body text-center p-4">
                  <div className="display-5 mb-3">📊</div>
                  <h3 className="h4 fw-bold mb-3">Smart Event Analysis</h3>
                  <p className="text-secondary">Our AI analyzes event content in real-time, highlighting key moments and providing insights you might otherwise miss.</p>
                </div>
              </div>
            </div>
            
            <div className="col-md-4">
              <div className="card h-100 border-0 shadow-sm">
                <div className="card-body text-center p-4">
                  <div className="display-5 mb-3">🎯</div>
                  <h3 className="h4 fw-bold mb-3">Personalized Recommendations</h3>
                  <p className="text-secondary">Receive tailored event suggestions based on your preferences, past attendance, and emerging trends.</p>
                </div>
              </div>
            </div>
            
            <div className="col-md-4">
              <div className="card h-100 border-0 shadow-sm">
                <div className="card-body text-center p-4">
                  <div className="display-5 mb-3">🔍</div>
                  <h3 className="h4 fw-bold mb-3">Intelligent Search</h3>
                  <p className="text-secondary">Find exactly what you're looking for with our context-aware search that understands natural language queries.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="bg-primary text-white py-5 text-center">
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-lg-8">
              <h2 className="fw-bold mb-3">Ready to Transform Your Event Experience?</h2>
              <p className="mb-4 opacity-75">Join thousands of users who have discovered the power of AI-enhanced event viewing.</p>
              <button 
                className="btn btn-light btn-lg px-5"
                onClick={() => navigate('/login')} // Redirects to login page
              >
                Get Started Now
              </button>
            </div>
          </div>
        </div>
      </section>
      
      {/* Simple Footer */}
      <footer className="bg-dark text-white-50 py-4 text-center">
        <p className="mb-0">&copy; 2025 EventAI. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default LandingPage;
