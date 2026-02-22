import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import { FormDataProvider } from './context/FormDataContext';
import { ToastProvider } from './context/ToastContext';
import App from './App.jsx';
import './index.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <HashRouter>
      <FormDataProvider>
        <ToastProvider>
          <App />
        </ToastProvider>
      </FormDataProvider>
    </HashRouter>
  </StrictMode>,
);
