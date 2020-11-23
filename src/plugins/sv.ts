import {AnalyticsClient} from '../client/analytics';
import {EventType} from '../events';
import {uuidv4} from '../client/crypto';
import {getFormattedLocation} from '../client/location';
import {
    convertImpressionListToMeasurementProtocol,
    convertTicketToMeasurementProtocol,
} from '../client/measurementProtocolMapper';

export const SVPluginEventTypes = {
    pageview: 'pageview',
    event: 'event',
};

const allSVEventTypes = Object.keys(SVPluginEventTypes).map(
    (key) => SVPluginEventTypes[key as keyof typeof SVPluginEventTypes]
);

export type CustomValues = {
    [key: string]: string | number | boolean;
};

export interface TicketProperties {
    id?: string;
    subject?: string;
    description?: string;
    category?: string;
    productId?: string;
    custom?: CustomValues;
}

export type Ticket = TicketProperties;

export interface ImpressionProperties {
    id?: string;
    name?: string;
    position?: number;
    list?: string;
    custom?: CustomValues;
}

export type Impression = ImpressionProperties;
export type BaseImpression = Omit<Impression, 'list'>;
export interface ImpressionList {
    listName?: string;
    impressions: BaseImpression[];
}

export class SV {
    private client: AnalyticsClient;
    private uuidGenerator: typeof uuidv4;
    private ticket: Ticket = {};
    private impressions: Impression[] = [];
    private action?: string;
    private actionData: {[name: string]: string} = {};
    private pageViewId: string;
    private hasSentFirstPageView?: boolean;
    private lastLocation: string;
    private lastReferrer: string;

    constructor({client, uuidGenerator = uuidv4}: {client: AnalyticsClient; uuidGenerator?: typeof uuidv4}) {
        this.client = client;
        this.uuidGenerator = uuidGenerator;
        this.pageViewId = uuidGenerator();
        this.lastLocation = getFormattedLocation(window.location);
        this.lastReferrer = document.referrer;

        this.addHooksForPageView();
        this.addHooksForEvent();
        this.addHooksForSVEvents();
    }

    setTicket(ticket: Ticket) {
        this.ticket = ticket;
    }

    addImpression(impression: Impression) {
        this.impressions.push(impression);
    }

    setAction(action: string, options?: any) {
        this.action = action;
        this.actionData = options;
    }

    clearData() {
        this.ticket = {};
        this.impressions = [];
        this.action = undefined;
        this.actionData = {};
    }

    clearTicket() {
        this.ticket = {};
    }

    private addHooksForSVEvents() {
        this.client.registerBeforeSendEventHook((eventType, ...[payload]) => {
            return allSVEventTypes.indexOf(eventType) !== -1 ? this.addSVDataToPayload(eventType, payload) : payload;
        });
    }

    private addHooksForPageView() {
        this.client.addEventTypeMapping(SVPluginEventTypes.pageview, {
            newEventType: EventType.collect,
            variableLengthArgumentsNames: ['page'],
            addVisitorIdParameter: true,
            usesMeasurementProtocol: true,
        });
    }

    private addHooksForEvent() {
        this.client.addEventTypeMapping(SVPluginEventTypes.event, {
            newEventType: EventType.collect,
            variableLengthArgumentsNames: ['eventCategory', 'eventAction', 'eventLabel', 'eventValue'],
            addVisitorIdParameter: true,
            usesMeasurementProtocol: true,
        });
    }

    private addSVDataToPayload(eventType: string, payload: any) {
        const svPayload = {
            ...this.getLocationInformation(eventType, payload),
            ...this.getDefaultContextInformation(eventType),
            ...(this.action ? {svcAction: this.action} : {}),
            ...(Object.keys(this.actionData ?? {}).length > 0 ? {svcActionData: this.actionData} : {}),
        };

        const ticketPayload = this.getTicketPayload();
        const impressionPayload = this.getImpressionPayload();
        this.clearData();

        return {
            ...impressionPayload,
            ...ticketPayload,
            ...svPayload,
            ...payload,
        };
    }

    private getTicketPayload() {
        return convertTicketToMeasurementProtocol(this.ticket);
    }

    private getImpressionPayload() {
        const impressionsByList = this.getImpressionsByList();
        return impressionsByList
            .map(
                ({impressions, ...rest}) =>
                    ({
                        ...rest,
                        impressions: impressions.map((baseImpression) =>
                            this.assureBaseImpressionValidity(baseImpression)
                        ),
                    } as ImpressionList)
            )
            .reduce((newPayload, impressionList, index) => {
                return {
                    ...newPayload,
                    ...convertImpressionListToMeasurementProtocol(impressionList, index, 'ii'),
                };
            }, {});
    }

    private assureBaseImpressionValidity(baseImpression: BaseImpression) {
        const {position, ...baseImpressionRest} = baseImpression;
        if (position !== undefined && position < 1) {
            console.warn(
                `The position for impression '${baseImpression.name || baseImpression.id}'` +
                    ` must be greater than 0 when provided.`
            );

            return baseImpressionRest;
        }

        return baseImpression;
    }

    private getImpressionsByList() {
        return this.impressions.reduce((lists, impression) => {
            const {list: listName, ...baseImpression} = impression;
            const list = lists.find((list) => list.listName === listName);
            if (list) {
                list.impressions.push(baseImpression);
            } else {
                lists.push({listName: listName, impressions: [baseImpression]});
            }
            return lists;
        }, [] as ImpressionList[]);
    }

    private updateStateForNewPageView(payload: any) {
        if (this.hasSentFirstPageView) {
            this.pageViewId = this.uuidGenerator();
            this.lastReferrer = this.lastLocation;
        }

        if (!!payload.page) {
            const removeStartingSlash = (page: string) => page.replace(/^\/?(.*)$/, '/$1');
            const extractHostnamePart = (location: string) => location.split('/').slice(0, 3).join('/');
            this.lastLocation = `${extractHostnamePart(this.lastLocation)}${removeStartingSlash(payload.page)}`;
        } else {
            this.lastLocation = getFormattedLocation(window.location);
        }

        this.hasSentFirstPageView = true;
    }

    getLocationInformation(eventType: string, payload: any) {
        eventType === SVPluginEventTypes.pageview && this.updateStateForNewPageView(payload);
        return {
            referrer: this.lastReferrer,
            location: this.lastLocation,
        };
    }

    getDefaultContextInformation(eventType: string) {
        const pageContext = {
            hitType: eventType,
            pageViewId: this.pageViewId,
        };
        const documentContext = {
            title: document.title,
            encoding: document.characterSet,
        };
        const screenContext = {
            screenResolution: `${screen.width}x${screen.height}`,
            screenColor: `${screen.colorDepth}-bit`,
        };
        const navigatorContext = {
            language: navigator.language,
            userAgent: navigator.userAgent,
        };
        const eventContext = {
            time: Date.now().toString(),
            eventId: this.uuidGenerator(),
        };
        return {
            ...pageContext,
            ...eventContext,
            ...screenContext,
            ...navigatorContext,
            ...documentContext,
        };
    }
}
