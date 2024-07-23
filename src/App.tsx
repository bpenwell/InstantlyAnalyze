import React, { useState } from 'react';
import './index.css';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { Footer, AuthenticatedPage, IAuthenticatedPageProps, ErrorBoundary } from '@bpenwell/rei-components';
import { ContactUs, Tools, Home, NavBar, PageNotFound, Login, SignUp, Dashboard, Preferences } from '@bpenwell/rei-layouts';
import { IUserData } from '@bpenwell/rei-module';

export const App = () => {
    const [user, setUser] = useState<IUserData>();

    const authenticatedPageProps: IAuthenticatedPageProps = {
        user,
        setUser
    };

    return (
        <React.StrictMode>
            <ErrorBoundary>
                <BrowserRouter>
                    <NavBar user={user} />
                    <Routes>
                        <Route path="/" element={<Home />} />
                        <Route path="/tools/:toolId/:pageId?/:instanceId?" element={<Tools />} />
                        <Route path="/contact-us" element={<ContactUs />} />
                        <Route path="/login" element={<Login />} />
                        <Route path="/signup" element={<SignUp />} />
                        <Route path="/dashboard" element={
                            <AuthenticatedPage props={authenticatedPageProps}>
                                <Dashboard />
                            </AuthenticatedPage>
                        } />
                        <Route path="/preferences" element={
                            <AuthenticatedPage props={authenticatedPageProps}>
                                <Preferences />
                            </AuthenticatedPage>
                        } />
                        <Route path="*" element={<PageNotFound />} />
                    </Routes>
                    <Footer />
                </BrowserRouter>
            </ErrorBoundary>
        </React.StrictMode>
    );
}
