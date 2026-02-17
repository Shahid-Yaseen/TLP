import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import PasswordGate from './components/PasswordGate';
import './index.css';

// Pre-launch gate: when VITE_PASSWORD_PROTECT=true, entire app is behind a password.
// To go live: set VITE_PASSWORD_PROTECT=false or omit it, then rebuild.

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <PasswordGate>
        <App />
      </PasswordGate>
    </BrowserRouter>
  </React.StrictMode>
);
