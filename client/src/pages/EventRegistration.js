import React, { useState, useEffect, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { AuthContext } from "../helpers/AuthContext";
import { format } from "date-fns";
import "bootstrap/dist/css/bootstrap.min.css";
import "@fortawesome/fontawesome-free/css/all.min.css";

export default function EventRegistration() {
  // Custom colors (matching Event.js)
  const colors = {
    navy: "#1A2A56",
    navyLight: "#2A3A66",
    pink: "#FF6B6B",
    pinkLight: "#FF6B6B",
    white: "#FFFFFF",
    lightGray: "#F5F7FA",
    gray: "#E2E8F0",
    darkGray: "#718096",
    errorRed: "#FF4D6A",
    successGreen: "#2DD4BF",
  };

  // Footer styles
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

  const { id } = useParams();
  const navigate = useNavigate();
  const { authState } = useContext(AuthContext);
  
  // Event data and loading states
  const [eventData, setEventData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Registration form data
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    specialRequirements: "",
    ticketQuantity: 1,
    agreeToTerms: false
  });
  
  // Payment state (for paid events)
  const [isPaidEvent, setIsPaidEvent] = useState(false);
  const [eventPrice, setEventPrice] = useState(0);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("creditCard");
  
  // Payment form data
  const [paymentFormData, setPaymentFormData] = useState({
    cardNumber: "",
    cardHolder: "",
    expiryDate: "",
    cvv: ""
  });
  
  // Form submission state
  const [submitting, setSubmitting] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [paymentProcessed, setPaymentProcessed] = useState(false);
  const [registrationId, setRegistrationId] = useState(null);

  // Load event data
  useEffect(() => {
    const fetchEventDetails = async () => {
      try {
        const response = await axios.get(`http://localhost:3001/events/${id}`);
        if (response.data.event) {
          setEventData(response.data.event);
          
          // Check if this is a paid event (you'll need to add a 'price' field to your Events model)
          if (response.data.event.price && response.data.event.price > 0) {
            setIsPaidEvent(true);
            setEventPrice(response.data.event.price);
          }
        } else {
          setEventData(null);
          setError("Event not found.");
        }
        setLoading(false);
      } catch (err) {
        setError("Failed to load event details.");
        setLoading(false);
        console.error("Error fetching event details:", err);
      }
    };
    fetchEventDetails();
  }, [id]);
  
  // Pre-fill form with user data if logged in
  useEffect(() => {
    if (authState.username) {
      // If you have more user profile data available, you can pre-fill more fields
      setFormData(prevData => ({
        ...prevData,
        email: authState.email || "",
        fullName: authState.fullName || ""
      }));
    }
  }, [authState]);

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prevData => ({
      ...prevData,
      [name]: type === "checkbox" ? checked : value
    }));
  };
  
  // Handle payment form input changes
  const handlePaymentInputChange = (e) => {
    const { name, value } = e.target;
    setPaymentFormData(prevData => ({
      ...prevData,
      [name]: value
    }));
  };
  
  // Handle ticket quantity changes
  const handleQuantityChange = (change) => {
    setFormData(prevData => ({
      ...prevData,
      ticketQuantity: Math.max(1, prevData.ticketQuantity + change)
    }));
  };
  
  // Validate the registration form
  const validateForm = () => {
    const { fullName, email, phone, agreeToTerms } = formData;
    
    if (!fullName.trim()) return "Full name is required";
    if (!email.trim()) return "Email is required";
    if (!email.includes('@')) return "Invalid email format";
    if (!phone.trim()) return "Phone number is required";
    if (!agreeToTerms) return "You must agree to the terms and conditions";
    
    return null;
  };
  
  // Validate the payment form
  const validatePaymentForm = () => {
    const { cardNumber, cardHolder, expiryDate, cvv } = paymentFormData;
    
    if (!cardNumber.trim()) return "Card number is required";
    if (cardNumber.replace(/\s/g, '').length !== 16) return "Card number must be 16 digits";
    if (!cardHolder.trim()) return "Cardholder name is required";
    if (!expiryDate.trim()) return "Expiry date is required";
    if (!expiryDate.includes('/')) return "Expiry date should be in MM/YY format";
    if (!cvv.trim()) return "CVV is required";
    if (cvv.length < 3) return "CVV should be at least 3 digits";
    
    return null;
  };

  // Handle form submission for registration
  const handleRegistrationSubmit = async (e) => {
    e.preventDefault();
    
    // Form validation
    const formError = validateForm();
    if (formError) {
      setError(formError);
      return;
    }
    
    try {
      setSubmitting(true);
      
      // If user is logged in, get their token
      const accessToken = localStorage.getItem("accessToken");
      
      // Create registration data
      const registrationData = {
        eventId: id,
        ...formData,
        userId: authState.id || null,
        registrationDate: new Date().toISOString(),
        paymentStatus: isPaidEvent ? "pending" : "free",
        totalAmount: isPaidEvent ? (eventPrice * formData.ticketQuantity) : 0
      };
      
      // Make API call to register
      const response = await axios.post(
        "http://localhost:3001/registrations",
        registrationData,
        accessToken ? { headers: { Authorization: `Bearer ${accessToken}` } } : {}
      );
      
      setRegistrationId(response.data.id);
      
      // If it's a free event, we're done
      if (!isPaidEvent) {
        setRegistrationSuccess(true);
        // Create notification for event organizer
        if (accessToken) {
          try {
            await axios.post(
              "http://localhost:3001/notifications",
              {
                message: `New registration for your event "${eventData?.title}"`,
                type: "registration",
                relatedId: id,
                userId: eventData?.userId, // Send to event creator
              },
              { headers: { Authorization: `Bearer ${accessToken}` } }
            );
          } catch (notifError) {
            console.error("Error creating notification:", notifError);
          }
        }
      } else {
        // If it's a paid event, show payment form
        setShowPaymentForm(true);
      }
      
    } catch (error) {
      console.error("Registration error:", error);
      setError("Failed to register. Please try again later.");
    } finally {
      setSubmitting(false);
    }
  };
  
  // Handle payment submission
  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    
    // Payment form validation
    const paymentError = validatePaymentForm();
    if (paymentError) {
      setError(paymentError);
      return;
    }
    
    try {
      setSubmitting(true);
      
      // In a real app, you would integrate with a payment gateway here
      // For now, we'll simulate a successful payment
      
      // Process payment data
      const paymentData = {
        registrationId: registrationId,
        paymentMethod: paymentMethod,
        amount: eventPrice * formData.ticketQuantity,
        // Don't include sensitive card data in the actual API request in production
        // Instead, use a token from your payment processor
        // cardToken: "token_from_payment_processor"
      };
      
      // Simulate API call for payment processing
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Update registration payment status
      await axios.put(
        `http://localhost:3001/registrations/${registrationId}/payment`,
        { paymentStatus: "completed" }
      );
      
      setPaymentProcessed(true);
      setRegistrationSuccess(true);
      
      // Create notification for event organizer about the payment
      const accessToken = localStorage.getItem("accessToken");
      if (accessToken) {
        try {
          await axios.post(
            "http://localhost:3001/notifications",
            {
              message: `Payment received for registration to "${eventData?.title}"`,
              type: "payment",
              relatedId: id,
              userId: eventData?.userId, // Send to event creator
            },
            { headers: { Authorization: `Bearer ${accessToken}` } }
          );
        } catch (notifError) {
          console.error("Error creating notification:", notifError);
        }
      }
      
    } catch (error) {
      console.error("Payment error:", error);
      setError("Payment processing failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // Render loading state
  if (loading) return (
    <>
      <div className="container d-flex justify-content-center align-items-center" style={{ minHeight: "60vh", paddingTop: "70px", paddingBottom: "200px" }}>
        <div className="spinner-border" role="status" style={{ color: colors.pink }}>
          <span className="visually-hidden">Loading event details...</span>
        </div>
      </div>
      
      <footer style={footerStyle}>
        <div style={footerContentStyle}>
          <p style={{ ...footerTextStyle, fontWeight: "600", fontSize: "1rem" }}>
            <i className="fas fa-heart" style={footerIconStyle}></i> EventHub Community
          </p>
          <p style={footerTextStyle}>
            Connect with event organizers and attendees from around the world
          </p>
          <p style={footerTextStyle}>
            <button 
              onClick={() => navigate("/terms")} 
              style={{...footerLinkStyle, background: "none", border: "none", cursor: "pointer", padding: 0}}
            >
              Terms
            </button> •
            <button 
              onClick={() => navigate("/privacy")} 
              style={{...footerLinkStyle, background: "none", border: "none", cursor: "pointer", margin: "0 0.5rem", padding: 0}}
            >
              Privacy
            </button> •
            <button 
              onClick={() => navigate("/support")} 
              style={{...footerLinkStyle, background: "none", border: "none", cursor: "pointer", padding: 0}}
            >
              Support
            </button>
          </p>
          <p style={{ ...footerTextStyle, marginTop: "0.5rem", fontSize: "0.8rem" }}>
            © {new Date().getFullYear()} EventHub. All rights reserved.
          </p>
        </div>
      </footer>
    </>
  );

  // Render error state
  if (error && !submitting && !registrationSuccess) return (
    <>
      <div className="container text-center mt-5" style={{ paddingTop: "70px", paddingBottom: "200px" }}>
        <div className="alert" style={{ backgroundColor: colors.errorRed, color: "white" }}>
          <i className="fas fa-exclamation-circle me-2"></i>{error}
        </div>
        <button 
          className="btn mt-3" 
          onClick={() => navigate(`/event/${id}`)}
          style={{ backgroundColor: colors.navy, color: "white" }}
        >
          <i className="fas fa-arrow-left me-2"></i>Back to Event
        </button>
      </div>
      
      <footer style={footerStyle}>
        <div style={footerContentStyle}>
          <p style={{ ...footerTextStyle, fontWeight: "600", fontSize: "1rem" }}>
            <i className="fas fa-heart" style={footerIconStyle}></i> EventHub Community
          </p>
          <p style={footerTextStyle}>
            Connect with event organizers and attendees from around the world
          </p>
          <p style={footerTextStyle}>
            <button 
              onClick={() => navigate("/terms")} 
              style={{...footerLinkStyle, background: "none", border: "none", cursor: "pointer", padding: 0}}
            >
              Terms
            </button> •
            <button 
              onClick={() => navigate("/privacy")} 
              style={{...footerLinkStyle, background: "none", border: "none", cursor: "pointer", margin: "0 0.5rem", padding: 0}}
            >
              Privacy
            </button> •
            <button 
              onClick={() => navigate("/support")} 
              style={{...footerLinkStyle, background: "none", border: "none", cursor: "pointer", padding: 0}}
            >
              Support
            </button>
          </p>
          <p style={{ ...footerTextStyle, marginTop: "0.5rem", fontSize: "0.8rem" }}>
            © {new Date().getFullYear()} EventHub. All rights reserved.
          </p>
        </div>
      </footer>
    </>
  );

  return (
    <>
      <div className="container mt-5" style={{ paddingBottom: "100px" }}>
        {/* Registration Success Message */}
        {registrationSuccess ? (
          <div className="card shadow-sm mb-4">
            <div className="card-header" style={{ backgroundColor: colors.successGreen, color: colors.white }}>
              <h3 className="mb-0 fs-4">
                <i className="fas fa-check-circle me-2"></i>
                Registration Successful!
              </h3>
            </div>
            <div className="card-body text-center py-5">
              <i className="fas fa-ticket-alt fa-3x mb-4" style={{ color: colors.pink }}></i>
              <h4 className="mb-3">Thank you for registering for {eventData?.title}!</h4>
              <p className="mb-4">
                {isPaidEvent ? 
                  "Your payment has been processed successfully and " :
                  "Your registration is confirmed and "
                }
                a confirmation email has been sent to {formData.email}.
              </p>
              <p className="mb-4">
                <strong>Registration ID:</strong> #{registrationId}
              </p>
              <p className="mb-4">
                Please save this confirmation for your records. We look forward to seeing you at the event!
              </p>
              <div className="d-flex justify-content-center gap-3 mt-4">
                <button 
                  className="btn" 
                  onClick={() => navigate("/")}
                  style={{ backgroundColor: colors.navy, color: colors.white }}
                >
                  <i className="fas fa-home me-2"></i>
                  Return to Homepage
                </button>
                <button 
                  className="btn" 
                  onClick={() => navigate(`/event/${id}`)}
                  style={{ backgroundColor: colors.navy, color: colors.white }}
                >
                  <i className="fas fa-eye me-2"></i>
                  View Event
                </button>
              </div>
            </div>
          </div>
        ) : showPaymentForm ? (
          /* Payment Form */
          <div className="row">
            <div className="col-lg-8 mx-auto">
              <div className="card shadow-sm mb-4">
                <div className="card-header" style={{ backgroundColor: colors.navy, color: colors.white }}>
                  <h3 className="mb-0 fs-4">
                    <i className="fas fa-credit-card me-2"></i>
                    Payment Information
                  </h3>
                </div>
                <div className="card-body">
                  {error && (
                    <div className="alert alert-danger mb-4">
                      <i className="fas fa-exclamation-circle me-2"></i>
                      {error}
                    </div>
                  )}
                  
                  <div className="mb-4 p-3" style={{ backgroundColor: colors.lightGray, borderRadius: "8px" }}>
                    <div className="d-flex justify-content-between">
                      <span><strong>Event:</strong> {eventData?.title}</span>
                      <span><strong>Date:</strong> {eventData?.date ? format(new Date(eventData.date), "MMM dd, yyyy") : "N/A"}</span>
                    </div>
                    <div className="d-flex justify-content-between mt-2">
                      <span><strong>Tickets:</strong> {formData.ticketQuantity}</span>
                      <span><strong>Total:</strong> ${(eventPrice * formData.ticketQuantity).toFixed(2)}</span>
                    </div>
                  </div>
                  
                  <form onSubmit={handlePaymentSubmit}>
                    <div className="mb-4">
                      <label className="form-label">Payment Method</label>
                      <div className="d-flex gap-3">
                        <div className="form-check">
                          <input
                            type="radio"
                            className="form-check-input"
                            id="creditCard"
                            name="paymentMethod"
                            value="creditCard"
                            checked={paymentMethod === "creditCard"}
                            onChange={e => setPaymentMethod(e.target.value)}
                          />
                          <label className="form-check-label" htmlFor="creditCard">
                            <i className="fas fa-credit-card me-2"></i>Credit Card
                          </label>
                        </div>
                        <div className="form-check">
                          <input
                            type="radio"
                            className="form-check-input"
                            id="paypal"
                            name="paymentMethod"
                            value="paypal"
                            checked={paymentMethod === "paypal"}
                            onChange={e => setPaymentMethod(e.target.value)}
                          />
                          <label className="form-check-label" htmlFor="paypal">
                            <i className="fab fa-paypal me-2"></i>PayPal
                          </label>
                        </div>
                      </div>
                    </div>
                    
                    {paymentMethod === "creditCard" && (
                      <>
                        <div className="mb-3">
                          <label htmlFor="cardNumber" className="form-label">Card Number</label>
                          <input
                            type="text"
                            className="form-control"
                            id="cardNumber"
                            name="cardNumber"
                            placeholder="1234 5678 9012 3456"
                            value={paymentFormData.cardNumber}
                            onChange={handlePaymentInputChange}
                            maxLength="19"
                          />
                        </div>
                        
                        <div className="mb-3">
                          <label htmlFor="cardHolder" className="form-label">Cardholder Name</label>
                          <input
                            type="text"
                            className="form-control"
                            id="cardHolder"
                            name="cardHolder"
                            placeholder="John Doe"
                            value={paymentFormData.cardHolder}
                            onChange={handlePaymentInputChange}
                          />
                        </div>
                        
                        <div className="row mb-3">
                          <div className="col-md-6">
                            <label htmlFor="expiryDate" className="form-label">Expiry Date</label>
                            <input
                              type="text"
                              className="form-control"
                              id="expiryDate"
                              name="expiryDate"
                              placeholder="MM/YY"
                              value={paymentFormData.expiryDate}
                              onChange={handlePaymentInputChange}
                              maxLength="5"
                            />
                          </div>
                          <div className="col-md-6">
                            <label htmlFor="cvv" className="form-label">CVV</label>
                            <input
                              type="text"
                              className="form-control"
                              id="cvv"
                              name="cvv"
                              placeholder="123"
                              value={paymentFormData.cvv}
                              onChange={handlePaymentInputChange}
                              maxLength="4"
                            />
                          </div>
                        </div>
                      </>
                    )}
                    
                    {paymentMethod === "paypal" && (
                      <div className="alert alert-info">
                        <i className="fab fa-paypal me-2"></i>
                        You will be redirected to PayPal to complete your payment after clicking "Process Payment".
                      </div>
                    )}
                    
                    <div className="d-grid gap-2 d-md-flex justify-content-md-end mt-4">
                      <button
                        type="button"
                        className="btn btn-outline-secondary"
                        onClick={() => setShowPaymentForm(false)}
                        disabled={submitting}
                      >
                        <i className="fas fa-arrow-left me-2"></i>
                        Back
                      </button>
                      <button
                        type="submit"
                        className="btn"
                        disabled={submitting}
                        style={{ backgroundColor: colors.pink, color: colors.white }}
                      >
                        {submitting ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                            Processing...
                          </>
                        ) : (
                          <>
                            <i className="fas fa-lock me-2"></i>
                            Process Payment (${(eventPrice * formData.ticketQuantity).toFixed(2)})
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Registration Form */
          <div className="row">
            <div className="col-lg-4 mb-4">
              {/* Event Summary Card */}
              <div className="card shadow-sm h-100">
                <div className="card-header" style={{ backgroundColor: colors.navy, color: colors.white }}>
                  <h3 className="mb-0 fs-5">
                    <i className="fas fa-calendar-day me-2"></i>
                    Event Summary
                  </h3>
                </div>
                
                {eventData?.image && (
                  <img 
                    src={`http://localhost:3001${eventData.image}`} 
                    alt={eventData.title} 
                    className="card-img-top"
                    style={{ height: "180px", objectFit: "cover" }}
                  />
                )}
                
                <div className="card-body">
                  <h4 className="card-title">{eventData?.title}</h4>
                  <p className="card-text mb-1">
                    <i className="fas fa-map-marker-alt me-2" style={{ color: colors.pink }}></i>
                    {eventData?.location}
                  </p>
                  <p className="card-text mb-1">
                    <i className="fas fa-calendar me-2" style={{ color: colors.pink }}></i>
                    {eventData?.date ? format(new Date(eventData.date), "MMMM dd, yyyy") : "Date not provided"}
                  </p>
                  <p className="card-text mb-3">
                    <i className="fas fa-clock me-2" style={{ color: colors.pink }}></i>
                    {eventData?.time ? format(new Date(`2000-01-01T${eventData.time}`), "h:mm a") : "Time not specified"}
                  </p>
                  
                  {isPaidEvent && (
                    <div className="alert" style={{ backgroundColor: colors.lightGray }}>
                      <div className="d-flex justify-content-between align-items-center">
                        <span className="fw-bold">Price per ticket:</span>
                        <span className="badge" style={{ backgroundColor: colors.navy, color: colors.white, fontSize: "1rem" }}>
                          ${eventPrice.toFixed(2)}
                        </span>
                      </div>
                      
                      <div className="d-flex align-items-center justify-content-between mt-3">
                        <span className="fw-bold">Quantity:</span>
                        <div className="input-group" style={{ width: "120px" }}>
                          <button 
                            className="btn btn-outline-secondary" 
                            type="button"
                            onClick={() => handleQuantityChange(-1)}
                            disabled={formData.ticketQuantity <= 1}
                          >
                            <i className="fas fa-minus"></i>
                          </button>
                          <input 
                            type="text" 
                            className="form-control text-center" 
                            value={formData.ticketQuantity} 
                            readOnly 
                          />
                          <button 
                            className="btn btn-outline-secondary" 
                            type="button"
                            onClick={() => handleQuantityChange(1)}
                          >
                            <i className="fas fa-plus"></i>
                          </button>
                        </div>
                      </div>
                      
                      <div className="d-flex justify-content-between align-items-center mt-3">
                        <span className="fw-bold">Total:</span>
                        <span className="badge" style={{ backgroundColor: colors.pink, color: colors.white, fontSize: "1rem" }}>
                          ${(eventPrice * formData.ticketQuantity).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  )}
                  
                  <div className="mt-3">
                    <h5 className="fs-6" style={{ color: colors.pink }}>Event Description</h5>
                    <p className="card-text">{eventData?.description}</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="col-lg-8">
              {/* Registration Form Card */}
              <div className="card shadow-sm">
                <div className="card-header" style={{ backgroundColor: colors.navy, color: colors.white }}>
                  <h3 className="mb-0 fs-4">
                    <i className="fas fa-user-plus me-2"></i>
                    Register for Event
                  </h3>
                </div>
                <div className="card-body">
                  {error && (
                    <div className="alert alert-danger mb-4">
                      <i className="fas fa-exclamation-circle me-2"></i>
                      {error}
                    </div>
                  )}
                  
                  <form onSubmit={handleRegistrationSubmit}>
                    <div className="row mb-3">
                      <div className="col-md-6">
                        <label htmlFor="fullName" className="form-label">Full Name*</label>
                        <input
                          type="text"
                          className="form-control"
                          id="fullName"
                          name="fullName"
                          value={formData.fullName}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                      <div className="col-md-6">
                        <label htmlFor="email" className="form-label">Email Address*</label>
                        <input
                          type="email"
                          className="form-control"
                          id="email"
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                    </div>
                    
                    <div className="row mb-3">
                      <div className="col-md-6">
                        <label htmlFor="phone" className="form-label">Phone Number*</label>
                        <input
                          type="tel"
                          className="form-control"
                          id="phone"
                          name="phone"
                          value={formData.phone}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                      <div className="col-md-6">
                        <label htmlFor="address" className="form-label">Address</label>
                        <input
                          type="text"
                          className="form-control"
                          id="address"
                          name="address"
                          value={formData.address}
                          onChange={handleInputChange}
                        />
                      </div>
                    </div>
                    
                    <div className="row mb-3">
                      <div className="col-md-4">
                        <label htmlFor="city" className="form-label">City</label>
                        <input
                          type="text"
                          className="form-control"
                          id="city"
                          name="city"
                          value={formData.city}
                          onChange={handleInputChange}
                        />
                      </div>
                      <div className="col-md-4">
                        <label htmlFor="state" className="form-label">State</label>
                        <input
                          type="text"
                          className="form-control"
                          id="state"
                          name="state"
                          value={formData.state}
                          onChange={handleInputChange}
                        />
                      </div>
                      <div className="col-md-4">
                        <label htmlFor="zipCode" className="form-label">Zip Code</label>
                        <input
                          type="text"
                          className="form-control"
                          id="zipCode"
                          name="zipCode"
                          value={formData.zipCode}
                          onChange={handleInputChange}
                        />
                      </div>
                    </div>
                    
                    <div className="mb-3">
                      <label htmlFor="specialRequirements" className="form-label">Special Requirements</label>
                      <textarea
                        className="form-control"
                        id="specialRequirements"
                        name="specialRequirements"
                        rows="3"
                        placeholder="Any dietary restrictions, accessibility needs, or other special requests?"
                        value={formData.specialRequirements}
                        onChange={handleInputChange}
                      ></textarea>
                    </div>
                    
                    <div className="mb-4">
                      <div className="form-check">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          id="agreeToTerms"
                          name="agreeToTerms"
                          checked={formData.agreeToTerms}
                          onChange={handleInputChange}
                          required
                        />
                        <label className="form-check-label" htmlFor="agreeToTerms">
                          I agree to the <button 
                            type="button" 
                            className="btn btn-link p-0 d-inline text-decoration-none"
                            style={{ color: colors.pink }}
                            onClick={() => navigate("/terms")}
                          >terms and conditions</button>
                        </label>
                      </div>
                    </div>
                    
                    <div className="d-grid gap-2 d-md-flex justify-content-md-end">
                      <button
                        type="button"
                        className="btn btn-outline-secondary"
                        onClick={() => navigate(`/event/${id}`)}
                      >
                        <i className="fas fa-times me-2"></i>
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="btn"
                        disabled={submitting}
                        style={{ backgroundColor: colors.pink, color: colors.white }}
                      >
                        {submitting ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                            Submitting...
                          </>
                        ) : (
                          <>
                            <i className="fas fa-check-circle me-2"></i>
                            {isPaidEvent ? "Continue to Payment" : "Complete Registration"}
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Footer */}
      <footer style={{
        ...footerStyle, 
        marginTop: "50px",
      }}>
        <div style={footerContentStyle}>
          <p style={{ ...footerTextStyle, fontWeight: "600", fontSize: "1rem" }}>
            <i className="fas fa-heart" style={footerIconStyle}></i> EventHub Community
          </p>
          <p style={footerTextStyle}>
            Connect with event organizers and attendees from around the world
          </p>
          <p style={footerTextStyle}>
            <button 
              onClick={() => navigate("/terms")} 
              style={{...footerLinkStyle, background: "none", border: "none", cursor: "pointer", padding: 0}}
            >
              Terms
            </button> •
            <button 
              onClick={() => navigate("/privacy")} 
              style={{...footerLinkStyle, background: "none", border: "none", cursor: "pointer", margin: "0 0.5rem", padding: 0}}
            >
              Privacy
            </button> •
            <button 
              onClick={() => navigate("/support")} 
              style={{...footerLinkStyle, background: "none", border: "none", cursor: "pointer", padding: 0}}
            >
              Support
            </button>
          </p>
          <p style={{ ...footerTextStyle, marginTop: "0.5rem", fontSize: "0.8rem" }}>
            © {new Date().getFullYear()} EventHub. All rights reserved.
          </p>
        </div>
      </footer>
    </>
  );
}