import React from 'react';
import './index.css';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import {
    Footer,
    AuthenticatedPage,
    ErrorBoundary,
    AppLayoutPreview,
} from '@bpenwell/rei-components';
import { ContactUs,
    Products,
    Home,
    NavBar,
    PageNotFound,
    Dashboard,
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

export const App = () => {
    return (
        <ErrorBoundary>
            <BrowserRouter>
                <NavBar />
                <div className='fullPage'>
                    <Routes>
                        <Route path='/' element={<AppLayoutPreview />} />
                        <Route path='/product'>
                            <Route path={TOOL_IDS.RENTAL_CALCULATOR}>
                                <Route path='create' element={
                                    <AuthenticatedPage>
                                        <RentalCalculatorCreation />
                                    </AuthenticatedPage>
                                }/>
                                <Route path='createv2' element={
                                    <AuthenticatedPage>
                                        <RentalCalculatorCreationV2 />
                                    </AuthenticatedPage>
                                }/>
                                <Route path='view' element={
                                    <AuthenticatedPage>
                                        <RentalCalculatorView />
                                    </AuthenticatedPage>
                                }/>
                                <Route path='view/:id' element={
                                    <AuthenticatedPage>
                                        <RentalCalculator />
                                    </AuthenticatedPage>
                                }/>
                                <Route index element={<RentalCalculatorHome />} />
                            </Route>
                            <Route path={TOOL_IDS.RENT_ESTIMATOR} element={<RentEstimatorTool />}/>
                            <Route path={TOOL_IDS.BRRRR_CALCULATOR} element={<BRRRRCalculatorTool />}/>
                            <Route path={TOOL_IDS.COMPREHENSIVE_PROPERTY_ANALYSIS} element={<ComprehensivePropertyAnalysis />}/>
                            <Route path={TOOL_IDS.AI_REAL_ESTATE_AGENT} element={<AIRealEstateAgent />}/>
                            <Route index element={<Products />} />
                        </Route>
                        <Route path='/contact-us' element={<ContactUs />} />
                        <Route path='/dashboard' element={  
                            <AuthenticatedPage>
                                <Dashboard />
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
