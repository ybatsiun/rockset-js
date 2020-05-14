import rocksetConfigure from "../src/index";
import axios from "axios";

const basePath = process.env.ROCKSET_APISERVER; 
const apikey = process.env.ROCKSET_APIKEY as string;

if (!apikey || !basePath) {
  throw "No ROCKSET_APIKEY specified. Please specify an environment variable ROCKSET_APIKEY with your Rockset key. eg: $ export ROCKSET_APIKEY=...";
}

console.log("Specified apiserver to hit:", basePath);

const customFetchAxios = async (url: string, options: any) => {
  const { headers, method, body: data, queryParams: params } = options;
  const res = await axios.request({
    url,
    headers,
    method,
    data,
    params
  });

  return res.data;
};

const rockset = rocksetConfigure(apikey, basePath, customFetchAxios);
const collection =
  "test_collection_" +
  Math.random()
    .toString(36)
    .slice(2);

const savedQuery =
  "test_query_" +
  Math.random()
    .toString(36)
    .slice(2);

afterAll(function() {});
describe("Rockset Unit Tests", function() {
  test("creating a collection", async () => {
    try {
      const result = await rockset.collections.createCollection("commons", {
        name: collection
      });
      expect(result).toMatchObject({
        data: {
          created_at: null,
          created_by: null,
          description: null,
          field_mappings: [],
          name: collection,
          retention_secs: null,
          sources: [],
          stats: null,
          status: "CREATED",
          workspace: "commons"
        }
      });
    } catch (e) {
      fail(e);
    }
  });

  test("running a query", async () => {
    const out = await rockset.queries.query({
      sql: {
        query: "Select count(*) from _events;"
      }
    });
    expect(out).toMatchObject({
      collections: ["commons._events"],
      column_fields: [{ name: "?count", type: "" }],
      results: [{ "?count": expect.anything() }],
    });
  });

  test("deleting a collection", async () => {
    try {
      const result = await rockset.collections.deleteCollection(
        "commons",
        collection
      );
      expect(result).toMatchObject({
        data: {
          created_at: null,
          created_by: null,
          description: null,
          field_mappings: [],
          name: collection,
          retention_secs: null,
          sources: [],
          stats: null,
          status: "DELETED",
          workspace: "commons"
        }
      });
    } catch (e) {
      fail(e);
    }
  });

  test("creating a Query Lambda", async () => {
    try {
      const result = await rockset.queryLambdas.createQueryLambda("commons", {
        name: savedQuery,
        sql: {
          query: 'SELECT :param as echo',
          default_parameters: [{
            name: 'param',
            type: 'string',
            value: 'Hello world!'
          }],
        },
      });
      expect(result).toMatchObject({
        data: {
          created_at: expect.anything(),
          created_by: expect.anything(),
          name: savedQuery,
          workspace: "commons",
          version: 1,
          description: null,
          sql: { 
            query: 'SELECT :param as echo',
            default_parameters: [{
              name: 'param',
              type: 'string',
              value: 'Hello world!'
            }],
          },
          stats: expect.anything(),
          collections: [],
        }
      });
    } catch (e) {
      fail(e);
    }
  });

  test("running a Query Lambda with default parameters", async () => {
    try {
      const result = await rockset.queryLambdas.executeQueryLambda("commons", savedQuery, 1);
      expect(result).toMatchObject({
        results: [{
          "echo": "Hello world!",
        }],
      });
    } catch (e) {
      fail(e);
    }
  });

  test("running a Query Lambda with custom parameters", async () => {
    try {
      const result = await rockset.queryLambdas.executeQueryLambda("commons", savedQuery, 1, {
        parameters: [{
          name: 'param',
          type: 'string',
          value: 'All work and no play makes Jack a dull boy',
        }]
      });
      expect(result).toMatchObject({
        results: [{
          "echo": "All work and no play makes Jack a dull boy",
        }],
        stats: expect.anything(),
      });
    } catch (e) {
      fail(e);
    }
  });

  test("deleting a Query Lambda", async () => {
    try {
      const result = await rockset.queryLambdas.deleteQueryLambda("commons", savedQuery);
      expect(result).toMatchObject({
        data: {
          name: savedQuery,
          workspace: "commons",
          collections: [],
        }
      });
    } catch (e) {
      fail(e);
    }
  });
});
