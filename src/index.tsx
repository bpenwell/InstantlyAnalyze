import { createRoot } from 'react-dom/client';
import React, { useState } from 'react';
import './index.css';
import reportWebVitals from './reportWebVitals';
import { App } from './App';

// Generate React Router with HashRouter
//const router = createHashRouter(ROUTER_ELEMENTS);

const container = document.getElementById('root');
const root = createRoot(container!);
root.render(<App/>);

reportWebVitals();