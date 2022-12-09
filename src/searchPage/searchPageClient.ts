import CoveoAnalyticsClient, {ClientOptions, AnalyticsClient, PreparedEvent} from '../client/analytics';
import {
    SearchEventRequest,
    ClickEventRequest,
    CustomEventRequest,
    SearchEventResponse,
    AnyEventResponse,
    ClickEventResponse,
    CustomEventResponse,
} from '../events';
import {
    SearchPageEvents,
    OmniboxSuggestionsMetadata,
    FacetMetadata,
    FacetRangeMetadata,
    CategoryFacetMetadata,
    DocumentIdentifier,
    InterfaceChangeMetadata,
    ResultsSortMetadata,
    PartialDocumentInformation,
    CustomEventsTypes,
    TriggerNotifyMetadata,
    TriggerExecuteMetadata,
    TriggerRedirectMetadata,
    PagerResizeMetadata,
    PagerMetadata,
    FacetBaseMeta,
    FacetSortMeta,
    QueryErrorMeta,
    FacetStateMetadata,
    SmartSnippetFeedbackReason,
    SmartSnippetSuggestionMeta,
    SmartSnippetDocumentIdentifier,
    StaticFilterMetadata,
    StaticFilterToggleValueMetadata,
    UndoTriggerRedirectMetadata,
    SmartSnippetLinkMeta,
} from './searchPageEvents';
import {NoopAnalytics} from '../client/noopAnalytics';
import {formatOmniboxMetadata} from '../formatting/format-omnibox-metadata';
import doNotTrack from '../donottrack';

export interface SearchPageClientProvider {
    getBaseMetadata: () => Record<string, any>;
    getSearchEventRequestPayload: () => Omit<SearchEventRequest, 'actionCause' | 'searchQueryUid'>;
    getSearchUID: () => string;
    getPipeline: () => string;
    getOriginContext?: () => string;
    getOriginLevel1: () => string;
    getOriginLevel2: () => string;
    getOriginLevel3: () => string;
    getLanguage: () => string;
    getIsAnonymous: () => boolean;
    getFacetState?: () => FacetStateMetadata[];
    getSplitTestRunName?: () => string | undefined;
    getSplitTestRunVersion?: () => string | undefined;
}

export interface SearchPageClientOptions extends ClientOptions {
    enableAnalytics: boolean;
}

export type EventDescription = Pick<SearchEventRequest, 'actionCause' | 'customData'>;

export interface EventBuilder<T extends AnyEventResponse = AnyEventResponse> {
    description: EventDescription;
    log: () => Promise<T | void>;
}

export class CoveoSearchPageClient {
    public coveoAnalyticsClient: AnalyticsClient;

    constructor(private opts: Partial<SearchPageClientOptions>, private provider: SearchPageClientProvider) {
        const shouldDisableAnalytics = opts.enableAnalytics === false || doNotTrack();
        this.coveoAnalyticsClient = shouldDisableAnalytics ? new NoopAnalytics() : new CoveoAnalyticsClient(opts);
    }

    public disable() {
        if (this.coveoAnalyticsClient instanceof CoveoAnalyticsClient) {
            this.coveoAnalyticsClient.clear();
        }

        this.coveoAnalyticsClient = new NoopAnalytics();
    }

    public enable() {
        this.coveoAnalyticsClient = new CoveoAnalyticsClient(this.opts);
    }

    public makeInterfaceLoad() {
        return this.makeSearchEvent(SearchPageEvents.interfaceLoad);
    }

    public async logInterfaceLoad() {
        return (await this.makeInterfaceLoad()).log();
    }

    public makeRecommendationInterfaceLoad() {
        return this.makeSearchEvent(SearchPageEvents.recommendationInterfaceLoad);
    }

    public async logRecommendationInterfaceLoad() {
        return (await this.makeRecommendationInterfaceLoad()).log();
    }

    public makeRecommendation() {
        return this.makeCustomEvent(SearchPageEvents.recommendation);
    }

    public async logRecommendation() {
        return (await this.makeRecommendation()).log();
    }

