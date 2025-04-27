import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';

function PaymentSuccess() {
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const sessionId = queryParams.get('session_id');
    
    if (sessionId) {
      // Verify the payment was successful
      axios.get(`http://localhost:3001/stripe/verify-session/${sessionId}`)
        .then(response => {
          setMessage('Your admin registration was successful! Redirecting to login...');
          setLoading(false);
          
          // Redirect to login after 3 seconds
          setTimeout(() => {
            navigate('/login');
          }, 3000);
        })
        .catch(error => {
          console.error('Error verifying payment:', error);
          setMessage('There was an issue verifying your payment. Please contact support.');
          setLoading(false);
        });
    } else {
      setMessage('Invalid session. Please try registering again.');
      setLoading(false);
    }
  }, [navigate, location]);

  return (
    <div className="container d-flex justify-content-center align-items-center min-vh-100">
      <div className="card shadow-lg p-5 text-center" style={{maxWidth: '500px'}}>
        {loading ? (
          <>
            <div className="spinner-border text-primary mx-auto mb-4" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <h3>Processing your registration...</h3>
          </>
        ) : (
          <>
            <div className="display-1 text-success mb-4">
              <i className="bi bi-check-circle-fill"></i>
            </div>
            <h2>Payment Successful!</h2>
            <p className="lead mt-3">{message}</p>
          </>
        )}
      </div>
    </div>
  );
}

export { PaymentSuccess };