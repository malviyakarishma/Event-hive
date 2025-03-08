import React, { useEffect, useState, useContext } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import "bootstrap/dist/css/bootstrap.min.css";
import { Tooltip } from "bootstrap";
import "bootstrap-icons/font/bootstrap-icons.min.css";
import { AuthContext } from "../helpers/AuthContext";

export default function CalendarView() {
  const [listOfEvents, setListOfEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dateSelected, setDateSelected] = useState(new Date());
  const [viewMode, setViewMode] = useState("calendar"); // calendar or list
  const { authState } = useContext(AuthContext);
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
    const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]');
    tooltipTriggerList.forEach((tooltip) => new Tooltip(tooltip));
  }, [listOfEvents]);

  if (loading) return (
    <div className="d-flex justify-content-center align-items-center" style={{ height: "80vh" }}>
      <div className="spinner-border text-primary" role="status">
        <span className="visually-hidden">Loading...</span>
      </div>
    </div>
  );
  
  if (error) return (
    <div className="alert alert-danger mx-auto mt-5" style={{ maxWidth: "600px" }}>
      <i className="bi bi-exclamation-triangle-fill me-2"></i>
      {error}
    </div>
  );

  // Get events for the selected date
  const eventsOnSelectedDate = listOfEvents.filter(
    (event) => new Date(event.date).toDateString() === dateSelected.toDateString()
  );

  // Get all dates with events for highlighting in the calendar
  const getDatesWithEvents = () => {
    const dates = {};
    listOfEvents.forEach((event) => {
      const dateStr = new Date(event.date).toDateString();
      dates[dateStr] = true;
    });
    return dates;
  };

  const datesWithEvents = getDatesWithEvents();
  
  // Custom styles for the calendar
  const tileClassName = ({ date }) => {
    const dateStr = date.toDateString();
    return datesWithEvents[dateStr] ? "has-event" : null;
  };

  // Get upcoming events for list view
  const upcomingEvents = [...listOfEvents]
    .filter(event => new Date(event.date) >= new Date())
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(0, 5);

  return (
    <div className="container" style={{ paddingTop: "70px" }}>
      <div className="row mb-4">
        <div className="col-md-6">
          <h2 className="text-primary">
            <i className="bi bi-calendar-event me-2"></i>
            Events Calendar
          </h2>
        </div>
        <div className="col-md-6 text-end">
          <div className="btn-group me-2">
            <button 
              className={`btn ${viewMode === 'calendar' ? 'btn-primary' : 'btn-outline-primary'}`}
              onClick={() => setViewMode("calendar")}
            >
              <i className="bi bi-calendar3 me-1"></i> Calendar
            </button>
            <button 
              className={`btn ${viewMode === 'list' ? 'btn-primary' : 'btn-outline-primary'}`}
              onClick={() => setViewMode("list")}
            >
              <i className="bi bi-list-ul me-1"></i> List
            </button>
          </div>
          <button 
            className="btn btn-success"
            onClick={() => navigate("/create-event")}
          >
            <i className="bi bi-plus-circle me-1"></i> New Event
          </button>
          <button 
            className="btn btn-outline-secondary ms-2"
            onClick={() => navigate("/")}
          >
            <i className="bi bi-house-door me-1"></i> Home
          </button>
        </div>
      </div>

      {viewMode === "calendar" ? (
        <div className="row">
          {/* Left Column: Calendar */}
          <div className="col-md-7">
            <div className="card shadow-sm">
              <div className="card-header bg-white">
                <h5 className="mb-0">
                  <i className="bi bi-calendar3-week me-2 text-primary"></i>
                  Select a Date
                </h5>
              </div>
              <div className="card-body">
                <Calendar
                  onChange={setDateSelected}
                  value={dateSelected}
                  tileClassName={tileClassName}
                  tileContent={({ date }) => {
                    const dateStr = date.toDateString();
                    if (datesWithEvents[dateStr]) {
                      const event = listOfEvents.find(
                        (event) => new Date(event.date).toDateString() === dateStr
                      );
                      return (
                        <div
                          className="event-dot"
                          style={{
                            height: "8px",
                            width: "8px",
                            backgroundColor: "#e74c3c",
                            borderRadius: "50%",
                            position: "absolute",
                            bottom: "5px",
                            left: "50%",
                            transform: "translateX(-50%)"
                          }}
                          data-bs-toggle="tooltip"
                          data-bs-placement="top"
                          title={event.title}
                        ></div>
                      );
                    }
                    return null;
                  }}
                />
                
                <style>{`
                  .has-event {
                    background-color: rgba(231, 76, 60, 0.1);
                    font-weight: bold;
                  }
                  .react-calendar__tile--active {
                    background-color: #0d6efd !important;
                    color: white;
                  }
                  .react-calendar {
                    border: none;
                    width: 100%;
                    font-family: inherit;
                  }
                  .react-calendar__navigation button:enabled:hover,
                  .react-calendar__navigation button:enabled:focus {
                    background-color: #f8f9fa;
                  }
                  .react-calendar__tile:enabled:hover,
                  .react-calendar__tile:enabled:focus {
                    background-color: #e9ecef;
                  }
                `}</style>
              </div>
            </div>
          </div>

          {/* Right Column: Events for Selected Date */}
          <div className="col-md-5">
            <div className="card shadow-sm mb-4">
              <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center">
                <h5 className="mb-0">
                  <i className="bi bi-calendar-check me-2"></i>
                  {dateSelected.toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </h5>
                <span className="badge bg-white text-primary">
                  {eventsOnSelectedDate.length} event{eventsOnSelectedDate.length !== 1 ? 's' : ''}
                </span>
              </div>
              <div className="card-body">
                {eventsOnSelectedDate.length === 0 ? (
                  <div className="text-center py-4">
                    <i className="bi bi-calendar-x text-muted" style={{ fontSize: "2.5rem" }}></i>
                    <p className="text-muted mt-3">No events scheduled for this date.</p>
                    <button 
                      className="btn btn-sm btn-outline-primary mt-2"
                      onClick={() => navigate("/create-event")}
                    >
                      <i className="bi bi-plus-circle me-1"></i> Add Event
                    </button>
                  </div>
                ) : (
                  <div className="list-group">
                    {eventsOnSelectedDate.map((event) => (
                      <div
                        key={event.id}
                        className="list-group-item list-group-item-action border-0 mb-3 shadow-sm rounded"
                        onClick={() => navigate(`/event/${event.id}`)}
                        style={{ cursor: "pointer" }}
                      >
                        <div className="d-flex w-100 justify-content-between">
                          <h5 className="mb-1">{event.title}</h5>
                          <small className="text-primary">
                            {new Date(event.date).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </small>
                        </div>
                        <p className="mb-1 text-muted">
                          <i className="bi bi-geo-alt-fill text-success me-1"></i>
                          {event.location}
                        </p>
                        <div className="mt-2 d-flex justify-content-between align-items-center">
                          <span className="badge bg-light text-dark">
                            {event.category || "General"}
                          </span>
                          <button className="btn btn-sm btn-outline-primary">
                            <i className="bi bi-arrow-right"></i> Details
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            
            <div className="card shadow-sm">
              <div className="card-header bg-success text-white">
                <h5 className="mb-0">
                  <i className="bi bi-trophy me-2"></i>
                  Popular Events
                </h5>
              </div>
              <div className="card-body">
                <div className="list-group">
                  {listOfEvents.slice(0, 3).map((event, index) => (
                    <div key={event.id} className="list-group-item border-0 px-1">
                      <div className="d-flex">
                        <div className="me-3 text-center">
                          <span className="badge rounded-pill bg-primary p-2" style={{ fontSize: "1.2rem" }}>
                            {index + 1}
                          </span>
                        </div>
                        <div>
                          <h6 className="mb-1">{event.title}</h6>
                          <p className="mb-0 small text-muted">
                            <i className="bi bi-person-fill me-1"></i>
                            {event.attendees || Math.floor(Math.random() * 50) + 10} attendees
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="text-center mt-3">
                  <button className="btn btn-sm btn-outline-success">
                    View All Rankings
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        // List View
        <div className="row">
          <div className="col-md-8">
            <div className="card shadow-sm">
              <div className="card-header bg-white">
                <h5 className="mb-0">
                  <i className="bi bi-calendar-range me-2 text-primary"></i>
                  Upcoming Events
                </h5>
              </div>
              <div className="card-body p-0">
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead className="table-light">
                      <tr>
                        <th scope="col">Date</th>
                        <th scope="col">Event</th>
                        <th scope="col">Location</th>
                        <th scope="col">Category</th>
                        <th scope="col">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {upcomingEvents.length > 0 ? (
                        upcomingEvents.map((event) => (
                          <tr key={event.id} style={{ cursor: "pointer" }}>
                            <td>
                              <div className="d-flex align-items-center">
                                <div className="text-center me-2" style={{ lineHeight: "1" }}>
                                  <div className="fw-bold" style={{ fontSize: "1.2rem" }}>
                                    {new Date(event.date).getDate()}
                                  </div>
                                  <div className="small text-muted text-uppercase">
                                    {new Date(event.date).toLocaleString('default', { month: 'short' })}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td>
                              <div className="fw-bold">{event.title}</div>
                              <div className="small text-muted">
                                {new Date(event.date).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </div>
                            </td>
                            <td>
                              <i className="bi bi-geo-alt-fill text-success me-1"></i>
                              {event.location}
                            </td>
                            <td>
                              <span className="badge bg-light text-dark">
                                {event.category || "General"}
                              </span>
                            </td>
                            <td>
                              <div className="btn-group btn-group-sm">
                                <button 
                                  className="btn btn-outline-primary"
                                  onClick={() => navigate(`/event/${event.id}`)}
                                >
                                  <i className="bi bi-eye"></i>
                                </button>
                                <button className="btn btn-outline-success">
                                  <i className="bi bi-calendar-plus"></i>
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="5" className="text-center py-4 text-muted">
                            No upcoming events found
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
          
          <div className="col-md-4">
            <div className="card shadow-sm mb-4">
              <div className="card-header bg-primary text-white">
                <h5 className="mb-0">
                  <i className="bi bi-funnel me-2"></i>
                  Filter Events
                </h5>
              </div>
              <div className="card-body">
                <form>
                  <div className="mb-3">
                    <label htmlFor="categoryFilter" className="form-label">Category</label>
                    <select className="form-select" id="categoryFilter">
                      <option value="">All Categories</option>
                      <option value="social">Social</option>
                      <option value="business">Business</option>
                      <option value="education">Education</option>
                      <option value="sports">Sports</option>
                    </select>
                  </div>
                  <div className="mb-3">
                    <label htmlFor="dateRangeFilter" className="form-label">Date Range</label>
                    <select className="form-select" id="dateRangeFilter">
                      <option value="all">All Dates</option>
                      <option value="today">Today</option>
                      <option value="tomorrow">Tomorrow</option>
                      <option value="week">This Week</option>
                      <option value="month">This Month</option>
                    </select>
                  </div>
                  <div className="d-grid">
                    <button type="submit" className="btn btn-primary">
                      <i className="bi bi-search me-1"></i> Apply Filters
                    </button>
                  </div>
                </form>
              </div>
            </div>
            
            <div className="card shadow-sm">
              <div className="card-header bg-info text-white">
                <h5 className="mb-0">
                  <i className="bi bi-info-circle me-2"></i>
                  Quick Stats
                </h5>
              </div>
              <div className="card-body">
                <div className="row text-center">
                  <div className="col-6 mb-3">
                    <div className="p-3 bg-light rounded">
                      <h2 className="text-primary">{listOfEvents.length}</h2>
                      <p className="mb-0 text-muted">Total Events</p>
                    </div>
                  </div>
                  <div className="col-6 mb-3">
                    <div className="p-3 bg-light rounded">
                      <h2 className="text-success">{upcomingEvents.length}</h2>
                      <p className="mb-0 text-muted">Upcoming</p>
                    </div>
                  </div>
                  <div className="col-6">
                    <div className="p-3 bg-light rounded">
                      <h2 className="text-info">
                        {
                          new Set(
                            listOfEvents.map(event => 
                              new Date(event.date).toLocaleDateString('en-US', { month: 'short' })
                            )
                          ).size
                        }
                      </h2>
                      <p className="mb-0 text-muted">Active Months</p>
                    </div>
                  </div>
                  <div className="col-6">
                    <div className="p-3 bg-light rounded">
                      <h2 className="text-warning">
                        {
                          new Set(
                            listOfEvents.map(event => event.location)
                          ).size
                        }
                      </h2>
                      <p className="mb-0 text-muted">Locations</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}