    public makeRecommendationOpen(info: PartialDocumentInformation, identifier: DocumentIdentifier) {
        return this.makeClickEvent(SearchPageEvents.recommendationOpen, info, identifier);
    }

    public async logRecommendationOpen(info: PartialDocumentInformation, identifier: DocumentIdentifier) {
        return (await this.makeRecommendationOpen(info, identifier)).log();
    }

    public makeStaticFilterClearAll(meta: StaticFilterMetadata) {
        return this.makeSearchEvent(SearchPageEvents.staticFilterClearAll, meta);
    }

    public async logStaticFilterClearAll(meta: StaticFilterMetadata) {
        return (await this.makeStaticFilterClearAll(meta)).log();
    }

    public makeStaticFilterSelect(meta: StaticFilterToggleValueMetadata) {
        return this.makeSearchEvent(SearchPageEvents.staticFilterSelect, meta);
    }

    public async logStaticFilterSelect(meta: StaticFilterToggleValueMetadata) {
        return (await this.makeStaticFilterSelect(meta)).log();
    }

    public makeStaticFilterDeselect(meta: StaticFilterToggleValueMetadata) {
        return this.makeSearchEvent(SearchPageEvents.staticFilterDeselect, meta);
    }

    public async logStaticFilterDeselect(meta: StaticFilterToggleValueMetadata) {
        return (await this.makeStaticFilterDeselect(meta)).log();
    }

    public makeFetchMoreResults() {
        return this.makeCustomEvent(SearchPageEvents.pagerScrolling, {type: 'getMoreResults'});
    }

    public async logFetchMoreResults() {
        return (await this.makeFetchMoreResults()).log();
    }

    public makeInterfaceChange(metadata: InterfaceChangeMetadata) {
        return this.makeSearchEvent(SearchPageEvents.interfaceChange, metadata);
    }

    public async logInterfaceChange(metadata: InterfaceChangeMetadata) {
        return (await this.makeInterfaceChange(metadata)).log();
    }

    public makeDidYouMeanAutomatic() {
        return this.makeSearchEvent(SearchPageEvents.didyoumeanAutomatic);
    }

    public async logDidYouMeanAutomatic() {
        return (await this.makeDidYouMeanAutomatic()).log();
    }

    public makeDidYouMeanClick() {
        return this.makeSearchEvent(SearchPageEvents.didyoumeanClick);
    }

    public async logDidYouMeanClick() {
        return (await this.makeDidYouMeanClick()).log();
    }

    public makeResultsSort(metadata: ResultsSortMetadata) {
        return this.makeSearchEvent(SearchPageEvents.resultsSort, metadata);
    }

    public async logResultsSort(metadata: ResultsSortMetadata) {
        return (await this.makeResultsSort(metadata)).log();
    }

    public makeSearchboxSubmit() {
        return this.makeSearchEvent(SearchPageEvents.searchboxSubmit);
    }

    public async logSearchboxSubmit() {
        return (await this.makeSearchboxSubmit()).log();
    }

    public makeSearchboxClear() {
        return this.makeSearchEvent(SearchPageEvents.searchboxClear);
    }

    public async logSearchboxClear() {
        return (await this.makeSearchboxClear()).log();
    }

    public makeSearchboxAsYouType() {
        return this.makeSearchEvent(SearchPageEvents.searchboxAsYouType);
    }

    public async logSearchboxAsYouType() {
        return (await this.makeSearchboxAsYouType()).log();
    }

    public makeBreadcrumbFacet(metadata: FacetMetadata | FacetRangeMetadata | CategoryFacetMetadata) {
        return this.makeSearchEvent(SearchPageEvents.breadcrumbFacet, metadata);
    }

    public async logBreadcrumbFacet(metadata: FacetMetadata | FacetRangeMetadata | CategoryFacetMetadata) {
        return (await this.makeBreadcrumbFacet(metadata)).log();
    }

    public makeBreadcrumbResetAll() {
        return this.makeSearchEvent(SearchPageEvents.breadcrumbResetAll);
    }

