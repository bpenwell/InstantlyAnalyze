var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useState } from 'react';
import './index.css';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { Footer, AuthenticatedPage, ErrorBoundary } from '@bpenwell/rei-components';
import { ContactUs, Tools, Home, NavBar, PageNotFound, Login, SignUp, Dashboard, Preferences } from '@bpenwell/rei-layouts';
export var App = function () {
    var _a = useState(), user = _a[0], setUser = _a[1];
    var authenticatedPageProps = {
        user: user,
        setUser: setUser
    };
    return (_jsx(React.StrictMode, { children: _jsx(ErrorBoundary, { children: _jsxs(BrowserRouter, { children: [_jsx(NavBar, { user: user }), _jsxs(Routes, { children: [_jsx(Route, { path: "/", element: _jsx(Home, {}) }), _jsx(Route, { path: "/tools/:toolId/:pageId?/:instanceId?", element: _jsx(Tools, {}) }), _jsx(Route, { path: "/contact-us", element: _jsx(ContactUs, {}) }), _jsx(Route, { path: "/login", element: _jsx(Login, {}) }), _jsx(Route, { path: "/signup", element: _jsx(SignUp, {}) }), _jsx(Route, { path: "/dashboard", element: _jsx(AuthenticatedPage, __assign({ props: authenticatedPageProps }, { children: _jsx(Dashboard, {}) })) }), _jsx(Route, { path: "/preferences", element: _jsx(AuthenticatedPage, __assign({ props: authenticatedPageProps }, { children: _jsx(Preferences, {}) })) }), _jsx(Route, { path: "*", element: _jsx(PageNotFound, {}) })] }), _jsx(Footer, {})] }) }) }));
};
