import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

// Render React App that will wrap and mount Vue
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);