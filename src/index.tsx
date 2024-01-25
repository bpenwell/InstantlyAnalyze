import { createRoot } from 'react-dom/client';
import React from 'react';
import './index.css';
import reportWebVitals from './reportWebVitals';
import { PageProps, Page } from '@bpenwell/rei-components';
import { ROUTER_ELEMENTS, Layout } from '@bpenwell/rei-layouts';
import {
  createBrowserRouter,
  createRoutesFromElements,
  RouterProvider,
} from 'react-router-dom';

/*const props: PageProps = {
  onCreateAccount: () => {},
  onLogin: () => {},
  onLogout: () => {},
};*/
//      <Page {...props} />


//Generates React Router
const router = createBrowserRouter(ROUTER_ELEMENTS);


const container = document.getElementById('root');
const root = createRoot(container!); // createRoot(container!) if you use TypeScript
root.render(
  <React.StrictMode>
    <RouterProvider router={router}/>
    </React.StrictMode>,
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
