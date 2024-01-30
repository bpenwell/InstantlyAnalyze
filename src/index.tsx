import { createRoot } from 'react-dom/client';
import React, { Fragment } from 'react';
import './index.css';
import reportWebVitals from './reportWebVitals';
import { PageProps, Page } from '@bpenwell/rei-components';
import {
  ContactUs,
  Tools,
  Home,
  NavBar,
  PageNotFound,
  Footer,
  Login,
  SignUp,
} from '@bpenwell/rei-layouts';
import {
  HashRouter,
  Route,
  Switch
} from 'react-router-dom';
// Generate React Router with HashRouter
//const router = createHashRouter(ROUTER_ELEMENTS);

const container = document.getElementById('root');
const root = createRoot(container!);

root.render(
  <React.StrictMode>
    <HashRouter>
      <div>
        <Route path="/*">
          <NavBar/>
        </Route>
        <Switch>
          <Route exact path="/">
            <Home/>
          </Route>
          <Route path="/tools/:toolId/:instanceId?">
            <Tools/>
          </Route>
          <Route exact path="/contact-us">
            <ContactUs/>
          </Route>
          <Route exact path="/login">
            <Login/>
          </Route>
          <Route exact path="/signup">
            <SignUp/>
          </Route>
        <Route path="*">
          <PageNotFound/>
        </Route>
        </Switch>
        <Route path="/*">
          <Footer/>
        </Route>
      </div>
    </HashRouter>
  </React.StrictMode>,
);

reportWebVitals();