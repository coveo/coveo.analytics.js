import {AnalyticsClient, PreparedEvent} from '../src/client/analytics';
import {NoopAnalytics} from '../src/client/noopAnalytics';
import {NoopRuntime} from '../src/client/runtimeEnvironment';
import {AnyEventResponse, EventType} from '../src/events';

export const visitorIdMock = 'mockvisitorid';

const prepareEvent = (eventType: EventType | string) =>
    Promise.resolve({eventType: eventType as EventType, payload: null, log: () => Promise.resolve()});

export const createAnalyticsClientMock = (): jest.Mocked<AnalyticsClient> => ({
    getPayload: jest.fn((eventType, ...payload) => Promise.resolve()),
    getParameters: jest.fn((eventType, ...payload) => Promise.resolve()),
    prepareEvent: jest.fn(prepareEvent),
    sendEvent: jest.fn((eventType, payload) => Promise.resolve()),
    prepareClickEvent: jest.fn((request) => prepareEvent(EventType.click)),
    sendClickEvent: jest.fn((request) => Promise.resolve()),
    prepareCustomEvent: jest.fn((request) => prepareEvent(EventType.custom)),
    sendCustomEvent: jest.fn((request) => Promise.resolve()),
    prepareSearchEvent: jest.fn((request) => prepareEvent(EventType.search)),
    sendSearchEvent: jest.fn((request) => Promise.resolve()),
    prepareViewEvent: jest.fn((request) => prepareEvent(EventType.view)),
    sendViewEvent: jest.fn((request) => Promise.resolve()),
    getHealth: jest.fn(() => Promise.resolve({status: 'ok'})),
    getVisit: jest.fn(() => Promise.resolve({id: 'a', visitorId: 'ok'})),
    addEventTypeMapping: jest.fn(),
    registerBeforeSendEventHook: jest.fn(),
    registerAfterSendEventHook: jest.fn(),
    runtime: new NoopRuntime(),
    currentVisitorId: '',
    getCurrentVisitorId: jest.fn(() => Promise.resolve(visitorIdMock)),
});
