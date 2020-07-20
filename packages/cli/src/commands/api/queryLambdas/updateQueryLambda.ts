/* eslint-disable unicorn/filename-case */
// Generated file, please do not edit directly

import { flags } from '@oclif/command';
import { main } from '@rockset/core';
import { runApiCall, Args } from '../../../helper/util';
import { RockCommand } from '../../../base-command';

import { cli } from 'cli-ux';

class UpdateQueryLambda extends RockCommand {
  static flags = {
    help: flags.help({ char: 'h' }),
    file: flags.string({
      char: 'f',
      description:
        'The config file to execute this command from. Format must be [json|yaml]. Keys are translated into arguments of the same name. If no BODY argument is specified, the whole object, minus keys used as other arguments, will be passed in as the BODY.',
    }),
    full: flags.boolean({
      description: 'Show the full results JSON object',
    }),
    ...cli.table.flags(),
    loadTestRps: flags.integer({
      char: 'l',
      description:
        'If this flag is active, a load test will be conducted using this apicall. The value passed to this flag determines how many requests per second will be sent',
    }),
    yes: flags.boolean({
      char: 'y',
      description: 'Skip all safety prompts',
      default: false,
    }),
  };

  static args = [
    {
      name: 'workspace',
      description: 'name of the workspace',
      required: false,
      hidden: false,
    },
    {
      name: 'queryLambda',
      description: 'name of the Query Lambda',
      required: false,
      hidden: false,
    },
    {
      name: 'body',
      description:
        'JSON Body for this POST request. Full schema at https://docs.rockset.com/rest-api#updatequerylambda ',
      required: false,
      hidden: false,
    },
    {
      name: 'create',
      required: false,
      hidden: false,
    },
  ];

  static description = `
Update Query Lambda

Create a new version of a Query Lambda in given workspace.

Endpoint: POST: /v1/orgs/self/ws/{workspace}/lambdas/{queryLambda}/versions

Endpoint Documentation: https://docs.rockset.com/rest-api#updatequerylambda

This command is a simple wrapper around the above endpoint. Please view further documentation at the url above.

`;

  async run() {
    const { args, flags } = this.parse(UpdateQueryLambda);

    // Rockset client object
    const client = await main.createClient();

    // Arguments
    const namedArgs: Args = UpdateQueryLambda.args;

    // apicall
    const apicall = client.queryLambdas.updateQueryLambda.bind(client.queryLambdas);

    // endpoint
    const endpoint = '/v1/orgs/self/ws/{workspace}/lambdas/{queryLambda}/versions';
    const method = 'POST';

    await runApiCall.bind(this)({ args, flags, namedArgs, apicall, method, endpoint });
  }
}

export default UpdateQueryLambda;
