import {AnalyticsClient} from '../src/client/analytics';
import {NoopRuntime} from '../src/client/runtimeEnvironment';

export const createAnalyticsClientMock = (): jest.Mocked<AnalyticsClient> => ({
    getPayload: jest.fn((eventType, ...payload) => Promise.resolve()),
    getParameters: jest.fn((eventType, ...payload) => Promise.resolve()),
    sendEvent: jest.fn((eventType, payload) => Promise.resolve()),
    sendClickEvent: jest.fn((request) => Promise.resolve()),
    sendCustomEvent: jest.fn((request) => Promise.resolve()),
    sendSearchEvent: jest.fn((request) => Promise.resolve()),
    sendViewEvent: jest.fn((request) => Promise.resolve()),
    getHealth: jest.fn(() => Promise.resolve({status: 'ok'})),
    getVisit: jest.fn(() => Promise.resolve({id: 'a', visitorId: 'ok'})),
    addEventTypeMapping: jest.fn(),
    registerBeforeSendEventHook: jest.fn(),
    registerAfterSendEventHook: jest.fn(),
    runtime: new NoopRuntime(),
    currentVisitorId: '',
});