    public async logBreadcrumbResetAll() {
        return (await this.makeBreadcrumbResetAll()).log();
    }

    public makeDocumentQuickview(info: PartialDocumentInformation, identifier: DocumentIdentifier) {
        return this.makeClickEvent(SearchPageEvents.documentQuickview, info, identifier);
    }

    public async logDocumentQuickview(info: PartialDocumentInformation, identifier: DocumentIdentifier) {
        return (await this.makeDocumentQuickview(info, identifier)).log();
    }

    public makeDocumentOpen(info: PartialDocumentInformation, identifier: DocumentIdentifier) {
        return this.makeClickEvent(SearchPageEvents.documentOpen, info, identifier);
    }

    public async logDocumentOpen(info: PartialDocumentInformation, identifier: DocumentIdentifier) {
        return (await this.makeDocumentOpen(info, identifier)).log();
    }

    public makeOmniboxAnalytics(meta: OmniboxSuggestionsMetadata) {
        return this.makeSearchEvent(SearchPageEvents.omniboxAnalytics, formatOmniboxMetadata(meta));
    }

    public async logOmniboxAnalytics(meta: OmniboxSuggestionsMetadata) {
        return (await this.makeOmniboxAnalytics(meta)).log();
    }

    public makeOmniboxFromLink(meta: OmniboxSuggestionsMetadata) {
        return this.makeSearchEvent(SearchPageEvents.omniboxFromLink, formatOmniboxMetadata(meta));
    }

    public async logOmniboxFromLink(meta: OmniboxSuggestionsMetadata) {
        return (await this.makeOmniboxFromLink(meta)).log();
    }

    public makeSearchFromLink() {
        return this.makeSearchEvent(SearchPageEvents.searchFromLink);
    }

    public async logSearchFromLink() {
        return (await this.makeSearchFromLink()).log();
    }

    public makeTriggerNotify(meta: TriggerNotifyMetadata) {
        return this.makeCustomEvent(SearchPageEvents.triggerNotify, meta);
    }

    public async logTriggerNotify(meta: TriggerNotifyMetadata) {
        return (await this.makeTriggerNotify(meta)).log();
    }

    public makeTriggerExecute(meta: TriggerExecuteMetadata) {
        return this.makeCustomEvent(SearchPageEvents.triggerExecute, meta);
    }

    public async logTriggerExecute(meta: TriggerExecuteMetadata) {
        return (await this.makeTriggerExecute(meta)).log();
    }

    public makeTriggerQuery() {
        return this.makeCustomEvent(
            SearchPageEvents.triggerQuery,
            {query: this.provider.getSearchEventRequestPayload().queryText},
            'queryPipelineTriggers'
        );
    }

    public async logTriggerQuery() {
        return (await this.makeTriggerQuery()).log();
    }

    public makeUndoTriggerQuery(meta: UndoTriggerRedirectMetadata) {
        return this.makeSearchEvent(SearchPageEvents.undoTriggerQuery, meta);
    }

    public async logUndoTriggerQuery(meta: UndoTriggerRedirectMetadata) {
        return (await this.makeUndoTriggerQuery(meta)).log();
    }

    public makeTriggerRedirect(meta: TriggerRedirectMetadata) {
        return this.makeCustomEvent(SearchPageEvents.triggerRedirect, {
            ...meta,
            query: this.provider.getSearchEventRequestPayload().queryText,
        });
    }

    public async logTriggerRedirect(meta: TriggerRedirectMetadata) {
        return (await this.makeTriggerRedirect(meta)).log();
    }

    public makePagerResize(meta: PagerResizeMetadata) {
        return this.makeCustomEvent(SearchPageEvents.pagerResize, meta);
    }

    public async logPagerResize(meta: PagerResizeMetadata) {
        return (await this.makePagerResize(meta)).log();
    }

    public makePagerNumber(meta: PagerMetadata) {
        return this.makeCustomEvent(SearchPageEvents.pagerNumber, meta);
    }

