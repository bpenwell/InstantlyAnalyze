import './index.css';
import React from 'react';
import reportWebVitals from './reportWebVitals';
import { App } from './App';
import { createRoot } from 'react-dom/client';

const container = document.getElementById('root');
const root = createRoot(container!);
root.render(
    <App/>
);

reportWebVitals();

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/service-worker.js').then(registration => {
        console.log('SW registered: ', registration);
        }).catch(registrationError => {
        console.log('SW registration failed: ', registrationError);
        });
    });
}