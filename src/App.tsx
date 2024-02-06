import React, { useState } from 'react';
import './index.css';
import {
  Footer,
  AuthenticatedPage,
  IAuthenticatedPageProps
} from '@bpenwell/rei-components';
import {
  ContactUs,
  Tools,
  Home,
  NavBar,
  PageNotFound,
  Login,
  SignUp,
  Dashboard,
  Preferences,
} from '@bpenwell/rei-layouts';
import {
  BrowserRouter,
  Route,
  Switch
} from 'react-router-dom';

export const App = () => {
    const [token, setToken] = useState<String>();

    const authenticatedPageProps: IAuthenticatedPageProps = {
        token,
        setToken
    };

    return (
        <React.StrictMode>
                <BrowserRouter>
                    <div>
                    <Route path="/*">
                        <NavBar token={token}/>
                    </Route>
                    <Switch>
                        <Route exact path="/">
                            <Home/>
                        </Route>
                        <Route path="/tools/:toolId/:pageId?/:instanceId?" component={Tools}/>
                        <Route exact path="/contact-us">
                            <ContactUs/>
                        </Route>
                        <Route exact path="/login">
                            <Login/>
                        </Route>
                        <Route exact path="/signup">
                            <SignUp/>
                        </Route>
                        <Route exact path="/dashboard">
                            <AuthenticatedPage props={authenticatedPageProps}>
                                <Dashboard/>
                            </AuthenticatedPage>
                        </Route>
                        <Route exact path="/preferences">
                            <AuthenticatedPage props={authenticatedPageProps}>
                                <Preferences/>
                            </AuthenticatedPage>
                        </Route>
                        <Route path="*">
                            <PageNotFound/>
                        </Route>
                    </Switch>
                    <Route path="/*">
                        <Footer/>
                    </Route>
                    </div>
                </BrowserRouter>
        </React.StrictMode>
    );
}
