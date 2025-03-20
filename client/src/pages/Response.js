import React, { useContext, useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import "bootstrap/dist/css/bootstrap.min.css";
import { FaCalendarAlt, FaMapMarkerAlt, FaArrowLeft, FaTrashAlt, FaReply, 
         FaChevronUp, FaPaperPlane, FaUser, FaStar, FaCommentSlash, 
         FaHeart, FaAlignLeft, FaTags, FaClock, FaEdit } from "react-icons/fa";
import { AuthContext } from "../helpers/AuthContext";

export default function Response() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [eventData, setEventData] = useState(null);
    const [reviews, setReviews] = useState([]);
    const [responses, setResponses] = useState({});
    const [loading, setLoading] = useState(true);
    const [expandedReview, setExpandedReview] = useState(null);
    const { authState } = useContext(AuthContext);

    // Custom color constants
    const colors = {
        navy: "#001F3F",
        coral: "#FF6B6B",
        white: "#FFFFFF",
        lightGray: "#F5F7FA",
        gray: "#E2E8F0",
        darkGray: "#718096",
        errorRed: "#FF4D6A",
        successGreen: "#2DD4BF"
    };

    useEffect(() => {
        const fetchEventDetails = async () => {
            setLoading(true);
            try {
                const response = await axios.get(`http://localhost:3001/events/${id}`);
                setEventData(response.data.event || null);
                setReviews(response.data.reviews || []);
            } catch (err) {
                console.error("Error fetching event details:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchEventDetails();
    }, [id]);

    const handleResponseChange = (reviewId, text) => {
        setResponses(prev => ({ ...prev, [reviewId]: text }));
    };

    const submitResponse = async (reviewId, e) => {
        e.preventDefault();
        if (!responses[reviewId]?.trim()) {
            alert("Response cannot be empty.");
            return;
        }

        const accessToken = localStorage.getItem("accessToken");
        if (!accessToken) {
            alert("You must be logged in as an admin to respond.");
            return;
        }

        try {
            const { data } = await axios.put(
                `http://localhost:3001/reviews/respond/${reviewId}`,
                { adminResponse: responses[reviewId] },
                { headers: { Authorization: `Bearer ${accessToken}` } }
            );

            alert("Response submitted successfully!");
            setReviews(prevReviews =>
                prevReviews.map(review =>
                    review.id === reviewId ? { ...review, admin_response: data.response } : review
                )
            );
            setResponses(prev => ({ ...prev, [reviewId]: "" }));
            setExpandedReview(null); // Collapse after submitting
        } catch (err) {
            console.error("Error submitting response:", err);
            console.log("Error response:", err.response?.data || "No response data");
            alert(`Failed to submit response: ${err.response?.data?.error || err.message}`);
        }
    };

    const deleteEvent = async () => {
        if (!window.confirm("Are you sure you want to delete this event? This action cannot be undone.")) return;

        const accessToken = localStorage.getItem("accessToken");
        if (!accessToken) {
            alert("You must be logged in as an admin to delete this event.");
            return;
        }

        try {
            await axios.delete(`http://localhost:3001/events/${id}`, {
                headers: { Authorization: `Bearer ${accessToken}` },
            });

            alert("Event deleted successfully!");
            navigate("/admin");
        } catch (err) {
            console.error("Error deleting event:", err);
            alert("Failed to delete event. Try again.");
        }
    };

    const editEvent = () => {
        navigate(`/admin/edit-event/${id}`);
      };

    const toggleExpandReview = (reviewId) => {
        setExpandedReview(expandedReview === reviewId ? null : reviewId);
    };

    // Function to correct the image path - following the same pattern from AdminDashboard
    const getImageUrl = (imagePath) => {
        if (!imagePath) return null;
        
        // If the path already starts with http, return as is
        if (imagePath.startsWith('http')) return imagePath;
        
        // If the path begins with "/uploads/events/", remove the leading slash
        if (imagePath.startsWith('/uploads/events/')) {
            return `http://localhost:3001${imagePath}`;
        }
        
        // For any other case, just append the path to the base URL
        return `http://localhost:3001/${imagePath}`;
    };

    // Helper function to get sentiment badge color
    const getSentimentColor = (sentiment) => {
        if (!sentiment) return colors.darkGray;
        sentiment = sentiment.toLowerCase();
        if (sentiment.includes("positive")) return colors.coral;
        if (sentiment.includes("negative")) return "#6B6BFF"; // Light blue for contrast
        return "#FFD700"; // Gold for neutral
    };

    // Footer component from Create Event page
    const Footer = () => {
        const currentYear = new Date().getFullYear();
        
        return (
          <footer style={{ 
            backgroundColor: colors.navy, 
            color: colors.white, 
            padding: "1.5rem", 
            textAlign: "center", 
            width: "100%", 
            boxShadow: "0 -5px 10px rgba(0,0,0,0.05)" 
          }}>
            <div style={{ 
              display: "flex", 
              flexDirection: "column", 
              alignItems: "center", 
              justifyContent: "center", 
              maxWidth: "800px", 
              margin: "0 auto" 
            }}>
              <p style={{ 
                margin: "0.5rem 0", 
                fontWeight: "600", 
                fontSize: "1rem" 
              }}>
                <FaHeart style={{ color: colors.coral, marginRight: "0.5rem" }} /> EventHub Community
              </p>
              <p style={{ margin: "0.5rem 0", fontSize: "0.9rem", color: colors.lightGray }}>
                Connect with event organizers and attendees from around the world
              </p>
              <p style={{ margin: "0.5rem 0", fontSize: "0.9rem", color: colors.lightGray }}>
                <button 
                  onClick={() => navigate("/terms")} 
                  style={{
                    color: colors.coral, 
                    textDecoration: "none", 
                    fontWeight: "500", 
                    transition: "color 0.3s ease",
                    background: "none", 
                    border: "none", 
                    cursor: "pointer", 
                    padding: 0
                  }}
                >
                  Terms
                </button> •
                <button 
                  onClick={() => navigate("/privacy")} 
                  style={{
                    color: colors.coral, 
                    textDecoration: "none", 
                    fontWeight: "500", 
                    transition: "color 0.3s ease",
                    background: "none", 
                    border: "none", 
                    cursor: "pointer", 
                    margin: "0 0.5rem", 
                    padding: 0
                  }}
                >
                  Privacy
                </button> •
                <button 
                  onClick={() => navigate("/support")} 
                  style={{
                    color: colors.coral, 
                    textDecoration: "none", 
                    fontWeight: "500", 
                    transition: "color 0.3s ease",
                    background: "none", 
                    border: "none", 
                    cursor: "pointer", 
                    padding: 0
                  }}
                >
                  Support
                </button>
              </p>
              <p style={{ marginTop: "0.5rem", fontSize: "0.8rem", color: colors.lightGray }}>
                © {currentYear} EventHub. All rights reserved.
              </p>
            </div>
          </footer>
        );
    };

    if (loading) {
        return (
            <div className="container d-flex justify-content-center align-items-center" style={{ minHeight: "60vh", paddingTop: "70px" }}>
                <div className="spinner-border" role="status" style={{ color: colors.coral }}>
                    <span className="visually-hidden">Loading...</span>
                </div>
            </div>
        );
    }

    return (
        <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
            <div className="container mt-5" style={{ paddingTop: "70px", flex: 1 }}>
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <h2 style={{ color: colors.navy }}>
                        <i className="bi bi-reply me-2" style={{ color: colors.coral }}></i>
                        Admin Response Panel
                    </h2>
                    <button 
                        className="btn" 
                        onClick={() => navigate("/admin")}
                        style={{ 
                            backgroundColor: "transparent", 
                            borderColor: colors.navy,
                            color: colors.navy
                        }}
                    >
                        <FaArrowLeft className="me-2" />
                        Back to Admin
                    </button>
                </div>

                {eventData && (
                    <div className="card mb-4 shadow-sm">
                        <div className="card-header d-flex justify-content-between align-items-center" 
                            style={{ backgroundColor: colors.navy, color: "white" }}>
                            <span><FaCalendarAlt className="me-2" style={{ color: colors.coral }} />Event Details</span>
                            <div>
                                {eventData.category && (
                                    <span className="badge bg-light me-2" style={{ color: colors.navy }}>
                                        <FaTags className="me-1" style={{ color: colors.coral }} />
                                        {eventData.category}
                                    </span>
                                )}
                                {eventData.date && (
                                    <span className="badge" style={{ backgroundColor: colors.coral, color: "white" }}>
                                        <FaClock className="me-1" />
                                        {new Date(eventData.date).toLocaleDateString()} {eventData.time}
                                    </span>
                                )}
                            </div>
                        </div>
                        <div className="card-body">
                            <div className="row">
                                {eventData.image && (
                                    <div className="col-md-4 mb-3 mb-md-0">
                                        <img 
                                            src={getImageUrl(eventData.image)} 
                                            alt={eventData.title}
                                            className="img-fluid rounded"
                                            style={{ maxHeight: "200px", width: "100%", objectFit: "cover" }}
                                        />
                                    </div>
                                )}
                                <div className={`col-md-${eventData.image ? '8' : '12'}`}>
                                    <h4 className="card-title" style={{ color: colors.navy }}>{eventData.title}</h4>
                                    <div className="row mt-3">
                                        <div className="col-md-8">
                                            <p className="card-text">
                                                <FaAlignLeft className="me-2" style={{ color: colors.coral }} />
                                                {eventData.description}
                                            </p>
                                        </div>
                                        <div className="col-md-4">
                                            <div className="card" style={{ backgroundColor: colors.lightGray }}>
                                                <div className="card-body">
                                                    <p className="mb-2">
                                                        <FaMapMarkerAlt className="me-2" style={{ color: colors.coral }} />
                                                        <strong>Location:</strong>
                                                    </p>
                                                    <p className="ms-4">{eventData.location}</p>
                                                    <p className="mb-2">
                                                        <FaUser className="me-2" style={{ color: colors.coral }} />
                                                        <strong>Created by:</strong>
                                                    </p>
                                                    <p className="ms-4">{eventData.username}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            {authState.isAdmin && (
                                <div className="text-end mt-3 d-flex justify-content-end">
                                    <button 
                                        className="btn me-2" 
                                        onClick={editEvent}
                                        style={{ 
                                            backgroundColor: colors.navy, 
                                            color: "white" 
                                        }}
                                    >
                                        <FaEdit className="me-2" />Edit Event
                                    </button>
                                    <button 
                                        className="btn" 
                                        onClick={deleteEvent}
                                        style={{ backgroundColor: colors.errorRed, color: "white" }}
                                    >
                                        <FaTrashAlt className="me-2" />Delete Event
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                <div className="card shadow-sm mb-4">
                    <div className="card-header" style={{ backgroundColor: colors.lightGray }}>
                        <div className="d-flex justify-content-between align-items-center">
                            <h4 className="mb-0" style={{ color: colors.navy }}>
                                <FaStar className="me-2" style={{ color: colors.coral }} />Reviews
                            </h4>
                            <span className="badge" style={{ backgroundColor: colors.navy, color: "white" }}>
                                {reviews.length} Total
                            </span>
                        </div>
                    </div>
                    <div className="card-body">
                        {reviews.length > 0 ? (
                            <div className="review-list">
                                {reviews.map(review => (
                                    <div key={review.id} className="card mb-3 border-0 shadow-sm">
                                        <div className="card-header bg-white d-flex justify-content-between align-items-center">
                                            <div>
                                                <strong>
                                                    <FaUser className="me-2" style={{ color: colors.coral }} />
                                                    {review.username}
                                                </strong>
                                                <span className="ms-3">
                                                    {Array.from({ length: 5 }, (_, i) => (
                                                        <FaStar 
                                                            key={i} 
                                                            style={{ color: i < review.rating ? '#FFD700' : '#E0E0E0' }}
                                                        />
                                                    ))}
                                                </span>
                                            </div>
                                            <span 
                                                className="badge"
                                                style={{ 
                                                    backgroundColor: getSentimentColor(review.sentiment),
                                                    color: "white" 
                                                }}
                                            >
                                                {review.sentiment || "Unknown"}
                                            </span>
                                        </div>
                                        <div className="card-body">
                                            <p className="card-text">{review.review_text}</p>
                                            
                                            {review.admin_response && (
                                                <div className="admin-response mt-3 p-3 rounded" 
                                                    style={{ backgroundColor: colors.lightGray }}>
                                                    <p className="mb-1">
                                                        <strong>
                                                            <FaReply className="me-2" style={{ color: colors.navy }} />
                                                            Admin Response:
                                                        </strong>
                                                    </p>
                                                    <p className="mb-0 ms-4">{review.admin_response}</p>
                                                </div>
                                            )}
                                            
                                            {!review.admin_response && authState.isAdmin && (
                                                <div className="mt-3">
                                                    <button
                                                        className="btn btn-sm"
                                                        onClick={() => toggleExpandReview(review.id)}
                                                        style={{ 
                                                            backgroundColor: expandedReview === review.id ? colors.coral : "transparent",
                                                            borderColor: expandedReview === review.id ? colors.coral : colors.navy,
                                                            color: expandedReview === review.id ? "white" : colors.navy
                                                        }}
                                                    >
                                                        {expandedReview === review.id ? (
                                                            <><FaChevronUp className="me-2" />Cancel</>
                                                        ) : (
                                                            <><FaReply className="me-2" />Respond</>
                                                        )}
                                                    </button>
                                                    
                                                    {expandedReview === review.id && (
                                                        <div className="mt-3">
                                                            <textarea
                                                                placeholder="Write your response here..."
                                                                value={responses[review.id] || ""}
                                                                onChange={e => handleResponseChange(review.id, e.target.value)}
                                                                className="form-control"
                                                                rows="3"
                                                                style={{ borderColor: colors.navy }}
                                                            />
                                                            <div className="d-flex justify-content-end mt-2">
                                                                <button
                                                                    onClick={e => submitResponse(review.id, e)}
                                                                    className="btn"
                                                                    disabled={!responses[review.id]?.trim()}
                                                                    style={{ 
                                                                        backgroundColor: colors.navy, 
                                                                        color: "white",
                                                                        opacity: !responses[review.id]?.trim() ? 0.65 : 1
                                                                    }}
                                                                >
                                                                    <FaPaperPlane className="me-2" />Submit Response
                                                                </button>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-5">
                                <FaCommentSlash className="mb-3" style={{ fontSize: "2.5rem", color: colors.coral }} />
                                <p style={{ color: colors.navy }}>No reviews available for this event yet.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            
            {/* Add Footer */}
            <Footer />
        </div>
    );
}