import {
  ErrorModel,
  Collection,
  QueryLambdaVersionResponse,
} from '@rockset/client/dist/codegen/api';
import { type, TypeOf, string, array } from 'io-ts';
import * as t from 'io-ts';
import * as path from 'path';
import {
  RockClientException,
  errorInvalidAbsolutePath,
  errorInvalidQualifiedName,
  errorFailedToCreateEntity,
} from './exception/exception';
import { Either, fold } from 'fp-ts/lib/Either';
import { PathReporter } from 'io-ts/lib/PathReporter';
import { getWsNamePair, relativeSQLPath } from './filesystem/pathutil';

export const ROOT_CONFIG = 'rockconfig.json' as const;

const AuthProfile = type({
  apikey: string,
  apiserver: string,
});

/**
 * Many of the types from here on out are defined as RuntimeTypes with io-ts.
 * eg. `t.string` is a runtime string type defined using io-ts.
 * Please view the io-ts documentation for more details.
 *
 * Runtime types defined by io-ts are values that can be used in js.
 * Every time you define a runtime type, you should also define a TS type with the same name
 * eg. const ABC = ...
 * type ABC = TypeOf<typeof ABC>
 */

/**
 * Brands here. Brands are a way of testing a particular type of string.
 * Eg. `QualifiedName` is a string subtype that refers to an entity name, eg `commons.foo`
 *
 */

export interface QualifiedNameBrand {
  readonly QualifiedName: unique symbol;
}
export type QualifiedName = t.Branded<string, QualifiedNameBrand>;
export const QualifiedName: t.Type<QualifiedName, string, unknown> = t.brand(
  t.string,
  (s): s is QualifiedName => {
    // Must be a string
    if (typeof s === 'string') {
      const pieces = s.split('.');
      return pieces.every((piece) => piece.match(/^[a-zA-Z0-9][\w-]*$/));
    }
    return false;
  },
  'QualifiedName'
);

export interface AbsolutePathBrand {
  readonly AbsolutePath: unique symbol;
}
export type AbsolutePath = t.Branded<string, AbsolutePathBrand>;
export const AbsolutePath: t.Type<AbsolutePath, string, unknown> = t.brand(
  t.string,
  (s): s is AbsolutePath => {
    return path.isAbsolute(s);
  },
  'AbsolutePath'
);

export type AuthProfile = TypeOf<typeof AuthProfile>;

// *** Config files ***
export const RootConfig = type({
  source_root: string,
});

export type RootConfig = TypeOf<typeof RootConfig>;

export const QueryParameter = type({
  name: string,
  value: string,
  type: string,
});

export type QueryParameter = TypeOf<typeof QueryParameter>;

const LambdaConfigRequired = t.interface({
  sql_path: string,
});

const LambdaConfigOptional = t.partial({
  default_parameters: array(QueryParameter),
  // Optional type
  description: string,
});

export const LambdaConfig = t.intersection([
  LambdaConfigRequired,
  LambdaConfigOptional,
]);

export type LambdaConfig = TypeOf<typeof LambdaConfig>;

type CollectionConfig = Omit<Collection, 'name' | 'stats' | 'workspace'>;

export const ENTITIES = ['lambda', 'collection'] as const;

export type EntityType = typeof ENTITIES[number];

export const LambdaEntity = type({
  fullName: QualifiedName,
  ws: string,
  name: string,
  type: t.literal('lambda'),
  config: LambdaConfig,
  sql: string,
});

export type LambdaEntity = TypeOf<typeof LambdaEntity>;

export interface CollectionEntity {
  fullName: QualifiedName;
  ws: string;
  name: string;
  type: 'collection';
  config: CollectionConfig;
}
export interface DeployHooks {
  onNoChange?: (e: LambdaEntity) => void;
  onDeployStart?: (e: LambdaEntity) => void;
  onDeployVersionSuccess?: (e: QueryLambdaVersionResponse) => void;
  onDeployTagSuccess?: (e: QueryLambdaVersionResponse) => void;
  onDeployError?: (error: ErrorModel, entity: LambdaEntity) => void;
}

export interface DownloadHooks {
  onNoOp?: () => void;
  onWriteLambda?: (e: LambdaEntity) => void;
  onWriteCollection?: (e: CollectionEntity) => void;
}

export interface LambdaDownloadOptions {
  useLambdaTag?: string;
}

export interface LambdaDeployOptions {
  tag?: string;
}

// *** Helper functions to parse stuff ***

export function throwOnError<B>(
  e: Either<t.Errors, B>,
  onError: (message: string) => RockClientException
): B {
  return fold<t.Errors, B, B>(
    () => {
      const message = PathReporter.report(e).join('\n');
      throw onError(message);
    },
    (a) => a
  )(e);
}

export function parseAbsolutePath(p: string): AbsolutePath {
  return throwOnError(AbsolutePath.decode(p), errorInvalidAbsolutePath);
}

export function parseQualifiedName(p: string): QualifiedName {
  return throwOnError(QualifiedName.decode(p), errorInvalidQualifiedName);
}

export function parseLambdaEntity(obj: unknown): LambdaEntity {
  return throwOnError(LambdaEntity.decode(obj), errorFailedToCreateEntity(obj));
}

export function notEmpty<TValue>(
  value: TValue | null | undefined
): value is TValue {
  return value !== null && value !== undefined;
}

// Helper function to create default values for types

export function createEmptyQLEntity(fullName: QualifiedName, description = '') {
  const { ws, name } = getWsNamePair(fullName);
  return parseLambdaEntity({
    ws,
    name,
    fullName,
    type: 'lambda',
    config: {
      sql_path: relativeSQLPath(name),
      default_parameters: [],
      description,
    },
    sql: `// Your SQL here
`,
  });
}
