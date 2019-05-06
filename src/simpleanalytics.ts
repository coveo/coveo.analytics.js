import {
    AnalyticsClient,
    CoveoAnalyticsClient,
    Endpoints,
    EventType
    } from './analytics';
import { AnyEventResponse } from './events';

/** @deprecated */
export type DeprecatedEventType = 'pageview';

// CoveoUA mimics the GoogleAnalytics API.
export class CoveoUA {
    private client: AnalyticsClient;

    // init initializes a new SimpleAPI client.
    // @param token is your coveo access_token / api_key / ...
    // @param endpoint is the endpoint you want to target defaults to the
    //        usage analytics production endpoint
    init(token: string | AnalyticsClient, endpoint: string): void {
        if (typeof token === 'undefined') {
            throw new Error(`You must pass your token when you call 'init'`);
        }
        if (typeof token === 'string') {
            endpoint = endpoint || Endpoints.default;
            this.client = new CoveoAnalyticsClient({
                token: token,
                endpoint: endpoint
            });
        } else if (typeof token === 'object' && typeof token.sendEvent !== 'undefined') {
            this.client = token;
        } else {
            throw new Error(`You must pass either your token or a valid object when you call 'init'`);
        }
    }

    send(event: EventType | DeprecatedEventType, payload: any): Promise<AnyEventResponse> {
        if (typeof this.client == 'undefined') {
            throw new Error(`You must call init before sending an event`);
        }

        payload = payload || {};

        switch (event) {
            case 'pageview':
                const {
                    contentLanguage,
                    contentIdKey,
                    contentIdValue,
                    contentType,
                    anonymous,
                    customData,
                    ...payloadRest
                } = payload;

                return this.client.sendViewEvent({
                    contentIdKey,
                    contentIdValue,
                    contentType,
                    anonymous,
                    customData: {
                        ...customData,
                        ...payloadRest
                    }
                });
            default:
                return this.client.sendEvent(event, payload);
        }
    }

    onLoad(callback: Function) {
        if (typeof callback == 'undefined') {
            throw new Error(`You must pass a function when you call 'onLoad'`);
        }

        callback();
    }
}
/** @deprecated */
export const SimpleAPI = CoveoUA;

export const coveoua = new CoveoUA();

export const handleOneAnalyticsEvent = (action: string, ...params: any[]): any => {
    const actionFunction = (<any>coveoua)[action];
    if (actionFunction) {
        return actionFunction.apply(coveoua, params);
    }
};

/** @deprecated */
export const SimpleAnalytics = handleOneAnalyticsEvent;

export default handleOneAnalyticsEvent;
