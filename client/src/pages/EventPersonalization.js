import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';

const EventPersonalization = () => {
  const navigate = useNavigate();
  const [interests, setInterests] = useState([]);
  const [selectedInterests, setSelectedInterests] = useState([]);
  const [recommendedEvents, setRecommendedEvents] = useState([]);
  const [loading, setLoading] = useState(false);

  // Color scheme
  const colors = {
    primary: "#FF5A8E", // Vibrant pink
    secondary: "#0D1B40", // Deep navy
    accent: "#41C9E2", // Bright turquoise accent
    dark: "#081029", // Very dark navy, almost black
    light: "#FFF5F8", // Very light pink (off-white with pink tint)
    text: "#0D1B40", // Navy for main text
    textLight: "#6C7A9C" // Muted navy for secondary text
  };

  // Initialize interests categories
  useEffect(() => {
    const interestCategories = [
      { id: 1, name: 'Technology', icon: '💻', color: '#4285F4' },
      { id: 2, name: 'Arts & Culture', icon: '🎨', color: '#EA4335' },
      { id: 3, name: 'Business', icon: '💼', color: '#FBBC05' },
      { id: 4, name: 'Sports', icon: '⚽', color: '#34A853' },
      { id: 5, name: 'Food & Drinks', icon: '🍲', color: '#FF9900' },
      { id: 6, name: 'Music', icon: '🎵', color: '#8428F8' },
      { id: 7, name: 'Education', icon: '📚', color: '#1DA1F2' },
      { id: 8, name: 'Health', icon: '🧘', color: '#25D366' }
    ];
    setInterests(interestCategories);
  }, []);

  // Toggle selection of interests
  const toggleInterest = (interestId) => {
    setSelectedInterests(prev => {
      if (prev.includes(interestId)) {
        return prev.filter(id => id !== interestId);
      } else {
        return [...prev, interestId];
      }
    });
  };

  // Generate AI recommendations
  const getRecommendations = () => {
    if (selectedInterests.length === 0) return;
    
    setLoading(true);
    
    // Simulate API call delay
    setTimeout(() => {
      // Mock data for recommended events
      const mockEvents = [
        {
          id: 1,
          title: "Tech Summit 2025",
          date: "April 15, 2025",
          time: "9:00 AM",
          location: "San Francisco, CA",
          category: "Technology",
          description: "Join the world's leading technology conference where startups compete and industry leaders share insights.",
          match: 98
        },
        {
          id: 2,
          title: "Modern Art Exhibition",
          date: "April 18, 2025",
          time: "10:00 AM",
          location: "New York, NY",
          category: "Arts & Culture",
          description: "Experience contemporary art from renowned international artists exploring the intersection of technology and creativity.",
          match: 92
        },
        {
          id: 3,
          title: "Business Leadership Forum",
          date: "April 25, 2025",
          time: "1:00 PM",
          location: "Chicago, IL",
          category: "Business",
          description: "Learn effective leadership strategies from top executives and connect with business professionals.",
          match: 87
        },
        {
          id: 4,
          title: "Global Music Festival",
          date: "May 10, 2025",
          time: "5:00 PM",
          location: "Austin, TX",
          category: "Music",
          description: "A weekend celebration featuring artists from around the world across all music genres.",
          match: 95
        }
      ];
      
      setRecommendedEvents(mockEvents);
      setLoading(false);
    }, 1500);
  };

  return (
    <div style={{ 
      fontFamily: "'Inter', 'Segoe UI', Roboto, sans-serif",
      color: colors.text,
      background: colors.light,
      minHeight: '100vh'
    }}>
      {/* Header */}
      <div style={{ 
        background: `linear-gradient(90deg, ${colors.secondary}, ${colors.primary})`,
        padding: '1.5rem 0',
        color: 'white'
      }}>
        <div className="container">
          <div className="d-flex justify-content-between align-items-center">
            <h2 className="m-0" style={{ fontWeight: '700' }}>EventAI</h2>
            <button 
              className="btn" 
              onClick={() => navigate('/')}
              style={{ 
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                color: 'white',
                borderRadius: '8px'
              }}
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>

      <div className="container py-5">
        {/* Page Title */}
        <div className="text-center mb-5">
          <h1 className="display-4 fw-bold mb-3" style={{ color: colors.secondary }}>
            Event <span style={{ color: colors.primary }}>Personalization</span>
          </h1>
          <p className="lead mb-0" style={{ color: colors.textLight, maxWidth: '800px', margin: '0 auto' }}>
            Let AI recommend events that match your interests and preferences
          </p>
        </div>

        {/* Interest Selection */}
        <div className="card shadow-sm mb-5">
          <div className="card-body p-4">
            <h3 className="mb-4" style={{ color: colors.secondary }}>Select Your Interests</h3>
            <div className="row g-3 mb-4">
              {interests.map(interest => (
                <div key={interest.id} className="col-md-3 col-sm-6">
                  <div 
                    className="d-flex align-items-center p-3"
                    style={{ 
                      borderRadius: '10px',
                      backgroundColor: selectedInterests.includes(interest.id) ? interest.color : 'white',
                      color: selectedInterests.includes(interest.id) ? 'white' : colors.text,
                      border: `1px solid ${selectedInterests.includes(interest.id) ? interest.color : '#e9ecef'}`,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      boxShadow: selectedInterests.includes(interest.id) ? '0 4px 8px rgba(0,0,0,0.1)' : 'none'
                    }}
                    onClick={() => toggleInterest(interest.id)}
                  >
                    <span className="me-2" style={{ fontSize: '1.5rem' }}>{interest.icon}</span>
                    <span style={{ fontWeight: '500' }}>{interest.name}</span>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="text-center">
              <button 
                className="btn btn-lg"
                onClick={getRecommendations}
                disabled={selectedInterests.length === 0 || loading}
                style={{ 
                  backgroundColor: colors.primary,
                  color: 'white',
                  opacity: selectedInterests.length === 0 ? 0.7 : 1,
                  fontWeight: '600',
                  padding: '0.75rem 2.5rem',
                  borderRadius: '10px',
                  transition: 'all 0.3s'
                }}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Generating Recommendations...
                  </>
                ) : (
                  'Get Personalized Recommendations'
                )}
              </button>
            </div>
          </div>
        </div>

        {/* User Preference Analysis */}
        <div className="card shadow-sm mb-5">
          <div className="card-body p-4">
            <h3 className="mb-4" style={{ color: colors.secondary }}>How AI Powers Your Recommendations</h3>
            
            <div className="row mb-4">
              <div className="col-md-6">
                <h4 style={{ color: colors.primary, fontSize: '1.25rem' }}>Personalized Event Matching</h4>
                <p>Our AI analyzes your selected interests and preferences to find events that align perfectly with what you enjoy. The matching process considers multiple factors:</p>
                <ul>
                  <li>Interest category alignment</li>
                  <li>Event popularity within your preference profile</li>
                  <li>Historical event attendance patterns</li>
                  <li>Content relevance and semantic matching</li>
                </ul>
              </div>
              <div className="col-md-6">
                <div className="card shadow-sm h-100">
                  <div className="card-body">
                    <div className="d-flex align-items-center justify-content-between mb-4">
                      <div>
                        <h5 style={{ color: colors.secondary, fontSize: '1.1rem' }}>Recommendation Accuracy</h5>
                        <p className="text-muted mb-0" style={{ fontSize: '0.9rem' }}>95% matching precision</p>
                      </div>
                      <div 
                        style={{ 
                          width: '80px', 
                          height: '80px', 
                          borderRadius: '50%',
                          background: `conic-gradient(${colors.primary} 95%, #e9ecef 0)`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <div style={{ 
                          width: '70px', 
                          height: '70px', 
                          borderRadius: '50%',
                          background: 'white',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '1.25rem',
                          fontWeight: 'bold',
                          color: colors.primary
                        }}>
                          95%
                        </div>
                      </div>
                    </div>
                    
                    <div className="progress mb-3" style={{ height: '25px' }}>
                      <div 
                        className="progress-bar" 
                        role="progressbar" 
                        style={{ 
                          width: '85%', 
                          backgroundColor: `${colors.primary}`,
                          borderRadius: '4px' 
                        }} 
                        aria-valuenow="85" 
                        aria-valuemin="0" 
                        aria-valuemax="100"
                      >
                        Technology Match 85%
                      </div>
                    </div>
                    
                    <div className="progress mb-3" style={{ height: '25px' }}>
                      <div 
                        className="progress-bar" 
                        role="progressbar" 
                        style={{ 
                          width: '78%', 
                          backgroundColor: colors.secondary,
                          borderRadius: '4px' 
                        }} 
                        aria-valuenow="78" 
                        aria-valuemin="0" 
                        aria-valuemax="100"
                      >
                        Event Relevance 78%
                      </div>
                    </div>
                    
                    <div className="progress" style={{ height: '25px' }}>
                      <div 
                        className="progress-bar" 
                        role="progressbar" 
                        style={{ 
                          width: '92%', 
                          backgroundColor: colors.accent,
                          borderRadius: '4px' 
                        }} 
                        aria-valuenow="92" 
                        aria-valuemin="0" 
                        aria-valuemax="100"
                      >
                        Interest Alignment 92%
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <h4 style={{ color: colors.primary, fontSize: '1.25rem' }}>Benefits of AI-Powered Event Discovery</h4>
            <div className="row mt-3">
              <div className="col-md-4 mb-3">
                <div className="card h-100" style={{ backgroundColor: colors.light }}>
                  <div className="card-body text-center">
                    <div style={{ fontSize: '2.5rem', color: colors.primary, marginBottom: '1rem' }}>
                      🎯
                    </div>
                    <h5 style={{ color: colors.secondary }}>Precision Matching</h5>
                    <p className="mb-0" style={{ color: colors.textLight }}>
                      Our AI algorithm precisely identifies events that match your specific interests
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="col-md-4 mb-3">
                <div className="card h-100" style={{ backgroundColor: colors.light }}>
                  <div className="card-body text-center">
                    <div style={{ fontSize: '2.5rem', color: colors.primary, marginBottom: '1rem' }}>
                      🧠
                    </div>
                    <h5 style={{ color: colors.secondary }}>Continuous Learning</h5>
                    <p className="mb-0" style={{ color: colors.textLight }}>
                      The recommendations improve over time as you interact with events
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="col-md-4 mb-3">
                <div className="card h-100" style={{ backgroundColor: colors.light }}>
                  <div className="card-body text-center">
                    <div style={{ fontSize: '2.5rem', color: colors.primary, marginBottom: '1rem' }}>
                      🔍
                    </div>
                    <h5 style={{ color: colors.secondary }}>Discovery</h5>
                    <p className="mb-0" style={{ color: colors.textLight }}>
                      Find events you might otherwise miss that perfectly match your interests
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recommended Events Section */}
        {recommendedEvents.length > 0 && (
          <div className="card shadow-sm mb-5">
            <div className="card-body p-4">
              <h3 className="mb-4" style={{ color: colors.secondary }}>Recommended Events for You</h3>
              <div className="row">
                {recommendedEvents.map(event => (
                  <div key={event.id} className="col-lg-6 mb-4">
                    <div className="card h-100 shadow-sm">
                      <div className="card-header d-flex justify-content-between align-items-start" style={{ backgroundColor: colors.light }}>
                        <h5 className="mb-0">{event.title}</h5>
                        <span className="badge" style={{ backgroundColor: colors.primary, color: 'white' }}>
                          {event.match}% Match
                        </span>
                      </div>
                      <div className="card-body">
                        <div className="mb-3">
                          <div style={{ fontSize: '0.9rem', color: colors.textLight }}>
                            <i className="bi bi-calendar me-2"></i>{event.date} at {event.time}
                          </div>
                          <div style={{ fontSize: '0.9rem', color: colors.textLight }}>
                            <i className="bi bi-geo-alt me-2"></i>{event.location}
                          </div>
                          <div className="mt-1">
                            <span className="badge" style={{ backgroundColor: `${colors.light}`, color: colors.primary, border: `1px solid ${colors.primary}` }}>
                              {event.category}
                            </span>
                          </div>
                        </div>
                        <p>{event.description}</p>
                      </div>
                      <div className="card-footer bg-white border-top-0">
                        <button className="btn w-100" style={{ backgroundColor: colors.secondary, color: 'white' }}>
                          View Event Details
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* AI Match Explainer */}
        <div className="card shadow-sm mb-5" style={{ backgroundColor: colors.secondary, color: 'white' }}>
          <div className="card-body p-4">
            <div className="d-flex align-items-center mb-3">
              <div style={{ 
                width: '50px', 
                height: '50px', 
                borderRadius: '50%', 
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.5rem',
                marginRight: '15px'
              }}>
                <i className="bi bi-lightbulb"></i>
              </div>
              <div>
                <h4 className="mb-0">How AI Match Scores Work</h4>
                <p className="mb-0" style={{ opacity: 0.8 }}>Understanding your personalized recommendations</p>
              </div>
            </div>
            
            <p>Our AI analyzes multiple factors to generate match scores for each event:</p>
            
            <div className="row">
              <div className="col-md-6">
                <div className="mb-3 p-3" style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)', borderRadius: '8px' }}>
                  <h5 style={{ color: colors.primary }}>Interest Correlation</h5>
                  <p className="mb-0" style={{ fontSize: '0.9rem', opacity: 0.9 }}>
                    How closely an event aligns with your selected interests, including category matches and topic relevance.
                  </p>
                </div>
              </div>
              <div className="col-md-6">
                <div className="mb-3 p-3" style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)', borderRadius: '8px' }}>
                  <h5 style={{ color: colors.primary }}>Attendance Patterns</h5>
                  <p className="mb-0" style={{ fontSize: '0.9rem', opacity: 0.9 }}>
                    Events similar to ones you've previously attended or expressed interest in are ranked higher.
                  </p>
                </div>
              </div>
              <div className="col-md-6">
                <div className="mb-3 p-3" style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)', borderRadius: '8px' }}>
                  <h5 style={{ color: colors.primary }}>Community Feedback</h5>
                  <p className="mb-0" style={{ fontSize: '0.9rem', opacity: 0.9 }}>
                    Ratings and reviews from users with similar interests influence match scores.
                  </p>
                </div>
              </div>
              <div className="col-md-6">
                <div className="mb-3 p-3" style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)', borderRadius: '8px' }}>
                  <h5 style={{ color: colors.primary }}>Content Analysis</h5>
                  <p className="mb-0" style={{ fontSize: '0.9rem', opacity: 0.9 }}>
                    AI examines event descriptions and content to identify matches with your interest keywords.
                  </p>
                </div>
              </div>
            </div>
            
            <p className="mt-3 text-center" style={{ opacity: 0.8 }}>
              A match score of 90%+ indicates an exceptional fit with your interests and preferences.
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{ 
        backgroundColor: colors.secondary,
        color: 'white',
        padding: '2rem 0',
        textAlign: 'center'
      }}>
        <div className="container">
          <p className="mb-1">© 2025 EventAI. All rights reserved.</p>
          <p className="mb-0" style={{ color: 'rgba(255,255,255,0.7)' }}>
            Powered by advanced artificial intelligence for personalized event experiences.
          </p>
        </div>
      </div>
    </div>
  );
};

export default EventPersonalization;