    public async logPagerNumber(meta: PagerMetadata) {
        return (await this.makePagerNumber(meta)).log();
    }

    public makePagerNext(meta: PagerMetadata) {
        return this.makeCustomEvent(SearchPageEvents.pagerNext, meta);
    }

    public async logPagerNext(meta: PagerMetadata) {
        return (await this.makePagerNext(meta)).log();
    }

    public makePagerPrevious(meta: PagerMetadata) {
        return this.makeCustomEvent(SearchPageEvents.pagerPrevious, meta);
    }

    public async logPagerPrevious(meta: PagerMetadata) {
        return (await this.makePagerPrevious(meta)).log();
    }

    public makePagerScrolling() {
        return this.makeCustomEvent(SearchPageEvents.pagerScrolling);
    }

    public async logPagerScrolling() {
        return (await this.makePagerScrolling()).log();
    }

    public makeFacetClearAll(meta: FacetBaseMeta) {
        return this.makeSearchEvent(SearchPageEvents.facetClearAll, meta);
    }

    public async logFacetClearAll(meta: FacetBaseMeta) {
        return (await this.makeFacetClearAll(meta)).log();
    }

    public makeFacetSearch(meta: FacetBaseMeta) {
        return this.makeSearchEvent(SearchPageEvents.facetSearch, meta);
    }

    public async logFacetSearch(meta: FacetBaseMeta) {
        return (await this.makeFacetSearch(meta)).log();
    }

    public makeFacetSelect(meta: FacetMetadata) {
        return this.makeSearchEvent(SearchPageEvents.facetSelect, meta);
    }

    public async logFacetSelect(meta: FacetMetadata) {
        return (await this.makeFacetSelect(meta)).log();
    }

    public makeFacetDeselect(meta: FacetMetadata) {
        return this.makeSearchEvent(SearchPageEvents.facetDeselect, meta);
    }

    public async logFacetDeselect(meta: FacetMetadata) {
        return (await this.makeFacetDeselect(meta)).log();
    }

    public makeFacetExclude(meta: FacetMetadata) {
        return this.makeSearchEvent(SearchPageEvents.facetExclude, meta);
    }

    public async logFacetExclude(meta: FacetMetadata) {
        return (await this.makeFacetExclude(meta)).log();
    }

    public makeFacetUnexclude(meta: FacetMetadata) {
        return this.makeSearchEvent(SearchPageEvents.facetUnexclude, meta);
    }

    public async logFacetUnexclude(meta: FacetMetadata) {
        return (await this.makeFacetUnexclude(meta)).log();
    }

    public makeFacetSelectAll(meta: FacetBaseMeta) {
        return this.makeSearchEvent(SearchPageEvents.facetSelectAll, meta);
    }

    public async logFacetSelectAll(meta: FacetBaseMeta) {
        return (await this.makeFacetSelectAll(meta)).log();
    }

    public makeFacetUpdateSort(meta: FacetSortMeta) {
        return this.makeSearchEvent(SearchPageEvents.facetUpdateSort, meta);
    }

    public async logFacetUpdateSort(meta: FacetSortMeta) {
        return (await this.makeFacetUpdateSort(meta)).log();
    }

    public makeFacetShowMore(meta: FacetBaseMeta) {
        return this.makeCustomEvent(SearchPageEvents.facetShowMore, meta);
    }

    public async logFacetShowMore(meta: FacetBaseMeta) {
        return (await this.makeFacetShowMore(meta)).log();
    }

    public makeFacetShowLess(meta: FacetBaseMeta) {
        return this.makeCustomEvent(SearchPageEvents.facetShowLess, meta);
    }

    public async logFacetShowLess(meta: FacetBaseMeta) {
        return (await this.makeFacetShowLess(meta)).log();
    }

    public makeQueryError(meta: QueryErrorMeta) {
        return this.makeCustomEvent(SearchPageEvents.queryError, meta);
    }

    public async logQueryError(meta: QueryErrorMeta) {
        return (await this.makeQueryError(meta)).log();
    }

