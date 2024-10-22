import React, { useEffect } from 'react';
import './index.css';
import { BrowserRouter, HashRouter, Route, Routes } from 'react-router-dom';
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
    RentalCalculatorViewV2,
    RentalCalculatorViewV3,
    ZillowScraperLandingPage,
} from '@bpenwell/rei-layouts';
import { TOOL_IDS } from '@bpenwell/rei-module';

export const App = () => {
    useEffect(() => {
        if (!window.location.hash.includes('#/')) {
            window.location.hash = `#/${window.location.hash}`
        }
    }, [window.location.hash]);

    const wrapPageInLayout = (component: React.JSX.Element) => {
        return (
            <AppLayoutPreview children={component}/>
        );
    }
    return (
        <ErrorBoundary>
            <HashRouter>
                <NavBar />
                <div className='fullPage'>
                    <Routes>
                        <Route path='/' element={wrapPageInLayout(
                                <Home />
                            )} />
                        <Route path='/product'>
                            <Route path={TOOL_IDS.RENTAL_CALCULATOR}>
                                <Route path='create' element={
                                    wrapPageInLayout(
                                        <AuthenticatedPage>
                                            <RentalCalculatorCreation />
                                        </AuthenticatedPage>
                                    )
                                }/>
                                <Route path='createv2' element={
                                    wrapPageInLayout(
                                        <AuthenticatedPage>
                                            <RentalCalculatorCreationV2 />
                                        </AuthenticatedPage>
                                    )
                                }/>
                                <Route path='view' element={
                                    wrapPageInLayout(
                                        <AuthenticatedPage>
                                            <RentalCalculatorViewV3 />
                                        </AuthenticatedPage>
                                    )
                                }/>
                                <Route path='view/:id' element={
                                    wrapPageInLayout(
                                        <AuthenticatedPage>
                                            <RentalCalculator />
                                        </AuthenticatedPage>
                                    )
                                }/>
                                <Route index element={wrapPageInLayout(<RentalCalculatorHome />)} />
                            </Route>
                            <Route path={TOOL_IDS.RENT_ESTIMATOR} element={wrapPageInLayout(<RentEstimatorTool />)}/>
                            <Route path={TOOL_IDS.ZILLOW_SCRAPER} element={wrapPageInLayout(<ZillowScraperLandingPage />)}/>
                            <Route path={TOOL_IDS.BRRRR_CALCULATOR} element={wrapPageInLayout(<BRRRRCalculatorTool />)}/>
                            <Route path={TOOL_IDS.COMPREHENSIVE_PROPERTY_ANALYSIS} element={wrapPageInLayout(<ComprehensivePropertyAnalysis />)}/>
                            <Route path={TOOL_IDS.AI_REAL_ESTATE_AGENT} element={wrapPageInLayout(<AIRealEstateAgent />)}/>
                            <Route index element={<Products />} />
                        </Route>
                        <Route path='/contact-us' element={wrapPageInLayout(<ContactUs />)} />
                        <Route path='/dashboard' element={  
                            wrapPageInLayout(
                                <AuthenticatedPage>
                                    <Dashboard />
                                </AuthenticatedPage>
                            )
                        } />
                        <Route path='*' element={
                            wrapPageInLayout(
                                <PageNotFound />
                            )} />
                    </Routes>
                </div>
                <Footer />
            </HashRouter>
        </ErrorBoundary>
    );
}
