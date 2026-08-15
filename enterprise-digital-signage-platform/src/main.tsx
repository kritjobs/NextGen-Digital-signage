import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Apply saved theme class before render to prevent flash
const savedTheme = localStorage.getItem('signage_theme') || 'dark';
document.documentElement.classList.add(savedTheme);
document.documentElement.classList.remove(savedTheme === 'dark' ? 'light' : 'dark');

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
