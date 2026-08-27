import { createYoga, createSchema } from "graphql-yoga";
import { readFileSync } from "node:fs";
import { serve } from "bun";
import { resolvers } from "./resolvers";

const typeDefs = readFileSync(
  new URL("./graphql/schema.graphql", import.meta.url),
  "utf8",
);

const schema = createSchema({
  typeDefs,
  resolvers,
});

const yoga = createYoga({
  schema,
  graphqlEndpoint: "/graphql",
});

const server = serve({
  port: 4000,
  fetch: yoga.fetch,
});

console.log(`GraphQL server running at http://localhost:${server.port}/graphql`);