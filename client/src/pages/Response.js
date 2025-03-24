import React, { useContext, useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import "bootstrap/dist/css/bootstrap.min.css";
import { FaCalendarAlt, FaMapMarkerAlt, FaArrowLeft, FaTrashAlt, FaReply, 
         FaChevronUp, FaPaperPlane, FaUser, FaStar, FaCommentSlash, 
         FaHeart, FaAlignLeft, FaTags, FaClock, FaEdit, FaRobot,
         FaChartPie, FaExclamationTriangle, FaCheckCircle, FaMagic,
         FaRegLightbulb, FaRegSmile, FaRegMeh, FaRegFrown } from "react-icons/fa";
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
    const [responseTemplates, setResponseTemplates] = useState([]);
    const [activeTab, setActiveTab] = useState('reviews');
    const [showSuccess, setShowSuccess] = useState(false);
    const [successMessage, setSuccessMessage] = useState("");
    const [processingAI, setProcessingAI] = useState(false);
    const [stats, setStats] = useState({
        averageRating: 0,
        totalReviews: 0,
        respondedCount: 0,
        pendingCount: 0,
        sentimentBreakdown: {
            positive: 0,
            neutral: 0,
            negative: 0
        }
    });

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

    // Define response templates
    useEffect(() => {
        setResponseTemplates([
            {
                name: "Thank You (Positive)",
                text: "Thank you for your wonderful feedback! We're thrilled to hear you enjoyed the event and appreciate you taking the time to share your experience with us. We hope to see you at our future events!",
                sentiment: "positive"
            },
            {
                name: "Neutral Response",
                text: "Thank you for your feedback. We appreciate you taking the time to share your thoughts on the event. Your input helps us improve our future events. If you have any additional suggestions, please feel free to reach out to us.",
                sentiment: "neutral"
            },
            {
                name: "Apology (Negative)",
                text: "We sincerely apologize that your experience didn't meet expectations. We appreciate your feedback and take your concerns seriously. We're working to address these issues for future events. Please contact us directly if you'd like to discuss your experience further.",
                sentiment: "negative"
            },
            {
                name: "General Response",
                text: "Thank you for your review. We value all feedback as it helps us continue to improve our events. We hope to have the opportunity to welcome you to another event in the future.",
                sentiment: "any"
            }
        ]);
    }, []);

    useEffect(() => {
        const fetchEventDetails = async () => {
            setLoading(true);
            try {
                const response = await axios.get(`http://localhost:3001/events/${id}`);
                setEventData(response.data.event || null);
                
                const reviewsData = response.data.reviews || [];
                setReviews(reviewsData);
                
                // Calculate stats
                calculateStats(reviewsData);
            } catch (err) {
                console.error("Error fetching event details:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchEventDetails();
    }, [id]);

    // Calculate review statistics
    const calculateStats = (reviewsData) => {
        if (!reviewsData.length) {
            setStats({
                averageRating: 0,
                totalReviews: 0,
                respondedCount: 0,
                pendingCount: 0,
                sentimentBreakdown: {
                    positive: 0,
                    neutral: 0,
                    negative: 0
                }
            });
            return;
        }

        const totalReviews = reviewsData.length;
        const totalRating = reviewsData.reduce((sum, review) => sum + review.rating, 0);
        const averageRating = (totalRating / totalReviews).toFixed(1);
        
        const respondedCount = reviewsData.filter(review => review.admin_response).length;
        const pendingCount = totalReviews - respondedCount;
        
        // Count sentiment distribution
        const sentimentBreakdown = {
            positive: reviewsData.filter(review => review.sentiment === 'positive').length,
            neutral: reviewsData.filter(review => review.sentiment === 'neutral').length,
            negative: reviewsData.filter(review => review.sentiment === 'negative').length
        };

        setStats({
            averageRating,
            totalReviews,
            respondedCount,
            pendingCount,
            sentimentBreakdown
        });
    };

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

            // Update reviews data
            const updatedReviews = reviews.map(review =>
                review.id === reviewId ? { ...review, admin_response: data.response } : review
            );
            
            setReviews(updatedReviews);
            setResponses(prev => ({ ...prev, [reviewId]: "" }));
            setExpandedReview(null); // Collapse after submitting
            
            // Recalculate stats
            calculateStats(updatedReviews);
            
            // Show success message
            setSuccessMessage("Response submitted successfully!");
            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 3000);
            
        } catch (err) {
            console.error("Error submitting response:", err);
            console.log("Error response:", err.response?.data || "No response data");
            alert(`Failed to submit response: ${err.response?.data?.error || err.message}`);
        }
    };

    const applyResponseTemplate = (reviewId, templateIndex) => {
        if (templateIndex >= 0 && templateIndex < responseTemplates.length) {
            setResponses(prev => ({ 
                ...prev, 
                [reviewId]: responseTemplates[templateIndex].text 
            }));
        }
    };

    const generateAIResponse = async (reviewId) => {
        setProcessingAI(true);
        
        try {
            // Get the review
            const review = reviews.find(r => r.id === reviewId);
            if (!review) {
                throw new Error("Review not found");
            }
            
            // Generate appropriate response based on sentiment and review content
            let aiResponse = "";
            
            if (review.sentiment === "positive") {
                aiResponse = "Thank you for your wonderful feedback! We're thrilled to hear you enjoyed the event and appreciate you taking the time to share your positive experience. We hope to see you at our next event!";
            } else if (review.sentiment === "negative") {
                aiResponse = "We sincerely appreciate your feedback and apologize for any aspects of the event that didn't meet your expectations. Your input is valuable as we continuously work to improve our events. We'd love to discuss your concerns further - please feel free to reach out directly to our team.";
            } else {
                aiResponse = "Thank you for your feedback! We appreciate you taking the time to share your thoughts about the event. Your insights help us improve future experiences for all attendees. We hope to see you at upcoming events!";
            }
            
            // Add personalization based on the rating
            if (review.rating >= 4) {
                aiResponse += " We're pleased to see you gave us a high rating!";
            } else if (review.rating <= 2) {
                aiResponse += " We understand your rating reflects areas where we can improve, and we take that seriously.";
            }
            
            // Set the response in the form
            setResponses(prev => ({ ...prev, [reviewId]: aiResponse }));
            
        } catch (err) {
            console.error("Error generating AI response:", err);
            alert("Failed to generate AI response. Please try again.");
        } finally {
            setProcessingAI(false);
        }
    };

    const autoRespondToAll = async () => {
        const unrespondedReviews = reviews.filter(review => !review.admin_response);
        
        if (unrespondedReviews.length === 0) {
            alert("All reviews already have responses!");
            return;
        }
        
        if (!window.confirm(`Auto-respond to ${unrespondedReviews.length} pending reviews?`)) {
            return;
        }
        
        setProcessingAI(true);
        const accessToken = localStorage.getItem("accessToken");
        
        try {
            let updatedReviews = [...reviews];
            
            for (const review of unrespondedReviews) {
                // Generate response based on sentiment
                let aiResponse = "";
                
                if (review.sentiment === "positive") {
                    aiResponse = "Thank you for your wonderful feedback! We're thrilled to hear you enjoyed the event and appreciate you taking the time to share your positive experience. We hope to see you at our next event!";
                } else if (review.sentiment === "negative") {
                    aiResponse = "We sincerely appreciate your feedback and apologize for any aspects of the event that didn't meet your expectations. Your input is valuable as we continuously work to improve our events. We'd love to discuss your concerns further - please feel free to reach out directly to our team.";
                } else {
                    aiResponse = "Thank you for your feedback! We appreciate you taking the time to share your thoughts about the event. Your insights help us improve future experiences for all attendees. We hope to see you at upcoming events!";
                }
                
                // Add personalization based on the rating
                if (review.rating >= 4) {
                    aiResponse += " We're pleased to see you gave us a high rating!";
                } else if (review.rating <= 2) {
                    aiResponse += " We understand your rating reflects areas where we can improve, and we take that seriously.";
                }
                
                // Submit the response
                await axios.put(
                    `http://localhost:3001/reviews/respond/${review.id}`,
                    { adminResponse: aiResponse },
                    { headers: { Authorization: `Bearer ${accessToken}` } }
                );
                
                // Update local state
                updatedReviews = updatedReviews.map(r => 
                    r.id === review.id ? { ...r, admin_response: aiResponse } : r
                );
            }
            
            setReviews(updatedReviews);
            calculateStats(updatedReviews);
            
            // Show success message
            setSuccessMessage(`Successfully responded to ${unrespondedReviews.length} reviews!`);
            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 3000);
            
        } catch (err) {
            console.error("Error auto-responding to reviews:", err);
            alert("Failed to auto-respond to all reviews. Please try again.");
        } finally {
            setProcessingAI(false);
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
        if (sentiment.includes("positive")) return "#4CAF50"; // Green
        if (sentiment.includes("negative")) return "#F44336"; // Red  
        return "#FF9800"; // Orange for neutral
    };

    // Helper function to get the sentiment icon
    const getSentimentIcon = (sentiment) => {
        if (!sentiment) return <FaRegMeh />;
        sentiment = sentiment.toLowerCase();
        if (sentiment.includes("positive")) return <FaRegSmile />;
        if (sentiment.includes("negative")) return <FaRegFrown />;
        return <FaRegMeh />;
    };

    // Helper function to format date
    const formatDate = (dateString) => {
        if (!dateString) return "N/A";
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
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

    const renderOverviewTab = () => {
        const completionPercentage = stats.totalReviews > 0
            ? Math.round((stats.respondedCount / stats.totalReviews) * 100)
            : 0;

        return (
            <div className="tab-pane active">
                <div className="row row-cols-1 row-cols-md-4 g-4 mb-4">
                    {/* Overall Rating Card */}
                    <div className="col">
                        <div className="card h-100 shadow-sm">
                            <div className="card-body text-center">
                                <h5 className="card-title mb-1" style={{ color: colors.navy }}>Overall Rating</h5>
                                <div style={{ fontSize: '2.2rem', fontWeight: 'bold', color: colors.coral }}>
                                    {stats.averageRating}
                                    <span style={{ fontSize: '1.3rem', verticalAlign: 'text-top', marginLeft: '3px' }}>
                                        / 5
                                    </span>
                                </div>
                                <div className="text-warning">
                                    {Array.from({ length: 5 }, (_, i) => (
                                        <FaStar 
                                            key={i} 
                                            style={{ 
                                                color: i < Math.round(stats.averageRating) ? '#FFD700' : '#E0E0E0',
                                                marginRight: '2px'
                                            }}
                                        />
                                    ))}
                                </div>
                                <p className="mt-2 text-muted">
                                    From {stats.totalReviews} {stats.totalReviews === 1 ? 'review' : 'reviews'}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Review Status Card */}
                    <div className="col">
                        <div className="card h-100 shadow-sm">
                            <div className="card-body text-center">
                                <h5 className="card-title mb-1" style={{ color: colors.navy }}>Response Status</h5>
                                <div className="progress mt-3" style={{ height: '20px' }}>
                                    <div 
                                        className="progress-bar bg-success" 
                                        role="progressbar" 
                                        style={{ width: `${completionPercentage}%` }} 
                                        aria-valuenow={completionPercentage} 
                                        aria-valuemin="0" 
                                        aria-valuemax="100"
                                    >
                                        {completionPercentage}%
                                    </div>
                                </div>
                                <div className="d-flex justify-content-between mt-2">
                                    <span style={{ color: colors.successGreen }}>
                                        <FaCheckCircle className="me-1" /> {stats.respondedCount} Responded
                                    </span>
                                    <span style={{ color: colors.coral }}>
                                        <FaExclamationTriangle className="me-1" /> {stats.pendingCount} Pending
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Sentiment Breakdown Card */}
                    <div className="col">
                        <div className="card h-100 shadow-sm">
                            <div className="card-body text-center">
                                <h5 className="card-title mb-3" style={{ color: colors.navy }}>Sentiment Breakdown</h5>
                                <div className="d-flex justify-content-between">
                                    <div>
                                        <FaRegSmile style={{ color: '#4CAF50', fontSize: '1.5rem' }} />
                                        <div style={{ fontWeight: 'bold', color: '#4CAF50' }}>
                                            {stats.sentimentBreakdown.positive}
                                        </div>
                                        <div className="text-muted" style={{ fontSize: '0.8rem' }}>Positive</div>
                                    </div>
                                    <div>
                                        <FaRegMeh style={{ color: '#FF9800', fontSize: '1.5rem' }} />
                                        <div style={{ fontWeight: 'bold', color: '#FF9800' }}>
                                            {stats.sentimentBreakdown.neutral}
                                        </div>
                                        <div className="text-muted" style={{ fontSize: '0.8rem' }}>Neutral</div>
                                    </div>
                                    <div>
                                        <FaRegFrown style={{ color: '#F44336', fontSize: '1.5rem' }} />
                                        <div style={{ fontWeight: 'bold', color: '#F44336' }}>
                                            {stats.sentimentBreakdown.negative}
                                        </div>
                                        <div className="text-muted" style={{ fontSize: '0.8rem' }}>Negative</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Actions Card */}
                    <div className="col">
                        <div className="card h-100 shadow-sm">
                            <div className="card-body d-flex flex-column justify-content-between">
                                <h5 className="card-title mb-3" style={{ color: colors.navy }}>Quick Actions</h5>
                                <div className="d-grid gap-2">
                                    <button 
                                        className="btn" 
                                        onClick={autoRespondToAll}
                                        disabled={processingAI || stats.pendingCount === 0}
                                        style={{ 
                                            backgroundColor: colors.navy, 
                                            color: "white",
                                            opacity: (processingAI || stats.pendingCount === 0) ? 0.65 : 1
                                        }}
                                    >
                                        {processingAI ? (
                                            <>
                                                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                                Processing...
                                            </>
                                        ) : (
                                            <>
                                                <FaMagic className="me-2" />
                                                Auto-Respond All ({stats.pendingCount})
                                            </>
                                        )}
                                    </button>
                                    <button 
                                        className="btn" 
                                        onClick={editEvent}
                                        style={{ 
                                            backgroundColor: colors.coral, 
                                            color: "white" 
                                        }}
                                    >
                                        <FaEdit className="me-2" />Edit Event
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                {/* Recent Unanswered Reviews */}
                {stats.pendingCount > 0 && (
                    <div className="card shadow-sm mt-4">
                        <div className="card-header" style={{ backgroundColor: colors.lightGray }}>
                            <h5 className="mb-0" style={{ color: colors.navy }}>
                                <FaExclamationTriangle className="me-2" style={{ color: colors.coral }} />
                                Priority Reviews Needing Response
                            </h5>
                        </div>
                        <div className="card-body">
                            <div className="table-responsive">
                                <table className="table table-hover">
                                    <thead>
                                        <tr>
                                            <th>User</th>
                                            <th>Rating</th>
                                            <th>Sentiment</th>
                                            <th>Review</th>
                                            <th>Date</th>
                                            <th>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {reviews
                                            .filter(review => !review.admin_response)
                                            .slice(0, 5)
                                            .map(review => (
                                                <tr key={review.id}>
                                                    <td>
                                                        <div className="d-flex align-items-center">
                                                            <div 
                                                                className="rounded-circle me-2 d-flex align-items-center justify-content-center"
                                                                style={{ 
                                                                    width: '30px', 
                                                                    height: '30px', 
                                                                    backgroundColor: colors.coral, 
                                                                    color: 'white' 
                                                                }}
                                                            >
                                                                {review.username?.charAt(0).toUpperCase()}
                                                            </div>
                                                            <span>{review.username}</span>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <span style={{ color: colors.navy }}>
                                                            {review.rating} 
                                                            <span className="ms-1" style={{ color: "#FFD700" }}>
                                                                {"★".repeat(review.rating)}
                                                            </span>
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <span 
                                                            className="badge rounded-pill" 
                                                            style={{
                                                                backgroundColor: getSentimentColor(review.sentiment),
                                                                color: "white"
                                                            }}
                                                        >
                                                            {getSentimentIcon(review.sentiment)}
                                                            <span className="ms-1">{review.sentiment}</span>
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <div style={{ maxWidth: "300px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                                            {review.review_text}
                                                        </div>
                                                    </td>
                                                    <td>{formatDate(review.createdAt)}</td>
                                                    <td>
                                                        <button 
                                                            className="btn btn-sm"
                                                            onClick={() => {
                                                                setActiveTab('reviews');
                                                                setTimeout(() => {
                                                                    toggleExpandReview(review.id);
                                                                    // Scroll to the review
                                                                    const element = document.getElementById(`review-${review.id}`);
                                                                    if (element) {
                                                                        element.scrollIntoView({ behavior: 'smooth' });
                                                                    }
                                                                }, 100);
                                                            }}
                                                            style={{ backgroundColor: colors.navy, color: "white" }}
                                                        >
                                                            <FaReply className="me-1" /> Respond
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                    </tbody>
                                </table>
                            </div>
                            {stats.pendingCount > 5 && (
                                <div className="text-center mt-3">
                                    <button 
                                        className="btn btn-sm"
                                        onClick={() => setActiveTab('reviews')}
                                        style={{ backgroundColor: colors.navy, color: "white" }}
                                    >
                                        View All Pending Reviews
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        );
    };

    const renderReviewsTab = () => {
        return (
            <div className="tab-pane active">
                <div className="d-flex justify-content-between align-items-center mb-3">
                    <h5 style={{ color: colors.navy }}>
                        Review Management
                    </h5>
                    {stats.pendingCount > 0 && (
                        <button 
                            className="btn btn-sm"
                            onClick={autoRespondToAll}
                            disabled={processingAI}
                            style={{ 
                                backgroundColor: colors.navy, 
                                color: "white",
                                opacity: processingAI ? 0.65 : 1
                            }}
                        >
                            {processingAI ? (
                                <>
                                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                    Processing...
                                </>
                            ) : (
                                <>
                                    <FaRobot className="me-2" />
                                    Auto-Respond to All Pending Reviews
                                </>
                            )}
                        </button>
                    )}
                </div>

                {/* Filter tabs */}
                <ul className="nav nav-tabs mb-3">
                    <li className="nav-item">
                        <button 
                            className="nav-link active" 
                            style={{ color: colors.navy }}
                            onClick={() => {/* Handle filter change */}}
                        >
                            All Reviews ({reviews.length})
                        </button>
                    </li>
                    <li className="nav-item">
                        <button 
                            className="nav-link" 
                            style={{ color: colors.coral }}
                            onClick={() => {/* Handle filter change */}}
                        >
                            Pending ({stats.pendingCount})
                        </button>
                    </li>
                    <li className="nav-item">
                        <button 
                            className="nav-link" 
                            style={{ color: colors.successGreen }}
                            onClick={() => {/* Handle filter change */}}
                        >
                            Responded ({stats.respondedCount})
                        </button>
                    </li>
                </ul>

                {reviews.length > 0 ? (
                    <div className="review-list">
                        {reviews.map(review => (
                            <div id={`review-${review.id}`} key={review.id} className="card mb-3 border-0 shadow-sm">
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
                                        <span className="ms-3 text-muted">
                                            {formatDate(review.createdAt)}
                                        </span>
                                    </div>
                                    <span 
                                        className="badge rounded-pill"
                                        style={{ 
                                            backgroundColor: getSentimentColor(review.sentiment),
                                            color: "white",
                                            padding: "5px 10px"
                                        }}
                                    >
                                        {getSentimentIcon(review.sentiment)}
                                        <span className="ms-1">{review.sentiment || "Unknown"}</span>
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
                                                    <div className="d-flex mb-2">
                                                        <button
                                                            className="btn btn-sm me-2"
                                                            onClick={() => generateAIResponse(review.id)}
                                                            disabled={processingAI}
                                                            style={{ 
                                                                backgroundColor: colors.navy, 
                                                                color: "white",
                                                                opacity: processingAI ? 0.65 : 1
                                                            }}
                                                        >
                                                            {processingAI ? (
                                                                <>
                                                                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                                                    Generating...
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <FaRobot className="me-2" />
                                                                    Generate AI Response
                                                                </>
                                                            )}
                                                        </button>
                                                        <div className="dropdown">
                                                            <button 
                                                                className="btn btn-sm btn-outline-secondary dropdown-toggle"
                                                                type="button"
                                                                data-bs-toggle="dropdown"
                                                                aria-expanded="false"
                                                            >
                                                                <FaRegLightbulb className="me-1" /> Templates
                                                            </button>
                                                            <ul className="dropdown-menu">
                                                                {responseTemplates.map((template, index) => (
                                                                    <li key={index}>
                                                                        <button 
                                                                            className="dropdown-item" 
                                                                            onClick={() => applyResponseTemplate(review.id, index)}
                                                                        >
                                                                            {template.name}
                                                                        </button>
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        </div>
                                                    </div>
                                                    <textarea
                                                        placeholder="Write your response here..."
                                                        value={responses[review.id] || ""}
                                                        onChange={e => handleResponseChange(review.id, e.target.value)}
                                                        className="form-control"
                                                        rows="4"
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
            {/* Success Toast Notification */}
            {showSuccess && (
                <div 
                    className="position-fixed top-0 end-0 p-3" 
                    style={{ zIndex: 1050, marginTop: "70px" }}
                >
                    <div 
                        className="toast show" 
                        role="alert" 
                        aria-live="assertive" 
                        aria-atomic="true"
                        style={{ backgroundColor: colors.successGreen, color: "white" }}
                    >
                        <div className="toast-header" style={{ backgroundColor: colors.successGreen, color: "white" }}>
                            <FaCheckCircle className="me-2" />
                            <strong className="me-auto">Success</strong>
                            <button 
                                type="button" 
                                className="btn-close btn-close-white" 
                                onClick={() => setShowSuccess(false)}
                                aria-label="Close"
                            ></button>
                        </div>
                        <div className="toast-body">
                            {successMessage}
                        </div>
                    </div>
                </div>
            )}

            <div className="container mt-5" style={{ paddingTop: "70px", flex: 1 }}>
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <h2 style={{ color: colors.navy }}>
                        <FaReply className="me-2" style={{ color: colors.coral }} />
                        Admin Response Panel
                    </h2>
                    <div>
                        <button 
                            className="btn me-2" 
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
                        <button 
                            className="btn" 
                            onClick={deleteEvent}
                            style={{ backgroundColor: colors.errorRed, color: "white" }}
                        >
                            <FaTrashAlt className="me-2" />Delete Event
                        </button>
                    </div>
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
                                        {formatDate(eventData.date)} {eventData.time}
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
                        </div>
                    </div>
                )}

                {/* Tab Navigation */}
                <ul className="nav nav-tabs mb-4">
                    <li className="nav-item">
                        <button 
                            className={`nav-link ${activeTab === 'overview' ? 'active' : ''}`}
                            onClick={() => setActiveTab('overview')}
                            style={{ 
                                color: activeTab === 'overview' ? colors.coral : colors.navy,
                                fontWeight: activeTab === 'overview' ? 'bold' : 'normal',
                                borderBottom: activeTab === 'overview' ? `2px solid ${colors.coral}` : 'none'
                            }}
                        >
                            <FaChartPie className="me-2" />
                            Overview
                        </button>
                    </li>
                    <li className="nav-item">
                        <button 
                            className={`nav-link ${activeTab === 'reviews' ? 'active' : ''}`}
                            onClick={() => setActiveTab('reviews')}
                            style={{ 
                                color: activeTab === 'reviews' ? colors.coral : colors.navy,
                                fontWeight: activeTab === 'reviews' ? 'bold' : 'normal',
                                borderBottom: activeTab === 'reviews' ? `2px solid ${colors.coral}` : 'none'
                            }}
                        >
                            <FaStar className="me-2" />
                            Reviews Management
                        </button>
                    </li>
                </ul>

                {/* Tab Content */}
                <div className="tab-content">
                    {activeTab === 'overview' && renderOverviewTab()}
                    {activeTab === 'reviews' && renderReviewsTab()}
                </div>
            </div>
            
            {/* Add Footer */}
            <Footer />
        </div>
    );
}