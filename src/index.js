import { jsx as _jsx } from "react/jsx-runtime";
import './index.css';
import reportWebVitals from './reportWebVitals';
import { App } from './App';
import { createRoot } from 'react-dom/client';
var container = document.getElementById('root');
var root = createRoot(container);
root.render(_jsx(App, {}));
reportWebVitals();
