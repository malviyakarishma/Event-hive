import React, { useContext, useEffect, useState } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import { FaCalendarAlt, FaMapMarkerAlt, FaFileAlt } from "react-icons/fa";
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
            const response = await axios.post("http://localhost:3001/events", data, {
                headers: { Authorization: `Bearer ${accessToken}` },
            });

            const eventId = response.data.id; // Get event ID from response

            await axios.post("http://localhost:3001/notifications/allusers", { //use allusers endpoint.
                message: `New event created: ${data.title}`,
                type: "event",
                relatedId: eventId,
            }, {
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

  return (
    <div
      className="d-flex justify-content-center align-items-center vh-100"
      style={{
        backgroundSize: "cover",
        paddingTop: "70px",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        minHeight: "100vh",
        width: "100%",
      }}
    >
      <div 
        className="card shadow-lg p-5"
        style={{
          width: "100%",
          maxWidth: "600px", 
          borderRadius: "15px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          minHeight: "80vh",
        }}
      >
        {/* Event Image */}
        <div className="text-center mb-4">
          <img 
            src={eventImage} 
            alt="Event Banner" 
            className="img-fluid rounded" 
            style={{ maxHeight: "200px", width: "100%", objectFit: "cover" }} 
          />
        </div>

        <h2 className="text-center glitch-text">Create Event</h2>

        <Formik initialValues={initialValues} onSubmit={onSubmit} validationSchema={validationSchema}>
          {({ isSubmitting, errors }) => (
            <Form>
              {/* ✅ Success Message */}
              {successMessage && <div className="alert alert-success">{successMessage}</div>}

              {/* Error Message */}
              {errors.general && <div className="alert alert-danger">{errors.general}</div>}

              {/* Title */}
              <div className="mb-4">
                <div className="input-group">
                  <span className="input-group-text" style={{ color: "blue" }}><FaFileAlt /></span>
                  <Field type="text" className="form-control form-control-lg" name="title" placeholder="Enter event title" />
                </div>
                <ErrorMessage name="title" component="div" className="text-danger small" />
              </div>

              {/* Location */}
              <div className="mb-4">
                <div className="input-group">
                  <span className="input-group-text" style={{ color: "blue" }}><FaMapMarkerAlt /></span>
                  <Field type="text" className="form-control form-control-lg" name="location" placeholder="Enter event location" />
                </div>
                <ErrorMessage name="location" component="div" className="text-danger small" />
              </div>

              {/* Description */}
              <div className="mb-4">
                <div className="input-group">
                  <span className="input-group-text" style={{ color: "blue" }}><FaFileAlt /></span>
                  <Field as="textarea" className="form-control form-control-lg" name="description" placeholder="Enter event description" rows="3" />
                </div>
                <ErrorMessage name="description" component="div" className="text-danger small" />
              </div>

              {/* Date */}
              <div className="mb-4">
                <div className="input-group">
                  <span className="input-group-text " style={{ color: "blue" }}><FaCalendarAlt bg-primary /></span>
                  <Field type="date" className="form-control form-control-lg" name="date" />
                </div>
                <ErrorMessage name="date" component="div" className="text-danger small" />
              </div>

              {/* Submit */}
              <button type="submit" className="btn btn-primary w-100 btn-lg" disabled={isSubmitting}>
                {isSubmitting ? "Creating..." : "Create Event"}
              </button>
            </Form>
          )}
        </Formik>
      </div>
    </div>
  );
}

export default CreateEvent;
