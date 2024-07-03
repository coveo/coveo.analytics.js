import {context, getOctokit} from '@actions/github';

const octokit = getOctokit(process.env.GH_TOKEN);

await octokit.rest.repos.createDispatchEvent({
  event_type: 'deploy',
  client_payload: {
    run_Id: context.runId,
    FORCE_DEPLOY: false
  },
  owner: 'coveo-platform',
  repo: 'coveo.analytics.js-infra',
});

