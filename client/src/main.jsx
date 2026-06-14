import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import { ClubProvider } from './context/ClubContext.jsx';
import './index.css';
import './styles/site.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <ClubProvider>
        <AuthProvider>
          <App />
        </AuthProvider>
      </ClubProvider>
    </BrowserRouter>
  </React.StrictMode>
);