    public async makeQueryErrorBack(): Promise<EventBuilder<SearchEventResponse>> {
        const customEventBuilder = await this.makeCustomEvent(SearchPageEvents.queryErrorBack);
        return {
            description: customEventBuilder.description,
            log: async () => {
                await customEventBuilder.log();
                return this.logSearchEvent(SearchPageEvents.queryErrorBack);
            },
        };
    }

    public async logQueryErrorBack() {
        return (await this.makeQueryErrorBack()).log();
    }

    public async makeQueryErrorRetry(): Promise<EventBuilder<SearchEventResponse>> {
        const customEventBuilder = await this.makeCustomEvent(SearchPageEvents.queryErrorRetry);
        return {
            description: customEventBuilder.description,
            log: async () => {
                await customEventBuilder.log();
                return this.logSearchEvent(SearchPageEvents.queryErrorRetry);
            },
        };
    }

    public async logQueryErrorRetry() {
        return (await this.makeQueryErrorRetry()).log();
    }

    public async makeQueryErrorClear(): Promise<EventBuilder<SearchEventResponse>> {
        const customEventBuilder = await this.makeCustomEvent(SearchPageEvents.queryErrorClear);
        return {
            description: customEventBuilder.description,
            log: async () => {
                await customEventBuilder.log();
                return this.logSearchEvent(SearchPageEvents.queryErrorClear);
            },
        };
    }

    public async logQueryErrorClear() {
        return (await this.makeQueryErrorClear()).log();
    }

    public makeLikeSmartSnippet() {
        return this.makeCustomEvent(SearchPageEvents.likeSmartSnippet);
    }

    public async logLikeSmartSnippet() {
        return (await this.makeLikeSmartSnippet()).log();
    }

    public makeDislikeSmartSnippet() {
        return this.makeCustomEvent(SearchPageEvents.dislikeSmartSnippet);
    }

    public async logDislikeSmartSnippet() {
        return (await this.makeDislikeSmartSnippet()).log();
    }

    public makeExpandSmartSnippet() {
        return this.makeCustomEvent(SearchPageEvents.expandSmartSnippet);
    }

    public async logExpandSmartSnippet() {
        return (await this.makeExpandSmartSnippet()).log();
    }

    public makeCollapseSmartSnippet() {
        return this.makeCustomEvent(SearchPageEvents.collapseSmartSnippet);
    }

    public async logCollapseSmartSnippet() {
        return (await this.makeCollapseSmartSnippet()).log();
    }

    public makeOpenSmartSnippetFeedbackModal() {
        return this.makeCustomEvent(SearchPageEvents.openSmartSnippetFeedbackModal);
    }

    public async logOpenSmartSnippetFeedbackModal() {
        return (await this.makeOpenSmartSnippetFeedbackModal()).log();
    }

    public makeCloseSmartSnippetFeedbackModal() {
        return this.makeCustomEvent(SearchPageEvents.closeSmartSnippetFeedbackModal);
    }

    public async logCloseSmartSnippetFeedbackModal() {
        return (await this.makeCloseSmartSnippetFeedbackModal()).log();
    }

    public makeSmartSnippetFeedbackReason(reason: SmartSnippetFeedbackReason, details?: string) {
        return this.makeCustomEvent(SearchPageEvents.sendSmartSnippetReason, {reason, details});
    }

    public async logSmartSnippetFeedbackReason(reason: SmartSnippetFeedbackReason, details?: string) {
        return (await this.makeSmartSnippetFeedbackReason(reason, details)).log();
    }

    public makeExpandSmartSnippetSuggestion(snippet: SmartSnippetSuggestionMeta | SmartSnippetDocumentIdentifier) {
        return this.makeCustomEvent(
            SearchPageEvents.expandSmartSnippetSuggestion,
            'documentId' in snippet ? snippet : {documentId: snippet}
        );
    }

    public async logExpandSmartSnippetSuggestion(snippet: SmartSnippetSuggestionMeta | SmartSnippetDocumentIdentifier) {
        return (await this.makeExpandSmartSnippetSuggestion(snippet)).log();
    }

