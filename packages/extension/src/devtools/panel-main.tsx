import React from 'react';
import { createRoot } from 'react-dom/client';
import '../styles.css';
import App from '../panel/App';

// DevTools panel reuses the same Panel App component
createRoot(document.getElementById('root')!).render(<App />);
