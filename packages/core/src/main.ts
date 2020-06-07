import rocksetConfigure from '@rockset/client';
import {
  DeployHooks,
  LambdaEntity,
  CollectionEntity,
  DownloadHooks,
  LambdaDownloadOptions,
  notEmpty,
  LambdaDeployOptions,
  QualifiedName,
  parseAbsolutePath,
  ExecuteHooks,
} from './types';
import {
  FetchAPI,
  Collection,
  QueryLambdaVersion,
  QueryLambda,
} from '@rockset/client/dist/codegen/api';
import {
  getFiles,
  isDefinitionPath,
  resolveQualifiedNameFromPath,
  getQualifiedName,
  relativeSQLPath,
  resolvePathFromQualifiedName,
} from './filesystem/pathutil';
import {
  getSrcPath,
  readLambda,
  writeLambda,
  writeCollection,
  deleteLambda,
} from './filesystem/fileutil';
import _ from 'lodash';
import { getAuthProfile } from './filesystem/auth';

/**
 *
 * @param customFetch custom fetch agent to pass into the client
 */
export async function createClient(customFetch?: FetchAPI) {
  const { apikey, apiserver } = await getAuthProfile();
  return rocksetConfigure(apikey, apiserver, customFetch);
}

export async function listEntityNames() {
  const src = await getSrcPath();
  const allFiles = await getFiles(src);

  const entities = allFiles
    .map((path) => resolveQualifiedNameFromPath(src, path))
    .filter(notEmpty);

  const lambdas = entities.filter(([, t]) => t === 'lambda');
  const collections = entities.filter(([, t]) => t === 'collection');

  return {
    lambdas,
    collections,
  };
}

const constructLambdaEntity = (
  networkLambda: QueryLambdaVersion
): LambdaEntity | null => {
  const ws = networkLambda.workspace;
  const name = networkLambda.name;

  // if workspace and name aren't defined, this query lambda object is broken
  if (!ws || !name) {
    return null;
  }

  const fullName = getQualifiedName(ws, name);
  const sql = networkLambda.sql?.query ?? '';
  const default_parameters = networkLambda.sql?.default_parameters ?? [];
  return {
    type: 'lambda',
    name,
    ws,
    fullName,
    sql,
    config: {
      sql_path: relativeSQLPath(name),
      default_parameters,
    },
  };
};

export const constructCollectionEntity = (networkCollection: Collection) => {
  const ws = networkCollection.workspace;
  const name = networkCollection.name;

  // if workspace and name aren't defined, this query lambda object is broken
  if (!ws || !name) {
    return null;
  }

  const fullName = getQualifiedName(ws, name);

  const entity: CollectionEntity = {
    name,
    fullName,
    ws,
    type: 'collection',
    config: _.omit(networkCollection, 'name', 'stats', 'workspace'),
  };
  return entity;
};

export async function downloadCollections(hooks: DownloadHooks = {}) {
  const client = await createClient();

  // Grab entities from apiserver
  const collections = await client.collections.listCollections();

  // Write collections to file
  collections.data?.forEach(async (collection) => {
    const collectionEntity = constructCollectionEntity(collection);
    if (collectionEntity) {
      await writeCollection(collectionEntity);
      hooks.onWriteCollection?.(collectionEntity);
    }
  });
}

export async function downloadQueryLambdas(
  hooks: DownloadHooks = {},
  options: LambdaDownloadOptions
) {
  const client = await createClient();

  let lambdas: QueryLambdaVersion[] = [];
  // Grab entities from apiserver
  if (options.useLambdaTag) {
    // Use tags — QLs without this tag will not be pulled
    const lambdaResponse = await client.queryLambdas.listQueryLambdaTagVersions(
      options.useLambdaTag
    );
    lambdas = lambdaResponse?.data ?? [];
  } else {
    // Use latest versions - all QLs will be pulled
    const lambdaResponse = await client.queryLambdas.listAllQueryLambdas();
    lambdas = (lambdaResponse.data ?? []).map(
      (l: QueryLambda) => l.latest_version as QueryLambdaVersion
    );
  }
  if (lambdas.length === 0) {
    hooks.onNoOp?.();
  }
  lambdas.forEach(async (lambda: QueryLambdaVersion) => {
    const qlEntity = constructLambdaEntity(lambda);
    if (qlEntity) {
      await writeLambda(qlEntity);
      hooks.onWriteLambda?.(qlEntity);
    }
  });
}

