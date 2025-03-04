import React from 'react';
import './index.css';
import { BrowserRouter, Route, Routes, useParams } from 'react-router-dom';
import {
    Footer,
    AuthenticatedPage,
    ErrorBoundary,
    AppLayoutPreview,
    AppContextProvider,
    Header,
    LoadingBar,
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
    SubscribeOutcome,
} from '@bpenwell/instantlyanalyze-layouts';
import {
    TOOL_IDS,
    PAGE_PATH,
    LOCAL_STORAGE_KEYS,
    useLocalStorage,
} from '@bpenwell/instantlyanalyze-module';
import { applyMode, applyDensity, Density, Mode } from '@cloudscape-design/global-styles';
import { useAuth0 } from '@auth0/auth0-react';

export const App = () => {
    const auth0 = useAuth0();
    // apply global css settings
    const [appMode] = useLocalStorage<Mode>(LOCAL_STORAGE_KEYS.APP_MODE);
    const [appDensity] = useLocalStorage<Density>(LOCAL_STORAGE_KEYS.APP_DENSITY);
    applyMode(appMode);
    applyDensity(appDensity);

    //Only for hash router
    /*useEffect(() => {
        if (!window.location.hash.includes('#/')) {
            window.location.hash = `#/${window.location.hash}`
        }
    }, [window.location.hash]);*/

    const wrapPageInLayout = (component: React.JSX.Element) => {
        return (
            <AppContextProvider>
                <Header />
                {/* */}
                <AppLayoutPreview children={component}/>
            </AppContextProvider>
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
                                            <RentalCalculatorCreation auth0={auth0} />
                                        </AuthenticatedPage>
                                    )
                                }/>
                                <Route path='edit/:id' element={
                                    wrapPageInLayout(
                                        <AuthenticatedPage>
                                            <RentalCalculatorCreation auth0={auth0} isEditPage={true} />
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
                                <Subscribe />
                            )
                        } />
                        <Route path={PAGE_PATH.SUBSCRIBE_OUTCOME} element={
                            wrapPageInLayout(
                                <SubscribeOutcome />
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