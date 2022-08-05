import CoveoAnalyticsClient from '../client/analytics';
import {ReactNativeRuntime} from './index';

describe('ReactNativeRuntime', () => {
    let runtimeEnvironment: ReactNativeRuntime;
    let client: CoveoAnalyticsClient;

    beforeEach(() => {
        runtimeEnvironment = new ReactNativeRuntime({
            baseUrl: 'https://www.coveo.com',
            visitorIdProvider: {getCurrentVisitorId: jest.fn(), setCurrentVisitorId: jest.fn()},
        });
        client = new CoveoAnalyticsClient({runtimeEnvironment});
    });

    it('should call "storage.getItem" when getting the visitor ID', async () => {
        spyOn(runtimeEnvironment.storage, 'getItem');
        await client.getCurrentVisitorId();
        expect(runtimeEnvironment.storage.getItem).toHaveBeenCalled();
    });

    it('should call "storage.getItem" when getting the visitor ID', async () => {
        spyOn(runtimeEnvironment.storage, 'setItem');
        await client.setCurrentVisitorId('myid');
        expect(runtimeEnvironment.storage.setItem).toHaveBeenCalled();
    });
});