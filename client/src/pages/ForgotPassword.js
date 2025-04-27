import React, { useState, useEffect } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { FaArrowLeft } from "react-icons/fa"; // Assuming you're using icons like these

const theme = {
  primary: "#4361ee",
  secondary: "#3f37c9",
  success: "#4cc9f0",
  danger: "#f72585",
  light: "#f8f9fa",
  dark: "#212529",
  cardBg: "#ffffff",
  inputBg: "#f8f9fa",
};

function ForgotPassword() {
  const [usernameOrEmail, setUsernameOrEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!usernameOrEmail.trim()) {
      setMessage({ text: "Username or email is required", type: "danger" });
      return;
    }

    if (!newPassword.trim()) {
      setMessage({ text: "Password is required", type: "danger" });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const { data } = await axios.patch(
        "http://localhost:3001/auth/forgot-password",
        {
          usernameOrEmail,
          newPassword,
        }
      );

      setMessage({ text: data.message, type: "success" });
      setSubmitted(true);
    } catch (error) {
      const errorMessage =
        error.response?.data?.error || "An error occurred. Please try again.";
      setMessage({ text: errorMessage, type: "danger" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="container d-flex justify-content-center align-items-center min-vh-100"
      style={{
        background: `linear-gradient(135deg, ${theme.light} 0%, ${theme.light}ee 100%)`,
        padding: "20px",
      }}
    >
      <div
        className="card shadow-lg p-4 col-lg-4 col-md-6 col-sm-10 col-12"
        style={{
          backgroundColor: theme.cardBg,
          borderRadius: "12px",
          border: "none",
          boxShadow: "0 12px 24px rgba(0,0,0,0.1)",
        }}
      >
        {/* Back to Login Button */}
        <div className="text-start mb-3">
          <Link
            to="/login"
            className="btn btn-sm d-inline-flex align-items-center"
            style={{
              color: theme.primary,
              fontWeight: "500",
              padding: "6px 12px",
              borderRadius: "6px",
              backgroundColor: `${theme.primary}10`,
            }}
          >
            <FaArrowLeft size={14} className="me-2" />
            Back to Login
          </Link>
        </div>

        <div className="text-center mb-4">
          <h1 className="h3 mb-3 fw-bold" style={{ color: theme.dark }}>
            {submitted ? "Password Changed Successfully" : "Change Password"}
          </h1>
          <div className="small text-muted">
            {submitted
              ? "Your password has been updated successfully."
              : "Enter your username/email and new password below."}
          </div>
        </div>

        {message && (
          <div
            className={`alert alert-${message.type} d-flex align-items-center`}
            role="alert"
            style={{
              backgroundColor:
                message.type === "danger" ? `${theme.danger}15` : `${theme.success}15`,
              color: message.type === "danger" ? theme.danger : theme.success,
              border: `1px solid ${message.type === "danger" ? theme.danger : theme.success}22`,
              borderRadius: "8px",
            }}
          >
            <div>{message.text}</div>
          </div>
        )}

        {!submitted ? (
          <form onSubmit={handleSubmit}>
            {/* Username/Email Field */}
            <div className="mb-4">
              <label className="form-label small fw-bold" style={{ color: theme.dark }}>
                Username or Email
              </label>
              <input
                type="text"
                className="form-control"
                placeholder="Enter your username or email"
                value={usernameOrEmail}
                onChange={(e) => setUsernameOrEmail(e.target.value)}
                style={{
                  backgroundColor: theme.inputBg,
                  borderColor: "#dee2e6",
                  fontSize: "0.95rem",
                  padding: "0.75rem 0.75rem",
                }}
                required
              />
            </div>

            {/* New Password Field */}
            <div className="mb-4">
              <label className="form-label small fw-bold" style={{ color: theme.dark }}>
                New Password
              </label>
              <input
                type="password"
                className="form-control"
                placeholder="Enter your new password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                style={{
                  backgroundColor: theme.inputBg,
                  borderColor: "#dee2e6",
                  fontSize: "0.95rem",
                  padding: "0.75rem 0.75rem",
                }}
                required
              />
            </div>

            <button
              className="btn w-100 mb-3"
              type="submit"
              disabled={loading}
              style={{
                backgroundColor: theme.primary,
                color: "white",
                padding: "0.75rem",
                borderRadius: "6px",
                fontWeight: "500",
                border: "none",
                opacity: loading ? 0.8 : 1,
              }}
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  <span>Changing...</span>
                </>
              ) : (
                "Change Password"
              )}
            </button>
          </form>
        ) : (
          <div className="text-center">
            <button
              className="btn w-100"
              onClick={() => navigate("/login")}
              style={{
                backgroundColor: theme.primary,
                color: "white",
                padding: "0.75rem",
                borderRadius: "6px",
                fontWeight: "500",
                border: "none",
              }}
            >
              Return to Login
            </button>
          </div>
        )}

        <div className="text-center mt-3">
          <span className="small text-muted">Remember your password? </span>
          <Link to="/login" className="small text-decoration-none fw-bold" style={{ color: theme.primary }}>
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}

export default ForgotPassword;
