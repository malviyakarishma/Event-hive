// src/pages/AdminAIReviewsDashboard.js
import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Line, Bar, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import 'bootstrap/dist/css/bootstrap.min.css';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

// Define the colors
const colors = {
  primary: "#FF5A8E", // Vibrant pink
  secondary: "#0D1B40", // Deep navy
  accent: "#41C9E2", // Bright turquoise accent
  dark: "#081029", // Very dark navy, almost black
  light: "#FFF5F8", // Very light pink (off-white with pink tint)
  text: "#0D1B40", // Navy for main text
  textLight: "#6C7A9C", // Muted navy for secondary text
  chart: ["#FF5A8E", "#0D1B40", "#41C9E2", "#FF9E6D", "#8676FF", "#44D7B6"]
};

// Simple error display component
const ErrorAlert = ({ message }) => (
  <div className="container py-3">
    <div className="alert alert-danger" role="alert">
      <h4 className="alert-heading">Error Loading Data</h4>
      <p>{message || 'An unexpected error occurred. Please try again later.'}</p>
    </div>
  </div>
);

// Loading spinner component
const LoadingSpinner = () => (
  <div className="d-flex justify-content-center my-4">
    <div className="spinner-border" role="status" style={{ color: colors.primary }}>
      <span className="visually-hidden">Loading...</span>
    </div>
  </div>
);

