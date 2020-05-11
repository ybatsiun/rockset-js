// Generated file, please do not edit directly

import { Command, flags } from '@oclif/command';
import * as _ from 'lodash';
import { createClient } from '@rockset/core';
import { runApiCall, Args } from '../../../helper/util';


class ExecuteQueryLambda extends Command {
  static flags = {
    help: flags.help({ char: 'h' }),
    file: flags.string({
      char: 'f',
      description: 'The config file to execute this command from. Format must be [yaml|json]',
    }),
  };

  static args = [
  {
    "name": "workspace",
    "description": "name of the workspace",
    "required": true,
    "hidden": false
  },
  {
    "name": "queryLambda",
    "description": "name of the Query Lambda",
    "required": true,
    "hidden": false
  },
  {
    "name": "version",
    "description": "version",
    "required": true,
    "hidden": false
  },
  {
    "name": "body",
    "description": "JSON object",
    "required": false,
    "hidden": false
  }
];
  static description = `
Run Query Lambda

Run a particular version of a Query Lambda.

Endpoint: POST: /v1/orgs/self/ws/{workspace}/lambdas/{queryLambda}/versions/{version}

Endpoint Documentation: https://docs.rockset.com/rest-api#executequerylambda

This command is a simple wrapper around the above endpoint. Please view further documentation at the url above.

`;

  async run() {
    const { args, flags } = this.parse(ExecuteQueryLambda);

    // Rockset client object
    const client = await createClient();

    // Arguments
    const namedArgs :Args = [
  {
    "name": "workspace",
    "description": "name of the workspace",
    "required": true,
    "hidden": false
  },
  {
    "name": "queryLambda",
    "description": "name of the Query Lambda",
    "required": true,
    "hidden": false
  },
  {
    "name": "version",
    "description": "version",
    "required": true,
    "hidden": false
  },
  {
    "name": "body",
    "description": "JSON object",
    "required": false,
    "hidden": false
  }
];

    // apicall 
    const apicall = client.queryLambdas.executeQueryLambda.bind(client.queryLambdas);

    runApiCall({args, flags, namedArgs, apicall, log: this.log, error: this.error});
  }
}

export default ExecuteQueryLambda;
