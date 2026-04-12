import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { FormDataProvider } from './context/FormDataContext';
import { ToastProvider } from './context/ToastContext';
import App from './App.jsx';
import './index.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <FormDataProvider>
          <ToastProvider>
            <App />
          </ToastProvider>
        </FormDataProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
);
