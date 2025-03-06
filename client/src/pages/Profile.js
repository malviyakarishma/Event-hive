import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";


const Profile = () => {
  const [user, setUser] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const token = localStorage.getItem("accessToken");
        if (!token) {
          throw new Error("Authentication token missing");
        }

        const response = await axios.get("http://localhost:3001/api/user/profile", { // Use consistent endpoint
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setUser({
          id: response.data.id,
          username: response.data.username,
          isAdmin: response.data.isAdmin,
        });
        setReviews(response.data.reviews || []);

        setLoading(false);
      } catch (err) {
        console.error("Error fetching profile:", err);
        let errorMessage = "An unexpected error occurred.";

        if (err.response) {
          if (err.response.status === 401 || err.response.status === 403) {
            errorMessage = "Your session has expired. Please log in again.";
            setTimeout(() => navigate("/login"), 2000);
          } else {
            errorMessage = `Error ${err.response.status}: ${err.response.data?.message || err.message}`;
          }
        } else if (err.message === "Authentication token missing") {
            errorMessage = "Please login.";
            setTimeout(() => navigate("/login"), 2000);
        } else {
            errorMessage = err.message;
        }

        setError(errorMessage);
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [navigate]);

  // Rest of your component remains the same
  if (loading) {
    return <p className="text-center mt-5">Loading profile...</p>;
  }

  if (error) {
    return <p className="text-center mt-5 text-danger">{error}</p>;
  }

  if (!user) {
    return <p className="text-center mt-5">User data not found.</p>;
  }

  return (
    <div className="bg-light min-vh-100" style={{ paddingTop: "70px" }}>
      <div className="container py-5">
        <div className="row">
          {/* User Info */}
          <div className="col-lg-4 mb-4">
            <div className="card border-0 shadow-sm">
              <div className="card-body text-center">
                <h2 className="h4 mb-2">{user.username}</h2>
                <p className="text-muted mb-3">Admin: {user.isAdmin ? "Yes" : "No"}</p>
                <p className="badge bg-success fs-6 mb-0">
                  {reviews.length} Events Reviewed
                </p>
              </div>
            </div>
          </div>

          {/* User Reviews */}
          <div className="col-lg-8">
            <div className="card border-0 shadow-sm">
              <div className="card-header bg-white">
                <h3 className="h5 mb-0">My Event Reviews</h3>
              </div>
              <div className="card-body p-0">
                <div className="list-group list-group-flush">
                  {reviews.length > 0 ? (
                    reviews.map((review) => (
                      <div key={review.id} className="list-group-item p-4">
                        <div className="d-flex justify-content-between align-items-center mb-2">
                          <h4 className="h6 mb-0">{review.event?.title || "Unknown Event"}</h4>
                          <div>
                            <span className="badge bg-primary rounded-pill me-2">
                              {review.event?.date}
                            </span>
                            <span className="badge bg-warning text-dark rounded-pill">
                              {review.rating} ★
                            </span>
                          </div>
                        </div>
                        <p className="text-muted mb-1">{review.text || review.review_text}</p>
                        {review.sentiment && (
                          <p className="text-muted"><strong>Sentiment:</strong> {review.sentiment}</p>
                        )}
                        {(review.adminResponse || review.admin_response) && (
                          <p className="text-muted"><strong>Admin Response:</strong> {review.adminResponse || review.admin_response}</p>
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="text-center p-3">No reviews yet.</p>
                  )}
                </div>
              </div>
            </div>

            {/* Find More Events */}
            <div className="text-center mt-4">
              <button 
                className="btn btn-outline-primary"
                onClick={() => navigate("/home")}
              >
                Find More Events to Attend & Review
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
