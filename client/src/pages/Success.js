import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function Success() {
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    async function handleSuccess() {
      const urlParams = new URLSearchParams(window.location.search);
      const sessionId = urlParams.get('session_id');

      if (!sessionId) {
        console.error("No session ID found.");
        navigate('/'); // or show error
        return;
      }

      try {
        // 1. Verify session with backend
        const { data } = await axios.get(`http://localhost:3001/stripe/verify-session/${sessionId}`);
        
        if (data.success) {
          // 2. Register the user now
          await axios.post('http://localhost:3001/auth', {
            username: data.username,
            email: data.email,
            password: "defaultpassword", // ⚡ You must somehow handle the password (store it temporarily or let user set again)
            isAdmin: true
          });

          // 3. Redirect to /admin
          navigate('/admin');
        } else {
          console.error("Payment not completed.");
          navigate('/'); // or show error
        }
      } catch (error) {
        console.error("Error verifying payment:", error);
        navigate('/');
      } finally {
        setLoading(false);
      }
    }

    handleSuccess();
  }, [navigate]);

  return (
    <div className="container text-center mt-5">
      {loading ? <h2>Processing your payment...</h2> : <h2>Redirecting...</h2>}
    </div>
  );
}

export default Success;