    public makeCollapseSmartSnippetSuggestion(snippet: SmartSnippetSuggestionMeta | SmartSnippetDocumentIdentifier) {
        return this.makeCustomEvent(
            SearchPageEvents.collapseSmartSnippetSuggestion,
            'documentId' in snippet ? snippet : {documentId: snippet}
        );
    }

    public async logCollapseSmartSnippetSuggestion(
        snippet: SmartSnippetSuggestionMeta | SmartSnippetDocumentIdentifier
    ) {
        return (await this.makeCollapseSmartSnippetSuggestion(snippet)).log();
    }

    /**
     * @deprecated
     */
    private makeShowMoreSmartSnippetSuggestion(snippet: SmartSnippetSuggestionMeta) {
        return this.makeCustomEvent(SearchPageEvents.showMoreSmartSnippetSuggestion, snippet);
    }

    /**
     * @deprecated
     */
    public async logShowMoreSmartSnippetSuggestion(snippet: SmartSnippetSuggestionMeta) {
        return (await this.makeShowMoreSmartSnippetSuggestion(snippet)).log();
    }

    /**
     * @deprecated
     */
    private makeShowLessSmartSnippetSuggestion(snippet: SmartSnippetSuggestionMeta) {
        return this.makeCustomEvent(SearchPageEvents.showLessSmartSnippetSuggestion, snippet);
    }

    /**
     * @deprecated
     */
    public async logShowLessSmartSnippetSuggestion(snippet: SmartSnippetSuggestionMeta) {
        return (await this.makeShowLessSmartSnippetSuggestion(snippet)).log();
    }

    public makeOpenSmartSnippetSource(info: PartialDocumentInformation, identifier: DocumentIdentifier) {
        return this.makeClickEvent(SearchPageEvents.openSmartSnippetSource, info, identifier);
    }

    public async logOpenSmartSnippetSource(info: PartialDocumentInformation, identifier: DocumentIdentifier) {
        return (await this.makeOpenSmartSnippetSource(info, identifier)).log();
    }

    public makeOpenSmartSnippetSuggestionSource(info: PartialDocumentInformation, snippet: SmartSnippetSuggestionMeta) {
        return this.makeClickEvent(
            SearchPageEvents.openSmartSnippetSuggestionSource,
            info,
            {contentIDKey: snippet.documentId.contentIdKey, contentIDValue: snippet.documentId.contentIdValue},
            snippet
        );
    }

    public makeCopyToClipboard(info: PartialDocumentInformation, identifier: DocumentIdentifier) {
        return this.makeClickEvent(SearchPageEvents.copyToClipboard, info, identifier);
    }

    public async logCopyToClipboard(info: PartialDocumentInformation, identifier: DocumentIdentifier) {
        return (await this.makeCopyToClipboard(info, identifier)).log();
    }

    public async logOpenSmartSnippetSuggestionSource(
        info: PartialDocumentInformation,
        snippet: SmartSnippetSuggestionMeta
    ) {
        return (await this.makeOpenSmartSnippetSuggestionSource(info, snippet)).log();
    }

    public makeOpenSmartSnippetInlineLink(
        info: PartialDocumentInformation,
        identifierAndLink: DocumentIdentifier & SmartSnippetLinkMeta
    ) {
        return this.makeClickEvent(
            SearchPageEvents.openSmartSnippetInlineLink,
            info,
            {contentIDKey: identifierAndLink.contentIDKey, contentIDValue: identifierAndLink.contentIDValue},
            identifierAndLink
        );
    }

    public async logOpenSmartSnippetInlineLink(
        info: PartialDocumentInformation,
        identifierAndLink: DocumentIdentifier & SmartSnippetLinkMeta
    ) {
        return (await this.makeOpenSmartSnippetInlineLink(info, identifierAndLink)).log();
    }

