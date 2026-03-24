import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import './stores/authStore'; // Initialize auth state

// Simplified startup - advanced features temporarily disabled for stability
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
