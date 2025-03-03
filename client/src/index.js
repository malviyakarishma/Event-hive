import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import reportWebVitals from './reportWebVitals';

// Creating a root element to render the app
const root = ReactDOM.createRoot(document.getElementById('root'));

// Rendering the app, temporarily disabling StrictMode
root.render(
  // Commenting out React.StrictMode temporarily for debugging
  // <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  // </React.StrictMode>
);

// Calling reportWebVitals for performance measurements
reportWebVitals();