const AdminAIReviewsDashboard = () => {
  const navigate = useNavigate();
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [timeRange, setTimeRange] = useState('week');
  const [sentimentTrend, setSentimentTrend] = useState([]);
  const [reviewVolume, setReviewVolume] = useState([]);
  const [keywordCloud, setKeywordCloud] = useState([]);
  const [aiRecommendations, setAiRecommendations] = useState([]);
  const [notificationCount, setNotificationCount] = useState(0);
  const [isAdmin, setIsAdmin] = useState(true); // Assume admin for now, in real app check auth
  
  // Create a ref to store fetchEventInsights
  const fetchEventInsightsRef = useRef(null);

  // Fetch detailed insights for a specific event
  const fetchEventInsights = useCallback(async (eventId) => {
    try {
      setLoading(true);
      
      // Generate sentiment trend data for the selected time range
      const daysInRange = timeRange === 'week' ? 7 : timeRange === 'month' ? 30 : 90;
      const sentimentData = [];
      const volumeData = [];
      
      for (let i = 0; i < daysInRange; i++) {
        const date = new Date();
        date.setDate(date.getDate() - (daysInRange - i - 1));
        
        // In a real implementation, fetch actual data from API
        sentimentData.push({
          date: date.toISOString().split('T')[0],
          score: Math.floor(Math.random() * 30) + 70 // Random score between 70-100
        });
        
        volumeData.push({
          date: date.toISOString().split('T')[0],
          count: Math.floor(Math.random() * 10) + 1 // Random count between 1-10
        });
      }
      
      setSentimentTrend(sentimentData);
      setReviewVolume(volumeData);
      
      // Generate keyword cloud data
      const keywords = [
        { text: 'Great', value: Math.floor(Math.random() * 30) + 20 },
        { text: 'Excellent', value: Math.floor(Math.random() * 25) + 15 },
        { text: 'Organized', value: Math.floor(Math.random() * 20) + 10 },
        { text: 'Speakers', value: Math.floor(Math.random() * 25) + 15 },
        { text: 'Content', value: Math.floor(Math.random() * 30) + 20 },
        { text: 'Venue', value: Math.floor(Math.random() * 15) + 5 },
        { text: 'Network', value: Math.floor(Math.random() * 20) + 10 },
        { text: 'Value', value: Math.floor(Math.random() * 15) + 5 },
        { text: 'Interactive', value: Math.floor(Math.random() * 20) + 10 },
        { text: 'Informative', value: Math.floor(Math.random() * 25) + 15 }
      ];
      
      setKeywordCloud(keywords);
      
      // Generate AI recommendations
      const event = events.find(e => e.id === eventId) || {};
      const recommendations = [
        `Based on sentiment analysis, attendees particularly enjoyed the ${event.category} content. Consider expanding this area in future events.`,
        `Reviews mentioning "speaker quality" showed 95% positive sentiment. Continue to prioritize high-quality speakers.`,
        `Negative feedback was primarily focused on venue amenities (15% of complaints). Consider a venue with better facilities next time.`,
        `Engagement was highest during interactive sessions. Adding more workshops could further improve satisfaction.`,
        `Reviews suggest attendees want more networking opportunities. Consider adding structured networking sessions.`
      ];
      
      setAiRecommendations(recommendations);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching event insights:', error);
      setError('Failed to load event insights');
      setLoading(false);
    }
  }, [timeRange, events]);

  // Store fetchEventInsights in the ref
  useEffect(() => {
    fetchEventInsightsRef.current = fetchEventInsights;
  }, [fetchEventInsights]);

  // Fetch events and analytics
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Check authentication status first
        try {
          const authResponse = await axios.get('/auth/check', {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('accessToken')}`
            }
          });
          setIsAdmin(authResponse.data.isAdmin);
          
          if (!authResponse.data.isAdmin) {
            navigate('/login');
            return;
          }
        } catch (authError) {
          console.error('Authentication error:', authError);
          navigate('/login');
          return;
        }
        
        // Fetch events
        const eventsResponse = await axios.get('/events');
        
        if (eventsResponse.data && Array.isArray(eventsResponse.data) && eventsResponse.data.length > 0) {
          // Add calculated metrics to events
          const enhancedEvents = await Promise.all(eventsResponse.data.map(async (event) => {
            try {
              // Get event analytics
              const analyticsResponse = await axios.get(`/analytics/${event.id}`);
              const analytics = analyticsResponse.data.analytics || {};
              
              // Format date
              let formattedDate = event.date;
              try {
                formattedDate = new Date(event.date).toLocaleDateString();
              } catch (dateError) {
                console.warn("Error formatting date:", dateError);
              }
              
              return {
                ...event,
                date: formattedDate,
                reviewCount: analytics.total_reviews || 0,
                avgRating: analytics.average_rating || 0,
                sentimentScore: analytics.sentiment_score || 0,
                attendanceTotal: analytics.total_attendance || 0
              };
            } catch (err) {
              console.error(`Error fetching analytics for event ${event.id}:`, err);
              return {
                ...event,
                date: new Date(event.date).toLocaleDateString(),
                reviewCount: 0,
                avgRating: 0,
                sentimentScore: 0,
                attendanceTotal: 0
              };
            }
          }));
          
          setEvents(enhancedEvents);
          
          if (enhancedEvents.length > 0) {
            setSelectedEvent(enhancedEvents[0]); // Set first event as default
            // Use the ref to call fetchEventInsights
            if (fetchEventInsightsRef.current) {
              await fetchEventInsightsRef.current(enhancedEvents[0].id);
            }
          }
        } else {
          setEvents([]);
        }
        
        // Get notification count
        try {
          const notificationResponse = await axios.get('/notifications/unread/count');
          setNotificationCount(notificationResponse.data.count || 0);
        } catch (notificationError) {
          console.error('Error fetching notification count:', notificationError);
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load dashboard data. Please try again later.');
        setLoading(false);
      }
    };

    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]);

  // Handle event selection
  const selectEvent = useCallback((event) => {
    setSelectedEvent(event);
    if (fetchEventInsightsRef.current) {
      fetchEventInsightsRef.current(event.id);
    }
  }, []);

  // Handle tab changes
  const handleTabChange = useCallback((tabId) => {
    setActiveTab(tabId);
  }, []);

  // Handle time range change
  const handleTimeRangeChange = useCallback((range) => {
    setTimeRange(range);
    if (selectedEvent && fetchEventInsightsRef.current) {
      fetchEventInsightsRef.current(selectedEvent.id);
    }
  }, [selectedEvent, fetchEventInsightsRef]);

  // Generate response to a review
  const generateAIResponse = async (reviewId, reviewText) => {
    try {
      // In a real implementation, this would call an API endpoint
      // that uses a language model to generate a response
      console.log(`Generating AI response for review ${reviewId}`);
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Sample response
      const aiResponse = `Thank you for your feedback! We're glad you enjoyed the event and appreciate your suggestions. We'll consider your input for future improvements.`;
      
      // In a real app, you would save this response to the database
      console.log('AI generated response:', aiResponse);
      
      return aiResponse;
    } catch (error) {
      console.error('Error generating AI response:', error);
      throw error;
    }
  };

  // Render overview tab
  const renderOverviewTab = () => {
    if (!selectedEvent) return null;
    
    // Prepare chart data for sentiment trend
    const sentimentChartData = {
      labels: sentimentTrend.map(item => item.date),
      datasets: [
        {
          label: 'Sentiment Score',
          data: sentimentTrend.map(item => item.score),
          borderColor: colors.primary,
          backgroundColor: `rgba(255, 90, 142, 0.1)`,
          tension: 0.4,
          fill: true
        }
      ]
    };
    
    // Prepare chart data for review volume
    const volumeChartData = {
      labels: reviewVolume.map(item => item.date),
      datasets: [
        {
          label: 'Review Count',
          data: reviewVolume.map(item => item.count),
          backgroundColor: colors.accent,
          borderRadius: 4
        }
      ]
    };
    
    // Chart options
    const lineOptions = {
      responsive: true,
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          mode: 'index',
          intersect: false
        }
      },
      scales: {
        y: {
          min: 0,
          max: 100,
          ticks: {
            stepSize: 20
          }
        }
      }
    };
    
    const barOptions = {
      responsive: true,
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          mode: 'index',
          intersect: false
        }
      },
      scales: {
        y: {
          beginAtZero: true
        }
      }
    };
    
    return (
      <div className="tab-pane fade show active">
        <h4 className="mb-4" style={{ color: colors.secondary }}>
          Overview Dashboard for {selectedEvent.title}
        </h4>
        
        {/* Key Metrics Cards */}
        <div className="row g-3 mb-4">
          <div className="col-md-3 col-sm-6">
            <div 
              className="p-3 rounded text-center h-100 shadow-sm" 
              style={{ backgroundColor: `rgba(255, 90, 142, 0.1)` }}
            >
              <div style={{ color: colors.primary, fontSize: '2rem', fontWeight: '700' }}>
                {selectedEvent.avgRating ? selectedEvent.avgRating.toFixed(1) : 'N/A'}
              </div>
              <div style={{ color: colors.secondary, fontSize: '0.9rem', fontWeight: '500' }}>
                Overall Rating
              </div>
              <div style={{ color: colors.primary }} aria-hidden="true">
                {"★".repeat(Math.round(selectedEvent.avgRating || 0))}
              </div>
            </div>
          </div>
          
          <div className="col-md-3 col-sm-6">
            <div 
              className="p-3 rounded text-center h-100 shadow-sm" 
              style={{ backgroundColor: `rgba(13, 27, 64, 0.1)` }}
            >
              <div style={{ color: colors.secondary, fontSize: '2rem', fontWeight: '700' }}>
                {selectedEvent.reviewCount || 0}
              </div>
              <div style={{ color: colors.secondary, fontSize: '0.9rem', fontWeight: '500' }}>
                Total Reviews
              </div>
            </div>
          </div>
          
          <div className="col-md-3 col-sm-6">
            <div 
              className="p-3 rounded text-center h-100 shadow-sm" 
              style={{ backgroundColor: `rgba(65, 201, 226, 0.1)` }}
            >
              <div style={{ color: colors.accent, fontSize: '2rem', fontWeight: '700' }}>
                {selectedEvent.sentimentScore || 0}%
              </div>
              <div style={{ color: colors.secondary, fontSize: '0.9rem', fontWeight: '500' }}>
                Positive Sentiment
              </div>
            </div>
          </div>
          
          <div className="col-md-3 col-sm-6">
            <div 
              className="p-3 rounded text-center h-100 shadow-sm" 
              style={{ backgroundColor: 'rgba(255, 158, 109, 0.1)' }}
            >
              <div style={{ color: '#FF9E6D', fontSize: '2rem', fontWeight: '700' }}>
                {(selectedEvent.attendanceTotal || 0).toLocaleString()}
              </div>
              <div style={{ color: colors.secondary, fontSize: '0.9rem', fontWeight: '500' }}>
                Total Attendance
              </div>
            </div>
          </div>
        </div>
        
        {/* Time Range Selector */}
        <div className="d-flex justify-content-end mb-3">
          <div className="btn-group">
            <button 
              className={`btn btn-sm ${timeRange === 'week' ? 'btn-primary' : 'btn-outline-primary'}`}
              onClick={() => handleTimeRangeChange('week')}
              style={{ 
                backgroundColor: timeRange === 'week' ? colors.primary : 'white',
                borderColor: colors.primary,
                color: timeRange === 'week' ? 'white' : colors.primary
              }}
            >
              Week
            </button>
            <button 
              className={`btn btn-sm ${timeRange === 'month' ? 'btn-primary' : 'btn-outline-primary'}`}
              onClick={() => handleTimeRangeChange('month')}
              style={{ 
                backgroundColor: timeRange === 'month' ? colors.primary : 'white',
                borderColor: colors.primary,
                color: timeRange === 'month' ? 'white' : colors.primary
              }}
            >
              Month
            </button>
            <button 
              className={`btn btn-sm ${timeRange === 'quarter' ? 'btn-primary' : 'btn-outline-primary'}`}
              onClick={() => handleTimeRangeChange('quarter')}
              style={{ 
                backgroundColor: timeRange === 'quarter' ? colors.primary : 'white',
                borderColor: colors.primary,
                color: timeRange === 'quarter' ? 'white' : colors.primary
              }}
            >
              Quarter
            </button>
          </div>
        </div>
        
        {/* Charts Row */}
        <div className="row mb-4">
          <div className="col-md-6">
            <div className="card shadow-sm h-100">
              <div className="card-header" style={{ backgroundColor: colors.light }}>
                <h5 className="card-title mb-0" style={{ color: colors.secondary }}>Sentiment Trend</h5>
              </div>
              <div className="card-body">
                <Line data={sentimentChartData} options={lineOptions} />
              </div>
            </div>
          </div>
          <div className="col-md-6">
            <div className="card shadow-sm h-100">
              <div className="card-header" style={{ backgroundColor: colors.light }}>
                <h5 className="card-title mb-0" style={{ color: colors.secondary }}>Review Volume</h5>
              </div>
              <div className="card-body">
                <Bar data={volumeChartData} options={barOptions} />
              </div>
            </div>
          </div>
        </div>
        
        {/* Keyword Cloud and Recommendations */}
        <div className="row">
          <div className="col-md-6">
            <div className="card shadow-sm h-100">
              <div className="card-header" style={{ backgroundColor: colors.light }}>
                <h5 className="card-title mb-0" style={{ color: colors.secondary }}>Keyword Analysis</h5>
              </div>
              <div className="card-body">
                <div className="p-4" style={{ minHeight: '250px' }}>
                  <div className="d-flex flex-wrap justify-content-center align-items-center">
                    {keywordCloud.map((keyword, index) => (
                      <div 
                        key={index}
                        className="m-2 p-2 rounded"
                        style={{ 
                          fontSize: `${Math.max(0.8, keyword.value / 10)}rem`,
                          fontWeight: Math.min(700, 300 + keyword.value * 10),
                          color: colors.chart[index % colors.chart.length],
                          backgroundColor: `rgba(${index * 20}, ${255 - index * 20}, ${150 + index * 10}, 0.1)`,
                        }}
                      >
                        {keyword.text}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="col-md-6">
            <div className="card shadow-sm h-100">
              <div className="card-header" style={{ backgroundColor: colors.light }}>
                <h5 className="card-title mb-0" style={{ color: colors.secondary }}>AI Recommendations</h5>
              </div>
              <div className="card-body">
                <ul className="list-group list-group-flush">
                  {aiRecommendations.map((recommendation, index) => (
                    <li key={index} className="list-group-item border-0 ps-0">
                      <div className="d-flex">
                        <div className="me-2 text-primary">
                          <i className="bi bi-lightbulb-fill"></i>
                        </div>
                        <div style={{ fontSize: '0.9rem' }}>{recommendation}</div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Render reviews tab
  const renderReviewsTab = () => {
    if (!selectedEvent) return null;
    
    // For demonstration, generate some mock reviews
    const reviews = Array.from({ length: 8 }, (_, i) => ({
      id: i + 1,
      username: `User${i + 1}`,
      avatar: `https://i.pravatar.cc/40?img=${i + 10}`,
      rating: Math.floor(Math.random() * 3) + 3, // 3-5 stars
      date: new Date(Date.now() - Math.random() * 10000000000).toLocaleDateString(),
      text: [
        "Great event! I particularly enjoyed the keynote speakers and networking opportunities.",
        "Really well organized. The content was informative and the speakers were engaging.",
        "The venue was excellent and the staff were very helpful. Would attend again!",
        "Good event overall, but would have liked more interactive sessions.",
        "Amazing experience! The workshops were incredibly valuable and I learned a lot."
      ][Math.floor(Math.random() * 5)],
      sentiment: ["positive", "positive", "positive", "neutral", "positive"][Math.floor(Math.random() * 5)],
      responded: Math.random() > 0.5
    }));
    
    return (
      <div className="tab-pane fade show active">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h4 style={{ color: colors.secondary }}>
            Reviews for {selectedEvent.title}
          </h4>
          <button 
            className="btn btn-sm"
            style={{ backgroundColor: colors.primary, color: 'white' }}
            onClick={() => {
              // Auto-respond to all unresponded reviews
              console.log('Auto-responding to all unresponded reviews');
            }}
          >
            Auto-respond to All
          </button>
        </div>
        
        <div className="card shadow-sm">
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <thead style={{ backgroundColor: colors.light }}>
                  <tr>
                    <th style={{ color: colors.secondary }}>User</th>
                    <th style={{ color: colors.secondary }}>Review</th>
                    <th style={{ color: colors.secondary }}>Rating</th>
                    <th style={{ color: colors.secondary }}>Sentiment</th>
                    <th style={{ color: colors.secondary }}>Date</th>
                    <th style={{ color: colors.secondary }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {reviews.map((review) => (
                    <tr key={review.id}>
                      <td>
                        <div className="d-flex align-items-center">
                          <img 
                            src={review.avatar} 
                            alt={review.username} 
                            className="rounded-circle me-2"
                            width="30"
                            height="30"
                          />
                          <span>{review.username}</span>
                        </div>
                      </td>
                      <td style={{ maxWidth: '300px' }}>
                        <div style={{ fontSize: '0.9rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {review.text}
                        </div>
                        {review.responded && (
                          <span className="badge bg-success ms-2" style={{ fontSize: '0.7rem' }}>
                            Responded
                          </span>
                        )}
                      </td>
                      <td>
                        <span style={{ color: colors.primary }}>
                          {review.rating} {"★".repeat(review.rating)}
                        </span>
                      </td>
                      <td>
                        <span 
                          className={`badge ${review.sentiment === 'positive' ? 'bg-success' : review.sentiment === 'negative' ? 'bg-danger' : 'bg-secondary'}`}
                        >
                          {review.sentiment}
                        </span>
                      </td>
                      <td>{review.date}</td>
                      <td>
                        <div className="btn-group">
                          <button 
                            className="btn btn-sm"
                            style={{ backgroundColor: colors.accent, color: 'white' }}
                            onClick={() => generateAIResponse(review.id, review.text)}
                            disabled={review.responded}
                          >
                            {review.responded ? 'Responded' : 'AI Response'}
                          </button>
                          <button 
                            className="btn btn-sm btn-outline-secondary"
                            onClick={() => {
                              // View review details
                              console.log('View review details', review);
                            }}
                          >
                            View
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Render settings tab
  const renderSettingsTab = () => {
    if (!selectedEvent) return null;
    
    return (
      <div className="tab-pane fade show active">
        <h4 className="mb-4" style={{ color: colors.secondary }}>
          AI Analysis Settings for {selectedEvent.title}
        </h4>
        
        <div className="card shadow-sm mb-4">
          <div className="card-header" style={{ backgroundColor: colors.light }}>
            <h5 className="card-title mb-0" style={{ color: colors.secondary }}>Sentiment Analysis</h5>
          </div>
          <div className="card-body">
            <form>
              <div className="mb-3">
                <label className="form-label">Response Threshold</label>
                <div className="input-group">
                  <select className="form-select">
                    <option value="any">Respond to any review</option>
                    <option value="negative">Respond to negative reviews only</option>
                    <option value="neutral">Respond to neutral and negative reviews</option>
                    <option value="none">Don't auto-respond</option>
                  </select>
                </div>
                <div className="form-text">
                  Set when AI should automatically generate responses to reviews
                </div>
              </div>
              
              <div className="mb-3">
                <label className="form-label">AI Response Tone</label>
                <div className="input-group">
                  <select className="form-select">
                    <option value="professional">Professional</option>
                    <option value="friendly">Friendly</option>
                    <option value="enthusiastic">Enthusiastic</option>
                    <option value="formal">Formal</option>
                  </select>
                </div>
                <div className="form-text">
                  Set the tone of AI-generated responses
                </div>
              </div>
              
              <div className="mb-3">
                <label className="form-label">Review Alert Threshold</label>
                <div className="input-group">
                  <select className="form-select">
                    <option value="1">★ (1 star)</option>
                    <option value="2">★★ (2 stars)</option>
                    <option value="3">★★★ (3 stars)</option>
                    <option value="none">No alerts</option>
                  </select>
                </div>
                <div className="form-text">
                  Get notified about reviews below this rating
                </div>
              </div>
              
              <div className="mb-3">
                <div className="form-check form-switch">
                  <input className="form-check-input" type="checkbox" id="autoApproveResponses" defaultChecked />
                  <label className="form-check-label" htmlFor="autoApproveResponses">
                    Auto-approve AI responses
                  </label>
                </div>
                <div className="form-text">
                  When enabled, AI responses will be posted without manual review
                </div>
              </div>
              
              <div className="mb-3">
                <div className="form-check form-switch">
                  <input className="form-check-input" type="checkbox" id="enableInsights" defaultChecked />
                  <label className="form-check-label" htmlFor="enableInsights">
                    Enable AI Insights
                  </label>
                </div>
                <div className="form-text">
                  Generate AI-powered insights and recommendations from review data
                </div>
              </div>
              
              <button 
                type="submit" 
                className="btn"
                style={{ backgroundColor: colors.primary, color: 'white' }}
              >
                Save Settings
              </button>
            </form>
          </div>
        </div>
        
        <div className="card shadow-sm">
          <div className="card-header" style={{ backgroundColor: colors.light }}>
            <h5 className="card-title mb-0" style={{ color: colors.secondary }}>Custom Response Templates</h5>
          </div>
          <div className="card-body">
            <div className="alert alert-info">
              Create custom response templates that the AI can use when responding to reviews.
              Use variables like {'{username}'}, {'{rating}'}, or {'{event_name}'} that will be replaced with actual values.
            </div>
            
            <div className="mb-3">
              <label className="form-label">Positive Review Template</label>
              <textarea 
                className="form-control" 
                rows="3"
                defaultValue="Thank you for your positive review, {username}! We're delighted that you enjoyed {event_name} and appreciate your feedback. We hope to see you at our future events!"
              ></textarea>
            </div>
            
            <div className="mb-3">
              <label className="form-label">Neutral Review Template</label>
              <textarea 
                className="form-control" 
                rows="3"
                defaultValue="Thank you for attending {event_name} and sharing your thoughts, {username}. We appreciate your honest feedback and will take your comments into consideration for our future events. If you have any specific suggestions, please let us know!"
              ></textarea>
            </div>
            
            <div className="mb-3">
              <label className="form-label">Negative Review Template</label>
              <textarea 
                className="form-control" 
                rows="3"
                defaultValue="We're sorry to hear about your experience at {event_name}, {username}. We take all feedback seriously and will use your comments to improve. Please contact our support team if you'd like to discuss your concerns further."
              ></textarea>
            </div>
            
            <button 
              type="submit" 
              className="btn"
              style={{ backgroundColor: colors.primary, color: 'white' }}
            >
              Save Templates
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Render reports tab
  const renderReportsTab = () => {
    if (!selectedEvent) return null;
    
    // Prepare sentiment distribution data for pie chart
    const sentimentData = {
      labels: ['Positive', 'Neutral', 'Negative'],
      datasets: [
        {
          data: [70, 20, 10],
          backgroundColor: [colors.chart[2], colors.chart[3], colors.chart[1]],
          borderWidth: 0
        }
      ]
    };
    
    // Prepare rating distribution data for bar chart
    const ratingData = {
      labels: ['5★', '4★', '3★', '2★', '1★'],
      datasets: [
        {
          label: 'Number of Reviews',
          data: [35, 25, 15, 5, 2],
          backgroundColor: [
            `rgba(65, 201, 226, 0.8)`,
            `rgba(65, 201, 226, 0.6)`,
            `rgba(65, 201, 226, 0.4)`,
            `rgba(13, 27, 64, 0.6)`,
            `rgba(13, 27, 64, 0.8)`
          ],
          borderRadius: 4
        }
      ]
    };
    
    // Chart options
    const pieOptions = {
      responsive: true,
      plugins: {
        legend: {
          position: 'right'
        }
      }
    };
    
    const barOptions = {
      responsive: true,
      plugins: {
        legend: {
          display: false
        }
      },
      scales: {
        y: {
          beginAtZero: true
        }
      }
    };
    
    return (
      <div className="tab-pane fade show active">
        <h4 className="mb-4" style={{ color: colors.secondary }}>
          Analytics Reports for {selectedEvent.title}
        </h4>
        
        {/* Charts Row */}
        <div className="row mb-4">
          <div className="col-md-6">
            <div className="card shadow-sm h-100">
              <div className="card-header" style={{ backgroundColor: colors.light }}>
                <h5 className="card-title mb-0" style={{ color: colors.secondary }}>Sentiment Distribution</h5>
              </div>
              <div className="card-body">
                <Pie data={sentimentData} options={pieOptions} />
              </div>
            </div>
          </div>
          <div className="col-md-6">
            <div className="card shadow-sm h-100">
              <div className="card-header" style={{ backgroundColor: colors.light }}>
                <h5 className="card-title mb-0" style={{ color: colors.secondary }}>Rating Distribution</h5>
              </div>
              <div className="card-body">
                <Bar data={ratingData} options={barOptions} />
              </div>
            </div>
          </div>
        </div>
        
        {/* Key Insight Cards */}
        <div className="row g-3 mb-4">
          <div className="col-md-4">
            <div className="card shadow-sm h-100">
              <div className="card-body">
                <h5 className="card-title" style={{ color: colors.primary }}>Top Positive Topics</h5>
                <ol className="list-group list-group-flush list-group-numbered">
                  <li className="list-group-item border-0 ps-0">Speaker Quality (85%)</li>
                  <li className="list-group-item border-0 ps-0">Content Relevance (80%)</li>
                  <li className="list-group-item border-0 ps-0">Networking (75%)</li>
                  <li className="list-group-item border-0 ps-0">Organization (70%)</li>
                  <li className="list-group-item border-0 ps-0">Value (65%)</li>
                </ol>
              </div>
            </div>
          </div>
          <div className="col-md-4">
            <div className="card shadow-sm h-100">
              <div className="card-body">
                <h5 className="card-title" style={{ color: colors.accent }}>Areas for Improvement</h5>
                <ol className="list-group list-group-flush list-group-numbered">
                  <li className="list-group-item border-0 ps-0">Venue Amenities (15%)</li>
                  <li className="list-group-item border-0 ps-0">Food Quality (12%)</li>
                  <li className="list-group-item border-0 ps-0">Session Length (10%)</li>
                  <li className="list-group-item border-0 ps-0">Registration Process (8%)</li>
                  <li className="list-group-item border-0 ps-0">Mobile App Experience (5%)</li>
                </ol>
              </div>
            </div>
          </div>
          <div className="col-md-4">
            <div className="card shadow-sm h-100">
              <div className="card-body">
                <h5 className="card-title" style={{ color: colors.secondary }}>Demographic Insights</h5>
                <ul className="list-group list-group-flush">
                  <li className="list-group-item border-0 ps-0">
                    <div className="d-flex justify-content-between">
                      <span>First-time Attendees</span>
                      <span>35%</span>
                    </div>
                    <div className="progress mt-1" style={{ height: '4px' }}>
                      <div 
                        className="progress-bar" 
                        role="progressbar" 
                        style={{ width: '35%', backgroundColor: colors.primary }} 
                        aria-valuenow="35" 
                        aria-valuemin="0" 
                        aria-valuemax="100"
                      ></div>
                    </div>
                  </li>
                  <li className="list-group-item border-0 ps-0">
                    <div className="d-flex justify-content-between">
                      <span>Returning Attendees</span>
                      <span>65%</span>
                    </div>
                    <div className="progress mt-1" style={{ height: '4px' }}>
                      <div 
                        className="progress-bar" 
                        role="progressbar" 
                        style={{ width: '65%', backgroundColor: colors.accent }} 
                        aria-valuenow="65" 
                        aria-valuemin="0" 
                        aria-valuemax="100"
                      ></div>
                    </div>
                  </li>
                  <li className="list-group-item border-0 ps-0">
                    <div className="d-flex justify-content-between">
                      <span>Avg. Session Attendance</span>
                      <span>78%</span>
                    </div>
                    <div className="progress mt-1" style={{ height: '4px' }}>
                      <div 
                        className="progress-bar" 
                        role="progressbar" 
                        style={{ width: '78%', backgroundColor: colors.chart[3] }} 
                        aria-valuenow="78" 
                        aria-valuemin="0" 
                        aria-valuemax="100"
                      ></div>
                    </div>
                  </li>
                  <li className="list-group-item border-0 ps-0">
                    <div className="d-flex justify-content-between">
                      <span>Likely to Recommend</span>
                      <span>82%</span>
                    </div>
                    <div className="progress mt-1" style={{ height: '4px' }}>
                      <div 
                        className="progress-bar" 
                        role="progressbar" 
                        style={{ width: '82%', backgroundColor: colors.chart[4] }} 
                        aria-valuenow="82" 
                        aria-valuemin="0" 
                        aria-valuemax="100"
                      ></div>
                    </div>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
        
        {/* Export Options */}
        <div className="card shadow-sm">
          <div className="card-header" style={{ backgroundColor: colors.light }}>
            <h5 className="card-title mb-0" style={{ color: colors.secondary }}>Export Reports</h5>
          </div>
          <div className="card-body">
            <div className="row">
              <div className="col-md-6">
                <div className="mb-3">
                  <label className="form-label">Report Type</label>
                  <select className="form-select">
                    <option value="full">Complete Analytics Report</option>
                    <option value="sentiment">Sentiment Analysis</option>
                    <option value="ratings">Ratings Distribution</option>
                    <option value="comments">Review Comments</option>
                    <option value="recommendations">AI Recommendations</option>
                  </select>
                </div>
              </div>
              <div className="col-md-6">
                <div className="mb-3">
                  <label className="form-label">Format</label>
                  <select className="form-select">
                    <option value="pdf">PDF Document</option>
                    <option value="excel">Excel Spreadsheet</option>
                    <option value="csv">CSV File</option>
                    <option value="json">JSON Data</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="mb-3">
              <label className="form-label">Date Range</label>
              <div className="row">
                <div className="col-md-6">
                  <input type="date" className="form-control" placeholder="Start Date" />
                </div>
                <div className="col-md-6">
                  <input type="date" className="form-control" placeholder="End Date" />
                </div>
              </div>
            </div>
            <div className="d-flex">
              <button 
                className="btn me-2"
                style={{ backgroundColor: colors.primary, color: 'white' }}
              >
                Generate Report
              </button>
              <button 
                className="btn btn-outline-secondary"
              >
                Schedule Weekly Reports
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <ErrorAlert message={error} />;
  }

  if (!isAdmin) {
    return (
      <div className="container py-5">
        <div className="alert alert-danger" role="alert">
          <h4 className="alert-heading">Access Denied</h4>
          <p>You must be an administrator to access this page.</p>
          <button 
            className="btn btn-primary"
            onClick={() => navigate('/login')}
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 style={{ color: colors.secondary }}>AI Reviews Dashboard</h2>
        <div className="position-relative">
          <button 
            className="btn btn-outline-secondary position-relative"
            onClick={() => navigate('/notifications')}
          >
            <i className="bi bi-bell"></i> Notifications
            {notificationCount > 0 && (
              <span 
                className="position-absolute top-0 start-100 translate-middle badge rounded-pill"
                style={{ backgroundColor: colors.primary }}
              >
                {notificationCount}
                <span className="visually-hidden">unread notifications</span>
              </span>
            )}
          </button>
        </div>
      </div>
      
      <div className="row">
        <div className="col-lg-3">
          <div className="card shadow-sm mb-4">
            <div className="card-header py-3" style={{ backgroundColor: colors.secondary, color: 'white' }}>
              <h2 className="m-0 fs-5">Select Event</h2>
            </div>
            <div className="card-body p-0">
              <div className="list-group list-group-flush" role="listbox">
                {events.length > 0 ? (
                  events.map(event => (
                    <div 
                      key={event.id}
                      className="p-3 border-bottom"
                      onClick={() => selectEvent(event)}
                      role="option"
                      tabIndex={0}
                      aria-selected={selectedEvent?.id === event.id}
                      onKeyDown={(e) => e.key === 'Enter' && selectEvent(event)}
                      style={{ 
                        cursor: 'pointer',
                        backgroundColor: selectedEvent?.id === event.id ? `rgba(255, 90, 142, 0.1)` : 'white',
                        borderLeft: selectedEvent?.id === event.id ? `4px solid ${colors.primary}` : '4px solid transparent',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <div className="d-flex justify-content-between align-items-start">
                        <div>
                          <h4 className="fs-6 mb-1" style={{ color: colors.secondary, fontWeight: '600' }}>
                            {event.title}
                          </h4>
                          <div style={{ fontSize: '0.85rem', color: colors.textLight }}>
                            {event.date} • {event.category}
                          </div>
                        </div>
                        <div 
                          className="px-2 py-1 rounded-pill" 
                          style={{ 
                            backgroundColor: colors.light, 
                            color: colors.primary,
                            fontSize: '0.9rem',
                            fontWeight: '600' 
                          }}
                        >
                          {event.avgRating ? event.avgRating.toFixed(1) : 'N/A'} ★
                        </div>
                      </div>
                      
                      <div className="d-flex align-items-center mt-2">
                        <div 
                          className="me-2 flex-grow-1" 
                          style={{ 
                            height: '6px', 
                            backgroundColor: '#e9ecef',
                            borderRadius: '3px',
                            overflow: 'hidden'
                          }}
                        >
                          <div 
                            style={{ 
                              width: `${event.sentimentScore || 0}%`, 
                              height: '100%', 
                              backgroundColor: colors.primary,
                              borderRadius: '3px'
                            }}
                            aria-label={`${event.sentimentScore || 0}% positive sentiment`}
                            role="progressbar"
                            aria-valuenow={event.sentimentScore || 0}
                            aria-valuemin="0"
                            aria-valuemax="100"
                          ></div>
                        </div>
                        <span style={{ fontSize: '0.8rem', color: colors.textLight }}>
                          {event.reviewCount || 0} reviews
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-center">
                    <p className="text-muted">No events available</p>
                    <button 
                      className="btn btn-sm"
                      style={{ backgroundColor: colors.primary, color: 'white' }}
                      onClick={() => navigate('/events/create')}
                    >
                      Create Event
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="card shadow-sm">
            <div className="card-header" style={{ backgroundColor: colors.secondary, color: 'white' }}>
              <h3 className="m-0 fs-5">AI Insights Engine</h3>
            </div>
            <div className="card-body">
              <p style={{ fontSize: '0.9rem', color: colors.textLight }}>
                Our AI analyzes event reviews and attendee feedback to provide actionable insights for event organizers.
              </p>
              <ul style={{ fontSize: '0.9rem', color: colors.textLight }}>
                <li className="mb-2">Auto-respond to reviews with AI-generated responses</li>
                <li className="mb-2">Understand sentiment trends and key topics</li>
                <li className="mb-2">Receive recommendations for event improvements</li>
                <li className="mb-2">Generate comprehensive analytics reports</li>
              </ul>
              {selectedEvent && (
                <button 
                  className="btn btn-sm w-100"
                  style={{ backgroundColor: colors.primary, color: 'white' }}
                  onClick={() => {
                    // Refresh AI analysis for this event
                    fetchEventInsights(selectedEvent.id);
                  }}
                >
                  Refresh AI Analysis
                </button>
              )}
            </div>
          </div>
        </div>
        
        <div className="col-lg-9">
          {selectedEvent ? (
            <>
              <div className="card shadow-sm">
                <div className="card-header" style={{ backgroundColor: colors.light }}>
                  <ul className="nav nav-tabs card-header-tabs">
                    <li className="nav-item">
                      <button 
                        className={`nav-link ${activeTab === 'overview' ? 'active' : ''}`}
                        onClick={() => handleTabChange('overview')}
                        style={{ 
                          color: activeTab === 'overview' ? colors.primary : colors.textLight,
                          fontWeight: activeTab === 'overview' ? '600' : '400'
                        }}
                      >
                        Overview
                      </button>
                    </li>
                    <li className="nav-item">
                      <button 
                        className={`nav-link ${activeTab === 'reviews' ? 'active' : ''}`}
                        onClick={() => handleTabChange('reviews')}
                        style={{ 
                          color: activeTab === 'reviews' ? colors.primary : colors.textLight,
                          fontWeight: activeTab === 'reviews' ? '600' : '400'
                        }}
                      >
                        Review Management
                      </button>
                    </li>
                    <li className="nav-item">
                      <button 
                        className={`nav-link ${activeTab === 'reports' ? 'active' : ''}`}
                        onClick={() => handleTabChange('reports')}
                        style={{ 
                          color: activeTab === 'reports' ? colors.primary : colors.textLight,
                          fontWeight: activeTab === 'reports' ? '600' : '400'
                        }}
                      >
                        Analytics Reports
                      </button>
                    </li>
                    <li className="nav-item">
                      <button 
                        className={`nav-link ${activeTab === 'settings' ? 'active' : ''}`}
                        onClick={() => handleTabChange('settings')}
                        style={{ 
                          color: activeTab === 'settings' ? colors.primary : colors.textLight,
                          fontWeight: activeTab === 'settings' ? '600' : '400'
                        }}
                      >
                        Settings
                      </button>
                    </li>
                  </ul>
                </div>
                <div className="card-body p-4">
                  {activeTab === 'overview' && renderOverviewTab()}
                  {activeTab === 'reviews' && renderReviewsTab()}
                  {activeTab === 'reports' && renderReportsTab()}
                  {activeTab === 'settings' && renderSettingsTab()}
                </div>
              </div>
            </>
          ) : (
            <div className="card shadow-sm">
              <div className="card-body text-center p-5">
                <p className="text-muted">Please select an event to view AI insights</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminAIReviewsDashboard;