import React, { useState } from 'react';
import './index.css';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import {
    Footer,
    AuthenticatedPage,
    IAuthenticatedPageProps,
    ErrorBoundary,
} from '@bpenwell/rei-components';
import { ContactUs,
    Tools,
    Home,
    NavBar,
    PageNotFound,
    Login,
    SignUp,
    Dashboard,
    Preferences,
    RentalCalculatorView,
    RentalCalculatorCreation,
    RentalCalculatorHome,
    RentalCalculator,
    RentEstimatorTool,
    BRRRRCalculatorTool,
    ComprehensivePropertyAnalysis,
    AIRealEstateAgent,
 } from '@bpenwell/rei-layouts';
import { IUserData, TOOL_IDS } from '@bpenwell/rei-module';

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
                    <div className='fullPage'>
                        <Routes >
                            <Route path='/' element={<Home />} />
                            <Route path='/product'>
                                <Route path={TOOL_IDS.RENTAL_CALCULATOR}>
                                    <Route path='create' element={<RentalCalculatorCreation />}/>
                                    <Route path='view' element={<RentalCalculatorView />}/>
                                    <Route path='view/:id' element={<RentalCalculator />}/> {/* Updated Route */}
                                    <Route index element={<RentalCalculatorHome />} />
                                </Route>
                                <Route path={TOOL_IDS.RENT_ESTIMATOR} element={<RentEstimatorTool />}/>
                                <Route path={TOOL_IDS.BRRRR_CALCULATOR} element={<BRRRRCalculatorTool />}/>
                                <Route path={TOOL_IDS.COMPREHENSIVE_PROPERTY_ANALYSIS} element={<ComprehensivePropertyAnalysis />}/>
                                <Route path={TOOL_IDS.AI_REAL_ESTATE_AGENT} element={<AIRealEstateAgent />}/>
                                <Route index element={<Tools />} />
                            </Route>
                            <Route path='/contact-us' element={<ContactUs />} />
                            <Route path='/login' element={<Login />} />
                            <Route path='/signup' element={<SignUp />} />
                            <Route path='/dashboard' element={  
                                <AuthenticatedPage props={authenticatedPageProps}>
                                    <Dashboard />
                                </AuthenticatedPage>
                            } />
                            <Route path='/preferences' element={
                                <AuthenticatedPage props={authenticatedPageProps}>
                                    <Preferences />
                                </AuthenticatedPage>
                            } />
                            <Route path='*' element={<PageNotFound />} />
                        </Routes>
                    </div>
                    <Footer />
                </BrowserRouter>
            </ErrorBoundary>
        </React.StrictMode>
    );
}
