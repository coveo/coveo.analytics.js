import {AnalyticsClient, PreparedEvent} from './analytics';
import {
    AnyEventResponse,
    SearchEventResponse,
    ClickEventResponse,
    CustomEventResponse,
    VisitResponse,
    HealthResponse,
    ViewEventResponse,
    EventType,
} from '../events';
import {NoopRuntime} from './runtimeEnvironment';

export class NoopAnalytics implements AnalyticsClient {
    getPayload(): Promise<any> {
        return Promise.resolve();
    }
    getParameters(): Promise<any> {
        return Promise.resolve();
    }
    prepareEvent<T extends AnyEventResponse>(eventType: EventType | string): Promise<PreparedEvent<T>> {
        return Promise.resolve({eventType: eventType as EventType, payload: null, log: () => Promise.resolve()});
    }
    sendEvent(): Promise<AnyEventResponse | void> {
        return Promise.resolve();
    }
    prepareSearchEvent(): Promise<PreparedEvent<SearchEventResponse>> {
        return this.prepareEvent(EventType.search);
    }
    sendSearchEvent(): Promise<SearchEventResponse | void> {
        return Promise.resolve();
    }
    prepareClickEvent(): Promise<PreparedEvent<ClickEventResponse>> {
        return this.prepareEvent(EventType.click);
    }
    sendClickEvent(): Promise<ClickEventResponse | void> {
        return Promise.resolve();
    }
    prepareCustomEvent(): Promise<PreparedEvent<CustomEventResponse>> {
        return this.prepareEvent(EventType.custom);
    }
    sendCustomEvent(): Promise<CustomEventResponse | void> {
        return Promise.resolve();
    }
    prepareViewEvent(): Promise<PreparedEvent<ViewEventResponse>> {
        return this.prepareEvent(EventType.view);
    }
    sendViewEvent(): Promise<ViewEventResponse | void> {
        return Promise.resolve();
    }
    getVisit(): Promise<VisitResponse> {
        return Promise.resolve({id: '', visitorId: ''});
    }
    getHealth(): Promise<HealthResponse> {
        return Promise.resolve({status: ''});
    }
    registerBeforeSendEventHook(): void {}
    registerAfterSendEventHook(): void {}
    addEventTypeMapping(): void {}
    runtime = new NoopRuntime();
    currentVisitorId = '';
}
