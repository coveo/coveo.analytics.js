import * as analytics from '../client/analytics';
import * as donottrack from '../donottrack';
import * as history from '../history';
import * as SimpleAnalytics from './simpleanalytics';
import * as storage from '../storage';
export {CoveoAnalyticsClient, AnalyticsClientSendEventHook} from '../client/analytics';
export {PreprocessAnalyticsRequest, AnalyticsClientOrigin} from '../client/analyticsRequestClient';
export {IRuntimeEnvironment} from '../client/runtimeEnvironment';
export {CoveoUA, getCurrentClient, handleOneAnalyticsEvent} from './simpleanalytics';
export {
    CoveoSearchPageClient,
    SearchPageClientProvider,
    EventDescription,
    EventBuilder,
} from '../searchPage/searchPageClient';
export * from '../searchPage/searchPageEvents';
export {CaseAssistClient} from '../caseAssist/caseAssistClient';
export {SearchEventResponse} from '../events';

export {analytics, donottrack, history, SimpleAnalytics, storage};
