import './index.css';
import React, { useMemo } from 'react';
import reportWebVitals from './reportWebVitals';
import { App } from './App';
import { createRoot } from 'react-dom/client';
import { AppV2 } from '@bpenwell/rei-layouts';
import { auth0Props } from '@bpenwell/rei-module';
import { Auth0Provider } from '@auth0/auth0-react';

const container = document.getElementById('root');
const root = createRoot(container!);
root.render(
    <Auth0Provider {...auth0Props}>
        <App/>
    </Auth0Provider>
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