export async function deleteAllQueryLambdas() {
  const srcPath = await getSrcPath();
  const allFiles = await getFiles(srcPath);
  const lambdaFiles = allFiles.filter((file) =>
    isDefinitionPath(srcPath, file, 'lambda')
  );

  lambdaFiles.map(async (file) => {
    const [qualifiedName] = resolveQualifiedNameFromPath(srcPath, file) ?? [
      null,
      null,
    ];
    if (qualifiedName) {
      const lambda = await readLambda(qualifiedName, file);
      return await deleteLambda(srcPath, file, lambda);
    }
  });
}

/**
 * This function deploys your local lambdas to Rockset
 * @param hooks Lifecycle hooks that will be called at appropriate intervals
 */
// TODO add tests for this
export async function deployQueryLambdas(
  hooks: DeployHooks = {},
  options: LambdaDeployOptions
) {
  const [srcPath, client] = await Promise.all([getSrcPath(), createClient()]);

  // Grab all files
  const allFiles = await getFiles(srcPath);
  const lambdaFiles = allFiles.filter((file) =>
    isDefinitionPath(srcPath, file, 'lambda')
  );

  // Construct lambda entities
  const lambdaEntities = (await Promise.all(
    lambdaFiles
      .map((file) => {
        const [qualifiedName] = resolveQualifiedNameFromPath(srcPath, file) ?? [
          null,
          null,
        ];
        if (qualifiedName) {
          return readLambda(qualifiedName, file);
        }
        return null;
      })
      .filter((x) => x != null)
  )) as LambdaEntity[];

  return lambdaEntities.map(async (lambdaEntity) => {
    const { ws, name: lambda, sql: text } = lambdaEntity;

    try {
      const lambdaResponse = await client.queryLambdas.updateQueryLambda(
        ws,
        lambda,
        {
          sql: {
            query: text,
            default_parameters: lambdaEntity.config.default_parameters,
          },
        },
        /* create if not present */ true
      );
      hooks.onDeployVersionSuccess?.(lambdaResponse);
      if (options.tag) {
        await client.queryLambdas.createQueryLambdaTag(ws, lambda, {
          tag_name: options.tag,
          version: lambdaResponse.data?.version,
        });
        hooks.onDeployTagSuccess?.(lambdaResponse);
      }
    } catch (e) {
      hooks.onDeployError?.(e, lambdaEntity);
    }
  });
}

/**
 * This function executes a specified version of a Query Lambda
 * @param hooks Lifecycle hooks that will be called at appropriate intervals
 */
// TODO add tests for this
export async function executeQueryLambda(
  hooks: ExecuteHooks = {},
  qualifiedName: QualifiedName,
  version: string
) {
  const [srcPath, client] = await Promise.all([getSrcPath(), createClient()]);
  const file = parseAbsolutePath(
    resolvePathFromQualifiedName(qualifiedName, 'lambda', srcPath)
  );

  // Construct lambda entity
  const lambdaEntity: LambdaEntity = await readLambda(qualifiedName, file);
  const { ws, name: lambda, config } = lambdaEntity;

  try {
    const lambdaResponse = await client.queryLambdas.executeQueryLambda(
      ws,
      lambda,
      version,
      {
        parameters: config.default_parameters,
      }
    );
    hooks.onExecuteSuccess?.(lambdaResponse);
  } catch (e) {
    hooks.onExecuteError?.(e, lambdaEntity);
  }
}
