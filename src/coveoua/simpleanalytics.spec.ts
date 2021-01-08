import {handleOneAnalyticsEvent} from './simpleanalytics';
import {createAnalyticsClientMock} from '../../tests/analyticsClientMock';
import {EC} from '../plugins/ec';
import {SVC} from '../plugins/svc';
import 'isomorphic-fetch';
import * as fetchMock from 'fetch-mock';

jest.mock('../plugins/svc', () => {
    const SVC = jest.fn().mockImplementation(() => {});
    (SVC as any)['Id'] = 'svc';
    return {
        SVC: SVC,
    };
});
jest.mock('../plugins/ec', () => {
    const EC = jest.fn().mockImplementation(() => {});
    (EC as any)['Id'] = 'ec';
    return {
        EC: EC,
    };
});

describe('simpleanalytics', () => {
    const analyticsClientMock = createAnalyticsClientMock();

    const someRandomEventName = 'kawabunga';

    beforeEach(() => {
        jest.clearAllMocks();
        fetchMock.mock('*', {});
    });

    afterEach(() => {
        fetchMock.reset();
        fetchMock.resetHistory();
        fetchMock.resetBehavior();
    });

    it('throws when not initialized', () => {
        expect(() => handleOneAnalyticsEvent('send')).toThrow(`You must call init before sending an event`);
    });

    it('throws when initializing without a token', () => {
        expect(() => handleOneAnalyticsEvent('init')).toThrow(`You must pass your token when you call 'init'`);
    });

    it('throws when initializing with a token that is not a string nor a AnalyticClient', () => {
        expect(() => handleOneAnalyticsEvent('init', {})).toThrow(
            `You must pass either your token or a valid object when you call 'init'`
        );
    });

    it('can send pageview', async () => {
        handleOneAnalyticsEvent('init', 'MYTOKEN');
        await handleOneAnalyticsEvent('send', 'pageview');

        expect(fetchMock.calls().length).toBe(1);
        expect(fetchMock.lastUrl()).toBe('https://platform.cloud.coveo.com/rest/ua/v15/analytics/pageview');
    });

    it('throws when send is called without any other arguments', () => {
        handleOneAnalyticsEvent('init', 'MYTOKEN');
        expect(() => handleOneAnalyticsEvent('send')).toThrow(`You must provide an event type when calling "send".`);
    });

    it('can send pageview with customdata', async () => {
        handleOneAnalyticsEvent('init', 'MYTOKEN', {plugins: []});
        await handleOneAnalyticsEvent('send', 'pageview', {somedata: 'asd'});

        expect(fetchMock.calls().length).toBe(1);
        expect(fetchMock.lastUrl()).toBe('https://platform.cloud.coveo.com/rest/ua/v15/analytics/pageview');
        expect(JSON.parse(fetchMock.lastCall()[1].body.toString())).toEqual({somedata: 'asd'});
    });

    it('can send any event to the endpoint', async () => {
        handleOneAnalyticsEvent('init', 'MYTOKEN');
        await handleOneAnalyticsEvent('send', someRandomEventName);

        expect(fetchMock.calls().length).toBe(1);
        expect(fetchMock.lastUrl()).toBe(
            `https://platform.cloud.coveo.com/rest/ua/v15/analytics/${someRandomEventName}`
        );
    });

    it('can send an event with a proxy endpoint', async () => {
        handleOneAnalyticsEvent('initForProxy', 'https://myProxyEndpoint.com');
        await handleOneAnalyticsEvent('send', someRandomEventName);

        expect(fetchMock.calls().length).toBe(1);
        expect(fetchMock.lastUrl()).toBe(`https://myproxyendpoint.com/rest/v15/analytics/${someRandomEventName}`);
    });

    it(`throw if the initForProxy don't receive an endpoint`, () => {
        expect(() => handleOneAnalyticsEvent('initForProxy')).toThrow(
            `You must pass your endpoint when you call 'initForProxy'`
        );
    });

    it(`throw if the initForProxy receive an endpoint that's is not a string`, () => {
        expect(() => handleOneAnalyticsEvent('initForProxy', {})).toThrow(
            `You must pass a string as the endpoint parameter when you call 'initForProxy'`
        );
    });

    it('can set a new parameter', async () => {
        handleOneAnalyticsEvent('init', 'MYTOKEN');
        handleOneAnalyticsEvent('set', 'userId', 'something');
        await handleOneAnalyticsEvent('send', someRandomEventName);

        expect(fetchMock.calls().length).toBe(1);
        expect(fetchMock.lastUrl()).toBe(
            `https://platform.cloud.coveo.com/rest/ua/v15/analytics/${someRandomEventName}`
        );
        expect(JSON.parse(fetchMock.lastCall()[1].body.toString())).toEqual({userId: 'something'});
    });

    it('can set parameters using an object', async () => {
        handleOneAnalyticsEvent('init', 'MYTOKEN');
        handleOneAnalyticsEvent('set', {
            userId: 'something',
        });
        await handleOneAnalyticsEvent('send', someRandomEventName);

        expect(fetchMock.calls().length).toBe(1);
        expect(fetchMock.lastUrl()).toBe(
            `https://platform.cloud.coveo.com/rest/ua/v15/analytics/${someRandomEventName}`
        );
        expect(JSON.parse(fetchMock.lastCall()[1].body.toString())).toEqual({userId: 'something'});
    });

    it('can initialize with analyticsClient', () => {
        expect(() => handleOneAnalyticsEvent('init', analyticsClientMock)).not.toThrow();
    });

    it('can initialize with a token', () => {
        expect(() => handleOneAnalyticsEvent('init', 'SOME TOKEN')).not.toThrow();
    });

    it('default to platform.cloud.coveo.com when no endpoint is given', async () => {
        handleOneAnalyticsEvent('init', 'SOME TOKEN');

        await handleOneAnalyticsEvent('send', 'pageview');

        expect(fetchMock.calls().length).toBe(1);
        const foo = fetchMock.lastUrl();
        expect(fetchMock.lastUrl()).toMatch(/^https:\/\/platform\.cloud\.coveo\.com\/rest\/ua/);
    });

    it('default to platform.cloud.coveo.com when the endpoint is an empty string', async () => {
        handleOneAnalyticsEvent('init', 'SOME TOKEN', '');

        await handleOneAnalyticsEvent('send', 'pageview');

        expect(fetchMock.calls().length).toBe(1);
        const foo = fetchMock.lastUrl();
        console.log(JSON.stringify(foo));
        expect(fetchMock.lastUrl()).toMatch(/^https:\/\/platform\.cloud\.coveo\.com\/rest\/ua/);
    });

    it('default to platform.cloud.coveo.com when an options object is given but does not include an endpoint', async () => {
        handleOneAnalyticsEvent('init', 'SOME TOKEN', {});

        await handleOneAnalyticsEvent('send', 'pageview');

        expect(fetchMock.calls().length).toBe(1);
        expect(fetchMock.lastUrl()).toMatch(/^https:\/\/platform\.cloud\.coveo\.com\/rest\/ua/);
    });

    it('default to platform.cloud.coveo.com when an options object is given but the endpoint property is falsy', async () => {
        handleOneAnalyticsEvent('init', 'SOME TOKEN', {endpoint: ''});

        await handleOneAnalyticsEvent('send', 'pageview');

        expect(fetchMock.calls().length).toBe(1);
        expect(fetchMock.lastUrl()).toMatch(/^https:\/\/platform\.cloud\.coveo\.com\/rest\/ua/);
    });

    it('uses the endpoint given if its a non-empty string', async () => {
        handleOneAnalyticsEvent('init', 'SOME TOKEN', 'https://someendpoint.com');

        await handleOneAnalyticsEvent('send', 'pageview');

        expect(fetchMock.calls().length).toBe(1);
        expect(fetchMock.lastUrl()).toMatch(/^https:\/\/someendpoint\.com/);
    });

    it('uses the endpoint given if the options object include a non-empty string', async () => {
        handleOneAnalyticsEvent('init', 'SOME TOKEN', {endpoint: 'https://someendpoint.com'});

        await handleOneAnalyticsEvent('send', 'pageview');

        expect(fetchMock.calls().length).toBe(1);
        expect(fetchMock.lastUrl()).toMatch(/^https:\/\/someendpoint\.com/);
    });

    it('uses EC and SVC plugins by default', () => {
        handleOneAnalyticsEvent('init', 'SOME TOKEN');

        expect(SVC).toHaveBeenCalled();
        expect(EC).toHaveBeenCalled();
    });

    it('can accepts no plugins', () => {
        handleOneAnalyticsEvent('init', 'SOME TOKEN', {plugins: []});

        expect(SVC).not.toHaveBeenCalled();
        expect(EC).not.toHaveBeenCalled();
    });

    it('can accepts one plugin', () => {
        handleOneAnalyticsEvent('init', 'SOME TOKEN', {plugins: ['svc']});

        expect(SVC).toHaveBeenCalled();
        expect(EC).not.toHaveBeenCalled();
    });

    it('can send pageview with analyticsClient', () => {
        handleOneAnalyticsEvent('init', analyticsClientMock);

        expect(() => handleOneAnalyticsEvent('send', 'pageview')).not.toThrow();
    });

    it('throw when a namespaced action is called and that the namespace/plugin is not registered', () => {
        handleOneAnalyticsEvent('init', 'SOME TOKEN');

        expect(() => handleOneAnalyticsEvent('foo:potato')).toThrow(
            `The plugin "foo" is not registered. Check that you passed it on initialization.`
        );
    });

    it('throw when a namespaced action is called and that the this action does not exists on the plugin', () => {
        handleOneAnalyticsEvent('init', 'SOME TOKEN', {plugins: ['svc']});

        expect(() => handleOneAnalyticsEvent('svc:fooBarBaz')).toThrow(
            `The function "fooBarBaz" does not exists on the plugin "svc".`
        );
    });

    it('throws when called with an unknown action', () => {
        handleOneAnalyticsEvent('init', 'SOME TOKEN', {plugins: ['svc']});
        expect(() => handleOneAnalyticsEvent('potato')).toThrow(
            `The action "potato" does not exist. Available actions: init, set, send, onLoad, callPlugin.`
        );
    });

    test('can execute callback with onLoad event', () => {
        var callback = jest.fn();

        handleOneAnalyticsEvent('onLoad', callback);

        expect(callback).toHaveBeenCalledTimes(1);
    });

    test('throws when registering an invalid onLoad event', () => {
        expect(() => handleOneAnalyticsEvent('onLoad', undefined)).toThrow();
    });
});
