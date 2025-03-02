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
  const { authState } = useContext(AuthContext);

  useEffect(() => {
    const fetchEventDetails = async () => {
      try {
        const response = await axios.get(`http://localhost:3001/events/${id}`);
        if (response.data.event) {
          setEventData(response.data.event);
        } else {
          setEventData(null);
        }
        if (response.data.reviews) {
          setReviews(response.data.reviews);
        }
      } catch (err) {
        console.error("Error fetching event details:", err);
      }
    };
    fetchEventDetails();
  }, [id]);

  const handleResponseChange = (reviewId, text) => {
    setResponses((prevResponses) => ({
      ...prevResponses,
      [reviewId]: text,
    }));
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
        `http://localhost:3001/reviews/respond/${reviewId}`, // Corrected endpoint
        { adminResponse: responses[reviewId] },
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
  
      alert("Response submitted successfully!");
      setReviews((prevReviews) =>
        prevReviews.map((review) =>
          review.id === reviewId ? { ...review, admin_response: data.response } : review
        )
      );
      setResponses((prev) => ({ ...prev, [reviewId]: "" }));
    } catch (err) {
      console.error("Error submitting response:", err);
      alert("Failed to submit response. Try again.");
    }
  };
  
  

  const deleteEvent = async () => {
    if (!window.confirm("Are you sure you want to delete this event?")) return;

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
      navigate("/");
    } catch (err) {
      console.error("Error deleting event:", err);
      alert("Failed to delete event. Try again.");
    }
  };

  return (
    <div className="container mt-5" style={{ paddingTop: "70px" }}>
      <h2 className="text-center">Admin Response Panel</h2>
      {eventData && (
        <div className="card text-center">
          <div className="card-header bg-primary text-white">Event Details</div>
          <div className="card-body">
            <h5>{eventData.title}</h5>
            <p><strong>Description:</strong> {eventData.description}</p>
            <p><strong>Location:</strong> {eventData.location}</p>
            <p><strong>Date:</strong> {eventData.date}</p>
            {authState.isAdmin && (
              <button className="btn btn-danger mt-3" onClick={deleteEvent}>
                Delete Event
              </button>
            )}
          </div>
        </div>
      )}
      <div className="mt-4">
        <h4>Reviews</h4>
        {reviews.length > 0 ? (
  reviews.map((review) => (
    <div key={review.id} className="alert alert-secondary">
      <p><strong>{review.username}</strong>: {review.review_text}</p>
      <p><strong>Rating:</strong> {Array.from({ length: review.rating }, (_, i) => "⭐").join(" ")}</p>
      <p><strong>Sentiment:</strong> {review.sentiment || "Unknown"}</p>

      {review.admin_response ? (
        <p><strong>Admin Response:</strong> {review.admin_response}</p>
      ) : (
        authState.isAdmin && (
          <div>
            <textarea
              placeholder="Write a response..."
              value={responses[review.id] || ""}
              onChange={(e) => handleResponseChange(review.id, e.target.value)}
              className="form-control"
            />
            <button
              onClick={(e) => submitResponse(review.id, e)}
              className="btn btn-primary mt-2"
            >
              Submit Response
            </button>
          </div>
        )
      )}
    </div>
  ))
) : (
  <p>No reviews available</p>
)}

      </div>
    </div>
  );
}
