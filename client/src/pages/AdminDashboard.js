import React, { useState, useEffect } from "react";
import axios from "axios";

function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [events, setEvents] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("accessToken");
        if (!token) {
          setError("No token found. Please log in.");
          setLoading(false);
          return;
        }

        console.log("Using Token:", token);

        const [usersRes, eventsRes, reviewsRes] = await Promise.all([
          axios.get("http://localhost:3001/api/users", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get("http://localhost:3001/api/events", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get("http://localhost:3001/api/reviews", {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        console.log("Users Data:", usersRes.data);
        console.log("Events Data:", eventsRes.data);
        console.log("Reviews Data:", reviewsRes.data);

        setUsers(usersRes.data);
        setEvents(eventsRes.data);
        setReviews(reviewsRes.data);
      } catch (error) {
        console.error("Error fetching data:", error);
        setError(error.response?.data?.message || "Failed to fetch data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="container mt-5">
      <h1 className="text-center">Admin Dashboard</h1>

      {loading && <p className="text-center">Loading data...</p>}
      {error && <p className="text-danger text-center">{error}</p>}

      {/* Registered Users */}
      <div className="mb-4">
        <h2>Registered Users</h2>
        {users.length > 0 ? (
          <table className="table table-striped">
            <thead>
              <tr>
                <th>ID</th>
                <th>Username</th>
                <th>Email</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td>{user.id}</td>
                  <td>{user.username}</td>
                  <td>{user.email}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>No registered users found.</p>
        )}
      </div>

      {/* Events */}
      <div className="mb-4">
        <h2>Events</h2>
        {events.length > 0 ? (
          <table className="table table-striped">
            <thead>
              <tr>
                <th>ID</th>
                <th>Event Name</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {events.map((event) => (
                <tr key={event.id}>
                  <td>{event.id}</td>
                  <td>{event.name}</td>
                  <td>{event.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>No events found.</p>
        )}
      </div>

      {/* Reviews */}
      <div className="mb-4">
        <h2>Event Reviews</h2>
        {reviews.length > 0 ? (
          <table className="table table-striped">
            <thead>
              <tr>
                <th>ID</th>
                <th>Event Name</th>
                <th>Review</th>
                <th>Sentiment</th>
              </tr>
            </thead>
            <tbody>
              {reviews.map((review) => (
                <tr key={review.id}>
                  <td>{review.id}</td>
                  <td>{review.event_name}</td>
                  <td>{review.review_text}</td>
                  <td className={review.sentiment === "positive" ? "text-success" : "text-danger"}>
                    {review.sentiment}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>No reviews available.</p>
        )}
      </div>
    </div>
  );
}

export default AdminDashboard;
