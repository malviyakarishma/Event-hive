import React, { useContext, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../helpers/AuthContext";
import { FaUser, FaLock } from "react-icons/fa"; // ✅ Import icons
import "bootstrap/dist/css/bootstrap.min.css";

function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState(null);
  const { setAuthState } = useContext(AuthContext);
  const navigate = useNavigate();

  const login = async () => {
    try {
      const { data } = await axios.post("http://localhost:3001/auth/login", { username, password });

      if (data.error) {
        setMessage({ text: data.error, type: "danger" });
      } else {
        setMessage({ text: "Login successful!", type: "success" });

        // ✅ Store token in localStorage
        localStorage.setItem("accessToken", data.token);

        // ✅ Extract username from the response
        const loggedInUser = data.username || username; // Fallback to input username

        // ✅ Update AuthContext correctly
        setAuthState({
          username: loggedInUser,
          id: data.id,
          status: true,
        });

        console.log("AuthState Updated:", {
          username: loggedInUser,
          id: data.id,
          status: true,
        });

        setTimeout(() => {
          navigate("/");
        }, 1000);
      }
    } catch (error) {
      setMessage({ text: "Incorrect Credentials, please try again.", type: "danger" });
      console.error("Login error:", error);
    }
  };

  return (
    <div className="container mt-5" style={{ paddingTop: "70px" }}>
      <div className="card shadow p-4">
        <h2 className="text-center mb-4">Login</h2>

        {message && <div className={`alert alert-${message.type}`}>{message.text}</div>}

        {/* Username Field with Icon */}
        <div className="mb-3">
          <label className="form-label">Username</label>
          <div className="input-group">
            <span className="input-group-text">
              <FaUser className="text-primary" /> {/* ✅ Blue Icon */}
            </span>
            <input
              type="text"
              className="form-control"
              placeholder="Enter username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
        </div>

        {/* Password Field with Icon */}
        <div className="mb-3">
          <label className="form-label">Password</label>
          <div className="input-group">
            <span className="input-group-text">
              <FaLock className="text-primary" /> {/* ✅ Blue Icon */}
            </span>
            <input
              type="password"
              className="form-control"
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
        </div>

        <button className="btn btn-primary w-100" onClick={login}>
          Login
        </button>
      </div>
    </div>
  );
}

export default Login;
