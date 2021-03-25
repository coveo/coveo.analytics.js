export const getQueryParameters = () => {
    return {
        version: getVersion(),
        endpoint: getEndpoint(),
        token: getToken(),
        s3Path: getS3Path(),
    };
};

const getToken = () => (Cypress.env('token') as string) || 'invalid';
const getVersion = () => (Cypress.env('version') as string) || '2';
const getEndpoint = () => (Cypress.env('endpoint') as string) || 'https://platform.cloud.coveo.com/rest/ua';
const getS3Path = () => (Cypress.env('s3_path') as string) || '';

export const getCollectEndpoint = () => `${getEndpoint()}/v15/analytics/collect`;
