import React, { useEffect, useState, useContext } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
// No Calendar import since we're creating our own calendar view
import "bootstrap/dist/css/bootstrap.min.css";
import { Tooltip } from "bootstrap";
import "bootstrap-icons/font/bootstrap-icons.min.css";
import { FaHeart } from "react-icons/fa";
import { AuthContext } from "../helpers/AuthContext";

export default function CalendarView() {
  const [listOfEvents, setListOfEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dateSelected, setDateSelected] = useState(new Date());
  const [viewMode, setViewMode] = useState("calendar"); // calendar or list
  const [currentMonthEvents, setCurrentMonthEvents] = useState([]);
  const [hoverEvent, setHoverEvent] = useState(null);
  const [hoverPosition, setHoverPosition] = useState({ top: 0, left: 0 });
  const { authState } = useContext(AuthContext);
  const navigate = useNavigate();

  // Color palette
  const colors = {
    navy: "#001F3F",
    coral: "#FF6B6B",
    white: "#FFFFFF",
    lightGray: "#F5F7FA",
    gray: "#E2E8F0",
    darkGray: "#718096",
  };

  useEffect(() => {
    if (!authState.status) {
      navigate("/login");
    } else {
      axios
        .get("http://localhost:3001/events")
        .then((response) => {
          setListOfEvents(response.data);
          setLoading(false);
          
          // Set initial current month events
          filterCurrentMonthEvents(response.data, dateSelected);
        })
        .catch((error) => {
          setError("There was an error loading events. Please try again later.");
          setLoading(false);
        });
    }
  }, [authState, navigate, dateSelected]); // Added dateSelected to dependency array

  useEffect(() => {
    const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]');
    tooltipTriggerList.forEach((tooltip) => new Tooltip(tooltip));
  }, [listOfEvents]);

  // Filter events for current month view
  const filterCurrentMonthEvents = (events, date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    
    const filteredEvents = events.filter(event => {
      const eventDate = new Date(event.date);
      return eventDate.getFullYear() === year && eventDate.getMonth() === month;
    });
    
    setCurrentMonthEvents(filteredEvents);
  };

  // Handle month change in calendar - we'll use this in the UI buttons instead
  const changeMonth = (increment) => {
    const newDate = new Date(dateSelected);
    newDate.setMonth(newDate.getMonth() + increment);
    setDateSelected(newDate);
    filterCurrentMonthEvents(listOfEvents, newDate);
  };

  if (loading) return (
    <div className="d-flex justify-content-center align-items-center" style={{ height: "80vh", paddingTop: "70px" }}>
      <div className="spinner-border" role="status" style={{ color: colors.coral }}>
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

  // Get upcoming events for list view
  const upcomingEvents = [...listOfEvents]
    .filter(event => new Date(event.date) >= new Date())
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(0, 5);

  // Function to group events by date for the month view
  const groupEventsByDate = () => {
    const grouped = {};
    
    currentMonthEvents.forEach(event => {
      const date = new Date(event.date);
      const day = date.getDate();
      
      if (!grouped[day]) {
        grouped[day] = [];
      }
      
      grouped[day].push(event);
    });
    
    return grouped;
  };

  const eventsByDay = groupEventsByDate();
  
  // Get days in current month
  const getDaysInMonth = (year, month) => {
    return new Date(year, month + 1, 0).getDate();
  };
  
  const getCurrentMonthDays = () => {
    const currentDate = new Date(dateSelected);
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = getDaysInMonth(year, month);
    
    const days = [];
    
    // Fill in days from previous month
    const prevMonthDays = firstDay === 0 ? 6 : firstDay - 1; // Adjust for Monday as first day
    const prevMonth = month === 0 ? 11 : month - 1;
    const prevMonthYear = month === 0 ? year - 1 : year;
    const daysInPrevMonth = getDaysInMonth(prevMonthYear, prevMonth);
    
    for (let i = 0; i < prevMonthDays; i++) {
      days.push({
        date: new Date(prevMonthYear, prevMonth, daysInPrevMonth - prevMonthDays + i + 1),
        isCurrentMonth: false
      });
    }
    
    // Current month days
    for (let day = 1; day <= daysInMonth; day++) {
      days.push({
        date: new Date(year, month, day),
        isCurrentMonth: true
      });
    }
    
    // Next month days to fill 6 rows (42 cells)
    const remainingCells = 42 - days.length;
    const nextMonth = month === 11 ? 0 : month + 1;
    const nextMonthYear = month === 11 ? year + 1 : year;
    
    for (let day = 1; day <= remainingCells; day++) {
      days.push({
        date: new Date(nextMonthYear, nextMonth, day),
        isCurrentMonth: false
      });
    }
    
    return days;
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
            <FaHeart style={{ color: colors.coral, marginRight: "0.5rem" }} /> Event Hive
          </p>
          <p style={{ margin: "0.5rem 0", fontSize: "0.9rem", color: colors.lightGray }}>
            Connect with event organizers and attendees from around the world, Buzzing With Possibilities 🐝
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
            © {currentYear} EventHive. All rights reserved.
          </p>
        </div>
      </footer>
    );
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

  // This function renders event popup content directly in the return statement
  // No need for a separate component definition

  // Event card component for month view
  const EventCard = ({ event }) => {
    return (
      <div 
        className="event-card"
        onClick={() => navigate(`/response/${event.id}`)}
        onMouseEnter={(e) => {
          setHoverEvent(event);
          setHoverPosition({ 
            top: e.clientY, 
            left: e.clientX + 20 // offset to prevent overlap with cursor
          });
        }}
        onMouseLeave={() => setHoverEvent(null)}
        style={{
          backgroundColor: colors.white,
          borderLeft: `3px solid ${colors.coral}`,
          padding: "0.5rem",
          marginBottom: "0.25rem",
          borderRadius: "4px",
          boxShadow: "0 1px 2px rgba(0,0,0,0.1)",
          cursor: "pointer",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap"
        }}
      >
        <div style={{ fontSize: "0.75rem", color: colors.coral, fontWeight: "bold" }}>
          {new Date(event.date).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit'
          })}
        </div>
        <div style={{ fontWeight: "500", color: colors.navy }}>
          {event.title}
        </div>
        <div style={{ fontSize: "0.75rem", color: colors.darkGray }}>
          <i className="bi bi-geo-alt-fill me-1"></i>
          {event.location}
        </div>
        {event.category && (
          <span 
            style={{ 
              display: "inline-block",
              fontSize: "0.7rem", 
              backgroundColor: `${colors.lightGray}`,
              color: colors.navy,
              padding: "0.1rem 0.5rem",
              borderRadius: "20px",
              marginTop: "0.25rem"
            }}
          >
            {event.category}
          </span>
        )}
      </div>
    );
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <div className="container">
        <div className="row mb-4">
          <div className="col-md-6">
            <h2 className="text-primary">
              <i className="bi bi-calendar-event me-2" style={{ color: colors.coral }}></i>
              <span style={{ color: colors.coral }}>Events </span>
              <span style={{ color: colors.navy }}>Calendar</span>
            </h2>
          </div>
          <div className="col-md-6 text-end">
            <div className="btn-group me-2">
              <button
                className={`btn ${viewMode === 'calendar' ? 'btn-primary' : 'btn-outline-primary'}`}
                onClick={() => setViewMode("calendar")}
                style={{ 
                  backgroundColor: viewMode === 'calendar' ? colors.navy : 'white', 
                  borderColor: colors.navy,
                  color: viewMode === 'calendar' ? 'white' : colors.navy
                }}
              >
                <i className="bi bi-calendar3 me-1" style={{ color: viewMode === 'calendar' ? colors.coral : colors.navy }}></i> Calendar
              </button>

              <button
                className={`btn ${viewMode === 'list' ? 'btn-primary' : 'btn-outline-primary'}`}
                onClick={() => setViewMode("list")}
                style={{ 
                  backgroundColor: viewMode === 'list' ? colors.navy : 'white', 
                  borderColor: colors.navy,
                  color: viewMode === 'list' ? 'white' : colors.navy
                }}
              >
                <i className="bi bi-list-ul me-1" style={{ color: viewMode === 'list' ? colors.coral : colors.navy }}></i> List
              </button>
            </div>
            <button
              className="btn text-white"
              onClick={() => navigate("/create_event")}
              style={{ backgroundColor: colors.coral }}
            >
              <i className="bi bi-plus-circle me-1"></i> New Event
            </button>
          </div>
        </div>

        {viewMode === "calendar" ? (
          <div className="row mb-4">
            <div className="col-12">
              <div className="card shadow-sm">
                <div className="card-header bg-white">
                  <div className="d-flex justify-content-between align-items-center">
                    <h5 className="mb-0">
                      <i className="bi bi-calendar3-week me-2" style={{ color: colors.coral }}></i>
                      <span style={{ color: colors.navy }}>
                        {dateSelected.toLocaleString('default', { month: 'long', year: 'numeric' })}
                      </span>
                    </h5>
                    <div>
                      <button 
                        className="btn btn-sm"
                        onClick={() => changeMonth(-1)}
                        style={{ 
                          backgroundColor: "white", 
                          borderColor: colors.navy,
                          color: colors.navy,
                          marginRight: "0.5rem"
                        }}
                      >
                        <i className="bi bi-chevron-left"></i>
                      </button>
                      <button 
                        className="btn btn-sm"
                        onClick={() => {
                          const newDate = new Date();
                          setDateSelected(newDate);
                          filterCurrentMonthEvents(listOfEvents, newDate);
                        }}
                        style={{ 
                          backgroundColor: colors.navy, 
                          color: "white",
                          marginRight: "0.5rem"
                        }}
                      >
                        Today
                      </button>
                      <button 
                        className="btn btn-sm"
                        onClick={() => changeMonth(1)}
                        style={{ 
                          backgroundColor: "white", 
                          borderColor: colors.navy,
                          color: colors.navy
                        }}
                      >
                        <i className="bi bi-chevron-right"></i>
                      </button>
                    </div>
                  </div>
                </div>
                <div className="card-body p-0">
                  {/* New calendar grid layout to match screenshots */}
                  <div className="table-responsive">
                    <table className="table table-bordered mb-0" style={{ tableLayout: 'fixed' }}>
                      <thead>
                        <tr style={{ backgroundColor: colors.navy, color: "white" }}>
                          <th className="text-center" style={{ width: "14.28%" }}>Mon</th>
                          <th className="text-center" style={{ width: "14.28%" }}>Tue</th>
                          <th className="text-center" style={{ width: "14.28%" }}>Wed</th>
                          <th className="text-center" style={{ width: "14.28%" }}>Thu</th>
                          <th className="text-center" style={{ width: "14.28%" }}>Fri</th>
                          <th className="text-center" style={{ width: "14.28%" }}>Sat</th>
                          <th className="text-center" style={{ width: "14.28%" }}>Sun</th>
                        </tr>
                      </thead>
                      <tbody>
                        {/* Generate calendar rows */}
                        {Array.from({ length: 6 }, (_, weekIndex) => {
                          const days = getCurrentMonthDays().slice(weekIndex * 7, (weekIndex + 1) * 7);
                          
                          return (
                            <tr key={`week-${weekIndex}`} style={{ height: "120px" }}>
                              {days.map((dayInfo, dayIndex) => {
                                const day = dayInfo.date.getDate();
                                const isCurrentMonth = dayInfo.isCurrentMonth;
                                const isToday = new Date().toDateString() === dayInfo.date.toDateString();
                                // Only get events for the current month to avoid conflicts with day numbers
                                const dayEvents = isCurrentMonth 
                                  ? (eventsByDay[day] || []) 
                                  : [];
                                
                                return (
                                  <td 
                                    key={`day-${dayIndex}`} 
                                    className={`position-relative ${isCurrentMonth ? '' : 'text-muted'}`}
                                    style={{ 
                                      backgroundColor: isToday ? `rgba(255, 107, 107, 0.1)` : 
                                                     !isCurrentMonth ? `rgba(0, 0, 0, 0.03)` : 
                                                     'white',
                                      padding: "0.25rem",
                                      verticalAlign: "top",
                                      overflow: "hidden"
                                    }}
                                    onClick={() => setDateSelected(dayInfo.date)}
                                  >
                                    <div 
                                      style={{ 
                                        color: isCurrentMonth ? (isToday ? colors.coral : colors.coral) : '#aaa',
                                        fontWeight: isToday ? 'bold' : 'normal',
                                        fontSize: '1.1rem',
                                        padding: '0.25rem',
                                        textAlign: 'right',
                                        borderBottom: isCurrentMonth && dayEvents.length > 0 ? '1px solid #eee' : 'none'
                                      }}
                                    >
                                      {day}
                                    </div>
                                    
                                    <div style={{ 
                                      maxHeight: "85px", 
                                      overflowY: "auto",
                                      paddingTop: "0.25rem"
                                    }}>
                                      {isCurrentMonth && dayEvents.slice(0, 3).map((event) => (
                                        <EventCard key={`event-${event.id}`} event={event} />
                                      ))}
                                      
                                      {isCurrentMonth && dayEvents.length > 3 && (
                                        <div 
                                          style={{ 
                                            fontSize: "0.75rem", 
                                            color: colors.navy, 
                                            textAlign: "center",
                                            marginTop: "0.25rem",
                                            fontWeight: "500"
                                          }}
                                        >
                                          + {dayEvents.length - 3} more
                                        </div>
                                      )}
                                    </div>
                                  </td>
                                );
                              })}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          // List View (keeping original code)
          <div className="row">
            <div className="col-md-8">
              <div className="card shadow-sm">
                <div className="card-header bg-white">
                  <h5 className="mb-0">
                    <i className="bi bi-calendar-range me-2" style={{ color: colors.coral }}></i>
                    <span style={{ color: colors.navy }}>Upcoming Events</span>
                  </h5>
                </div>
                <div className="card-body p-0">
                  <div className="table-responsive">
                    <table className="table table-hover">
                      <thead className="table-light">
                        <tr style={{ color: colors.navy }}>
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
                                    <div className="fw-bold" style={{ fontSize: "1.2rem", color: colors.coral }}>
                                      {new Date(event.date).getDate()}
                                    </div>
                                    <div className="small text-muted text-uppercase">
                                      {new Date(event.date).toLocaleString('default', { month: 'short' })}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td>
                                <div className="fw-bold" style={{ color: colors.navy }}>{event.title}</div>
                                <div className="small text-muted">
                                  {new Date(event.date).toLocaleTimeString([], {
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </div>
                              </td>
                              <td>
                                <i className="bi bi-geo-alt-fill me-1" style={{ color: colors.coral }}></i>
                                {event.location}
                              </td>
                              <td>
                                <span className="badge bg-light" style={{ color: colors.navy }}>
                                  {event.category || "General"}
                                </span>
                              </td>
                              <td>
                                <div className="btn-group btn-group-sm">
                                  <button
                                    className="btn"
                                    onClick={() => navigate(`/event/${event.id}`)}
                                    style={{ borderColor: colors.navy, color: colors.navy }}
                                  >
                                    <i className="bi bi-eye"></i>
                                  </button>
                                  <button className="btn" style={{ borderColor: colors.coral, color: colors.coral }}>
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
              {/* <div className="card shadow-sm mb-4"> */}
                {/* <div className="card-header text-white" style={{ backgroundColor: colors.navy }}> */}
                  {/* <h5 className="mb-0">
                    <i className="bi bi-funnel me-2" style={{ color: colors.coral }}></i>
                    Filter Events
                  </h5> */}
                {/* </div> */}
                {/* <div className="card-body"> */}
                  {/* <form>
                    <div className="mb-3">
                      <label htmlFor="categoryFilter" className="form-label" style={{ color: colors.navy }}>Category</label>
                      <select className="form-select" id="categoryFilter" style={{ borderColor: colors.coral }}>
                        <option value="">All Categories</option>
                        <option value="social">Social</option>
                        <option value="business">Business</option>
                        <option value="education">Education</option>
                        <option value="sports">Sports</option>
                        <option value="webinar">Webinar</option>
                        <option value="conference">Conference</option>
                        <option value="workshop">Workshop</option>
                      </select>
                    </div>
                    <div className="mb-3">
                      <label htmlFor="dateRangeFilter" className="form-label" style={{ color: colors.navy }}>Date Range</label>
                      <select className="form-select" id="dateRangeFilter" style={{ borderColor: colors.coral }}>
                        <option value="all">All Dates</option>
                        <option value="today">Today</option>
                        <option value="tomorrow">Tomorrow</option>
                        <option value="week">This Week</option>
                        <option value="month">This Month</option>
                      </select>
                    </div>
                    <div className="d-grid">
                      <button type="submit" className="btn text-white" style={{ backgroundColor: colors.coral }}>
                        <i className="bi bi-search me-1"></i> Apply Filters
                      </button>
                    </div>
                  </form> */}
                {/* </div> */}
              {/* </div> */}

              <div className="card shadow-sm">
                <div className="card-header text-white" style={{ backgroundColor: colors.coral }}>
                  <h5 className="mb-0">
                    <i className="bi bi-info-circle me-2"></i>
                    Quick Stats
                  </h5>
                </div>
                <div className="card-body">
                  <div className="row text-center">
                    <div className="col-6 mb-3">
                      <div className="p-3 bg-light rounded">
                        <h2 style={{ color: colors.navy }}>{listOfEvents.length}</h2>
                        <p className="mb-0 text-muted">Total Events</p>
                      </div>
                    </div>
                    <div className="col-6 mb-3">
                      <div className="p-3 bg-light rounded">
                        <h2 style={{ color: colors.coral }}>{upcomingEvents.length}</h2>
                        <p className="mb-0 text-muted">Upcoming</p>
                      </div>
                    </div>
                    <div className="col-6">
                      <div className="p-3 bg-light rounded">
                        <h2 style={{ color: colors.navy }}>
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
                        <h2 style={{ color: colors.coral }}>
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
      
      {/* Apply Footer from Create Event Page */}
      <Footer />
      
      {/* Event details popup on hover - direct implementation instead of using a separate component */}
      {hoverEvent && (
        <div 
          className="event-popup"
          style={{
            position: "fixed",
            top: `${hoverPosition.top}px`,
            left: `${hoverPosition.left}px`,
            backgroundColor: colors.white,
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
            borderRadius: "8px",
            padding: "12px",
            zIndex: 1050,
            width: "280px",
            pointerEvents: "none", // Prevent the popup from intercepting mouse events
          }}
        >
          {hoverEvent.image && (
            <div 
              style={{
                width: "100%",
                height: "140px",
                borderRadius: "6px",
                marginBottom: "10px",
                backgroundImage: `url(${getImageUrl(hoverEvent.image)})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                backgroundRepeat: "no-repeat",
                backgroundColor: "#f0f0f0"
              }}
            />
          )}
          
          <h5 style={{ margin: "0 0 5px 0", color: colors.navy }}>{hoverEvent.title}</h5>
          
          <div style={{ fontSize: "0.85rem", marginBottom: "5px", color: colors.coral, fontWeight: "500" }}>
            <i className="bi bi-clock me-2"></i>
            {new Date(hoverEvent.date).toLocaleString([], {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </div>
          
          <div style={{ fontSize: "0.85rem", marginBottom: "5px", color: colors.darkGray }}>
            <i className="bi bi-geo-alt-fill me-2"></i>
            {hoverEvent.location}
          </div>
          
          {hoverEvent.category && (
            <div style={{ marginTop: "8px" }}>
              <span
                style={{
                  fontSize: "0.75rem",
                  backgroundColor: colors.lightGray,
                  color: colors.navy,
                  padding: "3px 8px",
                  borderRadius: "12px",
                  display: "inline-block"
                }}
              >
                {hoverEvent.category}
              </span>
            </div>
          )}
          
          {hoverEvent.description && (
            <div style={{ 
              fontSize: "0.8rem", 
              marginTop: "8px", 
              color: colors.darkGray,
              maxHeight: "60px",
              overflow: "hidden",
              textOverflow: "ellipsis",
              display: "-webkit-box",
              WebkitLineClamp: 3,
              WebkitBoxOrient: "vertical"
            }}>
              {hoverEvent.description}
            </div>
          )}
        </div>
      )}
    </div>
  );
}