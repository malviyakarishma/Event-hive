import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { NotificationProvider } from './helpers/NotificationContext'; // Adjust path accordingly

// Creating a root element to render the app
const root = ReactDOM.createRoot(document.getElementById('root'));

// Rendering the app with NotificationProvider and BrowserRouter
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <NotificationProvider>
        <App />
      </NotificationProvider>
    </BrowserRouter>
  </React.StrictMode>
);

// Calling reportWebVitals for performance measurements
reportWebVitals();