    public makeOpenSmartSnippetSuggestionInlineLink(
        info: PartialDocumentInformation,
        snippetAndLink: SmartSnippetSuggestionMeta & SmartSnippetLinkMeta
    ) {
        return this.makeClickEvent(
            SearchPageEvents.openSmartSnippetSuggestionInlineLink,
            info,
            {
                contentIDKey: snippetAndLink.documentId.contentIdKey,
                contentIDValue: snippetAndLink.documentId.contentIdValue,
            },
            snippetAndLink
        );
    }

    public async logOpenSmartSnippetSuggestionInlineLink(
        info: PartialDocumentInformation,
        snippetAndLink: SmartSnippetSuggestionMeta & SmartSnippetLinkMeta
    ) {
        return (await this.makeOpenSmartSnippetSuggestionInlineLink(info, snippetAndLink)).log();
    }

    public makeRecentQueryClick() {
        return this.makeSearchEvent(SearchPageEvents.recentQueryClick);
    }

    public async logRecentQueryClick() {
        return (await this.makeRecentQueryClick()).log();
    }

    public makeClearRecentQueries() {
        return this.makeCustomEvent(SearchPageEvents.clearRecentQueries);
    }

    public async logClearRecentQueries() {
        return (await this.makeClearRecentQueries()).log();
    }

    public makeRecentResultClick(info: PartialDocumentInformation, identifier: DocumentIdentifier) {
        return this.makeCustomEvent(SearchPageEvents.recentResultClick, {info, identifier});
    }

    public async logRecentResultClick(info: PartialDocumentInformation, identifier: DocumentIdentifier) {
        return (await this.makeRecentResultClick(info, identifier)).log();
    }

    public makeClearRecentResults() {
        return this.makeCustomEvent(SearchPageEvents.clearRecentResults);
    }

    public async logClearRecentResults() {
        return (await this.makeClearRecentResults()).log();
    }

    public makeNoResultsBack() {
        return this.makeSearchEvent(SearchPageEvents.noResultsBack);
    }

    public async logNoResultsBack() {
        return (await this.makeNoResultsBack()).log();
    }

    public makeShowMoreFoldedResults(info: PartialDocumentInformation, identifier: DocumentIdentifier) {
        return this.makeClickEvent(SearchPageEvents.showMoreFoldedResults, info, identifier);
    }

    public async logShowMoreFoldedResults(info: PartialDocumentInformation, identifier: DocumentIdentifier) {
        return (await this.makeShowMoreFoldedResults(info, identifier)).log();
    }

    public makeShowLessFoldedResults() {
        return this.makeCustomEvent(SearchPageEvents.showLessFoldedResults);
    }

    public async logShowLessFoldedResults() {
        return (await this.makeShowLessFoldedResults()).log();
    }

    private makeEventBuilder<T extends AnyEventResponse>(
        actionCause: SearchPageEvents,
        preparedEvent: PreparedEvent<T>
    ): EventBuilder<T> {
        const description: EventDescription = {actionCause, customData: preparedEvent.payload?.customData};
        return {description, log: () => preparedEvent.log()};
    }

    public async makeCustomEvent(
        event: SearchPageEvents,
        metadata?: Record<string, any>,
        eventType: string = CustomEventsTypes[event]!
    ): Promise<EventBuilder<CustomEventResponse>> {
        this.coveoAnalyticsClient.getParameters;
        const customData = {...this.provider.getBaseMetadata(), ...metadata};
        const request: CustomEventRequest = {
            ...(await this.getBaseCustomEventRequest(customData)),
            eventType,
            eventValue: event,
        };
        const preparedEvent = await this.coveoAnalyticsClient.prepareCustomEvent(request);
        return this.makeEventBuilder(event, preparedEvent);
    }

    public async logCustomEvent(
        event: SearchPageEvents,
        metadata?: Record<string, any>,
        eventType: string = CustomEventsTypes[event]!
    ) {
        return (await this.makeCustomEvent(event, metadata, eventType)).log();
    }

