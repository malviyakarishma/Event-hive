import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import reviewsImage from "../images/reviews.jpg";
import eventImage from "../images/flex.jpg";

// Add global style reset
const globalStyle = `
  body, html {
    margin: 0;
    padding: 0;
    overflow-x: hidden;
  }
`;

const LandingPage = () => {
  const navigate = useNavigate();
  const [isHovered, setIsHovered] = useState(false);
  
  // Animation for reveal on scroll using Intersection Observer instead of scroll events
  const [visibleSections, setVisibleSections] = useState({
    hero: false,
    features: false,
    cta: false
  });

  useEffect(() => {
    // Using Intersection Observer for better performance
    const observerOptions = {
      root: null,
      rootMargin: '0px',
      threshold: 0.25
    };

    const sectionObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const sectionId = entry.target.id.replace('-section', '');
          setVisibleSections(prev => ({
            ...prev,
            [sectionId]: true
          }));
          
          // Once a section is visible, we can stop observing it
          sectionObserver.unobserve(entry.target);
        }
      });
    }, observerOptions);
    
    // Observe each section
    const sections = ['hero-section', 'features-section', 'cta-section'];
    sections.forEach(id => {
      const element = document.getElementById(id);
      if (element) sectionObserver.observe(element);
    });
    
    return () => {
      // Cleanup
      sections.forEach(id => {
        const element = document.getElementById(id);
        if (element) sectionObserver.unobserve(element);
      });
    };
  }, []);

  // Theming with design tokens
  const theme = {
    colors: {
      primary: "#FF5A8E", // Vibrant pink
      secondary: "#0D1B40", // Deep navy
      accent: "#41C9E2", // Bright turquoise accent
      dark: "#081029", // Very dark navy, almost black
      light: "#FFF5F8", // Very light pink (off-white with pink tint)
      text: "#0D1B40", // Navy for main text
      textLight: "#6C7A9C" // Muted navy for secondary text
    },
    shadows: {
      sm: '0 4px 15px rgba(255, 90, 142, 0.2)',
      md: '0 8px 25px rgba(255, 90, 142, 0.4)',
      lg: '0 20px 50px rgba(13, 27, 64, 0.2)'
    },
    transitions: {
      default: 'all 0.3s ease',
      slow: 'all 0.8s ease',
      delayed: 'all 1s ease 0.2s'
    },
    borderRadius: {
      sm: '6px',
      md: '8px',
      lg: '16px'
    }
  };

  // Button component for consistent styling and DRY code
  const Button = ({ primary, children, onClick, className = '' }) => (
    <button 
      className={`btn btn-lg ${className}`}
      onClick={onClick}
      onMouseEnter={primary ? () => setIsHovered(true) : undefined}
      onMouseLeave={primary ? () => setIsHovered(false) : undefined}
      style={{
        background: primary 
          ? (isHovered ? '#E04578' : theme.colors.primary) 
          : 'transparent',
        color: primary ? 'white' : theme.colors.primary,
        borderRadius: theme.borderRadius.md,
        padding: '0.75rem 2rem',
        fontSize: '1.1rem',
        fontWeight: '600',
        boxShadow: primary 
          ? (isHovered ? theme.shadows.md : theme.shadows.sm) 
          : 'none',
        border: primary ? 'none' : `2px solid ${theme.colors.primary}`,
        transition: theme.transitions.default,
        transform: primary && isHovered ? 'translateY(-2px)' : 'translateY(0)'
      }}
    >
      {children}
    </button>
  );

  // Shared section transition properties
  const getSectionStyle = (isVisible) => ({
    opacity: isVisible ? 1 : 0,
    transform: isVisible ? 'translateY(0)' : 'translateY(30px)',
    transition: theme.transitions.slow
  });

  return (
    <>
      <style>{globalStyle}</style>
      <div className="d-flex flex-column min-vh-100" style={{
        fontFamily: "'Inter', 'Segoe UI', Roboto, sans-serif",
        overflowX: 'hidden',
        color: theme.colors.text,
        background: theme.colors.light,
        margin: 0,
        padding: 0,
        marginTop: "-80px" // Compensate for the global padding
      }}>
        {/* Hero Section - Centered layout without image */}
        <section 
          id="hero-section"
          className="text-center d-flex align-items-center justify-content-center"
          style={{
            background: `linear-gradient(135deg, ${theme.colors.light} 0%, rgba(255, 90, 142, 0.1) 100%)`,
            padding: '6rem 0',
            marginTop: 0,
            minHeight: '100vh', /* Make it full height of the viewport */
            ...getSectionStyle(visibleSections.hero)
          }}
        >
          <div className="container">
            <div className="row justify-content-center">
              <div className="col-lg-8 mb-5">
                <h1 className="display-3 fw-bold mb-4" style={{
                  background: `linear-gradient(90deg, ${theme.colors.secondary} 0%, ${theme.colors.primary} 100%)`,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  fontWeight: '800',
                  letterSpacing: '-0.5px'
                }}>
                  Experience Events Through <span style={{ color: theme.colors.primary }}>AI-Powered</span> Intelligence
                </h1>
                
                <p className="lead mb-5" style={{
                  color: theme.colors.textLight,
                  fontSize: '1.25rem',
                  lineHeight: '1.6'
                }}>
                  EventAI transforms how you discover, experience, and remember events with cutting-edge artificial intelligence that personalizes every moment.
                </p>
                
                {/* Updated buttons for clearer navigation */}
                <div className="d-flex flex-column flex-sm-row justify-content-center gap-3">
                  <Button primary onClick={() => navigate('/registration')}>
                    Register
                  </Button>
                  <Button onClick={() => navigate('/login')}>
                    Login
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>
        
        {/* Features Section */}
        <section 
          id="features-section"
          className="py-5"
          style={{
            background: `linear-gradient(135deg, ${theme.colors.light} 0%, rgba(13, 27, 64, 0.05) 100%)`,
            padding: '5rem 0',
            ...getSectionStyle(visibleSections.features)
          }}
        >
          <div className="container">
            <div className="text-center mb-5">
              <h2 className="fw-bold mb-3" style={{
                color: theme.colors.secondary,
                fontSize: '2.5rem',
                position: 'relative',
                display: 'inline-block'
              }}>
                Intelligent Features
                <span style={{
                  position: 'absolute',
                  bottom: '-10px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: '80px',
                  height: '4px',
                  background: `linear-gradient(90deg, ${theme.colors.primary}, ${theme.colors.secondary})`,
                  borderRadius: '2px'
                }}></span>
              </h2>
              <p className="lead mb-4" style={{ color: theme.colors.textLight }}>
                Discover the power of AI in simplifying your event experiences.
              </p>
            </div>
            <div className="row">
              {/* Card Component */}
              {[
                {
                  title: "Event Personalization",
                  description: "Let AI recommend events that match your interests and preferences.",
                  image: eventImage,
                  buttonText: "Explore Recommendations",
                  path: "/EventPersonalization"
                },
                {
                  title: "AI Reviews & Insights",
                  description: "Get intelligent insights and detailed analytics on events.",
                  image: reviewsImage,
                  buttonText: "View Insights",
                  path: "/AIReviewsPage"
                }
              ].map((card, index) => (
                <div className="col-lg-6 col-md-6 mb-4" key={index}>
                  <div 
                    className="card shadow-sm border-0 rounded-lg h-100" 
                    style={{ 
                      overflow: 'hidden',
                      cursor: 'pointer',
                      transition: theme.transitions.default
                    }}
                    onClick={() => navigate(card.path)}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-5px)';
                      e.currentTarget.style.boxShadow = theme.shadows.md;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = theme.shadows.sm;
                    }}
                  >
                    <img src={card.image} alt={card.title} className="card-img-top" />
                    <div className="card-body" style={{ background: theme.colors.light }}>
                      <h5 className="card-title" style={{ color: theme.colors.primary }}>{card.title}</h5>
                      <p className="card-text" style={{ color: theme.colors.textLight }}>
                        {card.description}
                      </p>
                      <div className="mt-3">
                        <button 
                          className="btn btn-sm" 
                          style={{
                            background: theme.colors.primary,
                            color: 'white',
                            borderRadius: theme.borderRadius.sm,
                            padding: '8px 16px',
                            fontWeight: '600',
                            transition: theme.transitions.default,
                            border: 'none'
                          }}
                        >
                          {card.buttonText}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Call to Action Section */}
        <section 
          id="cta-section"
          className="py-5 text-center"
          style={{
            background: theme.colors.primary,
            color: 'white',
            ...getSectionStyle(visibleSections.cta)
          }}
        >
          <div className="container">
            <h3 className="display-4 mb-4">Join the Future of Event Discovery</h3>
            <p className="lead mb-5">
              Register now to start exploring and experiencing events powered by AI!
            </p>
            <div className="d-flex flex-wrap justify-content-center gap-3">
              <button 
                className="btn btn-lg" 
                onClick={() => navigate('/register')}
                style={{
                  background: 'white', 
                  color: theme.colors.primary,
                  padding: '1rem 3rem',
                  borderRadius: theme.borderRadius.md,
                  fontSize: '1.25rem',
                  fontWeight: '700',
                  boxShadow: '0 10px 20px rgba(255, 255, 255, 0.2)'
                }}
              >
                Register
              </button>
              <button 
                className="btn btn-lg" 
                onClick={() => navigate('/login')}
                style={{
                  background: 'transparent', 
                  color: 'white',
                  padding: '1rem 3rem',
                  borderRadius: theme.borderRadius.md,
                  fontSize: '1.25rem',
                  fontWeight: '700',
                  border: '2px solid white'
                }}
              >
                Login
              </button>
            </div>
          </div>
        </section>
      </div>
    </>
  );
};

export default LandingPage;