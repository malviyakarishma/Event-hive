import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function PaymentCancel() {
  const navigate = useNavigate();
  
  useEffect(() => {
    // Redirect back to registration after 5 seconds
    const timer = setTimeout(() => {
      navigate('/registration');
    }, 5000);
    
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="container d-flex justify-content-center align-items-center min-vh-100">
      <div className="card shadow-lg p-5 text-center" style={{maxWidth: '500px'}}>
        <div className="display-1 text-danger mb-4">
          <i className="bi bi-x-circle"></i>
        </div>
        <h2>Payment Cancelled</h2>
        <p className="lead mt-3">Your admin registration has been cancelled. No payment was processed.</p>
        <p>You will be redirected back to the registration page in a few seconds...</p>
        <button 
          className="btn btn-primary mt-3"
          onClick={() => navigate('/registration')}
        >
          Return to Registration
        </button>
      </div>
    </div>
  );
}

export {PaymentCancel };