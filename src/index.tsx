import './index.css';
import reportWebVitals from './reportWebVitals';
import { App } from './App';
import { createRoot } from 'react-dom/client';
import { auth0Props } from '@bpenwell/rei-module';
import { Auth0Provider } from '@auth0/auth0-react';
import '@cloudscape-design/global-styles/index.css'; // Correct import path
import { applyMode, applyDensity, Density, Mode } from '@cloudscape-design/global-styles';

// apply global css settings
applyMode(Mode.Dark);
applyDensity(Density.Comfortable);

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