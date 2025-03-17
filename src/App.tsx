import React, {useEffect} from 'react';
import './index.css';
import { BrowserRouter, Route, Routes, useParams } from 'react-router-dom';
import {
    Footer,
    AuthenticatedPage,
    ErrorBoundary,
    AppLayoutPreview,
    Header,
    LoadingBar,
    useLocalStorage,
    LOCAL_STORAGE_KEYS,
    useAppContext,
} from '@bpenwell/instantlyanalyze-components';
import {
    Home,
    PageNotFound,
    Dashboard,
    RentalCalculatorCreation,
    RentalCalculatorCreationV3,
    RentalCalculatorHome,
    RentalCalculator,
    RentEstimatorTool,
    BRRRRCalculatorTool,
    ComprehensivePropertyAnalysis,
    AIRealEstateAgent,
    RentalCalculatorViewV3,
    ZillowScraperLandingPage,
    Profile,
    Subscribe,
    HomeV2,
    PrivacyPolicyAndTerms,
    MissionPage,
    ContactUs,
    ZillowScraperImportPage,
} from '@bpenwell/instantlyanalyze-layouts';
import {
    TOOL_IDS,
    PAGE_PATH,
} from '@bpenwell/instantlyanalyze-module';
import { applyMode, applyDensity, Density, Mode } from '@cloudscape-design/global-styles';

export const App = () => {
    // apply global css settings
    const { getAppDensity, getAppMode } = useAppContext();
    applyDensity(getAppDensity());
    const appMode = getAppMode();
    console.log('appMode root 1', appMode);
    useEffect(() => {
        console.log('appMode root 2', appMode);
        applyMode(appMode);
    }, [appMode])

    const wrapPageInLayout = (component: React.JSX.Element) => {
        return (
            <>
                <Header />
                <AppLayoutPreview children={component}/>
            </>
        );
    }
    const smartAuthComponent = (component: React.JSX.Element) => {
        const { id } = useParams();
        return id === 'demo' ? (
            wrapPageInLayout(component)
        ) : (
            wrapPageInLayout(
                <AuthenticatedPage>
                    {component}
                </AuthenticatedPage>
            )
        );
    };
    return (
        <ErrorBoundary>
            <BrowserRouter>
                <div className='fullPage'>
                    <Routes>
                        <Route path={PAGE_PATH.HOME} element={wrapPageInLayout(
                                <Home />
                            )} />
                        <Route path='/product'>
                            <Route path={TOOL_IDS.RENTAL_REPORT}>
                                <Route path='create' element={
                                    wrapPageInLayout(
                                        <AuthenticatedPage>
                                            <RentalCalculatorCreation />
                                        </AuthenticatedPage>
                                    )
                                }/>
                                <Route path='edit/:id' element={
                                    wrapPageInLayout(
                                        <AuthenticatedPage>
                                            <RentalCalculatorCreation isEditPage={true} />
                                        </AuthenticatedPage>
                                    )
                                }/>
                                <Route path='createv3' element={
                                    wrapPageInLayout(
                                        <AuthenticatedPage>
                                            <RentalCalculatorCreationV3 />
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
                                    smartAuthComponent(<RentalCalculator isShareView={false} />)
                                }/>
                                <Route path='share/:id' element={
                                    wrapPageInLayout(
                                        <RentalCalculator isShareView={true} />
                                    )
                                }/>
                                <Route index element={wrapPageInLayout(<RentalCalculatorHome />)} />
                            </Route>
                            <Route path={TOOL_IDS.RENT_ESTIMATOR} element={wrapPageInLayout(<RentEstimatorTool />)}/>
                            <Route path={TOOL_IDS.ZILLOW_SCRAPER}>
                                <Route path='import' element={
                                    wrapPageInLayout(
                                        <ZillowScraperImportPage />
                                    )
                                }/>
                                <Route index element={wrapPageInLayout(<ZillowScraperLandingPage />)} />
                            </Route>
                            <Route path={TOOL_IDS.BRRRR_CALCULATOR} element={wrapPageInLayout(<BRRRRCalculatorTool />)}/>
                            <Route path={TOOL_IDS.COMPREHENSIVE_PROPERTY_ANALYSIS} element={wrapPageInLayout(<ComprehensivePropertyAnalysis />)}/>
                            <Route path={TOOL_IDS.AI_REAL_ESTATE_AGENT} element={wrapPageInLayout(<AIRealEstateAgent />)}/>
                        </Route>
                        <Route path={PAGE_PATH.PROFILE} element={wrapPageInLayout(<Profile />)} />

                        <Route path={PAGE_PATH.SUBSCRIBE} element={
                            wrapPageInLayout(
                                <AuthenticatedPage>
                                     <Subscribe />
                                 </AuthenticatedPage>
                            )
                        } />

                        <Route path={PAGE_PATH.MISSION} element={wrapPageInLayout(<MissionPage />)} />
                        <Route path={PAGE_PATH.CONTACT_US} element={wrapPageInLayout(<ContactUs />)} />
                        <Route path={PAGE_PATH.DASHBOARD} element={  
                            wrapPageInLayout(
                                <AuthenticatedPage>
                                    <Dashboard />
                                </AuthenticatedPage>
                            )
                        } />
                        <Route path={PAGE_PATH.PRIVACY_POLICY_AND_TERMS} element={wrapPageInLayout(<PrivacyPolicyAndTerms />)} />
                        <Route path='*' element={
                            wrapPageInLayout(
                                <PageNotFound />
                            )} />
                    </Routes>
                </div>
                <Footer />
            </BrowserRouter>
        </ErrorBoundary>
    );
}