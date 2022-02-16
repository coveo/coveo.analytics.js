import CoveoAnalyticsClient, {ClientOptions, AnalyticsClient} from '../client/analytics';
import {SearchEventRequest, ClickEventRequest, CustomEventRequest, SearchEventResponse} from '../events';
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
    StaticFilterMetadata,
    StaticFilterToggleValueMetadata,
} from './searchPageEvents';
import {NoopAnalytics} from '../client/noopAnalytics';
import {formatOmniboxMetadata} from '../formatting/format-omnibox-metadata';

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
}

export interface SearchPageClientOptions extends ClientOptions {
    enableAnalytics: boolean;
}

export type EventDescription = Pick<SearchEventRequest, 'actionCause' | 'customData'>;

export interface EventBuilder {
    description: EventDescription;
    log: () => Promise<SearchEventResponse | void>;
}

export class CoveoSearchPageClient {
    public coveoAnalyticsClient: AnalyticsClient;

    constructor(private opts: Partial<SearchPageClientOptions>, private provider: SearchPageClientProvider) {
        this.coveoAnalyticsClient =
            opts.enableAnalytics === false ? new NoopAnalytics() : new CoveoAnalyticsClient(opts);
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

    public logInterfaceLoad() {
        return this.logSearchEvent(SearchPageEvents.interfaceLoad);
    }

    public buildInterfaceLoad(): EventBuilder {
        return {
            ...this.getDescription(SearchPageEvents.interfaceLoad),
            log: () => this.logInterfaceLoad(),
        };
    }

    public logRecommendationInterfaceLoad() {
        return this.logSearchEvent(SearchPageEvents.recommendationInterfaceLoad);
    }

    public buildRecommendationInterfaceLoad(): EventBuilder {
        return {
            ...this.getDescription(SearchPageEvents.recommendationInterfaceLoad),
            log: () => this.logRecommendationInterfaceLoad(),
        };
    }

    public logRecommendation() {
        return this.logCustomEvent(SearchPageEvents.recommendation);
    }

    public buildRecommendation(): EventBuilder {
        return {
            ...this.getDescription(SearchPageEvents.recommendation),
            log: () => this.logRecommendation(),
        };
    }

    public logRecommendationOpen(info: PartialDocumentInformation, identifier: DocumentIdentifier) {
        return this.logClickEvent(SearchPageEvents.recommendationOpen, info, identifier);
    }

    public buildRecommendationOpen(info: PartialDocumentInformation, identifier: DocumentIdentifier): EventBuilder {
        return {
            ...this.getDescription(SearchPageEvents.recommendationOpen, {...identifier}),
            log: () => this.logRecommendationOpen(info, identifier),
        };
    }

    public logStaticFilterClearAll(meta: StaticFilterMetadata) {
        return this.logSearchEvent(SearchPageEvents.staticFilterClearAll, meta);
    }

    public buildStaticFilterClearAll(meta: StaticFilterMetadata): EventBuilder {
        return {
            ...this.getDescription(SearchPageEvents.staticFilterClearAll, meta),
            log: () => this.logStaticFilterClearAll(meta),
        };
    }

    public logStaticFilterSelect(meta: StaticFilterToggleValueMetadata) {
        return this.logSearchEvent(SearchPageEvents.staticFilterSelect, meta);
    }

    public buildStaticFilterSelect(meta: StaticFilterToggleValueMetadata): EventBuilder {
        return {
            ...this.getDescription(SearchPageEvents.staticFilterSelect, meta),
            log: () => this.logStaticFilterSelect(meta),
        };
    }

    public logStaticFilterDeselect(meta: StaticFilterToggleValueMetadata) {
        return this.logSearchEvent(SearchPageEvents.staticFilterDeselect, meta);
    }

    public buildStaticFilterDeselect(meta: StaticFilterToggleValueMetadata): EventBuilder {
        return {
            ...this.getDescription(SearchPageEvents.staticFilterDeselect, meta),
            log: () => this.logStaticFilterDeselect(meta),
        };
    }

    public logFetchMoreResults() {
        return this.logCustomEvent(SearchPageEvents.pagerScrolling, {type: 'getMoreResults'});
    }

    public buildFetchMoreResults(): EventBuilder {
        return {
            ...this.getDescription(SearchPageEvents.pagerScrolling),
            log: () => this.logFetchMoreResults(),
        };
    }

    public logInterfaceChange(metadata: InterfaceChangeMetadata) {
        return this.logSearchEvent(SearchPageEvents.interfaceChange, metadata);
    }

    public buildInterfaceChange(metadata: InterfaceChangeMetadata): EventBuilder {
        return {
            ...this.getDescription(SearchPageEvents.interfaceChange, metadata),
            log: () => this.logInterfaceChange(metadata),
        };
    }

    public logDidYouMeanAutomatic() {
        return this.logSearchEvent(SearchPageEvents.didyoumeanAutomatic);
    }

    public buildDidYouMeanAutomatic(): EventBuilder {
        return {
            ...this.getDescription(SearchPageEvents.didyoumeanAutomatic),
            log: () => this.logDidYouMeanAutomatic(),
        };
    }

    public logDidYouMeanClick() {
        return this.logSearchEvent(SearchPageEvents.didyoumeanClick);
    }

    public buildDidYouMeanClick(): EventBuilder {
        return {
            ...this.getDescription(SearchPageEvents.didyoumeanClick),
            log: () => this.logDidYouMeanClick(),
        };
    }

    public logResultsSort(metadata: ResultsSortMetadata) {
        return this.logSearchEvent(SearchPageEvents.resultsSort, metadata);
    }

    public buildResultsSort(metadata: ResultsSortMetadata): EventBuilder {
        return {
            ...this.getDescription(SearchPageEvents.resultsSort, metadata),
            log: () => this.logResultsSort(metadata),
        };
    }

    public logSearchboxSubmit() {
        return this.logSearchEvent(SearchPageEvents.searchboxSubmit);
    }

    public buildSearchboxSubmit(): EventBuilder {
        return {
            ...this.getDescription(SearchPageEvents.searchboxSubmit),
            log: () => this.logSearchboxSubmit(),
        };
    }

    public logSearchboxClear() {
        return this.logSearchEvent(SearchPageEvents.searchboxClear);
    }

    public buildSearchboxClear(): EventBuilder {
        return {
            ...this.getDescription(SearchPageEvents.searchboxClear),
            log: () => this.logSearchboxClear(),
        };
    }

    public logSearchboxAsYouType() {
        return this.logSearchEvent(SearchPageEvents.searchboxAsYouType);
    }

    public buildSearchboxAsYouType(): EventBuilder {
        return {
            ...this.getDescription(SearchPageEvents.searchboxAsYouType),
            log: () => this.logSearchboxAsYouType(),
        };
    }

    public logBreadcrumbFacet(metadata: FacetMetadata | FacetRangeMetadata | CategoryFacetMetadata) {
        return this.logSearchEvent(SearchPageEvents.breadcrumbFacet, metadata);
    }

    public buildBreadcrumbFacet(metadata: FacetMetadata | FacetRangeMetadata | CategoryFacetMetadata): EventBuilder {
        return {
            ...this.getDescription(SearchPageEvents.breadcrumbFacet, metadata),
            log: () => this.logBreadcrumbFacet(metadata),
        };
    }

    public logBreadcrumbResetAll() {
        return this.logSearchEvent(SearchPageEvents.breadcrumbResetAll);
    }

    public buildBreadcrumbResetAll(): EventBuilder {
        return {
            ...this.getDescription(SearchPageEvents.breadcrumbResetAll),
            log: () => this.logBreadcrumbResetAll(),
        };
    }

    public logDocumentQuickview(info: PartialDocumentInformation, identifier: DocumentIdentifier) {
        return this.logClickEvent(SearchPageEvents.documentQuickview, info, identifier);
    }

    public buildDocumentQuickview(info: PartialDocumentInformation, identifier: DocumentIdentifier): EventBuilder {
        return {
            ...this.getDescription(SearchPageEvents.documentQuickview, {...identifier}),
            log: () => this.logDocumentQuickview(info, identifier),
        };
    }

    public logDocumentOpen(info: PartialDocumentInformation, identifier: DocumentIdentifier) {
        return this.logClickEvent(SearchPageEvents.documentOpen, info, identifier);
    }

    public buildDocumentOpen(info: PartialDocumentInformation, identifier: DocumentIdentifier): EventBuilder {
        return {
            ...this.getDescription(SearchPageEvents.documentOpen, {...identifier}),
            log: () => this.logDocumentOpen(info, identifier),
        };
    }

    public logOmniboxAnalytics(meta: OmniboxSuggestionsMetadata) {
        return this.logSearchEvent(SearchPageEvents.omniboxAnalytics, formatOmniboxMetadata(meta));
    }

    public buildOmniboxAnalytics(meta: OmniboxSuggestionsMetadata): EventBuilder {
        return {
            ...this.getDescription(SearchPageEvents.omniboxAnalytics, formatOmniboxMetadata(meta)),
            log: () => this.logOmniboxAnalytics(meta),
        };
    }

    public logOmniboxFromLink(meta: OmniboxSuggestionsMetadata) {
        return this.logSearchEvent(SearchPageEvents.omniboxFromLink, formatOmniboxMetadata(meta));
    }

    public buildOmniboxFromLink(meta: OmniboxSuggestionsMetadata): EventBuilder {
        return {
            ...this.getDescription(SearchPageEvents.omniboxFromLink, formatOmniboxMetadata(meta)),
            log: () => this.logOmniboxFromLink(meta),
        };
    }

    public logSearchFromLink() {
        return this.logSearchEvent(SearchPageEvents.searchFromLink);
    }

    public buildSearchFromLink(): EventBuilder {
        return {
            ...this.getDescription(SearchPageEvents.searchFromLink),
            log: () => this.logSearchFromLink(),
        };
    }

    public logTriggerNotify(meta: TriggerNotifyMetadata) {
        return this.logCustomEvent(SearchPageEvents.triggerNotify, meta);
    }

    public buildTriggerNotify(meta: TriggerNotifyMetadata): EventBuilder {
        return {
            ...this.getDescription(SearchPageEvents.triggerNotify, meta),
            log: () => this.logTriggerNotify(meta),
        };
    }

    public logTriggerExecute(meta: TriggerExecuteMetadata) {
        return this.logCustomEvent(SearchPageEvents.triggerExecute, meta);
    }

    public buildTriggerExecute(meta: TriggerExecuteMetadata): EventBuilder {
        return {
            ...this.getDescription(SearchPageEvents.triggerExecute, meta),
            log: () => this.logTriggerExecute(meta),
        };
    }

    public logTriggerQuery() {
        const meta = {query: this.provider.getSearchEventRequestPayload().queryText};
        return this.logCustomEvent(SearchPageEvents.triggerQuery, meta);
    }

    public buildTriggerQuery(): EventBuilder {
        const meta = {query: this.provider.getSearchEventRequestPayload().queryText};
        return {
            ...this.getDescription(SearchPageEvents.triggerQuery, meta),
            log: () => this.logTriggerQuery(),
        };
    }

    public logTriggerRedirect(meta: TriggerRedirectMetadata) {
        const allMeta = {...meta, query: this.provider.getSearchEventRequestPayload().queryText};
        return this.logCustomEvent(SearchPageEvents.triggerRedirect, allMeta);
    }

    public buildTriggerRedirect(meta: TriggerRedirectMetadata): EventBuilder {
        const allMeta = {...meta, query: this.provider.getSearchEventRequestPayload().queryText};
        return {
            ...this.getDescription(SearchPageEvents.triggerRedirect, allMeta),
            log: () => this.logTriggerRedirect(meta),
        };
    }

    public logPagerResize(meta: PagerResizeMetadata) {
        return this.logCustomEvent(SearchPageEvents.pagerResize, meta);
    }

    public buildPagerResize(meta: PagerResizeMetadata): EventBuilder {
        return {
            ...this.getDescription(SearchPageEvents.pagerResize, meta),
            log: () => this.logPagerResize(meta),
        };
    }

    public logPagerNumber(meta: PagerMetadata) {
        return this.logCustomEvent(SearchPageEvents.pagerNumber, meta);
    }

    public buildPagerNumber(meta: PagerMetadata): EventBuilder {
        return {
            ...this.getDescription(SearchPageEvents.pagerNumber, meta),
            log: () => this.logPagerNumber(meta),
        };
    }

    public logPagerNext(meta: PagerMetadata) {
        return this.logCustomEvent(SearchPageEvents.pagerNext, meta);
    }

    public buildPagerNext(meta: PagerMetadata): EventBuilder {
        return {
            ...this.getDescription(SearchPageEvents.pagerNext, meta),
            log: () => this.logPagerNext(meta),
        };
    }

    public logPagerPrevious(meta: PagerMetadata) {
        return this.logCustomEvent(SearchPageEvents.pagerPrevious, meta);
    }

    public buildPagerPrevious(meta: PagerMetadata): EventBuilder {
        return {
            ...this.getDescription(SearchPageEvents.pagerPrevious, meta),
            log: () => this.logPagerPrevious(meta),
        };
    }

    public logPagerScrolling() {
        return this.logCustomEvent(SearchPageEvents.pagerScrolling);
    }

    public buildPagerScrolling(): EventBuilder {
        return {
            ...this.getDescription(SearchPageEvents.pagerScrolling),
            log: () => this.logPagerScrolling(),
        };
    }

    public logFacetClearAll(meta: FacetBaseMeta) {
        return this.logSearchEvent(SearchPageEvents.facetClearAll, meta);
    }

    public buildFacetClearAll(meta: FacetBaseMeta): EventBuilder {
        return {
            ...this.getDescription(SearchPageEvents.facetClearAll, meta),
            log: () => this.logFacetClearAll(meta),
        };
    }

    public logFacetSearch(meta: FacetBaseMeta) {
        return this.logSearchEvent(SearchPageEvents.facetSearch, meta);
    }

    public buildFacetSearch(meta: FacetBaseMeta): EventBuilder {
        return {
            ...this.getDescription(SearchPageEvents.facetSearch, meta),
            log: () => this.logFacetSearch(meta),
        };
    }

    public logFacetSelect(meta: FacetMetadata) {
        return this.logSearchEvent(SearchPageEvents.facetSelect, meta);
    }

    public buildFacetSelect(meta: FacetMetadata): EventBuilder {
        return {
            ...this.getDescription(SearchPageEvents.facetSelect, meta),
            log: () => this.logFacetSelect(meta),
        };
    }

    public logFacetDeselect(meta: FacetMetadata) {
        return this.logSearchEvent(SearchPageEvents.facetDeselect, meta);
    }

    public buildFacetDeselect(meta: FacetMetadata): EventBuilder {
        return {
            ...this.getDescription(SearchPageEvents.facetDeselect, meta),
            log: () => this.logFacetDeselect(meta),
        };
    }

    public logFacetExclude(meta: FacetMetadata) {
        return this.logSearchEvent(SearchPageEvents.facetExclude, meta);
    }

    public buildFacetExclude(meta: FacetMetadata): EventBuilder {
        return {
            ...this.getDescription(SearchPageEvents.facetExclude, meta),
            log: () => this.logFacetExclude(meta),
        };
    }

    public logFacetUnexclude(meta: FacetMetadata) {
        return this.logSearchEvent(SearchPageEvents.facetUnexclude, meta);
    }

    public buildFacetUnexclude(meta: FacetMetadata): EventBuilder {
        return {
            ...this.getDescription(SearchPageEvents.facetUnexclude, meta),
            log: () => this.logFacetUnexclude(meta),
        };
    }

    public logFacetSelectAll(meta: FacetBaseMeta) {
        return this.logSearchEvent(SearchPageEvents.facetSelectAll, meta);
    }

    public buildFacetSelectAll(meta: FacetBaseMeta): EventBuilder {
        return {
            ...this.getDescription(SearchPageEvents.facetSelectAll, meta),
            log: () => this.logFacetSelectAll(meta),
        };
    }

    public logFacetUpdateSort(meta: FacetSortMeta) {
        return this.logSearchEvent(SearchPageEvents.facetUpdateSort, meta);
    }

    public buildFacetUpdateSort(meta: FacetSortMeta): EventBuilder {
        return {
            ...this.getDescription(SearchPageEvents.facetUpdateSort, meta),
            log: () => this.logFacetUpdateSort(meta),
        };
    }

    public logFacetShowMore(meta: FacetBaseMeta) {
        return this.logCustomEvent(SearchPageEvents.facetShowMore, meta);
    }

    public buildFacetShowMore(meta: FacetBaseMeta): EventBuilder {
        return {
            ...this.getDescription(SearchPageEvents.facetShowMore, meta),
            log: () => this.logFacetShowMore(meta),
        };
    }

    public logFacetShowLess(meta: FacetBaseMeta) {
        return this.logCustomEvent(SearchPageEvents.facetShowLess, meta);
    }

    public buildFacetShowLess(meta: FacetBaseMeta): EventBuilder {
        return {
            ...this.getDescription(SearchPageEvents.facetShowLess, meta),
            log: () => this.logFacetShowLess(meta),
        };
    }

    public logQueryError(meta: QueryErrorMeta) {
        return this.logCustomEvent(SearchPageEvents.queryError, meta);
    }

    public buildQueryError(meta: QueryErrorMeta): EventBuilder {
        return {
            ...this.getDescription(SearchPageEvents.queryError, meta),
            log: () => this.logQueryError(meta),
        };
    }

    public async logQueryErrorBack() {
        await this.logCustomEvent(SearchPageEvents.queryErrorBack);
        return this.logSearchEvent(SearchPageEvents.queryErrorBack);
    }

    public buildQueryErrorBack(): EventBuilder {
        return {
            ...this.getDescription(SearchPageEvents.queryErrorBack),
            log: () => this.logQueryErrorBack(),
        };
    }

    public async logQueryErrorRetry() {
        await this.logCustomEvent(SearchPageEvents.queryErrorRetry);
        return this.logSearchEvent(SearchPageEvents.queryErrorRetry);
    }

    public buildQueryErrorRetry(): EventBuilder {
        return {
            ...this.getDescription(SearchPageEvents.queryErrorRetry),
            log: () => this.logQueryErrorRetry(),
        };
    }

    public async logQueryErrorClear() {
        await this.logCustomEvent(SearchPageEvents.queryErrorClear);
        return this.logSearchEvent(SearchPageEvents.queryErrorClear);
    }

    public buildQueryErrorClear(): EventBuilder {
        return {
            ...this.getDescription(SearchPageEvents.queryErrorClear),
            log: () => this.logQueryErrorClear(),
        };
    }

    public logLikeSmartSnippet() {
        return this.logCustomEvent(SearchPageEvents.likeSmartSnippet);
    }

    public buildLikeSmartSnippet(): EventBuilder {
        return {
            ...this.getDescription(SearchPageEvents.likeSmartSnippet),
            log: () => this.logLikeSmartSnippet(),
        };
    }

    public logDislikeSmartSnippet() {
        return this.logCustomEvent(SearchPageEvents.dislikeSmartSnippet);
    }

    public buildDislikeSmartSnippet(): EventBuilder {
        return {
            ...this.getDescription(SearchPageEvents.dislikeSmartSnippet),
            log: () => this.logDislikeSmartSnippet(),
        };
    }

    public logExpandSmartSnippet() {
        return this.logCustomEvent(SearchPageEvents.expandSmartSnippet);
    }

    public buildExpandSmartSnippet(): EventBuilder {
        return {
            ...this.getDescription(SearchPageEvents.expandSmartSnippet),
            log: () => this.logExpandSmartSnippet(),
        };
    }

    public logCollapseSmartSnippet() {
        return this.logCustomEvent(SearchPageEvents.collapseSmartSnippet);
    }

    public buildCollapseSmartSnippet(): EventBuilder {
        return {
            ...this.getDescription(SearchPageEvents.collapseSmartSnippet),
            log: () => this.logCollapseSmartSnippet(),
        };
    }

    public logOpenSmartSnippetFeedbackModal() {
        return this.logCustomEvent(SearchPageEvents.openSmartSnippetFeedbackModal);
    }

    public buildOpenSmartSnippetFeedbackModal(): EventBuilder {
        return {
            ...this.getDescription(SearchPageEvents.openSmartSnippetFeedbackModal),
            log: () => this.logOpenSmartSnippetFeedbackModal(),
        };
    }

    public logCloseSmartSnippetFeedbackModal() {
        return this.logCustomEvent(SearchPageEvents.closeSmartSnippetFeedbackModal);
    }

    public buildCloseSmartSnippetFeedbackModal(): EventBuilder {
        return {
            ...this.getDescription(SearchPageEvents.closeSmartSnippetFeedbackModal),
            log: () => this.logCloseSmartSnippetFeedbackModal(),
        };
    }

    public logSmartSnippetFeedbackReason(reason: SmartSnippetFeedbackReason, details?: string) {
        return this.logCustomEvent(SearchPageEvents.sendSmartSnippetReason, {reason, details});
    }

    public buildSmartSnippetFeedbackReason(reason: SmartSnippetFeedbackReason, details?: string): EventBuilder {
        return {
            ...this.getDescription(SearchPageEvents.sendSmartSnippetReason, {reason, details}),
            log: () => this.logSmartSnippetFeedbackReason(reason, details),
        };
    }

    public logExpandSmartSnippetSuggestion(documentId: SmartSnippetSuggestionMeta) {
        return this.logCustomEvent(SearchPageEvents.expandSmartSnippetSuggestion, {documentId});
    }

    public buildExpandSmartSnippetSuggestion(documentId: SmartSnippetSuggestionMeta): EventBuilder {
        return {
            ...this.getDescription(SearchPageEvents.expandSmartSnippetSuggestion, {documentId}),
            log: () => this.logExpandSmartSnippetSuggestion(documentId),
        };
    }

    public logCollapseSmartSnippetSuggestion(documentId: SmartSnippetSuggestionMeta) {
        return this.logCustomEvent(SearchPageEvents.collapseSmartSnippetSuggestion, {documentId});
    }

    public buildCollapseSmartSnippetSuggestion(documentId: SmartSnippetSuggestionMeta): EventBuilder {
        return {
            ...this.getDescription(SearchPageEvents.collapseSmartSnippetSuggestion, {documentId}),
            log: () => this.logCollapseSmartSnippetSuggestion(documentId),
        };
    }

    public logRecentQueryClick() {
        return this.logSearchEvent(SearchPageEvents.recentQueryClick);
    }

    public buildRecentQueryClick(): EventBuilder {
        return {
            ...this.getDescription(SearchPageEvents.recentQueryClick),
            log: () => this.logRecentQueryClick(),
        };
    }

    public logClearRecentQueries() {
        return this.logCustomEvent(SearchPageEvents.clearRecentQueries);
    }

    public buildClearRecentQueries(): EventBuilder {
        return {
            ...this.getDescription(SearchPageEvents.clearRecentQueries),
            log: () => this.logClearRecentQueries(),
        };
    }

    public logRecentResultClick(info: PartialDocumentInformation, identifier: DocumentIdentifier) {
        return this.logCustomEvent(SearchPageEvents.recentResultClick, {info, identifier});
    }

    public buildRecentResultClick(info: PartialDocumentInformation, identifier: DocumentIdentifier): EventBuilder {
        return {
            ...this.getDescription(SearchPageEvents.recentResultClick, {info, identifier}),
            log: () => this.logRecentResultClick(info, identifier),
        };
    }

    public logClearRecentResults() {
        return this.logCustomEvent(SearchPageEvents.clearRecentResults);
    }

    public buildClearRecentResults(): EventBuilder {
        return {
            ...this.getDescription(SearchPageEvents.clearRecentResults),
            log: () => this.logClearRecentResults(),
        };
    }

    public logNoResultsBack() {
        return this.logSearchEvent(SearchPageEvents.noResultsBack);
    }

    public buildNoResultsBack(): EventBuilder {
        return {
            ...this.getDescription(SearchPageEvents.noResultsBack),
            log: () => this.logNoResultsBack(),
        };
    }

    public async logCustomEvent(event: SearchPageEvents, metadata?: Record<string, any>) {
        const customData = {...this.provider.getBaseMetadata(), ...metadata};

        const payload: CustomEventRequest = {
            ...(await this.getBaseCustomEventRequest(customData)),
            eventType: CustomEventsTypes[event]!,
            eventValue: event,
        };

        return this.coveoAnalyticsClient.sendCustomEvent(payload);
    }

    public async logCustomEventWithType(eventValue: string, eventType: string, metadata?: Record<string, any>) {
        const customData = {...this.provider.getBaseMetadata(), ...metadata};

        const payload: CustomEventRequest = {
            ...(await this.getBaseCustomEventRequest(customData)),
            eventType,
            eventValue,
        };
        return this.coveoAnalyticsClient.sendCustomEvent(payload);
    }

    public async logSearchEvent(event: SearchPageEvents, metadata?: Record<string, any>) {
        return this.coveoAnalyticsClient.sendSearchEvent(await this.getBaseSearchEventRequest(event, metadata));
    }

    public async logClickEvent(
        event: SearchPageEvents,
        info: PartialDocumentInformation,
        identifier: DocumentIdentifier,
        metadata?: Record<string, any>
    ) {
        const payload: ClickEventRequest = {
            ...info,
            ...(await this.getBaseEventRequest({...identifier, ...metadata})),
            searchQueryUid: this.provider.getSearchUID(),
            queryPipeline: this.provider.getPipeline(),
            actionCause: event,
        };

        return this.coveoAnalyticsClient.sendClickEvent(payload);
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

    private getDescription(actionCause: SearchPageEvents, metadata?: Record<string, any>) {
        return {
            description: {
                actionCause,
                customData: {...this.provider.getBaseMetadata(), ...metadata},
            },
        };
    }
}
