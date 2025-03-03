import "./App.css";
import { Routes, Route, Link, useNavigate, Navigate } from "react-router-dom";
import Home from "./pages/Home";
import CreateEvent from "./pages/CreateEvent";
import Event from "./pages/Event";
import Response from "./pages/Response";
import Login from "./pages/Login";
import PageNotFound from "./pages/PageNotFound";
import Registration from "./pages/Registration";
import { AuthContext } from "./helpers/AuthContext";
import { NotificationProvider } from "./helpers/NotificationContext";
import { useState, useEffect } from "react";
import axios from "axios";
import Chatbot from "./pages/Chatbot";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import logo from "./images/logo.png"; // Ensure this path is correct
import AdminDashboard from "./pages/AdminDashboard";

function App() {
  const [authState, setAuthState] = useState({
    username: "",
    id: 0,
    status: false,
    isAdmin: false,
  });

  const navigate = useNavigate();

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
        navigate("/");
      }
    } catch (error) {
      if (error.response?.status === 401) {
        localStorage.removeItem("accessToken");
        setAuthState({ username: "", id: 0, status: false, isAdmin: false });
        navigate("/login");
      }
    }
  };

  return (
    <AuthContext.Provider value={{ authState, setAuthState, deleteEvent }}>
      <NotificationProvider>
      <div className="App">
        {/* Navbar */}
        <nav className="navbar navbar-expand-lg navbar-dark bg-primary fixed-top">
          <div className="container-fluid">
            {/* Logo */}
            <Link className="navbar-brand fw-bold fs-3 d-flex align-items-center" to="/">
              <img src={logo} alt="Logo" style={{ width: "100px", height: "auto" }} />
            </Link>

            {/* Welcome Message */}
            <Link className="navbar-brand fw-bold fs-4 ms-2" to="/">
              {authState.status ? `Welcome, ${authState.username}` : "Dashboard"}
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

            {/* Navbar Links */}
            <div className="collapse navbar-collapse" id="navbarNav">
              <ul className="navbar-nav mx-auto">
                {!authState.status ? (
                  <>
                    <li className="nav-item">
                      <Link className="nav-link fw-bold fs-5" to="/login">
                        Login
                      </Link>
                    </li>
                    <li className="nav-item">
                      <Link className="nav-link fw-bold fs-5" to="/registration">
                        Register
                      </Link>
                    </li>
                  </>
                ) : (
                  <>
                    <li className="nav-item">
                      <Link className="nav-link fw-bold fs-5" to="/">
                        Home Page
                      </Link>
                    </li>
                    {/* Show Create Event link only for admins */}
                    {authState.isAdmin && (
                      <li className="nav-item">
                        <Link className="nav-link fw-bold fs-5" to="/create_event">
                          Create An Event
                        </Link>
                      </li>
                    )}
                    <li className="nav-item">
                      <Link className="nav-link fw-bold fs-5" to="/chatbot">
                        Chatbot
                      </Link>
                    </li>
                    {/* Admin Dashboard Link */}
                    {authState.isAdmin && (
                      <li className="nav-item">
                        <Link className="nav-link fw-bold fs-5" to="/admin">
                          Admin Dashboard
                        </Link>
                      </li>
                    )}
                  </>
                )}
              </ul>

              {/* Logout Button */}
              {authState.status && (
                <div className="ms-auto">
                  <button className="btn btn-danger" onClick={logout}>
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </nav>

        {/* Routes */}
        <Routes>
          <Route path="/" element={<Home />} />
          {/* Admin Routes */}
          <Route
            path="/admin"
            element={authState.isAdmin ? <AdminDashboard /> : <Navigate to="/" />}
          />
          <Route
            path="/create_event"
            element={authState.isAdmin ? <CreateEvent /> : <Navigate to="/" />}
          />
          <Route path="/login" element={<Login />} />
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
