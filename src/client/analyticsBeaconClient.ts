import {AnalyticsRequestClient, IAnalyticsClientOptions, PreprocessAnalyticsRequest} from './analyticsRequestClient';
import {EventType, IRequestPayload} from '../events';

export class AnalyticsBeaconClient implements AnalyticsRequestClient {
    constructor(private opts: IAnalyticsClientOptions) {}

    public async sendEvent(eventType: EventType, originalPayload: IRequestPayload): Promise<void> {
        if (!this.isAvailable()) {
            throw new Error(
                `navigator.sendBeacon is not supported in this browser. Consider adding a polyfill like "sendbeacon-polyfill".`
            );
        }

        const {baseUrl, preprocessRequest} = this.opts;

        const paramsFragments = await this.getQueryParamsForEventType(eventType);

        const {url, payload} = await this.preProcessRequestAsPotentialJSONString(
            `${baseUrl}/analytics/${eventType}?${paramsFragments}`,
            originalPayload,
            preprocessRequest
        );

        const parsedRequestData = this.encodeForEventType(eventType, payload);
        const body = new Blob([parsedRequestData], {
            type: 'application/x-www-form-urlencoded',
        });

        navigator.sendBeacon(url, body as any); // https://github.com/microsoft/TypeScript/issues/38715
        return;
    }

    public isAvailable() {
        return 'sendBeacon' in navigator;
    }

    public deleteHttpCookieVisitorId() {
        return Promise.resolve();
    }

    private async preProcessRequestAsPotentialJSONString(
        originalURL: string,
        originalPayload: IRequestPayload,
        preprocessRequest?: PreprocessAnalyticsRequest
    ): Promise<{url: string; payload: IRequestPayload}> {
        let returnedUrl = originalURL;
        let returnedPayload = originalPayload;

        if (preprocessRequest) {
            const processedRequest = await preprocessRequest(
                {url: originalURL, body: JSON.stringify(originalPayload)},
                'analyticsBeacon'
            );
            const {url: processedURL, body: processedBody} = processedRequest;
            returnedUrl = processedURL || originalURL;
            try {
                returnedPayload = JSON.parse(processedBody as string);
            } catch (e) {
                console.error('Unable to process the request body as a JSON string', e);
            }
        }

        return {
            payload: returnedPayload,
            url: returnedUrl,
        };
    }

    private encodeForEventType(eventType: EventType, payload: IRequestPayload): string {
        return this.isEventTypeLegacy(eventType)
            ? this.encodeToJson(eventType, payload)
            : this.encodeToJson(eventType, payload, this.opts.token);
    }

    private async getQueryParamsForEventType(eventType: EventType): Promise<string> {
        const {token, visitorIdProvider} = this.opts;
        const visitorId = await visitorIdProvider.getCurrentVisitorId();
        return [
            token && this.isEventTypeLegacy(eventType) ? `access_token=${token}` : '',
            visitorId ? `visitorId=${visitorId}` : '',
            'discardVisitInfo=true',
        ]
            .filter((p) => !!p)
            .join('&');
    }

    private isEventTypeLegacy(eventType: EventType) {
        return [EventType.click, EventType.custom, EventType.search, EventType.view].indexOf(eventType) !== -1;
    }

    private encodeToJson(eventType: EventType, payload: IRequestPayload, access_token?: string): string {
        if (access_token) {
            return `access_token=${encodeURIComponent(access_token)}&${eventType}Event=${encodeURIComponent(
                JSON.stringify(payload)
            )}`;
        } else {
            return `${eventType}Event=${encodeURIComponent(JSON.stringify(payload))}`;
        }
    }
}
