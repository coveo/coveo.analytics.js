import {CoveoSearchPageClient, EventDescription, SearchPageClientProvider} from './searchPageClient';
import {
    SearchPageEvents,
    PartialDocumentInformation,
    CustomEventsTypes,
    SmartSnippetFeedbackReason,
    OmniboxSuggestionsMetadata,
    StaticFilterToggleValueMetadata,
} from './searchPageEvents';
import CoveoAnalyticsClient from '../client/analytics';
import {NoopAnalytics} from '../client/noopAnalytics';
import {mockFetch} from '../../tests/fetchMock';

const {fetchMock, fetchMockBeforeEach} = mockFetch();

describe('SearchPageClient', () => {
    const fakeDocInfo = {
        collectionName: 'collection',
        documentAuthor: 'author',
        documentPosition: 1,
        documentTitle: 'title',
        documentUri: 'uri',
        documentUriHash: 'hash',
        documentUrl: 'url',
        queryPipeline: 'my-pipeline',
        rankingModifier: 'modifier',
        sourceName: 'source',
    };

    const fakeDocID = {
        contentIDKey: 'permanentID',
        contentIDValue: 'the-permanent-id',
    };

    const fakeFacetState = [
        {
            valuePosition: 0,
            value: 'foo',
            state: 'selected' as const,
            facetPosition: 1,
            displayValue: 'foobar',
            facetType: 'specific' as const,
            field: '@foo',
            id: 'bar',
            title: 'title',
        },
    ];

    let client: CoveoSearchPageClient;

    const provider: SearchPageClientProvider = {
        getBaseMetadata: () => ({foo: 'bar'}),
        getSearchEventRequestPayload: () => ({
            queryText: 'queryText',
            responseTime: 123,
        }),
        getSearchUID: () => 'my-uid',
        getPipeline: () => 'my-pipeline',
        getOriginContext: () => 'origin-context',
        getOriginLevel1: () => 'origin-level-1',
        getOriginLevel2: () => 'origin-level-2',
        getOriginLevel3: () => 'origin-level-3',
        getLanguage: () => 'en',
        getFacetState: () => fakeFacetState,
        getIsAnonymous: () => false,
    };

    beforeEach(() => {
        fetchMockBeforeEach();

        client = initClient();
        client.coveoAnalyticsClient.runtime.storage.setItem('visitorId', 'visitor-id');
        fetchMock.mock(/.*/, {
            visitId: 'visit-id',
        });
    });

    afterEach(() => {
        fetchMock.reset();
    });

    const initClient = () => {
        return new CoveoSearchPageClient({}, provider);
    };

    const expectOrigins = () => ({
        originContext: 'origin-context',
        originLevel1: 'origin-level-1',
        originLevel2: 'origin-level-2',
        originLevel3: 'origin-level-3',
    });

    const expectMatchPayload = (actionCause: SearchPageEvents, meta = {}) => {
        const [, {body}] = fetchMock.lastCall();
        const customData = {foo: 'bar', ...meta};
        expect(JSON.parse(body.toString())).toMatchObject({
            queryText: 'queryText',
            responseTime: 123,
            queryPipeline: 'my-pipeline',
            actionCause,
            customData,
            facetState: fakeFacetState,
            language: 'en',
            clientId: 'visitor-id',
            ...expectOrigins(),
        });
    };

    const expectMatchDescription = (description: EventDescription, actionCause: SearchPageEvents, meta = {}) => {
        const customData = {foo: 'bar', ...meta};
        expect(description).toMatchObject({
            actionCause,
            customData,
        });
    };

    const expectMatchDocumentPayload = (actionCause: SearchPageEvents, doc: PartialDocumentInformation, meta = {}) => {
        const [, {body}] = fetchMock.lastCall();
        const customData = {foo: 'bar', ...meta};
        expect(JSON.parse(body.toString())).toMatchObject({
            actionCause,
            customData,
            queryPipeline: 'my-pipeline',
            language: 'en',
            clientId: 'visitor-id',
            ...doc,
            ...expectOrigins(),
        });
    };

    const expectMatchCustomEventPayload = (actionCause: SearchPageEvents, meta = {}) => {
        const [, {body}] = fetchMock.lastCall();
        const customData = {foo: 'bar', ...meta};
        expect(JSON.parse(body.toString())).toMatchObject({
            eventValue: actionCause,
            eventType: CustomEventsTypes[actionCause],
            lastSearchQueryUid: 'my-uid',
            customData,
            language: 'en',
            clientId: 'visitor-id',
            ...expectOrigins(),
        });
    };

    const expectMatchCustomEventWithTypePayload = (eventValue: string, eventType: string, meta = {}) => {
        const [, {body}] = fetchMock.lastCall();
        const customData = {foo: 'bar', ...meta};
        expect(JSON.parse(body.toString())).toMatchObject({
            eventValue,
            eventType,
            lastSearchQueryUid: 'my-uid',
            customData,
            language: 'en',
            clientId: 'visitor-id',
            ...expectOrigins(),
        });
    };

    it('should send proper payload for #interfaceLoad', async () => {
        await client.logInterfaceLoad();
        expectMatchPayload(SearchPageEvents.interfaceLoad);
    });

    it('should send proper payload for #buildInterfaceLoad', async () => {
        const built = client.buildInterfaceLoad();
        await built.log();
        expectMatchPayload(SearchPageEvents.interfaceLoad);
        expectMatchDescription(built.description, SearchPageEvents.interfaceLoad);
    });

    it('should send proper payload for #interfaceChange', async () => {
        await client.logInterfaceChange({
            interfaceChangeTo: 'bob',
        });
        expectMatchPayload(SearchPageEvents.interfaceChange, {interfaceChangeTo: 'bob'});
    });

    it('should send proper payload for #buildInterfaceChange', async () => {
        const built = client.buildInterfaceChange({interfaceChangeTo: 'bob'});
        await built.log();
        expectMatchPayload(SearchPageEvents.interfaceChange, {interfaceChangeTo: 'bob'});
        expectMatchDescription(built.description, SearchPageEvents.interfaceChange, {interfaceChangeTo: 'bob'});
    });

    it('should send proper payload for #didyoumeanAutomatic', async () => {
        await client.logDidYouMeanAutomatic();
        expectMatchPayload(SearchPageEvents.didyoumeanAutomatic);
    });

    it('should send proper payload for #buildDidyoumeanAutomatic', async () => {
        const built = client.buildDidYouMeanAutomatic();
        await built.log();
        expectMatchPayload(SearchPageEvents.didyoumeanAutomatic);
        expectMatchDescription(built.description, SearchPageEvents.didyoumeanAutomatic);
    });

    it('should send proper payload for #didyoumeanClick', async () => {
        await client.logDidYouMeanClick();
        expectMatchPayload(SearchPageEvents.didyoumeanClick);
    });

    it('should send proper payload for #buildDidyoumeanClick', async () => {
        const built = client.buildDidYouMeanClick();
        await built.log();
        expectMatchPayload(SearchPageEvents.didyoumeanClick);
        expectMatchDescription(built.description, SearchPageEvents.didyoumeanClick);
    });

    it('should send proper payload for #resultsSort', async () => {
        await client.logResultsSort({resultsSortBy: 'date ascending'});
        expectMatchPayload(SearchPageEvents.resultsSort, {resultsSortBy: 'date ascending'});
    });

    it('should send proper payload for #buildResultsSort', async () => {
        const built = client.buildResultsSort({resultsSortBy: 'date ascending'});
        await built.log();
        expectMatchPayload(SearchPageEvents.resultsSort, {resultsSortBy: 'date ascending'});
        expectMatchDescription(built.description, SearchPageEvents.resultsSort, {resultsSortBy: 'date ascending'});
    });

    it('should send proper payload for #searchboxSubmit', async () => {
        await client.logSearchboxSubmit();
        expectMatchPayload(SearchPageEvents.searchboxSubmit);
    });

    it('should send proper payload for #buildSearchboxSubmit', async () => {
        const built = client.buildSearchboxSubmit();
        await built.log();
        expectMatchPayload(SearchPageEvents.searchboxSubmit);
        expectMatchDescription(built.description, SearchPageEvents.searchboxSubmit);
    });

    it('should send proper payload for #searchboxClear', async () => {
        await client.logSearchboxClear();
        expectMatchPayload(SearchPageEvents.searchboxClear);
    });

    it('should send proper payload for #buildSearchboxClear', async () => {
        const built = client.buildSearchboxClear();
        await built.log();
        expectMatchPayload(SearchPageEvents.searchboxClear);
        expectMatchDescription(built.description, SearchPageEvents.searchboxClear);
    });

    it('should send proper payload for #searchboxAsYouType', async () => {
        await client.logSearchboxAsYouType();
        expectMatchPayload(SearchPageEvents.searchboxAsYouType);
    });

    it('should send proper payload for #buildSearchboxAsYouType', async () => {
        const built = client.buildSearchboxAsYouType();
        await built.log();
        expectMatchPayload(SearchPageEvents.searchboxAsYouType);
        expectMatchDescription(built.description, SearchPageEvents.searchboxAsYouType);
    });

    it('should send proper payload for #documentQuickview', async () => {
        await client.logDocumentQuickview(fakeDocInfo, fakeDocID);
        expectMatchDocumentPayload(SearchPageEvents.documentQuickview, fakeDocInfo, fakeDocID);
    });

    it('should send proper payload for #buildDocumentQuickview', async () => {
        const built = client.buildDocumentQuickview(fakeDocInfo, fakeDocID);
        await built.log();
        await client.logDocumentQuickview(fakeDocInfo, fakeDocID);
        expectMatchDocumentPayload(SearchPageEvents.documentQuickview, fakeDocInfo, fakeDocID);
        expectMatchDescription(built.description, SearchPageEvents.documentQuickview, {...fakeDocID});
    });

    it('should send proper payload for #documentOpen', async () => {
        await client.logDocumentOpen(fakeDocInfo, fakeDocID);
        expectMatchDocumentPayload(SearchPageEvents.documentOpen, fakeDocInfo, fakeDocID);
    });

    it('should send proper payload for #buildDocumentOpen', async () => {
        const built = client.buildDocumentOpen(fakeDocInfo, fakeDocID);
        await built.log();
        expectMatchDocumentPayload(SearchPageEvents.documentOpen, fakeDocInfo, fakeDocID);
        expectMatchDescription(built.description, SearchPageEvents.documentOpen, {...fakeDocID});
    });

    it('should send proper payload for #omniboxAnalytics', async () => {
        const meta: OmniboxSuggestionsMetadata = {
            partialQueries: 'a;b;c',
            partialQuery: 'abcd',
            suggestionRanking: 1,
            suggestions: 'q;w;e;r;t;y',
            querySuggestResponseId: '1',
        };
        await client.logOmniboxAnalytics(meta);
        expectMatchPayload(SearchPageEvents.omniboxAnalytics, meta);
    });

    it('should send proper payload for #buildOmniboxAnalytics', async () => {
        const meta: OmniboxSuggestionsMetadata = {
            partialQueries: 'a;b;c',
            partialQuery: 'abcd',
            suggestionRanking: 1,
            suggestions: 'q;w;e;r;t;y',
            querySuggestResponseId: '1',
        };
        const built = client.buildOmniboxAnalytics(meta);
        await built.log();
        expectMatchPayload(SearchPageEvents.omniboxAnalytics, meta);
        expectMatchDescription(built.description, SearchPageEvents.omniboxAnalytics, meta);
    });

    it('should send proper payload for #logOmniboxFromLink', async () => {
        const meta: OmniboxSuggestionsMetadata = {
            partialQueries: 'a;b;c',
            partialQuery: 'abcd',
            suggestionRanking: 1,
            suggestions: 'q;w;e;r;t;y',
            querySuggestResponseId: '1',
        };
        await client.logOmniboxFromLink(meta);
        expectMatchPayload(SearchPageEvents.omniboxFromLink, meta);
    });

    it('should send proper payload for #buildOmniboxFromLink', async () => {
        const meta: OmniboxSuggestionsMetadata = {
            partialQueries: 'a;b;c',
            partialQuery: 'abcd',
            suggestionRanking: 1,
            suggestions: 'q;w;e;r;t;y',
            querySuggestResponseId: '1',
        };
        const built = client.buildOmniboxFromLink(meta);
        await built.log();
        expectMatchPayload(SearchPageEvents.omniboxFromLink, meta);
        expectMatchDescription(built.description, SearchPageEvents.omniboxFromLink, meta);
    });

    it('should send proper payload for #logSearchFromLink', async () => {
        await client.logSearchFromLink();
        expectMatchPayload(SearchPageEvents.searchFromLink);
    });

    it('should send proper payload for #buildSearchFromLink', async () => {
        const built = client.buildSearchFromLink();
        await built.log();
        expectMatchPayload(SearchPageEvents.searchFromLink);
        expectMatchDescription(built.description, SearchPageEvents.searchFromLink);
    });

    it('should send proper payload for #logTriggerNotify', async () => {
        const meta = {
            notification: 'foo',
        };
        await client.logTriggerNotify(meta);
        expectMatchCustomEventPayload(SearchPageEvents.triggerNotify, meta);
    });

    it('should send proper payload for #buildTriggerNotify', async () => {
        const meta = {
            notification: 'foo',
        };
        const built = client.buildTriggerNotify(meta);
        await built.log();
        expectMatchCustomEventPayload(SearchPageEvents.triggerNotify, meta);
        expectMatchDescription(built.description, SearchPageEvents.triggerNotify, meta);
    });

    it('should send proper payload for #logTriggerExecute', async () => {
        const meta = {
            executed: 'foo',
        };
        await client.logTriggerExecute(meta);
        expectMatchCustomEventPayload(SearchPageEvents.triggerExecute, meta);
    });

    it('should send proper payload for #buildTriggerExecute', async () => {
        const meta = {
            executed: 'foo',
        };
        const built = client.buildTriggerExecute(meta);
        await built.log();
        expectMatchCustomEventPayload(SearchPageEvents.triggerExecute, meta);
        expectMatchDescription(built.description, SearchPageEvents.triggerExecute, meta);
    });

    it('should send proper payload for #logTriggerQuery', async () => {
        const meta = {
            query: 'queryText',
        };
        await client.logTriggerQuery();
        expectMatchCustomEventPayload(SearchPageEvents.triggerQuery, meta);
    });

    it('should send proper payload for #buildTriggerQuery', async () => {
        const meta = {
            query: 'queryText',
        };
        const built = client.buildTriggerQuery();
        await built.log();
        expectMatchCustomEventPayload(SearchPageEvents.triggerQuery, meta);
        expectMatchDescription(built.description, SearchPageEvents.triggerQuery, meta);
    });

    it('should send proper payload for #logTriggerRedirect', async () => {
        const meta = {
            redirectedTo: 'foo',
        };
        await client.logTriggerRedirect(meta);
        expectMatchCustomEventPayload(SearchPageEvents.triggerRedirect, meta);
    });

    it('should send proper payload for #buildTriggerRedirect', async () => {
        const meta = {
            redirectedTo: 'foo',
        };
        const built = client.buildTriggerRedirect(meta);
        await built.log();
        expectMatchCustomEventPayload(SearchPageEvents.triggerRedirect, meta);
        expectMatchDescription(built.description, SearchPageEvents.triggerRedirect, meta);
    });

    it('should send proper payload for #logPagerResize', async () => {
        const meta = {
            currentResultsPerPage: 123,
        };
        await client.logPagerResize(meta);
        expectMatchCustomEventPayload(SearchPageEvents.pagerResize, meta);
    });

    it('should send proper payload for #buildPagerResize', async () => {
        const meta = {
            currentResultsPerPage: 123,
        };
        const built = client.buildPagerResize(meta);
        await built.log();
        expectMatchCustomEventPayload(SearchPageEvents.pagerResize, meta);
        expectMatchDescription(built.description, SearchPageEvents.pagerResize, meta);
    });

    it('should send proper payload for #logPagerNumber', async () => {
        const meta = {pagerNumber: 123};
        await client.logPagerNumber(meta);
        expectMatchCustomEventPayload(SearchPageEvents.pagerNumber, meta);
    });

    it('should send proper payload for #buildPagerNumber', async () => {
        const meta = {pagerNumber: 123};
        const built = client.buildPagerNumber(meta);
        await built.log();
        expectMatchCustomEventPayload(SearchPageEvents.pagerNumber, meta);
        expectMatchDescription(built.description, SearchPageEvents.pagerNumber, meta);
    });

    it('should send proper payload for #logPagerNext', async () => {
        const meta = {pagerNumber: 123};
        await client.logPagerNext(meta);
        expectMatchCustomEventPayload(SearchPageEvents.pagerNext, meta);
    });

    it('should send proper payload for #buildPagerNext', async () => {
        const meta = {pagerNumber: 123};
        const built = client.buildPagerNext(meta);
        await built.log();
        expectMatchCustomEventPayload(SearchPageEvents.pagerNext, meta);
        expectMatchDescription(built.description, SearchPageEvents.pagerNext, meta);
    });

    it('should send proper payload for #logPagerPrevious', async () => {
        const meta = {pagerNumber: 123};
        await client.logPagerPrevious(meta);
        expectMatchCustomEventPayload(SearchPageEvents.pagerPrevious, meta);
    });

    it('should send proper payload for #buildPagerPrevious', async () => {
        const meta = {pagerNumber: 123};
        const built = client.buildPagerPrevious(meta);
        await built.log();
        expectMatchCustomEventPayload(SearchPageEvents.pagerPrevious, meta);
        expectMatchDescription(built.description, SearchPageEvents.pagerPrevious, meta);
    });

    it('should send proper payload for #logPagerScrolling', async () => {
        await client.logPagerScrolling();
        expectMatchCustomEventPayload(SearchPageEvents.pagerScrolling);
    });

    it('should send proper payload for #buildPagerScrolling', async () => {
        const built = client.buildPagerScrolling();
        await built.log();
        expectMatchCustomEventPayload(SearchPageEvents.pagerScrolling);
        expectMatchDescription(built.description, SearchPageEvents.pagerScrolling);
    });

    it('should send the proper payload for #logStaticFilterClearAll', async () => {
        const staticFilterId = 'filetypes';
        await client.logStaticFilterClearAll({staticFilterId});

        expectMatchPayload(SearchPageEvents.staticFilterClearAll, {staticFilterId});
    });

    it('should send the proper payload for #buildStaticFilterClearAll', async () => {
        const staticFilterId = 'filetypes';
        const built = client.buildStaticFilterClearAll({staticFilterId});
        await built.log();
        expectMatchPayload(SearchPageEvents.staticFilterClearAll, {staticFilterId});
        expectMatchDescription(built.description, SearchPageEvents.staticFilterClearAll, {staticFilterId});
    });

    it('should send the proper payload for #logStaticFilterSelect', async () => {
        const meta: StaticFilterToggleValueMetadata = {
            staticFilterId: 'filetypes',
            staticFilterValue: {
                caption: 'Youtube',
                expression: '@filetype="youtubevideo"',
            },
        };
        await client.logStaticFilterSelect(meta);

        expectMatchPayload(SearchPageEvents.staticFilterSelect, meta);
    });

    it('should send the proper payload for #buildStaticFilterSelect', async () => {
        const meta: StaticFilterToggleValueMetadata = {
            staticFilterId: 'filetypes',
            staticFilterValue: {
                caption: 'Youtube',
                expression: '@filetype="youtubevideo"',
            },
        };
        const built = client.buildStaticFilterSelect(meta);
        await built.log();

        expectMatchPayload(SearchPageEvents.staticFilterSelect, meta);
        expectMatchDescription(built.description, SearchPageEvents.staticFilterSelect, meta);
    });

    it('should send the proper payload for #logStaticFilterDeselect', async () => {
        const meta: StaticFilterToggleValueMetadata = {
            staticFilterId: 'filetypes',
            staticFilterValue: {
                caption: 'Youtube',
                expression: '@filetype="youtubevideo"',
            },
        };
        await client.logStaticFilterDeselect(meta);

        expectMatchPayload(SearchPageEvents.staticFilterDeselect, meta);
    });

    it('should send the proper payload for #buildStaticFilterDeselect', async () => {
        const meta: StaticFilterToggleValueMetadata = {
            staticFilterId: 'filetypes',
            staticFilterValue: {
                caption: 'Youtube',
                expression: '@filetype="youtubevideo"',
            },
        };
        const built = client.buildStaticFilterDeselect(meta);
        await built.log();
        expectMatchPayload(SearchPageEvents.staticFilterDeselect, meta);
        expectMatchDescription(built.description, SearchPageEvents.staticFilterDeselect, meta);
    });

    it('should send proper payload for #logFacetSearch', async () => {
        const meta = {
            facetField: '@foo',
            facetId: 'bar',
            facetTitle: 'title',
        };
        await client.logFacetSearch(meta);
        expectMatchPayload(SearchPageEvents.facetSearch, meta);
    });

    it('should send proper payload for #buildFacetSearch', async () => {
        const meta = {
            facetField: '@foo',
            facetId: 'bar',
            facetTitle: 'title',
        };
        const built = client.buildFacetSearch(meta);
        await built.log();
        expectMatchPayload(SearchPageEvents.facetSearch, meta);
        expectMatchDescription(built.description, SearchPageEvents.facetSearch, meta);
    });

    it('should send proper payload for #logFacetSelect', async () => {
        const meta = {
            facetField: '@foo',
            facetId: 'bar',
            facetTitle: 'title',
            facetValue: 'qwerty',
        };

        await client.logFacetSelect(meta);
        expectMatchPayload(SearchPageEvents.facetSelect, meta);
    });

    it('should send proper payload for #buildFacetSelect', async () => {
        const meta = {
            facetField: '@foo',
            facetId: 'bar',
            facetTitle: 'title',
            facetValue: 'qwerty',
        };
        const built = await client.buildFacetSelect(meta);
        await built.log();
        expectMatchPayload(SearchPageEvents.facetSelect, meta);
        expectMatchDescription(built.description, SearchPageEvents.facetSelect, meta);
    });

    it('should send proper payload for #logFacetDeselect', async () => {
        const meta = {
            facetField: '@foo',
            facetId: 'bar',
            facetTitle: 'title',
            facetValue: 'qwerty',
        };

        await client.logFacetDeselect(meta);
        expectMatchPayload(SearchPageEvents.facetDeselect, meta);
    });

    it('should send proper payload for #buildFacetDeselect', async () => {
        const meta = {
            facetField: '@foo',
            facetId: 'bar',
            facetTitle: 'title',
            facetValue: 'qwerty',
        };

        const built = client.buildFacetDeselect(meta);
        await built.log();
        expectMatchPayload(SearchPageEvents.facetDeselect, meta);
        expectMatchDescription(built.description, SearchPageEvents.facetDeselect, meta);
    });

    it('should send proper payload for #logFacetExclude', async () => {
        const meta = {
            facetField: '@foo',
            facetId: 'bar',
            facetTitle: 'title',
            facetValue: 'qwerty',
        };
        await client.logFacetExclude(meta);
        expectMatchPayload(SearchPageEvents.facetExclude, meta);
    });

    it('should send proper payload for #buildFacetExclude', async () => {
        const meta = {
            facetField: '@foo',
            facetId: 'bar',
            facetTitle: 'title',
            facetValue: 'qwerty',
        };
        const built = client.buildFacetExclude(meta);
        await built.log();
        expectMatchPayload(SearchPageEvents.facetExclude, meta);
        expectMatchDescription(built.description, SearchPageEvents.facetExclude, meta);
    });

    it('should send proper payload for #logFacetUnexclude', async () => {
        const meta = {
            facetField: '@foo',
            facetId: 'bar',
            facetTitle: 'title',
            facetValue: 'qwerty',
        };
        await client.logFacetUnexclude(meta);
        expectMatchPayload(SearchPageEvents.facetUnexclude, meta);
    });

    it('should send proper payload for #buildFacetUnexclude', async () => {
        const meta = {
            facetField: '@foo',
            facetId: 'bar',
            facetTitle: 'title',
            facetValue: 'qwerty',
        };
        const built = client.buildFacetUnexclude(meta);
        await built.log();
        expectMatchPayload(SearchPageEvents.facetUnexclude, meta);
        expectMatchDescription(built.description, SearchPageEvents.facetUnexclude, meta);
    });

    it('should send proper payload for #logFacetSelectAll', async () => {
        const meta = {
            facetField: '@foo',
            facetId: 'bar',
            facetTitle: 'title',
        };
        await client.logFacetSelectAll(meta);
        expectMatchPayload(SearchPageEvents.facetSelectAll, meta);
    });

    it('should send proper payload for #buildFacetSelectAll', async () => {
        const meta = {
            facetField: '@foo',
            facetId: 'bar',
            facetTitle: 'title',
        };
        const built = client.buildFacetSelectAll(meta);
        await built.log();
        expectMatchPayload(SearchPageEvents.facetSelectAll, meta);
        expectMatchDescription(built.description, SearchPageEvents.facetSelectAll, meta);
    });

    it('should send proper payload for #logFacetUpdateSort', async () => {
        const meta = {
            facetField: '@foo',
            facetId: 'bar',
            facetTitle: 'title',
            criteria: 'bazz',
        };
        await client.logFacetUpdateSort(meta);
        expectMatchPayload(SearchPageEvents.facetUpdateSort, meta);
    });

    it('should send proper payload for #buildFacetUpdateSort', async () => {
        const meta = {
            facetField: '@foo',
            facetId: 'bar',
            facetTitle: 'title',
            criteria: 'bazz',
        };
        const built = client.buildFacetUpdateSort(meta);
        await built.log();
        expectMatchPayload(SearchPageEvents.facetUpdateSort, meta);
        expectMatchDescription(built.description, SearchPageEvents.facetUpdateSort, meta);
    });

    it('should send proper payload for #logFacetShowMore', async () => {
        const meta = {
            facetField: '@foo',
            facetId: 'bar',
            facetTitle: 'title',
        };
        await client.logFacetShowMore(meta);
        expectMatchCustomEventPayload(SearchPageEvents.facetShowMore, meta);
    });

    it('should send proper payload for #buildFacetShowMore', async () => {
        const meta = {
            facetField: '@foo',
            facetId: 'bar',
            facetTitle: 'title',
        };
        const built = client.buildFacetShowMore(meta);
        await built.log();
        expectMatchCustomEventPayload(SearchPageEvents.facetShowMore, meta);
        expectMatchDescription(built.description, SearchPageEvents.facetShowMore, meta);
    });

    it('should send proper payload for #logFacetShowLess', async () => {
        const meta = {
            facetField: '@foo',
            facetId: 'bar',
            facetTitle: 'title',
        };
        await client.logFacetShowLess(meta);
        expectMatchCustomEventPayload(SearchPageEvents.facetShowLess, meta);
    });

    it('should send proper payload for #buildFacetShowLess', async () => {
        const meta = {
            facetField: '@foo',
            facetId: 'bar',
            facetTitle: 'title',
        };
        const built = client.buildFacetShowLess(meta);
        await built.log();
        expectMatchCustomEventPayload(SearchPageEvents.facetShowLess, meta);
        expectMatchDescription(built.description, SearchPageEvents.facetShowLess, meta);
    });

    it('should send proper payload for #logQueryError', async () => {
        const meta = {
            query: 'q',
            aq: 'aq',
            cq: 'cq',
            dq: 'dq',
            errorMessage: 'boom',
            errorType: 'a bad one',
        };
        await client.logQueryError(meta);
        expectMatchCustomEventPayload(SearchPageEvents.queryError, meta);
    });

    it('should send proper payload for #buildQueryError', async () => {
        const meta = {
            query: 'q',
            aq: 'aq',
            cq: 'cq',
            dq: 'dq',
            errorMessage: 'boom',
            errorType: 'a bad one',
        };
        const built = client.buildQueryError(meta);
        await built.log();
        expectMatchCustomEventPayload(SearchPageEvents.queryError, meta);
        expectMatchDescription(built.description, SearchPageEvents.queryError, meta);
    });

    it('should send proper payload for #logQueryErrorBack', async () => {
        await client.logQueryErrorBack();
        expectMatchPayload(SearchPageEvents.queryErrorBack);
    });

    it('should send proper payload for #buildQueryErrorBack', async () => {
        const built = client.buildQueryErrorBack();
        await built.log();

        expectMatchPayload(SearchPageEvents.queryErrorBack);
        expectMatchDescription(built.description, SearchPageEvents.queryErrorBack);
    });

    it('should send proper payload for #logQueryErrorRetry', async () => {
        await client.logQueryErrorRetry();
        expectMatchPayload(SearchPageEvents.queryErrorRetry);
    });

    it('should send proper payload for #buildQueryErrorRetry', async () => {
        const built = client.buildQueryErrorRetry();
        await built.log();
        expectMatchPayload(SearchPageEvents.queryErrorRetry);
        expectMatchDescription(built.description, SearchPageEvents.queryErrorRetry);
    });

    it('should send proper payload for #logQueryErrorClear', async () => {
        await client.logQueryErrorClear();
        expectMatchPayload(SearchPageEvents.queryErrorClear);
    });

    it('should send proper payload for #buildQueryErrorClear', async () => {
        const built = client.buildQueryErrorClear();
        await built.log();
        expectMatchPayload(SearchPageEvents.queryErrorClear);
        expectMatchDescription(built.description, SearchPageEvents.queryErrorClear);
    });

    it('should send proper payload for #logRecommendationInterfaceLoad', async () => {
        await client.logRecommendationInterfaceLoad();
        expectMatchPayload(SearchPageEvents.recommendationInterfaceLoad);
    });

    it('should send proper payload for #buildRecommendationInterfaceLoad', async () => {
        const built = client.buildRecommendationInterfaceLoad();
        await built.log();
        expectMatchPayload(SearchPageEvents.recommendationInterfaceLoad);
        expectMatchDescription(built.description, SearchPageEvents.recommendationInterfaceLoad);
    });

    it('should send proper payload for #logRecommendation', async () => {
        await client.logRecommendation();
        expectMatchCustomEventPayload(SearchPageEvents.recommendation);
    });

    it('should send proper payload for #buildRecommendation', async () => {
        const built = client.buildRecommendation();
        await built.log();

        await client.logRecommendation();
        expectMatchCustomEventPayload(SearchPageEvents.recommendation);
    });

    it('should send proper payload for #recommendationOpen', async () => {
        await client.logRecommendationOpen(fakeDocInfo, fakeDocID);
        expectMatchDocumentPayload(SearchPageEvents.recommendationOpen, fakeDocInfo, fakeDocID);
    });

    it('should send proper payload for #buildRecommendationOpen', async () => {
        const built = client.buildRecommendationOpen(fakeDocInfo, fakeDocID);
        await built.log();
        expectMatchDocumentPayload(SearchPageEvents.recommendationOpen, fakeDocInfo, fakeDocID);
        expectMatchDescription(built.description, SearchPageEvents.recommendationOpen, {...fakeDocID});
    });

    it('should send proper payload for #fetchMoreResults', async () => {
        await client.logFetchMoreResults();
        expectMatchCustomEventPayload(SearchPageEvents.pagerScrolling, {type: 'getMoreResults'});
    });

    it('should send proper payload for #buildFetchMoreResults', async () => {
        const built = client.buildFetchMoreResults();
        await built.log();
        expectMatchCustomEventPayload(SearchPageEvents.pagerScrolling, {type: 'getMoreResults'});
        expectMatchDescription(built.description, SearchPageEvents.pagerScrolling);
    });

    it('should send proper payload for #logLikeSmartSnippet', async () => {
        await client.logLikeSmartSnippet();
        expectMatchCustomEventPayload(SearchPageEvents.likeSmartSnippet);
    });

    it('should send proper payload for #buildLikeSmartSnippet', async () => {
        const built = client.buildLikeSmartSnippet();
        await built.log();
        expectMatchCustomEventPayload(SearchPageEvents.likeSmartSnippet);
        expectMatchDescription(built.description, SearchPageEvents.likeSmartSnippet);
    });

    it('should send proper payload for #logDislikeSmartSnippet', async () => {
        await client.logDislikeSmartSnippet();
        expectMatchCustomEventPayload(SearchPageEvents.dislikeSmartSnippet);
    });

    it('should send proper payload for #buildDislikeSmartSnippet', async () => {
        const built = client.buildDislikeSmartSnippet();
        await built.log();
        expectMatchCustomEventPayload(SearchPageEvents.dislikeSmartSnippet);
        expectMatchDescription(built.description, SearchPageEvents.dislikeSmartSnippet);
    });

    it('should send proper payload for #logExpandSmartSnippet', async () => {
        await client.logExpandSmartSnippet();
        expectMatchCustomEventPayload(SearchPageEvents.expandSmartSnippet);
    });

    it('should send proper payload for #buildExpandSmartSnippet', async () => {
        const built = client.buildExpandSmartSnippet();
        await built.log();
        expectMatchCustomEventPayload(SearchPageEvents.expandSmartSnippet);
        expectMatchDescription(built.description, SearchPageEvents.expandSmartSnippet);
    });

    it('should send proper payload for #logCollapseSmartSnippet', async () => {
        await client.logCollapseSmartSnippet();
        expectMatchCustomEventPayload(SearchPageEvents.collapseSmartSnippet);
    });

    it('should send proper payload for #buildCollapseSmartSnippet', async () => {
        const built = client.buildCollapseSmartSnippet();
        await built.log();
        expectMatchCustomEventPayload(SearchPageEvents.collapseSmartSnippet);
        expectMatchDescription(built.description, SearchPageEvents.collapseSmartSnippet);
    });

    it('should send proper payload for #logOpenSmartSnippetFeedbackModal', async () => {
        await client.logOpenSmartSnippetFeedbackModal();
        expectMatchCustomEventPayload(SearchPageEvents.openSmartSnippetFeedbackModal);
    });

    it('should send proper payload for #buildOpenSmartSnippetFeedbackModal', async () => {
        const built = client.buildOpenSmartSnippetFeedbackModal();
        await built.log();
        expectMatchCustomEventPayload(SearchPageEvents.openSmartSnippetFeedbackModal);
        expectMatchDescription(built.description, SearchPageEvents.openSmartSnippetFeedbackModal);
    });

    it('should send proper payload for #logCloseSmartSnippetFeedbackModal', async () => {
        await client.logCloseSmartSnippetFeedbackModal();
        expectMatchCustomEventPayload(SearchPageEvents.closeSmartSnippetFeedbackModal);
    });

    it('should send proper payload for #buildCloseSmartSnippetFeedbackModal', async () => {
        const built = client.buildCloseSmartSnippetFeedbackModal();
        await built.log();
        expectMatchCustomEventPayload(SearchPageEvents.closeSmartSnippetFeedbackModal);
        expectMatchDescription(built.description, SearchPageEvents.closeSmartSnippetFeedbackModal);
    });

    it('should send proper payload for #logSmartSnippetFeedbackReason', async () => {
        await client.logSmartSnippetFeedbackReason(SmartSnippetFeedbackReason.DoesNotAnswer, 'this is irrelevant');
        expectMatchCustomEventPayload(SearchPageEvents.sendSmartSnippetReason, {
            details: 'this is irrelevant',
            reason: SmartSnippetFeedbackReason.DoesNotAnswer,
        });
    });

    it('should send proper payload for #buildSmartSnippetFeedbackReason', async () => {
        const built = client.buildSmartSnippetFeedbackReason(
            SmartSnippetFeedbackReason.DoesNotAnswer,
            'this is irrelevant'
        );
        await built.log();
        expectMatchCustomEventPayload(SearchPageEvents.sendSmartSnippetReason, {
            details: 'this is irrelevant',
            reason: SmartSnippetFeedbackReason.DoesNotAnswer,
        });
        expectMatchDescription(built.description, SearchPageEvents.sendSmartSnippetReason, {
            details: 'this is irrelevant',
            reason: SmartSnippetFeedbackReason.DoesNotAnswer,
        });
    });

    it('should send proper payload for #logExpandSmartSnippetSuggestion', async () => {
        await client.logExpandSmartSnippetSuggestion({contentIdKey: 'permanentid', contentIdValue: 'foo'});
        expectMatchCustomEventPayload(SearchPageEvents.expandSmartSnippetSuggestion, {
            documentId: {contentIdKey: 'permanentid', contentIdValue: 'foo'},
        });
    });

    it('should send proper payload for #buildExpandSmartSnippetSuggestion', async () => {
        const built = client.buildExpandSmartSnippetSuggestion({
            contentIdKey: 'permanentid',
            contentIdValue: 'foo',
        });
        await built.log();
        expectMatchCustomEventPayload(SearchPageEvents.expandSmartSnippetSuggestion, {
            documentId: {contentIdKey: 'permanentid', contentIdValue: 'foo'},
        });
        expectMatchDescription(built.description, SearchPageEvents.expandSmartSnippetSuggestion, {
            documentId: {contentIdKey: 'permanentid', contentIdValue: 'foo'},
        });
    });

    it('should send proper payload for #logCollapseSmartSnippetSuggestion', async () => {
        await client.logCollapseSmartSnippetSuggestion({contentIdKey: 'permanentid', contentIdValue: 'foo'});
        expectMatchCustomEventPayload(SearchPageEvents.collapseSmartSnippetSuggestion, {
            documentId: {contentIdKey: 'permanentid', contentIdValue: 'foo'},
        });
    });

    it('should send proper payload for #buildCollapseSmartSnippetSuggestion', async () => {
        const built = client.buildCollapseSmartSnippetSuggestion({contentIdKey: 'permanentid', contentIdValue: 'foo'});
        await built.log();
        expectMatchCustomEventPayload(SearchPageEvents.collapseSmartSnippetSuggestion, {
            documentId: {contentIdKey: 'permanentid', contentIdValue: 'foo'},
        });
        expectMatchDescription(built.description, SearchPageEvents.collapseSmartSnippetSuggestion, {
            documentId: {contentIdKey: 'permanentid', contentIdValue: 'foo'},
        });
    });

    it('should send proper payload for #logRecentQueryClick', async () => {
        await client.logRecentQueryClick();
        expectMatchPayload(SearchPageEvents.recentQueryClick);
    });

    it('should send proper payload for #buildRecentQueryClick', async () => {
        const built = client.buildRecentQueryClick();
        await built.log();

        expectMatchPayload(SearchPageEvents.recentQueryClick);
        expectMatchDescription(built.description, SearchPageEvents.recentQueryClick);
    });

    it('should send proper payload for #logClearRecentQueries', async () => {
        await client.logClearRecentQueries();
        expectMatchCustomEventPayload(SearchPageEvents.clearRecentQueries);
    });

    it('should send proper payload for #buildClearRecentQueries', async () => {
        const built = client.buildClearRecentQueries();
        await built.log();

        expectMatchCustomEventPayload(SearchPageEvents.clearRecentQueries);
        expectMatchDescription(built.description, SearchPageEvents.clearRecentQueries);
    });

    it('should send proper payload for #logRecentResultClick', async () => {
        await client.logRecentResultClick(fakeDocInfo, fakeDocID);
        expectMatchCustomEventPayload(SearchPageEvents.recentResultClick, {
            info: fakeDocInfo,
            identifier: fakeDocID,
        });
    });

    it('should send proper payload for #buildRecentResultClick', async () => {
        const built = client.buildRecentResultClick(fakeDocInfo, fakeDocID);
        await built.log();

        expectMatchCustomEventPayload(SearchPageEvents.recentResultClick, {
            info: fakeDocInfo,
            identifier: fakeDocID,
        });

        expectMatchDescription(built.description, SearchPageEvents.recentResultClick, {
            info: fakeDocInfo,
            identifier: fakeDocID,
        });
    });

    it('should send proper payload for #logNoResultsBack', async () => {
        await client.logNoResultsBack();
        expectMatchPayload(SearchPageEvents.noResultsBack);
    });

    it('should send proper payload for #buildNoResultsBack', async () => {
        const built = client.buildNoResultsBack();
        await built.log();

        expectMatchPayload(SearchPageEvents.noResultsBack);
        expectMatchDescription(built.description, SearchPageEvents.noResultsBack);
    });

    it('should send proper payload for #logClearRecentResults', async () => {
        await client.logClearRecentResults();
        expectMatchCustomEventPayload(SearchPageEvents.clearRecentResults);
    });

    it('should send proper payload for #buildClearRecentResults', async () => {
        const built = client.buildClearRecentResults();
        await built.log();

        expectMatchCustomEventPayload(SearchPageEvents.clearRecentResults);
        expectMatchDescription(built.description, SearchPageEvents.clearRecentResults);
    });

    it('should send proper payload for #logCustomEventWithType', async () => {
        await client.logCustomEventWithType('foo', 'bar', {buzz: 'bazz'});
        expectMatchCustomEventWithTypePayload('foo', 'bar', {buzz: 'bazz'});
    });

    it('should enable analytics tracking by default', () => {
        const c = new CoveoSearchPageClient({}, provider);
        expect(c.coveoAnalyticsClient instanceof CoveoAnalyticsClient).toBe(true);
    });

    it('should allow disabling analytics on initialization', () => {
        const c = new CoveoSearchPageClient({enableAnalytics: false}, provider);
        expect(c.coveoAnalyticsClient instanceof NoopAnalytics).toBe(true);
    });

    it('should allow disabling analytics after initialization', () => {
        const c = new CoveoSearchPageClient({enableAnalytics: true}, provider);
        expect(c.coveoAnalyticsClient instanceof CoveoAnalyticsClient).toBe(true);
        c.disable();
        expect(c.coveoAnalyticsClient instanceof NoopAnalytics).toBe(true);
    });

    it('should allow enabling analytics after initialization', () => {
        const c = new CoveoSearchPageClient({enableAnalytics: false}, provider);
        expect(c.coveoAnalyticsClient instanceof NoopAnalytics).toBe(true);
        c.enable();
        expect(c.coveoAnalyticsClient instanceof CoveoAnalyticsClient).toBe(true);
    });
});
