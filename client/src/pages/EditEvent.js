import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../helpers/AuthContext';
import { FaCalendarAlt, FaImage, FaMapMarkerAlt, FaArrowLeft, 
         FaSave, FaTimes, FaInfoCircle, FaCheck,
         FaHeart, FaClock, FaTags, FaEdit } from 'react-icons/fa';

function EditEvent() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { authState } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Form state
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [category, setCategory] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [currentImage, setCurrentImage] = useState('');

  // Options for category dropdown
  const categoryOptions = [
    'Conference', 'Workshop', 'Seminar', 'Networking', 
    'Social Gathering', 'Corporate Event', 'Trade Show', 
    'Charity', 'Festival', 'Concert', 'Sports', 'Other'
  ];

  // Custom color constants
  const colors = {
    navy: "#001F3F",
    coral: "#FF6B6B",
    white: "#FFFFFF",
    lightGray: "#F5F7FA",
    gray: "#E2E8F0",
    darkGray: "#718096",
    errorRed: "#FF4D6A",
    successGreen: "#2DD4BF"
  };

  useEffect(() => {
    // Check authentication
    if (!authState.status || !authState.isAdmin) {
      navigate("/login");
      return;
    }

    const fetchEventData = async () => {
      setLoading(true);
      try {
        const response = await axios.get(`http://localhost:3001/events/${id}`);
        const eventData = response.data.event;
        
        if (!eventData) {
          setError('Event not found');
          return;
        }

        // Set form fields with existing data
        setTitle(eventData.title);
        setLocation(eventData.location);
        setDescription(eventData.description);
        setDate(formatDateForInput(eventData.date));
        setTime(eventData.time);
        setCategory(eventData.category);
        
        if (eventData.image) {
          setCurrentImage(getImageUrl(eventData.image));
        }
        
      } catch (err) {
        console.error('Error fetching event:', err);
        setError('Failed to load event data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchEventData();
  }, [id, authState, navigate]);

  // Format date for input field (YYYY-MM-DD)
  const formatDateForInput = (dateString) => {
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
  };

  // Function to correct the image path
  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;
    
    if (imagePath.startsWith('http')) return imagePath;
    
    if (imagePath.startsWith('/uploads/events/')) {
      return `http://localhost:3001${imagePath}`;
    }
    
    return `http://localhost:3001/${imagePath}`;
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const validateForm = () => {
    if (!title.trim()) return 'Title is required';
    if (!location.trim()) return 'Location is required';
    if (!description.trim()) return 'Description is required';
    if (!date) return 'Date is required';
    if (!time) return 'Time is required';
    if (!category) return 'Category is required';
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      const accessToken = localStorage.getItem('accessToken');
      
      if (!accessToken) {
        setError('Authorization required. Please log in again.');
        setLoading(false);
        return;
      }

      // Create form data for file upload
      const formData = new FormData();
      formData.append('title', title);
      formData.append('location', location);
      formData.append('description', description);
      formData.append('date', date);
      formData.append('time', time);
      formData.append('category', category);
      
      if (imageFile) {
        formData.append('image', imageFile);
      }

      // Update event with form data
      await axios.put(`http://localhost:3001/events/${id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${accessToken}`
        }
      });

      setSuccessMsg('Event updated successfully!');
      
      // Scroll to top to show success message
      window.scrollTo(0, 0);
      
      // Navigate back to admin page after a short delay
      setTimeout(() => {
        navigate(`/admin/response/${id}`);
      }, 2000);
      
    } catch (err) {
      console.error('Error updating event:', err);
      const errorMessage = err.response?.data?.error || 'Failed to update event. Please try again.';
      setError(errorMessage);
      window.scrollTo(0, 0);
    } finally {
      setLoading(false);
    }
  };

  const cancelEdit = () => {
    navigate(`/admin/response/${id}`);
  };
  // Footer component
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
            <FaHeart style={{ color: colors.coral, marginRight: "0.5rem" }} /> EventHub Community
          </p>
          <p style={{ margin: "0.5rem 0", fontSize: "0.9rem", color: colors.lightGray }}>
            Connect with event organizers and attendees from around the world
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
            © {currentYear} EventHub. All rights reserved.
          </p>
        </div>
      </footer>
    );
  };

  if (loading && !title) {
    return (
      <div className="container d-flex justify-content-center align-items-center" style={{ minHeight: "60vh", paddingTop: "70px" }}>
        <div className="spinner-border" role="status" style={{ color: colors.coral }}>
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <div className="container my-5" style={{ paddingTop: "70px", flex: 1 }}>
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2 style={{ color: colors.navy }}>
            <FaEdit className="me-2" style={{ color: colors.coral }} />
            Edit Event
          </h2>
          <button 
            className="btn"
            onClick={cancelEdit}
            style={{ 
              backgroundColor: "transparent", 
              borderColor: colors.navy,
              color: colors.navy
            }}
          >
            <FaArrowLeft className="me-2" />
            Back to Event
          </button>
        </div>

        {error && (
          <div className="alert alert-danger d-flex align-items-center" role="alert">
            <FaInfoCircle className="me-2" />
            {error}
          </div>
        )}

        {successMsg && (
          <div className="alert alert-success d-flex align-items-center" role="alert">
            <FaCheck className="me-2" />
            {successMsg}
          </div>
        )}
        
        <div className="card shadow-sm mb-4">
          <div className="card-header" style={{ backgroundColor: colors.navy, color: "white" }}>
            <div className="d-flex align-items-center">
              <FaCalendarAlt className="me-2" style={{ color: colors.coral }} />
              <span>Event Information</span>
            </div>
          </div>
          <div className="card-body">
            <form onSubmit={handleSubmit}>
              {/* Title */}
              <div className="mb-3">
                <label htmlFor="title" className="form-label" style={{ color: colors.navy, fontWeight: "500" }}>
                  Event Title*
                </label>
                <input
                  type="text"
                  className="form-control"
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  style={{ borderColor: colors.gray }}
                />
              </div>
              
              {/* Location */}
              <div className="mb-3">
                <label htmlFor="location" className="form-label" style={{ color: colors.navy, fontWeight: "500" }}>
                  <FaMapMarkerAlt className="me-2" style={{ color: colors.coral }} />
                  Location*
                </label>
                <input
                  type="text"
                  className="form-control"
                  id="location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  required
                  style={{ borderColor: colors.gray }}
                />
              </div>
              
              {/* Date and Time */}
              <div className="row mb-3">
                <div className="col-md-6 mb-3 mb-md-0">
                  <label htmlFor="date" className="form-label" style={{ color: colors.navy, fontWeight: "500" }}>
                    <FaCalendarAlt className="me-2" style={{ color: colors.coral }} />
                    Date*
                  </label>
                  <input
                    type="date"
                    className="form-control"
                    id="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                    style={{ borderColor: colors.gray }}
                  />
                </div>
                <div className="col-md-6">
                  <label htmlFor="time" className="form-label" style={{ color: colors.navy, fontWeight: "500" }}>
                    <FaClock className="me-2" style={{ color: colors.coral }} />
                    Time*
                  </label>
                  <input
                    type="time"
                    className="form-control"
                    id="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    required
                    style={{ borderColor: colors.gray }}
                  />
                </div>
              </div>
              
              {/* Category */}
              <div className="mb-3">
                <label htmlFor="category" className="form-label" style={{ color: colors.navy, fontWeight: "500" }}>
                  <FaTags className="me-2" style={{ color: colors.coral }} />
                  Category*
                </label>
                <select
                  className="form-select"
                  id="category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  required
                  style={{ borderColor: colors.gray }}
                >
                  <option value="">Select a category</option>
                  {categoryOptions.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
              
              {/* Description */}
              <div className="mb-3">
                <label htmlFor="description" className="form-label" style={{ color: colors.navy, fontWeight: "500" }}>
                  Description*
                </label>
                <textarea
                  className="form-control"
                  id="description"
                  rows="4"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                  style={{ borderColor: colors.gray }}
                />
              </div>
              
              {/* Image Upload */}
              <div className="mb-4">
                <label htmlFor="image" className="form-label" style={{ color: colors.navy, fontWeight: "500" }}>
                  <FaImage className="me-2" style={{ color: colors.coral }} />
                  Event Image
                </label>
                <input
                  type="file"
                  className="form-control"
                  id="image"
                  accept="image/*"
                  onChange={handleImageChange}
                  style={{ borderColor: colors.gray }}
                />
                <div className="form-text" style={{ color: colors.darkGray }}>
                  Upload a new image to replace the current one, or leave empty to keep existing image.
                </div>
                
                {/* Image preview */}
                <div className="mt-3 d-flex gap-3 flex-wrap">
                  {currentImage && !imagePreview && (
                    <div>
                      <p className="mb-2" style={{ color: colors.navy }}>Current Image:</p>
                      <img 
                        src={currentImage} 
                        alt="Current event" 
                        className="img-thumbnail" 
                        style={{ maxHeight: "150px" }} 
                      />
                    </div>
                  )}
                  
                  {imagePreview && (
                    <div>
                      <p className="mb-2" style={{ color: colors.navy }}>New Image:</p>
                      <img 
                        src={imagePreview} 
                        alt="Preview" 
                        className="img-thumbnail" 
                        style={{ maxHeight: "150px" }} 
                      />
                    </div>
                  )}
                </div>
              </div>
              
              {/* Submit and Cancel buttons */}
              <div className="d-flex justify-content-end gap-3 mt-4">
                <button
                  type="button"
                  className="btn"
                  onClick={cancelEdit}
                  style={{ 
                    backgroundColor: colors.lightGray,
                    color: colors.navy
                  }}
                >
                  <FaTimes className="me-2" /> Cancel
                </button>
                <button
                  type="submit"
                  className="btn"
                  disabled={loading}
                  style={{ 
                    backgroundColor: colors.navy,
                    color: colors.white
                  }}
                >
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Saving...
                    </>
                  ) : (
                    <>
                      <FaSave className="me-2" /> Save Changes
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <Footer />
    </div>
  );
}

export default EditEvent;