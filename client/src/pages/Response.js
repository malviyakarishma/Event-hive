import React, { useContext, useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import "bootstrap/dist/css/bootstrap.min.css";
import "@fortawesome/fontawesome-free/css/all.min.css";
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
    const primaryColor = "#001F3F"; // Navy blue
    const accentColor = "#FF6B6B";  // Coral red

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

    const toggleExpandReview = (reviewId) => {
        setExpandedReview(expandedReview === reviewId ? null : reviewId);
    };

    // Helper function to get sentiment badge color
    const getSentimentColor = (sentiment) => {
        if (!sentiment) return "secondary";
        sentiment = sentiment.toLowerCase();
        if (sentiment.includes("positive")) return accentColor;
        if (sentiment.includes("negative")) return "#6B6BFF"; // Light blue for contrast
        return "#FFD700"; // Gold for neutral
    };

    if (loading) {
        return (
            <div className="container d-flex justify-content-center align-items-center" style={{ minHeight: "60vh", paddingTop: "70px" }}>
                <div className="spinner-border" role="status" style={{ color: accentColor }}>
                    <span className="visually-hidden">Loading...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="container mt-5" style={{ paddingTop: "70px" }}>
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2 style={{ color: primaryColor }}><i className="fas fa-comment-dots me-2"></i>Admin Response Panel</h2>
                <button 
                    className="btn" 
                    onClick={() => navigate("/admin")}
                    style={{ 
                        backgroundColor: "transparent", 
                        borderColor: primaryColor,
                        color: primaryColor
                    }}
                >
                    <i className="fas fa-arrow-left me-2"></i>Back to Admin
                </button>
            </div>

            {eventData && (
                <div className="card mb-4 shadow-sm">
                    <div className="card-header d-flex justify-content-between align-items-center" 
                        style={{ backgroundColor: primaryColor, color: "white" }}>
                        <span><i className="fas fa-calendar-alt me-2"></i>Event Details</span>
                        {eventData.date && (
                            <span className="badge" style={{ backgroundColor: accentColor, color: "white" }}>
                                <i className="far fa-clock me-1"></i>
                                {new Date(eventData.date).toLocaleDateString()}
                            </span>
                        )}
                    </div>
                    <div className="card-body">
                        <h4 className="card-title" style={{ color: primaryColor }}>{eventData.title}</h4>
                        <div className="row mt-3">
                            <div className="col-md-8">
                                <p className="card-text"><i className="fas fa-align-left me-2" style={{ color: accentColor }}></i>{eventData.description}</p>
                            </div>
                            <div className="col-md-4">
                                <div className="card" style={{ backgroundColor: "#F8F9FA" }}>
                                    <div className="card-body">
                                        <p className="mb-2"><i className="fas fa-map-marker-alt me-2" style={{ color: accentColor }}></i><strong>Location:</strong></p>
                                        <p className="ms-4">{eventData.location}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        {authState.isAdmin && (
                            <div className="text-end mt-3">
                                <button 
                                    className="btn" 
                                    onClick={deleteEvent}
                                    style={{ backgroundColor: accentColor, color: "white" }}
                                >
                                    <i className="fas fa-trash-alt me-2"></i>Delete Event
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            <div className="card shadow-sm">
                <div className="card-header" style={{ backgroundColor: "#F8F9FA" }}>
                    <div className="d-flex justify-content-between align-items-center">
                        <h4 className="mb-0" style={{ color: primaryColor }}>
                            <i className="fas fa-star me-2" style={{ color: accentColor }}></i>Reviews
                        </h4>
                        <span className="badge" style={{ backgroundColor: primaryColor, color: "white" }}>
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
                                            <strong><i className="fas fa-user-circle me-2" style={{ color: accentColor }}></i>{review.username}</strong>
                                            <span className="ms-3">
                                                {Array.from({ length: 5 }, (_, i) => (
                                                    <i 
                                                        key={i} 
                                                        className={`fas fa-star`}
                                                        style={{ color: i < review.rating ? '#FFD700' : '#E0E0E0' }}
                                                    ></i>
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
                                                style={{ backgroundColor: "#F8F9FA" }}>
                                                <p className="mb-1">
                                                    <strong>
                                                        <i className="fas fa-reply me-2" style={{ color: primaryColor }}></i>
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
                                                        backgroundColor: expandedReview === review.id ? accentColor : "transparent",
                                                        borderColor: expandedReview === review.id ? accentColor : primaryColor,
                                                        color: expandedReview === review.id ? "white" : primaryColor
                                                    }}
                                                >
                                                    <i className={`fas ${expandedReview === review.id ? 'fa-chevron-up' : 'fa-reply'} me-2`}></i>
                                                    {expandedReview === review.id ? 'Cancel' : 'Respond'}
                                                </button>
                                                
                                                {expandedReview === review.id && (
                                                    <div className="mt-3">
                                                        <textarea
                                                            placeholder="Write your response here..."
                                                            value={responses[review.id] || ""}
                                                            onChange={e => handleResponseChange(review.id, e.target.value)}
                                                            className="form-control"
                                                            rows="3"
                                                            style={{ borderColor: primaryColor }}
                                                        />
                                                        <div className="d-flex justify-content-end mt-2">
                                                            <button
                                                                onClick={e => submitResponse(review.id, e)}
                                                                className="btn"
                                                                disabled={!responses[review.id]?.trim()}
                                                                style={{ 
                                                                    backgroundColor: primaryColor, 
                                                                    color: "white",
                                                                    opacity: !responses[review.id]?.trim() ? 0.65 : 1
                                                                }}
                                                            >
                                                                <i className="fas fa-paper-plane me-2"></i>Submit Response
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
                            <i className="fas fa-comment-slash fa-3x mb-3" style={{ color: accentColor }}></i>
                            <p style={{ color: primaryColor }}>No reviews available for this event yet.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}