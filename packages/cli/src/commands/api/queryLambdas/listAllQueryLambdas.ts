/* eslint-disable unicorn/filename-case */
// Generated file, please do not edit directly

import { Command, flags } from '@oclif/command';
import { main } from '@rockset/core';
import { runApiCall, Args } from '../../../helper/util';

class ListAllQueryLambdas extends Command {
  static flags = {
    help: flags.help({ char: 'h' }),
    file: flags.string({
      char: 'f',
      description: 'The config file to execute this command from. Format must be [yaml|json]',
    }),
  };

  static args = [];

  static description = `
List Query Lambdas

List all Query Lambdas.

Endpoint: GET: /v1/orgs/self/lambdas

Endpoint Documentation: https://docs.rockset.com/rest-api#listallquerylambdas

This command is a simple wrapper around the above endpoint. Please view further documentation at the url above.

`;

  async run() {
    const { args, flags } = this.parse(ListAllQueryLambdas);

    // Rockset client object
    const client = await main.createClient();

    // Arguments
    const namedArgs: Args = ListAllQueryLambdas.args;

    // apicall
    const apicall = client.queryLambdas.listAllQueryLambdas.bind(client.queryLambdas);

    runApiCall.bind(this)({ args, flags, namedArgs, apicall });
  }
}

export default ListAllQueryLambdas;
