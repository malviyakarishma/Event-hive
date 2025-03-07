import React, { useContext, useEffect, useState } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { FaCalendarAlt, FaMapMarkerAlt, FaFileAlt, FaPlus, FaHeart } from "react-icons/fa";
import { AuthContext } from "../helpers/AuthContext";
import eventImage from "../images/event-banner.jpg"; 

function CreateEvent() {
  const { authState } = useContext(AuthContext);
  const navigate = useNavigate();
  const [currentDate] = useState(new Date().toISOString().split("T")[0]);
  const [successMessage, setSuccessMessage] = useState("");

  const initialValues = {
    title: "",
    location: "",
    description: "",
    date: currentDate,
  };

  useEffect(() => {
    if (!authState.status) {
      navigate("/login");
    }
  }, [authState, navigate]);

  const validationSchema = Yup.object().shape({
    title: Yup.string().trim().required("Title is required"),
    location: Yup.string().trim().required("Location is required"),
    description: Yup.string().trim().required("Description is required"),
    date: Yup.string()
      .matches(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format")
      .required("Date is required"),
  });

  const onSubmit = async (data, { setSubmitting, setErrors, resetForm }) => {
    const accessToken = localStorage.getItem("accessToken");
    if (!accessToken) {
      setErrors({ general: "Unauthorized. Please log in again." });
      setSubmitting(false);
      return;
    }

    try {
      await axios.post("http://localhost:3001/events", data, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      setSuccessMessage("Event created successfully!");
      resetForm();

      setTimeout(() => {
        navigate("/");
      }, 2000);
      
    } catch (error) {
      console.error("Error:", error.response ? error.response.data : error.message);
      setErrors({ general: error.response?.data?.error || "An unexpected error occurred" });
    } finally {
      setSubmitting(false);
    }
  };

  // Color palette
  const colors = {
    navy: "#1A2A56",
    navyLight: "#2A3A66",
    pink: "#FF5D8F",
    pinkLight: "#FF7EA5",
    white: "#FFFFFF",
    lightGray: "#F5F7FA",
    gray: "#E2E8F0",
    darkGray: "#718096",
    errorRed: "#FF4D6A",
    successGreen: "#2DD4BF",
  };

  // Styles
  const pageContainerStyle = {
    display: "flex",
    flexDirection: "column",
    minHeight: "100vh",
    width: "100%",
    backgroundColor: colors.lightGray,
    background: "linear-gradient(135deg, #f5f7fa 0%, #e2e8f0 100%)",
    position: "relative",
    overflow: "hidden",
  };

  const containerStyle = {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    flex: 1,
    padding: "2rem",
    position: "relative",
  };

  const cardStyle = {
    width: "100%",
    maxWidth: "800px", // Wider form
    backgroundColor: colors.white,
    borderRadius: "20px",
    boxShadow: "0 20px 60px rgba(26, 42, 86, 0.15), 0 10px 20px rgba(26, 42, 86, 0.12)",
    overflow: "hidden",
    position: "relative",
    transform: "translateY(0)",
    transition: "transform 0.3s ease, box-shadow 0.3s ease",
    animation: "float 6s ease-in-out infinite", // Floating animation
  };

  // Floating animation keyframes
  const floatingAnimationStyle = {
    "@keyframes float": {
      "0%": {
        transform: "translateY(0px)",
        boxShadow: "0 20px 60px rgba(26, 42, 86, 0.15), 0 10px 20px rgba(26, 42, 86, 0.12)",
      },
      "50%": {
        transform: "translateY(-10px)",
        boxShadow: "0 30px 70px rgba(26, 42, 86, 0.2), 0 15px 30px rgba(26, 42, 86, 0.15)",
      },
      "100%": {
        transform: "translateY(0px)",
        boxShadow: "0 20px 60px rgba(26, 42, 86, 0.15), 0 10px 20px rgba(26, 42, 86, 0.12)",
      },
    },
  };

  // Adding animation using the style tag
  useEffect(() => {
    const styleElement = document.createElement('style');
    styleElement.textContent = `
      @keyframes float {
        0% {
          transform: translateY(0px);
          box-shadow: 0 20px 60px rgba(26, 42, 86, 0.15), 0 10px 20px rgba(26, 42, 86, 0.12);
        }
        50% {
          transform: translateY(-10px);
          box-shadow: 0 30px 70px rgba(26, 42, 86, 0.2), 0 15px 30px rgba(26, 42, 86, 0.15);
        }
        100% {
          transform: translateY(0px);
          box-shadow: 0 20px 60px rgba(26, 42, 86, 0.15), 0 10px 20px rgba(26, 42, 86, 0.12);
        }
      }
      .floating-card {
        animation: float 6s ease-in-out infinite;
      }
    `;
    document.head.appendChild(styleElement);
    
    return () => {
      document.head.removeChild(styleElement);
    };
  }, []);

  const cardHeaderStyle = {
    backgroundColor: colors.navy,
    padding: "2.5rem",
    position: "relative",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
  };

  const cardHeaderAfterStyle = {
    content: '""',
    position: "absolute",
    bottom: "0",
    left: "0",
    right: "0",
    height: "30px",
    borderRadius: "50% 50% 0 0 / 100% 100% 0 0",
    transform: "translateY(50%)",
    backgroundColor: colors.white,
  };

  const headingStyle = {
    color: colors.white,
    fontSize: "2.25rem",
    fontWeight: "600",
    marginBottom: "1rem",
    textAlign: "center",
    position: "relative",
    zIndex: 1,
  };

  const subtitleStyle = {
    color: colors.lightGray,
    fontSize: "1rem",
    textAlign: "center",
    marginBottom: "1.5rem",
    position: "relative",
    zIndex: 1,
  };

  const formContainerStyle = {
    padding: "2.5rem",
  };

  const formGroupStyle = {
    marginBottom: "1.75rem",
  };

  const inputLabelStyle = {
    fontSize: "0.9rem",
    fontWeight: "600",
    color: colors.navy,
    marginBottom: "0.5rem",
    display: "block",
  };

  const inputGroupStyle = {
    position: "relative",
    transition: "all 0.3s ease",
  };

  const inputIconStyle = {
    position: "absolute",
    left: "1rem",
    top: "50%",
    transform: "translateY(-50%)",
    color: colors.darkGray,
    zIndex: 1,
  };

  const inputBaseStyle = {
    width: "100%",
    padding: "0.75rem 1rem 0.75rem 2.75rem", // Extra left padding for icon
    fontSize: "1rem",
    color: colors.navy,
    backgroundColor: colors.lightGray,
    border: "2px solid transparent",
    borderRadius: "12px",
    transition: "all 0.3s ease",
    outline: "none",
    boxSizing: "border-box",
  };

  const inputFocusStyle = {
    ...inputBaseStyle,
    border: `2px solid ${colors.pinkLight}`,
    boxShadow: `0 0 0 3px rgba(255, 93, 143, 0.15)`,
  };

  const textareaStyle = {
    ...inputBaseStyle,
    minHeight: "120px",
    resize: "vertical",
    paddingTop: "2.5rem",
  };

  const errorStyle = {
    color: colors.errorRed,
    fontSize: "0.85rem",
    marginTop: "0.5rem",
    fontWeight: "500",
  };

  const buttonStyle = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "0.5rem",
    width: "100%",
    padding: "1rem",
    fontSize: "1.1rem",
    fontWeight: "600",
    color: colors.white,
    backgroundColor: colors.pink,
    border: "none",
    borderRadius: "12px",
    cursor: "pointer",
    transition: "all 0.3s ease",
    boxShadow: `0 4px 12px rgba(255, 93, 143, 0.3)`,
  };

  const buttonHoverStyle = {
    ...buttonStyle,
    backgroundColor: colors.pinkLight,
    transform: "translateY(-2px)",
    boxShadow: `0 6px 16px rgba(255, 93, 143, 0.4)`,
  };

  const disabledButtonStyle = {
    ...buttonStyle,
    opacity: "0.7",
    cursor: "not-allowed",
    boxShadow: "none",
    transform: "none",
  };

  const alertSuccessStyle = {
    padding: "1rem",
    marginBottom: "1.5rem",
    borderRadius: "12px",
    color: colors.navy,
    backgroundColor: "rgba(45, 212, 191, 0.15)",
    border: `1px solid ${colors.successGreen}`,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
  };

  const alertDangerStyle = {
    padding: "1rem",
    marginBottom: "1.5rem",
    borderRadius: "12px",
    color: colors.navy,
    backgroundColor: "rgba(255, 77, 106, 0.15)",
    border: `1px solid ${colors.errorRed}`,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
  };

  const footerStyle = {
    backgroundColor: colors.navy,
    color: colors.white,
    padding: "1.5rem",
    textAlign: "center",
    width: "100%",
    boxShadow: "0 -5px 10px rgba(0,0,0,0.05)",
  };

  const footerContentStyle = {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    maxWidth: "800px",
    margin: "0 auto",
  };

  const footerTextStyle = {
    margin: "0.5rem 0",
    fontSize: "0.9rem",
    color: colors.lightGray,
  };

  const footerLinkStyle = {
    color: colors.pinkLight,
    textDecoration: "none",
    fontWeight: "500",
    transition: "color 0.3s ease",
  };

  const footerIconStyle = {
    color: colors.pink,
    marginRight: "0.5rem",
    verticalAlign: "middle",
  };

  const [isHovered, setIsHovered] = useState(false);

  // Function to handle hover state for the button
  const handleMouseEnter = () => setIsHovered(true);
  const handleMouseLeave = () => setIsHovered(false);

  return (
    <div style={pageContainerStyle}>
      <div style={containerStyle}>
        <div style={cardStyle} className="floating-card">
          <div style={cardHeaderStyle}>
            <h2 style={headingStyle}>Create Event</h2>
            <p style={subtitleStyle}>Share your exciting event with the community</p>
            <div style={cardHeaderAfterStyle}></div>
          </div>

          <div style={formContainerStyle}>
            <Formik initialValues={initialValues} onSubmit={onSubmit} validationSchema={validationSchema}>
              {({ isSubmitting, errors, touched, setFieldTouched }) => (
                <Form>
                  {/* Success Message */}
                  {successMessage && <div style={alertSuccessStyle}>{successMessage}</div>}

                  {/* Error Message */}
                  {errors.general && <div style={alertDangerStyle}>{errors.general}</div>}

                  {/* Title */}
                  <div style={formGroupStyle}>
                    <label htmlFor="title" style={inputLabelStyle}>Event Title</label>
                    <div style={inputGroupStyle}>
                      <div style={inputIconStyle}>
                        <FaFileAlt size={16} color={colors.darkGray} />
                      </div>
                      <Field 
                        type="text" 
                        id="title"
                        name="title" 
                        placeholder="Enter a catchy title for your event" 
                        style={touched.title ? inputFocusStyle : inputBaseStyle} 
                        onFocus={() => setFieldTouched('title', true)}
                      />
                    </div>
                    <ErrorMessage name="title" component="div" style={errorStyle} />
                  </div>

                  {/* Two column layout for location and date */}
                  <div style={{ display: "flex", gap: "1.5rem" }}>
                    {/* Location - Left column */}
                    <div style={{ ...formGroupStyle, flex: 1 }}>
                      <label htmlFor="location" style={inputLabelStyle}>Event Location</label>
                      <div style={inputGroupStyle}>
                        <div style={inputIconStyle}>
                          <FaMapMarkerAlt size={16} color={colors.darkGray} />
                        </div>
                        <Field 
                          type="text" 
                          id="location"
                          name="location" 
                          placeholder="Where will your event take place?" 
                          style={touched.location ? inputFocusStyle : inputBaseStyle} 
                          onFocus={() => setFieldTouched('location', true)}
                        />
                      </div>
                      <ErrorMessage name="location" component="div" style={errorStyle} />
                    </div>

                    {/* Date - Right column */}
                    <div style={{ ...formGroupStyle, flex: 1 }}>
                      <label htmlFor="date" style={inputLabelStyle}>Event Date</label>
                      <div style={inputGroupStyle}>
                        <div style={inputIconStyle}>
                          <FaCalendarAlt size={16} color={colors.darkGray} />
                        </div>
                        <Field 
                          type="date" 
                          id="date"
                          name="date" 
                          style={touched.date ? inputFocusStyle : inputBaseStyle} 
                          onFocus={() => setFieldTouched('date', true)}
                        />
                      </div>
                      <ErrorMessage name="date" component="div" style={errorStyle} />
                    </div>
                  </div>

                  {/* Description */}
                  <div style={formGroupStyle}>
                    <label htmlFor="description" style={inputLabelStyle}>Event Description</label>
                    <div style={inputGroupStyle}>
                      <Field 
                        as="textarea" 
                        id="description"
                        name="description" 
                        placeholder="Share all exciting details about your event" 
                        style={textareaStyle} 
                        onFocus={() => setFieldTouched('description', true)}
                      />
                    </div>
                    <ErrorMessage name="description" component="div" style={errorStyle} />
                  </div>

                  {/* Submit */}
                  <button 
                    type="submit" 
                    style={isSubmitting ? disabledButtonStyle : (isHovered ? buttonHoverStyle : buttonStyle)} 
                    disabled={isSubmitting}
                    onMouseEnter={handleMouseEnter}
                    onMouseLeave={handleMouseLeave}
                  >
                    <FaPlus size={16} />
                    {isSubmitting ? "Creating..." : "Create Event"}
                  </button>
                </Form>
              )}
            </Formik>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer style={footerStyle}>
        <div style={footerContentStyle}>
          <p style={{ ...footerTextStyle, fontWeight: "600", fontSize: "1rem" }}>
            <FaHeart style={footerIconStyle} /> EventHub Community
          </p>
          <p style={footerTextStyle}>
            Connect with event organizers and attendees from around the world
          </p>
          <p style={footerTextStyle}>
            <a href="#" style={footerLinkStyle}>Terms</a> • 
            <a href="#" style={{ ...footerLinkStyle, margin: "0 0.5rem" }}>Privacy</a> • 
            <a href="#" style={footerLinkStyle}>Support</a>
          </p>
          <p style={{ ...footerTextStyle, marginTop: "0.5rem", fontSize: "0.8rem" }}>
            © {new Date().getFullYear()} EventHub. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}

export default CreateEvent;