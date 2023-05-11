import {AnyEventResponse, EventType, IRequestPayload} from '../events';
import {AnalyticsRequestClient, IAnalyticsRequestOptions, IAnalyticsClientOptions} from './analyticsRequestClient';
import {fetch} from 'cross-fetch';

export class ValidationClient implements AnalyticsRequestClient {
    private host: String | undefined;
    constructor(private opts: IAnalyticsClientOptions, host?: string) {
        this.host = host;
    }
    public async sendEvent(eventType: EventType, payload: IRequestPayload): Promise<AnyEventResponse> {
        const {token, baseUrl} = this.opts;
        const defaultOptions: IAnalyticsRequestOptions = {
            url: baseUrl,
            credentials: 'include',
            headers: {
                ...(this.host ? {host: `${this.host}`} : {}),
                ...(token ? {Authorization: `Bearer ${token}`} : {}),
                'Content-Type': `application/json`,
            },
            method: 'POST',
            body: (function (payload: IRequestPayload, eventType: EventType) {
                let wrappedRequest = {
                    operation: {
                        id: 'api.analytics.' + eventType,
                        version: 15,
                    },
                    meta: {
                        id: 'event1',
                    },
                    data: {
                        payload,
                    },
                };
                return JSON.stringify(wrappedRequest);
            })(payload, eventType),
        };
        const {url, ...fetchData}: IAnalyticsRequestOptions = {
            ...defaultOptions,
        };

        const response = await fetch(url, fetchData);
        if (response.ok) {
            const visit = (await response.json()) as AnyEventResponse;
            return visit;
        } else {
            try {
                response.json();
            } catch {
                /* If you don't parse the response, it won't appear in the network tab. */
            }
            console.error(`An error has occured when validating the "${eventType}" event.`, response, payload);
            throw new Error(
                `An error has occurred when validating the "${eventType}" event. Check the console logs for more details.`
            );
        }
    }

    public async deleteHttpCookieVisitorId() {
        const {baseUrl} = this.opts;
        const url = `${baseUrl}/analytics/visit`;
        await fetch(url, {headers: this.getHeaders(), method: 'DELETE'});
    }

    private getHeaders(): Record<string, string> {
        const {token} = this.opts;
        return {
            ...(token ? {Authorization: `Bearer ${token}`} : {}),
            'Content-Type': `application/json`,
        };
    }
}
