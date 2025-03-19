import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import eventImage from "../images/flex.jpg";

const LandingPage = () => {
  const navigate = useNavigate();
  const [setScrolled] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  
  // Handle scroll effects
  useEffect(() => {
    const handleScroll = () => {
      // Set scrolled state to true once scrolled down
      setScrolled(window.scrollY > 100);
    };
  
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [setScrolled]);
  

  // Animation for reveal on scroll
  const [visible, setVisible] = useState({
    hero: false,
    features: false,
    cta: false
  });

  useEffect(() => {
    const handleReveal = () => {
      const heroSection = document.getElementById('hero-section');
      const featuresSection = document.getElementById('features-section');
      const ctaSection = document.getElementById('cta-section');
      
      const isInViewport = (element) => {
        if (!element) return false; // Add null check here
        const rect = element.getBoundingClientRect();
        return rect.top <= window.innerHeight * 0.75;
      };
      
      setVisible({
        hero: heroSection ? isInViewport(heroSection) : false, // Add null check here
        features: featuresSection ? isInViewport(featuresSection) : false, // Add null check here
        cta: ctaSection ? isInViewport(ctaSection) : false // Add null check here
      });
    };
    
    // Wait for DOM to be ready before initial check
    const timer = setTimeout(() => {
      handleReveal();
    }, 100);
    
    window.addEventListener('scroll', handleReveal);
    
    return () => {
      window.removeEventListener('scroll', handleReveal);
      clearTimeout(timer);
    };
  }, []);

  // Pink and Navy color scheme
  const colors = {
    primary: "#FF5A8E", // Vibrant pink
    secondary: "#0D1B40", // Deep navy
    accent: "#41C9E2", // Bright turquoise accent
    dark: "#081029", // Very dark navy, almost black
    light: "#FFF5F8", // Very light pink (off-white with pink tint)
    text: "#0D1B40", // Navy for main text
    textLight: "#6C7A9C" // Muted navy for secondary text
  };

  return (
    <div className="d-flex flex-column min-vh-100" style={{
      fontFamily: "'Inter', 'Segoe UI', Roboto, sans-serif",
      overflowX: 'hidden',
      color: colors.text,
      background: colors.light
    }}>
      {/* Hero Section - Side by side layout */}
      <section 
        id="hero-section"
        className={`py-5 ${visible.hero ? 'animate-fade-in' : ''}`}
        style={{
          background: `linear-gradient(135deg, ${colors.light} 0%, rgba(255, 90, 142, 0.1) 100%)`,
          padding: '6rem 0',
          opacity: visible.hero ? 1 : 0,
          transform: visible.hero ? 'translateY(0)' : 'translateY(20px)',
          transition: 'opacity 0.8s ease, transform 0.8s ease',
        }}
      >
        <div className="container">
          <div className="row align-items-center">
            {/* Text content - Now on the left */}
            <div className="col-lg-6 mb-5 mb-lg-0 text-lg-start text-center order-lg-1 order-2">
              <h1 className="display-4 fw-bold mb-4" style={{
                background: `linear-gradient(90deg, ${colors.secondary} 0%, ${colors.primary} 100%)`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                fontWeight: '800',
                letterSpacing: '-0.5px'
              }}>
                Experience Events Through <span style={{ color: colors.primary }}>AI-Powered</span> Intelligence
              </h1>
              
              <p className="lead mb-5" style={{
                color: colors.textLight,
                fontSize: '1.25rem',
                lineHeight: '1.6',
              }}>
                EventAI transforms how you discover, experience, and remember events with cutting-edge artificial intelligence that personalizes every moment.
              </p>
              
              {/* Button row with two options */}
              <div className="d-flex flex-column flex-sm-row justify-content-center justify-content-lg-start gap-3">
                <button 
                  className="btn btn-lg"
                  onMouseEnter={() => setIsHovered(true)}
                  onMouseLeave={() => setIsHovered(false)}
                  onClick={() => navigate('/login')}
                  style={{
                    background: isHovered ? '#E04578' : colors.primary,
                    color: 'white',
                    borderRadius: '8px',
                    padding: '0.75rem 2rem',
                    fontSize: '1.1rem',
                    fontWeight: '600',
                    boxShadow: isHovered ? `0 8px 25px rgba(255, 90, 142, 0.4)` : `0 4px 15px rgba(255, 90, 142, 0.2)`,
                    border: 'none',
                    transition: 'all 0.3s ease',
                    transform: isHovered ? 'translateY(-2px)' : 'translateY(0)',
                  }}
                >
                  Get Started
                </button>
                <button 
                  className="btn btn-lg"
                  onClick={() => navigate('/about')}
                  style={{
                    background: 'transparent',
                    color: colors.primary,
                    borderRadius: '8px',
                    padding: '0.75rem 2rem',
                    fontSize: '1.1rem',
                    fontWeight: '600',
                    border: `2px solid ${colors.primary}`,
                    transition: 'all 0.3s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = 'rgba(255, 90, 142, 0.05)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = 'transparent';
                  }}
                >
                  Learn More
                </button>
              </div>
            </div>
            
            {/* Hero Image - Now on the right */}
            <div className="col-lg-6 order-lg-2 order-1 mb-5 mb-lg-0">
              <div style={{
                borderRadius: '16px',
                overflow: 'hidden',
                boxShadow: `0 20px 50px rgba(13, 27, 64, 0.2)`,
                transform: visible.hero ? 'translateY(0)' : 'translateY(40px)',
                opacity: visible.hero ? 1 : 0,
                transition: 'all 1s ease 0.2s',
                position: 'relative'
              }}>
                <div style={{
                  position: 'absolute',
                  top: '-20px',
                  right: '-20px',
                  width: '180px',
                  height: '180px',
                  borderRadius: '50%',
                  background: colors.primary,
                  opacity: '0.15',
                  zIndex: 0
                }}></div>
                <img 
                  src={eventImage} 
                  alt="Event Banner" 
                  className="img-fluid" 
                  style={{ 
                    maxHeight: "500px", 
                    width: "100%", 
                    objectFit: "cover",
                    transition: 'transform 0.5s ease-in-out',
                    transform: isHovered ? 'scale(1.02)' : 'scale(1)',
                    position: 'relative',
                    zIndex: 1
                  }} 
                />
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Features Section - Now with horizontal cards */}
      <section 
        id="features-section"
        className="py-5"
        style={{
          background: `linear-gradient(135deg, ${colors.light} 0%, rgba(13, 27, 64, 0.05) 100%)`,
          padding: '5rem 0',
          opacity: visible.features ? 1 : 0,
          transform: visible.features ? 'translateY(0)' : 'translateY(30px)',
          transition: 'opacity 0.8s ease, transform 0.8s ease',
        }}
      >
        <div className="container">
          <div className="text-center mb-5">
            <h2 className="fw-bold mb-3" style={{
              color: colors.secondary,
              fontSize: '2.5rem',
              position: 'relative',
              display: 'inline-block',
            }}>
              Intelligent Features
              <span style={{
                position: 'absolute',
                bottom: '-10px',
                left: '50%',
                transform: 'translateX(-50%)',
                width: '80px',
                height: '4px',
                background: `linear-gradient(90deg, ${colors.primary}, ${colors.secondary})`,
                borderRadius: '2px'
              }}></span>
            </h2>
            <p className="lead mb-4" style={{ color: colors.textLight }}>
              Discover the power of AI in simplifying your event experiences.
            </p>
          </div>
          <div className="row">
            {/* Card 1 */}
            <div className="col-lg-4 col-md-6 mb-4">
              <div className="card shadow-sm border-0 rounded-lg" style={{ overflow: 'hidden' }}>
                <img src="https://via.placeholder.com/400x300" alt="Feature 1" className="card-img-top" />
                <div className="card-body" style={{ background: colors.light }}>
                  <h5 className="card-title" style={{ color: colors.primary }}>Event Personalization</h5>
                  <p className="card-text" style={{ color: colors.textLight }}>
                    Let AI recommend events that match your interests and preferences.
                  </p>
                </div>
              </div>
            </div>
            {/* Card 2 */}
            <div className="col-lg-4 col-md-6 mb-4">
              <div className="card shadow-sm border-0 rounded-lg" style={{ overflow: 'hidden' }}>
                <img src="https://via.placeholder.com/400x300" alt="Feature 2" className="card-img-top" />
                <div className="card-body" style={{ background: colors.light }}>
                  <h5 className="card-title" style={{ color: colors.primary }}>Seamless Booking</h5>
                  <p className="card-text" style={{ color: colors.textLight }}>
                    Effortlessly book your next event with just a few clicks.
                  </p>
                </div>
              </div>
            </div>
            {/* Card 3 */}
            <div className="col-lg-4 col-md-6 mb-4">
              <div className="card shadow-sm border-0 rounded-lg" style={{ overflow: 'hidden' }}>
                <img src="https://via.placeholder.com/400x300" alt="Feature 3" className="card-img-top" />
                <div className="card-body" style={{ background: colors.light }}>
                  <h5 className="card-title" style={{ color: colors.primary }}>AI Reviews</h5>
                  <p className="card-text" style={{ color: colors.textLight }}>
                    Get intelligent insights and ratings on events.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section 
        id="cta-section"
        className={`py-5 text-center ${visible.cta ? 'animate-fade-in' : ''}`}
        style={{
          background: colors.primary,
          color: 'white',
          opacity: visible.cta ? 1 : 0,
          transform: visible.cta ? 'translateY(0)' : 'translateY(30px)',
          transition: 'opacity 0.8s ease, transform 0.8s ease',
        }}
      >
        <div className="container">
          <h3 className="display-4 mb-4">Join the Future of Event Discovery</h3>
          <p className="lead mb-5">
            Sign up now to start exploring and experiencing events powered by AI!
          </p>
          <button 
            className="btn btn-lg" 
            onClick={() => navigate('/signup')}
            style={{
              background: '#E04578', 
              color: 'white',
              padding: '1rem 3rem',
              borderRadius: '8px',
              fontSize: '1.25rem',
              fontWeight: '700',
              boxShadow: '0 10px 20px rgba(224, 69, 120, 0.2)',
            }}
          >
            Get Started
          </button>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
