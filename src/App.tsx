import React from 'react';
import './index.css';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import {
    Footer,
    AuthenticatedPage,
    ErrorBoundary,
} from '@bpenwell/rei-components';
import { ContactUs,
    Products,
    Home,
    NavBar,
    PageNotFound,
    Login,
    SignUp,
    Dashboard,
    Preferences,
    RentalCalculatorView,
    RentalCalculatorCreation,
    RentalCalculatorCreationV2,
    RentalCalculatorHome,
    RentalCalculator,
    RentEstimatorTool,
    BRRRRCalculatorTool,
    ComprehensivePropertyAnalysis,
    AIRealEstateAgent,
 } from '@bpenwell/rei-layouts';
import { TOOL_IDS } from '@bpenwell/rei-module';
import { AppV2 } from '@bpenwell/rei-layouts';

export const App = () => {
    return (
        <ErrorBoundary>
            <BrowserRouter>
                <NavBar />
                <div className='fullPage'>
                    <Routes>
                        <Route path='/test-auth' element={<AppV2 />} />
                        <Route path='/' element={<Home />} />
                        <Route path='/product'>
                            <Route path={TOOL_IDS.RENTAL_CALCULATOR}>
                                <Route path='create' element={<RentalCalculatorCreation />}/>
                                <Route path='createv2' element={<RentalCalculatorCreationV2 />}/>
                                <Route path='view' element={<RentalCalculatorView />}/>
                                <Route path='view/:id' element={<RentalCalculator />}/> {/* Updated Route */}
                                <Route index element={<RentalCalculatorHome />} />
                            </Route>
                            <Route path={TOOL_IDS.RENT_ESTIMATOR} element={<RentEstimatorTool />}/>
                            <Route path={TOOL_IDS.BRRRR_CALCULATOR} element={<BRRRRCalculatorTool />}/>
                            <Route path={TOOL_IDS.COMPREHENSIVE_PROPERTY_ANALYSIS} element={<ComprehensivePropertyAnalysis />}/>
                            <Route path={TOOL_IDS.AI_REAL_ESTATE_AGENT} element={<AIRealEstateAgent />}/>
                            <Route index element={<Products />} />
                        </Route>
                        <Route path='/contact-us' element={<ContactUs />} />
                        <Route path='/login' element={<Login />} />
                        <Route path='/signup' element={<SignUp />} />
                        <Route path='/dashboard' element={  
                            <AuthenticatedPage>
                                <Dashboard />
                            </AuthenticatedPage>
                        } />
                        <Route path='/preferences' element={
                            <AuthenticatedPage>
                                <Preferences />
                            </AuthenticatedPage>
                        } />
                        <Route path='*' element={<PageNotFound />} />
                    </Routes>
                </div>
                <Footer />
            </BrowserRouter>
        </ErrorBoundary>
    );
}
