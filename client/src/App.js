"use client"

import { useState, useEffect } from "react";
import { useLocation, Routes, Route, Link, useNavigate, Navigate } from "react-router-dom";
import axios from "axios";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
// import logo from "./images/logo.png";

import Home from "./pages/Home";
import CreateEvent from "./pages/CreateEvent";
import Event from "./pages/Event";
import LandingPage from "./pages/LandingPage";
import Profile from "./pages/Profile";
import Calendar from "./pages/Calendar";
import AdminCalendar from "./pages/AdminCalendar";
import Response from "./pages/Response";
import Login from "./pages/Login";
import PageNotFound from "./pages/PageNotFound";
import Registration from "./pages/Registration";
import Chatbot from "./pages/Chatbot";
import AdminDashboard from "./pages/AdminDashboard";

import { AuthContext } from "./helpers/AuthContext";
import { NotificationProvider, useNotifications } from "./helpers/NotificationContext";
import NotificationIcon from "./pages/NotificationIcon";
import UserNotificationIcon from "./pages/UserNotificationIcon"; // Adjust path as needed


function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const { notifications, markAsRead, markAllAsRead } = useNotifications(); // Use the hook here
  const [authState, setAuthState] = useState({
    username: "",
    id: 0,
    status: false,
    isAdmin: false,
  });

  const useSocketNotifications = true;

  useEffect(() => {
    const token = localStorage.getItem("accessToken");

    if (!token) {
      setAuthState({ username: "", id: 0, status: false, isAdmin: false });
      return;
    }

    axios
      .get("http://localhost:3001/auth/auth", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((response) => {
        if (response.data.error) {
          setAuthState({ username: "", id: 0, status: false, isAdmin: false });
          localStorage.removeItem("accessToken");
        } else {
          setAuthState({
            username: response.data.username || "User",
            id: response.data.id,
            status: true,
            isAdmin: response.data.isAdmin || false,
          });

          if (response.data.isAdmin && window.location.pathname === "/login") {
            navigate("/admin");
          }
        }
      })
      .catch(() => {
        setAuthState({ username: "", id: 0, status: false, isAdmin: false });
        localStorage.removeItem("accessToken");
      });
  }, [navigate]);

  const logout = () => {
    localStorage.removeItem("accessToken");
    setAuthState({ username: "", id: 0, status: false, isAdmin: false });
    navigate("/login");
  };

  const deleteEvent = async (eventId) => {
    try {
      const token = localStorage.getItem("accessToken");

      if (!token) {
        navigate("/login");
        return;
      }

      const response = await axios.delete(`http://localhost:3001/events/${eventId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.status === 200) {
        navigate("/home");
      }
    } catch (error) {
      if (error.response?.status === 401) {
        localStorage.removeItem("accessToken");
        setAuthState({ username: "", id: 0, status: false, isAdmin: false });
        navigate("/login");
      }
    }
  };

  const hideNavbarRoutes = ["/", "/landingPage"];

  return (
    <AuthContext.Provider value={{ authState, setAuthState, deleteEvent }}>
      <NotificationProvider>
        <div className="App">
          {!hideNavbarRoutes.includes(location.pathname) && (
            <nav className="navbar navbar-expand-lg navbar-dark bg-primary fixed-top py-4">
              <div className="container-fluid">
                {/* Brand/Logo - Moved to the left edge */}
                <Link className="navbar-brand fw-bold fs-4" to="/">
                  <i className="bi bi-calendar-event me-2"></i>
                  EventApp
                </Link>

                {/* Navbar Toggler */}
                <button
                  className="navbar-toggler"
                  type="button"
                  data-bs-toggle="collapse"
                  data-bs-target="#navbarNav"
                  aria-controls="navbarNav"
                  aria-expanded="false"
                  aria-label="Toggle navigation"
                >
                  <span className="navbar-toggler-icon"></span>
                </button>

                {/* Navbar Links - Centered */}
                <div className="collapse navbar-collapse" id="navbarNav">
                  {/* This empty div helps push the nav items to center */}
                  <div className="me-auto d-none d-lg-block"></div>

                  <ul className="navbar-nav mx-auto">
                    {!authState.status ? (
                      <>
                        <li className="nav-item mx-2">
                          <Link className="nav-link fw-bold fs-5 text-white" to="/login">
                            Login
                          </Link>
                        </li>
                        <li className="nav-item mx-2">
                          <Link className="nav-link fw-bold fs-5 text-white" to="/registration">
                            Register
                          </Link>
                        </li>
                      </>
                    ) : (
                      <>
                        {!authState.isAdmin && (
                          <>
                            <li className="nav-item mx-2">
                              <Link className="nav-link fw-bold fs-5 text-white" to="/home">
                                <i className="bi bi-house-door me-1"></i> Home
                              </Link>
                            </li>
                            <li className="nav-item mx-2">
                              <Link className="nav-link fw-bold fs-5 text-white" to="/chatbot">
                                <i className="bi bi-chat-dots me-1"></i> Chatbot
                              </Link>
                            </li>
                            <li className="nav-item mx-2">
                              <Link className="nav-link fw-bold fs-5 text-white" to="/calendar">
                                <i className="bi bi-calendar3 me-1"></i> Calendar
                              </Link>
                            </li>
                          </>
                        )}
                        {authState.isAdmin && (
                          <>
                            <li className="nav-item mx-2">
                              <Link className="nav-link fw-bold fs-5 text-white" to="/admin">
                                <i className="bi bi-speedometer2 me-1"></i> Dashboard
                              </Link>
                            </li>
                            <li className="nav-item mx-2">
                              <Link className="nav-link fw-bold fs-5 text-white" to="/create_event">
                                <i className="bi bi-plus-circle me-1"></i> Create Event
                              </Link>
                            </li>
                            <li className="nav-item mx-2">
                              <Link className="nav-link fw-bold fs-5 text-white" to="/admincalendar">
                                <i className="bi bi-calendar3 me-1"></i> Calendar
                              </Link>
                            </li>
                          </>
                        )}
                      </>
                    )}
                  </ul>

                  {/* This empty div helps push the right items to the edge */}
                  <div className="ms-auto d-none d-lg-block"></div>

                  {/* Right side items: Username, Notification, and Logout */}
                  {authState.status && (
                    <div className="d-flex align-items-center ms-auto">
                      {/* Username */}
                      <Link className="text-decoration-none me-3" to="/profile">
                        <span className="text-white fw-bold">
                          <i className="bi bi-person-circle me-1"></i>
                          {authState.username}
                        </span>
                      </Link>

                      {/* Notification Icon */}
                      <div className="me-3">
                        {useSocketNotifications ? (
                          <UserNotificationIcon />
                        ) : (
                          <NotificationIcon
                            notifications={notifications}
                            markAsRead={markAsRead}
                            markAllAsRead={markAllAsRead}
                          />
                        )}
                      </div>

                      {/* Logout Button */}
                      <button
                        className="btn btn-sm text-white fw-bold"
                        style={{ backgroundColor: '#FF6B6B', borderColor: '#FF6B6B' }}
                        onClick={logout}
                      >
                        <i className="bi bi-box-arrow-right me-1"></i>
                        Logout
                      </button>

                    </div>
                  )}
                </div>
              </div>
            </nav>
          )}

          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/landingPage" element={<LandingPage />} />
            <Route path="/home" element={<Home />} />
            <Route path="/admin" element={authState.isAdmin ? <AdminDashboard /> : <Navigate to="/home" />} />
            <Route path="/create_event" element={authState.isAdmin ? <CreateEvent /> : <Navigate to="/home" />} />
            <Route path="/login" element={<Login />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/admincalendar" element={<AdminCalendar />} />
            <Route path="/calendar" element={<Calendar />} />
            <Route path="/registration" element={<Registration />} />
            <Route path="/event/:id" element={<Event />} />
            <Route path="/response/:id" element={<Response />} />
            <Route path="/chatbot" element={<Chatbot />} />
            <Route path="*" element={<PageNotFound />} />
          </Routes>
        </div>
      </NotificationProvider>
    </AuthContext.Provider>
  );
}

export default App;