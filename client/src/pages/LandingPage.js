import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import eventImage from "../images/flex.jpg";

const LandingPage = () => {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  
  // Handle scroll effects
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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
            <p style={{
              color: colors.textLight,
              fontSize: '1.1rem',
              maxWidth: '600px',
              margin: '0 auto'
            }}>Discover how our AI enhances your event experience</p>
          </div>
          
          {/* Features as horizontal cards */}
          {[
            {
              icon: "📊",
              title: "Smart Event Analysis",
              description: "Our AI analyzes event content in real-time, highlighting key moments and providing insights you might otherwise miss."
            },
            {
              icon: "🎯",
              title: "Personalized Recommendations",
              description: "Receive tailored event suggestions based on your preferences, past attendance, and emerging trends."
            },
            {
              icon: "🔍",
              title: "Intelligent Search",
              description: "Find exactly what you're looking for with our context-aware search that understands natural language queries."
            }
          ].map((feature, index) => (
            <div 
              className="mb-4" 
              key={index}
              style={{
                transform: `translateY(${visible.features ? '0' : '40px'})`,
                opacity: visible.features ? 1 : 0,
                transition: 'all 0.3s ease',
                transitionDelay: `${0.1 + index * 0.1}s`,
              }}
            >
              <div className="card border-0 h-100" style={{
                borderRadius: '16px',
                overflow: 'hidden',
                boxShadow: '0 10px 30px rgba(13, 27, 64, 0.05)',
                background: index % 2 === 0 ? '#FFF5F8' : '#F8F9FD',
                transition: 'all 0.3s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-5px)';
                e.currentTarget.style.boxShadow = '0 15px 35px rgba(13, 27, 64, 0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 10px 30px rgba(13, 27, 64, 0.05)';
              }}>
                <div className="card-body p-4">
                  <div className="row align-items-center">
                    <div className="col-md-2 col-sm-3 text-center mb-3 mb-md-0">
                      <div style={{
                        fontSize: '3rem',
                        background: index === 0 ? colors.primary : index === 1 ? colors.secondary : colors.accent,
                        color: 'white',
                        width: '80px',
                        height: '80px',
                        borderRadius: '16px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto'
                      }}>{feature.icon}</div>
                    </div>
                    <div className="col-md-10 col-sm-9">
                      <h3 className="h4 fw-bold mb-2" style={{
                        color: colors.secondary,
                        fontSize: '1.25rem',
                      }}>{feature.title}</h3>
                      <p style={{
                        color: colors.textLight,
                        fontSize: '1rem',
                        lineHeight: '1.6',
                        marginBottom: 0
                      }}>{feature.description}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
      
      {/* CTA Section with updated design */}
      <section 
        id="cta-section"
        className="text-white py-5"
        style={{
          background: `linear-gradient(135deg, ${colors.secondary} 0%, ${colors.primary} 100%)`,
          padding: '5rem 0',
          position: 'relative',
          overflow: 'hidden',
          opacity: visible.cta ? 1 : 0,
          transform: visible.cta ? 'translateY(0)' : 'translateY(30px)',
          transition: 'opacity 0.8s ease, transform 0.8s ease',
        }}
      >
        {/* Abstract shapes in background */}
        <div style={{
          position: 'absolute',
          top: '-50px',
          right: '-50px',
          width: '300px',
          height: '300px',
          borderRadius: '50%',
          background: 'rgba(255, 255, 255, 0.1)',
          zIndex: 0
        }}></div>
        <div style={{
          position: 'absolute',
          bottom: '-80px',
          left: '-80px',
          width: '400px',
          height: '400px',
          borderRadius: '50%',
          background: 'rgba(255, 255, 255, 0.05)',
          zIndex: 0
        }}></div>
        
        <div className="container" style={{ position: 'relative', zIndex: 1 }}>
          <div className="row align-items-center">
            <div className="col-lg-6 text-center text-lg-start mb-4 mb-lg-0">
              <h2 className="fw-bold mb-3" style={{
                fontSize: '2.5rem',
                marginBottom: '1rem'
              }}>Ready to Transform Your Event Experience?</h2>
              <p className="mb-4" style={{
                fontSize: '1.1rem',
                opacity: '0.9',
              }}>Join thousands of users who have discovered the power of AI-enhanced event viewing.</p>
            </div>
            <div className="col-lg-6 text-center text-lg-end">
              <button 
                className="btn btn-light btn-lg"
                onClick={() => navigate('/login')}
                style={{
                  borderRadius: '8px',
                  padding: '0.75rem 2.5rem',
                  fontSize: '1.1rem',
                  fontWeight: '600',
                  color: colors.secondary,
                  boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)',
                  border: 'none',
                  transition: 'all 0.3s ease',
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = 'translateY(-3px)';
                  e.target.style.boxShadow = '0 15px 30px rgba(0, 0, 0, 0.25)';
                  e.target.style.color = colors.primary;
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 10px 25px rgba(0, 0, 0, 0.15)';
                  e.target.style.color = colors.secondary;
                }}
              >
                Get Started Now
              </button>
            </div>
          </div>
        </div>
      </section>
      
      {/* Refined Footer with updated layout */}
      <footer style={{
        background: colors.secondary,
        color: 'rgba(255, 255, 255, 0.7)',
        padding: '3rem 0'
      }}>
        <div className="container">
          <div className="row">
            <div className="col-lg-4 mb-4 mb-lg-0">
              <h3 style={{ color: 'white', fontSize: '1.5rem', marginBottom: '1rem' }}>EventAI</h3>
              <p style={{ fontSize: '0.9rem', maxWidth: '300px' }}>
                Transforming how you discover, experience, and remember events with cutting-edge AI.
              </p>
            </div>
            <div className="col-lg-2 col-md-4 mb-4 mb-md-0">
              <h4 style={{ color: 'white', fontSize: '1.1rem', marginBottom: '1rem' }}>Company</h4>
              <ul className="list-unstyled">
                {['About', 'Careers', 'Blog', 'Press'].map(item => (
                  <li key={item} className="mb-2">
                    <a href="#" style={{ color: 'inherit', textDecoration: 'none', transition: 'color 0.2s' }}
                      onMouseEnter={(e) => e.target.style.color = colors.primary}
                      onMouseLeave={(e) => e.target.style.color = 'rgba(255, 255, 255, 0.7)'}
                    >{item}</a>
                  </li>
                ))}
              </ul>
            </div>
            <div className="col-lg-2 col-md-4 mb-4 mb-md-0">
              <h4 style={{ color: 'white', fontSize: '1.1rem', marginBottom: '1rem' }}>Product</h4>
              <ul className="list-unstyled">
                {['Features', 'Pricing', 'Support', 'Docs'].map(item => (
                  <li key={item} className="mb-2">
                    <a href="#" style={{ color: 'inherit', textDecoration: 'none', transition: 'color 0.2s' }}
                      onMouseEnter={(e) => e.target.style.color = colors.primary}
                      onMouseLeave={(e) => e.target.style.color = 'rgba(255, 255, 255, 0.7)'}
                    >{item}</a>
                  </li>
                ))}
              </ul>
            </div>
            <div className="col-lg-4 col-md-4">
              <h4 style={{ color: 'white', fontSize: '1.1rem', marginBottom: '1rem' }}>Connect</h4>
              <div style={{
                display: 'flex',
                gap: '1rem',
                marginBottom: '1rem'
              }}>
                {['Twitter', 'Facebook', 'Instagram', 'LinkedIn'].map((social, index) => (
                  <a key={index} href="#" style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'rgba(255, 255, 255, 0.1)',
                    color: 'white',
                    transition: 'all 0.3s ease',
                    textDecoration: 'none'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = colors.primary;
                    e.target.style.transform = 'translateY(-3px)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = 'rgba(255, 255, 255, 0.1)';
                    e.target.style.transform = 'translateY(0)';
                  }}
                  >
                    {social.charAt(0)}
                  </a>
                ))}
              </div>
              <p style={{ fontSize: '0.9rem' }}>
                Subscribe to our newsletter for updates
              </p>
              <div className="d-flex">
                <input type="email" placeholder="Your email" style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '8px 0 0 8px',
                  border: 'none',
                  outline: 'none',
                  fontSize: '0.9rem',
                  width: '70%',
                  background: 'rgba(255, 255, 255, 0.1)',
                  color: 'white'
                }} />
                <button style={{
                  background: colors.primary,
                  color: 'white',
                  border: 'none',
                  borderRadius: '0 8px 8px 0',
                  padding: '0.5rem 1rem',
                  fontSize: '0.9rem'
                }}>
                  Subscribe
                </button>
              </div>
            </div>
          </div>
          <div className="pt-4 mt-4" style={{ borderTop: '1px solid rgba(255, 255, 255, 0.1)', textAlign: 'center' }}>
            <p style={{
              margin: 0,
              fontSize: '0.9rem'
            }}>&copy; 2025 EventAI. All rights reserved.</p>
          </div>
        </div>
      </footer>
      
      {/* Add custom CSS for scroll animations */}
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .animate-fade-in {
          animation: fadeIn 0.8s ease forwards;
        }
      `}</style>
    </div>
  );
};

export default LandingPage;