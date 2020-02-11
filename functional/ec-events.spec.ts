import 'isomorphic-fetch';
import * as fetchMock from 'fetch-mock';
import { DefaultEventResponse } from '../src/events';
import coveoua from '../src/coveoua/browser';

describe('ec events', () => {
    const aToken = 'token';
    const anEndpoint = 'http://bloup';
    const aVisitorId = '123';

    const defaultContextValues = {
        dl: `${location.protocol}//${location.hostname}${location.pathname.indexOf('/') === 0 ? location.pathname : `/${location.pathname}`}${location.search}`,
        sr: `${screen.width}x${screen.height}`,
        sd: `${screen.colorDepth}-bit`,
        ul: navigator.language,
        ua: navigator.userAgent,
        dr: document.referrer,
        dt: document.title,
        de: document.characterSet,
    };

    beforeEach(() => {
        const address = `${anEndpoint}/rest/v15/analytics/collect`;
        const eventResponse: DefaultEventResponse = {
            visitId : 'firsttimevisiting',
            visitorId: aVisitorId
        };
        fetchMock.reset();
        fetchMock.post(address, eventResponse);
        coveoua('init', aToken, anEndpoint);
    });

    it('can send a product detail view event', async () => {
        coveoua('ec:addProduct', {name: 'wow', id: 'something', brand: 'brand', custom: 'ok'});
        coveoua('ec:setAction', 'detail', {storeid: 'amazing'});
        await coveoua('send', 'pageview');

        assertRequestSentContainsEqual({
            ...defaultContextValues,
            t: 'pageview',
            pr1nm: 'wow',
            pr1id: 'something',
            pr1br: 'brand',
            pr1custom: 'ok',
            pa: 'detail',
            storeid: 'amazing',
        });
    });

    it('can send a pageview event with options', async () => {
        await coveoua('send', 'pageview', 'page', {
            title: 'wow',
            location: 'http://right.here',
        });

        assertRequestSentContainsEqual({
            ...defaultContextValues,
            t: 'pageview',
            dp: 'page',
            dt: 'wow',
            dl: 'http://right.here'
        });
    });

    it('should change the pageViewId only when sending a second page view event', async () => {
        await coveoua('send', 'event');
        await coveoua('send', 'event');
        await coveoua('send', 'pageview');
        await coveoua('send', 'event');
        await coveoua('send', 'pageview');
        await coveoua('send', 'event');

        const [event, secondEvent, pageView, thirdEvent, secondPageView, afterSecondPageView] = getParsedBody();

        expect(event.a).toBe(secondEvent.a);
        expect(event.a).toBe(pageView.a);
        expect(event.a).toBe(thirdEvent.a);
        expect(event.a).not.toBe(secondPageView.a);
        expect(secondPageView.a).toBe(afterSecondPageView.a);
    });

    it('should update the current location and referrer on a second page view', async () => {
        const initialLocation = `${window.location}`;
        const secondLocation = 'http://very.new/';

        await coveoua('send', 'pageview');
        await coveoua('send', 'event', '1');
        changeDocumentLocation(secondLocation);
        await coveoua('send', 'pageview');
        await coveoua('send', 'event', '2');

        const [pageView, afterFirst, secondPageView, afterSecond] = getParsedBody();

        expect(pageView.dl).toBe(initialLocation);
        expect(pageView.dr).toBe(document.referrer);
        expect(afterFirst.dl).toBe(initialLocation);
        expect(afterFirst.dr).toBe(document.referrer);

        expect(secondPageView.dl).toBe(secondLocation);
        expect(secondPageView.dr).toBe(initialLocation);
        expect(afterSecond.dl).toBe(secondLocation);
        expect(afterSecond.dr).toBe(initialLocation);
    });

    it('should update the current location when a pageview is sent with the page parameter and keep it', async () => {
        const initialLocation = `${window.location}`;

        await coveoua('send', 'pageview', '/page');
        await coveoua('send', 'event', '1');

        const [event, secondEvent] = getParsedBody();

        expect(event.dl).toBe(`${initialLocation}page`);
        expect(secondEvent.dl).toBe(`${initialLocation}page`);
    });

    it('should keep the current location when a pageview is sent with the page parameter', async () => {
        const initialLocation = `${window.location}`;

        await coveoua('send', 'pageview', '/page');

        const [event] = getParsedBody();

        expect(event.dl).toBe(`${initialLocation}page`);
    });

    const assertRequestSentContainsEqual = (toContain: {[name: string]: any}) => {
        expect(fetchMock.called()).toBe(true);

        const [, { body }] = fetchMock.lastCall();
        expect(body).not.toBeUndefined();

        const parsedBody = JSON.parse(body.toString());
        Object.keys(toContain).map((key: string) => ({
            [key]: toContain[key]
        })).forEach((toTest) => expect(parsedBody).toMatchObject(toTest));
    };

    const getParsedBody = (): any[] => {
        return fetchMock.calls().map(([, { body }]) => JSON.parse(body.toString()));
    };

    const changeDocumentLocation = (url: string) => {
        delete window.location;
        // @ts-ignore
        // Ooommmpf... JSDOM does not support any form of navigation, so let's overwrite the whole thing 💥.
        window.location = new URL(url);
    };
});
