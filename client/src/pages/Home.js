import React, { useEffect, useState, useContext } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import "bootstrap/dist/css/bootstrap.min.css";
import { Tooltip } from "bootstrap";
import "bootstrap-icons/font/bootstrap-icons.min.css";
import { AuthContext } from "../helpers/AuthContext";

export default function Home() {
  const [listOfEvents, setListOfEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [dateSelected, setDateSelected] = useState(new Date());
  const [visibleEvents, setVisibleEvents] = useState(4);
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

  useEffect(() => {
    const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]');
    tooltipTriggerList.forEach((tooltip) => new Tooltip(tooltip));
  }, [listOfEvents]);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (loading) return <p>Loading events...</p>;
  if (error) return <p className="text-danger">{error}</p>;

  const today = new Date();
  const upcomingEvents = listOfEvents
    .filter((event) => new Date(event.date) >= today)
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  const pastEvents = listOfEvents.filter((event) => new Date(event.date) < today);

  const filteredEvents = upcomingEvents
    .filter(
      (event) =>
        event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.location.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .slice(0, visibleEvents);

  const loadMore = () => {
    setVisibleEvents((prev) => prev + 4);
  };

  return (
    <div className="container" style={{ paddingTop: "70px" }}>
      <div className="row">
        {/* Left Column: Events List */}
        <div className="col-md-8">
          <h2 className="mb-3 text-primary">
            <span className="text-danger">Upcoming</span> Events
          </h2>
          {filteredEvents.length === 0 ? (
            <p>No upcoming events found.</p>
          ) : (
            <div className="row">
              {filteredEvents.map((event) => (
                <div className="col-md-6 mb-3" key={event.id}>
                  <div
                    className="card event-card"
                    onClick={() => navigate(`/event/${event.id}`)}
                    style={{ cursor: "pointer", maxWidth: "18rem" }}
                  >
                    <div className="card-header bg-primary text-white">{event.title}</div>
                    <div className="card-body bg-light">
                      <p className="card-text text-center text-dark">
                        <i className="bi bi-geo-alt-fill text-success"></i>{" "}
                        <span className="fw-bold text-success">{event.location}</span>
                      </p>
                      <p className="card-text text-center fw-bold text-success">
                        <i className="bi bi-calendar-event-fill"></i> {new Date(event.date).toDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Past Events Section */}
          <h3 className="mt-5 text-primary">Past Events</h3>
          <div className="row">
            {pastEvents.slice(0, visibleEvents).map((event) => (
              <div className="col-md-6 mb-3" key={event.id}>
                <div
                  className="card event-card"
                  onClick={() => navigate(`/event/${event.id}`)}
                  style={{ cursor: "pointer", maxWidth: "18rem" }}
                >
                  <div className="card-header" style={{ backgroundColor: "#6c7b6d", color: "white" }}>
                    {event.title}
                  </div>
                  <div className="card-body bg-light">
                    <p className="card-text text-center text-dark">
                      <i className="bi bi-geo-alt-fill text-success"></i>{" "}
                      <span className="fw-bold text-success">{event.location}</span>
                    </p>
                    <p className="card-text text-center text-dark">
                      <i className="bi bi-calendar-event-fill"></i> {new Date(event.date).toDateString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Load More Button */}
          {visibleEvents < upcomingEvents.length && (
            <div className="text-center">
              <button className="btn btn-success mt-3" onClick={loadMore}>
                Load More
              </button>
            </div>
          )}
        </div>

        {/* Right Column: Search Bar & Calendar */}
        <div className="col-md-4">
          <input
            type="text"
            className="form-control mb-3"
            placeholder="Search events..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Calendar
            onChange={setDateSelected}
            value={dateSelected}
            tileContent={({ date }) => {
              const event = listOfEvents.find(
                (event) => new Date(event.date).toDateString() === date.toDateString()
              );

              return event ? (
                <div
                  className="event-dot"
                  data-bs-toggle="tooltip"
                  data-bs-placement="top"
                  title={event.title} // Tooltip text
                ></div>
              ) : null;
            }}
          />

          <h5 className="mt-3 text-primary">Events on {dateSelected.toDateString()}</h5>
          <ul className="list-group">
            {listOfEvents
              .filter((event) => new Date(event.date).toDateString() === dateSelected.toDateString())
              .map((event) => (
                <li
                  key={event.id}
                  className="list-group-item list-group-item-action"
                  onClick={() => navigate(`/event/${event.id}`)}
                >
                  {event.title}
                </li>
              ))}
          </ul>
        </div>
      </div>

      {/* Scroll to Top Button */}
      {showScrollButton && (
        <button
          onClick={scrollToTop}
          className="btn btn-primary scroll-top-btn"
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
