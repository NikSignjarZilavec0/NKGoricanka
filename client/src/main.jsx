import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import { ClubProvider } from './context/ClubContext.jsx';
import { SeasonProvider } from './context/SeasonContext.jsx';
import './index.css';
import './styles/site.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <ClubProvider>
        <SeasonProvider>
          <AuthProvider>
            <App />
          </AuthProvider>
        </SeasonProvider>
      </ClubProvider>
    </BrowserRouter>
  </React.StrictMode>
);
