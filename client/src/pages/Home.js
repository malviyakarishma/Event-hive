import React, { useEffect, useState, useContext } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.min.css";
import { AuthContext } from "../helpers/AuthContext";

export default function Home() {
  const [listOfEvents, setListOfEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchType, setSearchType] = useState("title"); // Default search by title
  const [visibleUpcomingEvents, setVisibleUpcomingEvents] = useState(8);
  const [visiblePastEvents, setVisiblePastEvents] = useState(8);
  const { authState } = useContext(AuthContext);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!authState.status) {
      navigate("/login");
    } else {
      axios
        .get("http://localhost:3001/events")
        .then((response) => {
          setListOfEvents(response.data);
          setLoading(false);
        })
        .catch((error) => {
          setError("There was an error loading events. Please try again later.");
          setLoading(false);
        });
    }
  }, [authState, navigate]);
  
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollButton(window.scrollY > 200);
    };

    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (loading) return <p>Loading events...</p>;
  if (error) return <p className="text-danger">{error}</p>;

  const today = new Date();
  const upcomingEvents = listOfEvents
    .filter((event) => new Date(event.date) >= today)
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  const pastEvents = listOfEvents
    .filter((event) => new Date(event.date) < today)
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  const filteredUpcomingEvents = upcomingEvents.filter((event) => {
    if (searchType === "title") {
      return event.title.toLowerCase().includes(searchQuery.toLowerCase());
    } else if (searchType === "location") {
      return event.location.toLowerCase().includes(searchQuery.toLowerCase());
    }
    return true;
  });

  const filteredPastEvents = pastEvents.filter((event) => {
    if (searchType === "title") {
      return event.title.toLowerCase().includes(searchQuery.toLowerCase());
    } else if (searchType === "location") {
      return event.location.toLowerCase().includes(searchQuery.toLowerCase());
    }
    return true;
  });

  const loadMoreUpcoming = () => {
    setVisibleUpcomingEvents((prev) => prev + 8);
  };

  const loadMorePast = () => {
    setVisiblePastEvents((prev) => prev + 8);
  };

  // Create placeholder arrays for even distribution
  const createEventGrid = (events, visibleCount) => {
    const visibleEvents = events.slice(0, visibleCount);
    
    // Display a placeholder message if no events found
    if (visibleEvents.length === 0) {
      return (
        <div className="col-12 text-center py-4">
          <p className="fs-5 text-muted">No events found matching your search criteria.</p>
          {searchQuery && (
            <button 
              className="btn btn-outline-secondary mt-2" 
              onClick={() => setSearchQuery("")}
            >
              <i className="bi bi-x-circle me-1"></i> Clear Search
            </button>
          )}
        </div>
      );
    }

    // Return the actual events
    return visibleEvents.map((event) => (
      <div className="col-md-3 mb-4" key={event.id}>
        <div
          className="card event-card h-100 shadow-sm mx-auto"
          onClick={() => navigate(`/event/${event.id}`)}
          style={{ cursor: "pointer", maxWidth: "280px" }}
        >
          <div 
            className="card-header" 
            style={{ 
              backgroundColor: new Date(event.date) >= today ? "#0d6efd" : "#6c7b6d", 
              color: "white" 
            }}
          >
            {event.title}
          </div>
          <div className="card-body bg-light">
            <p className="card-text text-center text-dark">
              <i className="bi bi-geo-alt-fill text-success"></i>{" "}
              <span className="fw-bold text-success">{event.location}</span>
            </p>
            <p className="card-text text-center fw-bold" style={{ color: new Date(event.date) >= today ? "#198754" : "#6c757d" }}>
              <i className="bi bi-calendar-event-fill"></i> {new Date(event.date).toDateString()}
            </p>
          </div>
        </div>
      </div>
    ));
  };

  return (
    <div className="container" style={{ paddingTop: "70px" }}>
      {/* Centered Search Bar with Options and Icon */}
      <div className="row mb-4">
        <div className="col-md-8 mx-auto">
          <div className="input-group shadow-sm">
            <span className="input-group-text bg-white border-end-0">
              <i className="bi bi-search text-primary"></i>
            </span>
            <input
              type="text"
              className="form-control border-start-0"
              placeholder="Search events..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ boxShadow: "none" }}
            />
            <select 
              className="form-select border-start"
              style={{ maxWidth: "130px", boxShadow: "none" }}
              value={searchType}
              onChange={(e) => setSearchType(e.target.value)}
            >
              <option value="title">By Title</option>
              <option value="location">By Location</option>
            </select>
          </div>
        </div>
      </div>

      {/* Events Count Indicator - appears when searching */}
      {searchQuery && (
        <div className="row mb-3">
          <div className="col-12 text-center">
            <span className="badge bg-light text-dark p-2">
              Found {filteredUpcomingEvents.length + filteredPastEvents.length} events 
              {searchType === "title" ? " with title" : " in location"} 
              containing "{searchQuery}"
            </span>
          </div>
        </div>
      )}

      {/* Upcoming Events Section - Centered */}
      <div className="row">
        <div className="col-12 text-center">
          <h2 className="mb-4 text-primary">
            <span className="text-danger">Upcoming</span> Events
          </h2>
        </div>
      </div>

      {/* Centered Events Display with Grid System */}
      <div className="row justify-content-center">
        {createEventGrid(filteredUpcomingEvents, visibleUpcomingEvents)}
      </div>

      {/* Load More Button for Upcoming Events - Centered */}
      {visibleUpcomingEvents < filteredUpcomingEvents.length && (
        <div className="row">
          <div className="col-12 text-center mb-5">
            <button className="btn btn-success px-4" onClick={loadMoreUpcoming}>
              View More <i className="bi bi-arrow-down-circle ms-1"></i>
            </button>
          </div>
        </div>
      )}

      {/* Past Events Section - Centered */}
      <div className="row mt-4">
        <div className="col-12 text-center">
          <h3 className="mb-4 text-primary">Past Events</h3>
        </div>
      </div>
          
      {/* Centered Past Events Display with Grid System */}
      <div className="row justify-content-center">
        {createEventGrid(filteredPastEvents, visiblePastEvents)}
      </div>

      {/* Load More Button for Past Events - Centered */}
      {visiblePastEvents < filteredPastEvents.length && (
        <div className="row">
          <div className="col-12 text-center mb-5">
            <button className="btn btn-success px-4" onClick={loadMorePast}>
              View More <i className="bi bi-arrow-down-circle ms-1"></i>
            </button>
          </div>
        </div>
      )}

      {/* Scroll to Top Button */}
      {showScrollButton && (
        <button
          onClick={scrollToTop}
          className="btn btn-primary scroll-top-btn shadow"
          style={{
            position: "fixed",
            bottom: "20px",
            right: "20px",
            borderRadius: "50%",
            fontSize: "24px",
            padding: "10px 15px",
          }}
        >
          <i className="bi bi-arrow-up"></i>
        </button>
      )}
    </div>
  );
}