    public async makeCustomEventWithType(eventValue: string, eventType: string, metadata?: Record<string, any>) {
        const customData = {...this.provider.getBaseMetadata(), ...metadata};
        const payload: CustomEventRequest = {
            ...(await this.getBaseCustomEventRequest(customData)),
            eventType,
            eventValue,
        };
        const preparedEvent = await this.coveoAnalyticsClient.prepareCustomEvent(payload);
        return this.makeEventBuilder(eventValue as SearchPageEvents, preparedEvent);
    }

    public async logCustomEventWithType(eventValue: string, eventType: string, metadata?: Record<string, any>) {
        return (await this.makeCustomEventWithType(eventValue, eventType, metadata)).log();
    }

    public async logSearchEvent(event: SearchPageEvents, metadata?: Record<string, any>) {
        return (await this.makeSearchEvent(event, metadata)).log();
    }

    public async makeSearchEvent(
        event: SearchPageEvents,
        metadata?: Record<string, any>
    ): Promise<EventBuilder<SearchEventResponse>> {
        const request = await this.getBaseSearchEventRequest(event, metadata);
        const preparedEvent = await this.coveoAnalyticsClient.prepareSearchEvent(request);
        return this.makeEventBuilder(event, preparedEvent);
    }

    public async makeClickEvent(
        event: SearchPageEvents,
        info: PartialDocumentInformation,
        identifier: DocumentIdentifier,
        metadata?: Record<string, any>
    ): Promise<EventBuilder<ClickEventResponse>> {
        const request: ClickEventRequest = {
            ...info,
            ...(await this.getBaseEventRequest({...identifier, ...metadata})),
            searchQueryUid: this.provider.getSearchUID(),
            queryPipeline: this.provider.getPipeline(),
            actionCause: event,
        };
        const preparedEvent = await this.coveoAnalyticsClient.prepareClickEvent(request);
        return this.makeEventBuilder(event, preparedEvent);
    }

    public async logClickEvent(
        event: SearchPageEvents,
        info: PartialDocumentInformation,
        identifier: DocumentIdentifier,
        metadata?: Record<string, any>
    ) {
        return (await this.makeClickEvent(event, info, identifier, metadata)).log();
    }

    private async getBaseSearchEventRequest(
        event: SearchPageEvents,
        metadata?: Record<string, any>
    ): Promise<SearchEventRequest> {
        return {
            ...(await this.getBaseEventRequest(metadata)),
            ...this.provider.getSearchEventRequestPayload(),
            searchQueryUid: this.provider.getSearchUID(),
            queryPipeline: this.provider.getPipeline(),
            actionCause: event,
        };
    }

    private async getBaseCustomEventRequest(metadata?: Record<string, any>) {
        return {
            ...(await this.getBaseEventRequest(metadata)),
            lastSearchQueryUid: this.provider.getSearchUID(),
        };
    }

    private async getBaseEventRequest(metadata?: Record<string, any>) {
        const customData = {...this.provider.getBaseMetadata(), ...metadata};
        return {
            ...this.getOrigins(),
            ...this.getSplitTestRun(),
            customData,
            language: this.provider.getLanguage(),
            facetState: this.provider.getFacetState ? this.provider.getFacetState() : [],
            anonymous: this.provider.getIsAnonymous(),
            clientId: await this.getClientId(),
        };
    }

    private getOrigins() {
        return {
            originContext: this.provider.getOriginContext?.(),
            originLevel1: this.provider.getOriginLevel1(),
            originLevel2: this.provider.getOriginLevel2(),
            originLevel3: this.provider.getOriginLevel3(),
        };
    }

    private getClientId() {
        return this.coveoAnalyticsClient instanceof CoveoAnalyticsClient
            ? this.coveoAnalyticsClient.getCurrentVisitorId()
            : undefined;
    }

    private getSplitTestRun() {
        const splitTestRunName = this.provider.getSplitTestRunName ? this.provider.getSplitTestRunName() : '';
        const splitTestRunVersion = this.provider.getSplitTestRunVersion ? this.provider.getSplitTestRunVersion() : '';
        return {
            ...(splitTestRunName && {splitTestRunName}),
            ...(splitTestRunVersion && {splitTestRunVersion}),
        };
    }
}
