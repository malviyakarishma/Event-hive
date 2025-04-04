import React, { useState, useEffect, useCallback } from 'react';
// Import your banner images - make sure these files exist in your project
// You'll need to adjust these paths based on your project structure
import banner1 from '../images/banners/banner1.jpg';
import banner2 from '../images/banners/banner2.jpg';
import banner3 from '../images/banners/banner3.jpg';
import banner4 from '../images/banners/banner4.jpg';
import banner5 from '../images/banners/banner5.jpg';
import banner6 from '../images/banners/banner6.jpg';
import banner7 from '../images/banners/banner7.jpg';
import banner8 from '../images/banners/banner8.jpg';

const BannerSlideshow = ({ theme, isCircular = false }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [nextIndex, setNextIndex] = useState(1);
  const [fading, setFading] = useState(false);
  
  // Use imported images
  const banners = [
    banner1, banner2, banner3, banner4,
    banner5, banner6, banner7, banner8
  ];

  // Centralized transition logic to ensure consistency
  // Using useCallback to memoize the function
  const handleTransition = useCallback((newIndex) => {
    if (fading) return;
  
    // Begin fade out
    setFading(true);
  
    // Fade out lasts 500ms, then switch image, then fade in
    setTimeout(() => {
      setCurrentIndex(newIndex);
      setNextIndex((newIndex + 1) % banners.length);
  
      // Allow time for re-render and apply fade-in
      requestAnimationFrame(() => {
        // Using rAF ensures DOM has painted with new image
        setFading(false);
      });
    }, 500); // Match this with your CSS fade-out duration
  }, [fading, banners.length]);

  useEffect(() => {
    // Change image every 5 seconds for a slower, more elegant transition
    const interval = setInterval(() => {
      handleTransition((currentIndex + 1) % banners.length);
    }, 3000); // 5 seconds between transitions for better viewing

    return () => clearInterval(interval);
  }, [currentIndex, banners.length, handleTransition]);

  // Container shape based on prop
  const containerShape = isCircular 
    ? { borderRadius: '50%' } 
    : { borderRadius: '12px' };

  return (
    <div className="banner-slideshow position-relative overflow-hidden w-100 h-100" style={{ 
      border: '5px solid rgba(255, 255, 255, 0.2)',
      boxShadow: '0 10px 30px rgba(0, 0, 0, 0.2)',
      background: 'rgba(255, 255, 255, 0.1)',
      ...containerShape
    }}>
      {/* Current image with fade effect */}
      <div 
        className="position-absolute w-100 h-100"
        style={{
          backgroundImage: `url(${banners[currentIndex]})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          width: '100%',
          height: '100%',
          opacity: fading ? 0 : 1,
          transition: 'opacity 1s ease-in-out',
          zIndex: 1
        }}
      />
      
      {/* Base layer (next image) */}
      <div 
        className="position-absolute w-100 h-100"
        style={{
          backgroundImage: `url(${banners[nextIndex]})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          width: '100%',
          height: '100%',
          zIndex: 0
        }}
      />
      
      {/* Subtle overlay for better text readability if needed */}
      {/* <div 
        className="position-absolute w-100 h-100"
        style={{
          background: 'radial-gradient(circle, rgba(0,0,0,0) 50%, rgba(0,0,0,0.3) 100%)',
          zIndex: 2
        }}
      /> */}
      
      {/* Improved indicators with active animation */}
      <div 
        className="position-absolute bottom-0 start-50 translate-middle-x mb-4 d-flex gap-2"
        style={{ zIndex: 3 }}
      >
        {banners.map((_, index) => (
          <div 
            key={index}
            className="rounded-pill"
            style={{
              width: currentIndex === index ? '24px' : '8px',
              height: '8px',
              backgroundColor: currentIndex === index ? 'white' : 'rgba(255,255,255,0.5)',
              transition: 'all 0.5s ease',
              cursor: 'pointer'
            }}
            onClick={() => handleTransition(index)}
          />
        ))}
      </div>
      
      {/* Navigation buttons with improved styling */}
      {/* <button 
        className="banner-nav-button position-absolute top-50 start-0 translate-middle-y ms-3"
        style={{ 
          zIndex: 3, 
          cursor: 'pointer',
          width: '40px',
          height: '40px',
          border: 'none',
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.2)',
          backdropFilter: 'blur(5px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          color: 'white',
          fontSize: '1.5rem',
          transition: 'all 0.3s ease',
          opacity: 0.7
        }}
        onMouseEnter={(e) => e.currentTarget.style.opacity = 1}
        onMouseLeave={(e) => e.currentTarget.style.opacity = 0.7}
        onClick={() => handleTransition((currentIndex - 1 + banners.length) % banners.length)}
        aria-label="Previous banner"
      >
        <i className="bi bi-chevron-left"></i>
      </button>
       */}
      {/* <button 
        className="banner-nav-button position-absolute top-50 end-0 translate-middle-y me-3"
        style={{ 
          zIndex: 3, 
          cursor: 'pointer',
          width: '40px',
          height: '40px',
          border: 'none',
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.2)',
          backdropFilter: 'blur(5px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          color: 'white',
          fontSize: '1.5rem',
          transition: 'all 0.3s ease',
          opacity: 0.7
        }}
        onMouseEnter={(e) => e.currentTarget.style.opacity = 1}
        onMouseLeave={(e) => e.currentTarget.style.opacity = 0.7}
        onClick={() => handleTransition((currentIndex + 1) % banners.length)}
        aria-label="Next banner"
      >
        <i className="bi bi-chevron-right"></i>
      </button> */}
    </div>
  );
};

export default BannerSlideshow;