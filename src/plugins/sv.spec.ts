import {SV, SVPluginEventTypes} from './sv';
import {createAnalyticsClientMock} from '../../tests/analyticsClientMock';

describe('SV plugin', () => {
    let sv: SV;
    let client: ReturnType<typeof createAnalyticsClientMock>;

    const someUUIDGenerator = jest.fn(() => someUUID);
    const someUUID = '13ccebdb-0138-45e8-bf70-884817ead190';
    const defaultResult = {
        pageViewId: someUUID,
        encoding: document.characterSet,
        location: 'http://localhost/',
        referrer: 'http://somewhere.over/therainbow',
        title: 'MAH PAGE',
        screenColor: '24-bit',
        screenResolution: '0x0',
        time: expect.any(String),
        userAgent: navigator.userAgent,
        language: 'en-US',
        hitType: SVPluginEventTypes.event,
        eventId: someUUID,
    };

    beforeEach(() => {
        jest.clearAllMocks();
        client = createAnalyticsClientMock();
        sv = new SV({client, uuidGenerator: someUUIDGenerator});
    });

    it('should register a hook in the client', () => {
        expect(client.registerBeforeSendEventHook).toHaveBeenCalledTimes(1);
    });

    it('should register a mapping for each SV type', () => {
        expect(client.addEventTypeMapping).toHaveBeenCalledTimes(Object.keys(SVPluginEventTypes).length);
    });

    describe('tickets', () => {
        it('should set the ticket with the specific format and convert known ticket keys into the measurement protocol format when the hook is called', () => {
            sv.setTicket({
                id: 'Some ID',
                subject: 'Some Subject',
                description: 'Some Description',
                category: 'Some Category',
                productId: 'Some Product ID',
                custom: {someCustomProp: 'some custom prop value'},
            });

            const result = executeRegisteredHook(SVPluginEventTypes.event, {});

            expect(result).toEqual({
                ...defaultResult,
                svc_ticket_id: 'Some ID',
                svc_ticket_subject: 'Some Subject',
                svc_ticket_description: 'Some Description',
                svc_ticket_category: 'Some Category',
                svc_ticket_product_id: 'Some Product ID',
                svc_ticket_custom: {someCustomProp: 'some custom prop value'},
            });
        });

        it('should append the ticket with the pageview event', () => {
            sv.setTicket({subject: 'Some Subject'});

            const result = executeRegisteredHook(SVPluginEventTypes.pageview, {});

            expect(result).toEqual({
                ...defaultResult,
                hitType: SVPluginEventTypes.pageview,
                svc_ticket_subject: 'Some Subject',
            });
        });

        it('should not append the product with a random event type', () => {
            sv.setTicket({subject: 'Some Subject'});

            const result = executeRegisteredHook('🎲', {});

            expect(result).toEqual({});
        });

        it('should keep the ticket until a valid event type is used', () => {
            sv.setTicket({subject: 'Some Subject'});

            executeRegisteredHook('🎲', {});
            executeRegisteredHook('🐟', {});
            executeRegisteredHook('💀', {});
            const result = executeRegisteredHook(SVPluginEventTypes.event, {});

            expect(result).toEqual({...defaultResult, svc_ticket_subject: 'Some Subject'});
        });

        it('should keep custom metadata in the ticket', () => {
            sv.setTicket({subject: '🧀', custom: {verycustom: 'value'}});

            const result = executeRegisteredHook(SVPluginEventTypes.event, {});

            expect(result).toEqual({
                ...defaultResult,
                svc_ticket_subject: '🧀',
                svc_ticket_custom: {verycustom: 'value'},
            });
        });

        it('should flush the ticket once they are sent', () => {
            sv.setTicket({subject: '🍟', description: 'description'});

            const firstResult = executeRegisteredHook(SVPluginEventTypes.event, {});
            const secondResult = executeRegisteredHook(SVPluginEventTypes.event, {});

            expect(firstResult).not.toEqual({});
            expect(secondResult).toEqual({...defaultResult});
        });
    });

    it('should be able to set an action', () => {
        sv.setAction('ok');

        const result = executeRegisteredHook(SVPluginEventTypes.event, {});

        expect(result).toEqual({
            ...defaultResult,
            svcAction: 'ok',
        });
    });

    it('should flush the action once it is sent', () => {
        sv.setAction('ok');

        const firstResult = executeRegisteredHook(SVPluginEventTypes.event, {});
        const secondResult = executeRegisteredHook(SVPluginEventTypes.event, {});

        expect(firstResult).not.toEqual({});
        expect(secondResult).toEqual({...defaultResult});
    });

    it('should be able to clear all the data', () => {
        sv.setTicket({subject: '🍨', description: 'Some desc'});
        sv.addImpression({id: '🍦', name: 'impression'});
        sv.clearData();

        const result = executeRegisteredHook(SVPluginEventTypes.event, {});

        expect(result).toEqual({...defaultResult});
    });

    it('should call the uuidv4 method', async () => {
        await executeRegisteredHook(SVPluginEventTypes.event, {});
        await executeRegisteredHook(SVPluginEventTypes.event, {});
        await executeRegisteredHook(SVPluginEventTypes.event, {});

        // One for generating pageViewId, one for each individual event.
        expect(someUUIDGenerator).toHaveBeenCalledTimes(1 + 3);
    });

    it('should update the location when sending a pageview with the page parameter', async () => {
        const payload = {
            page: '/somepage',
        };

        const pageview = await executeRegisteredHook(SVPluginEventTypes.pageview, payload);
        const event = await executeRegisteredHook(SVPluginEventTypes.event, {});

        expect(pageview).toEqual({
            ...defaultResult,
            hitType: SVPluginEventTypes.pageview,
            page: payload.page,
            location: `${defaultResult.location}${payload.page.substring(1)}`,
        });
        expect(event).toEqual({
            ...defaultResult,
            hitType: SVPluginEventTypes.event,
            location: `${defaultResult.location}${payload.page.substring(1)}`,
        });
    });

    const executeRegisteredHook = (eventType: string, payload: any) => {
        const [hook] = client.registerBeforeSendEventHook.mock.calls[0];
        return hook(eventType, payload);
    };
});
