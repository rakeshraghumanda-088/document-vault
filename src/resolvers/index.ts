import { GraphQLError } from "graphql";
import type { Document, Collection } from "../../generated/prisma/client";
import { prisma } from "../lib/prisma";

interface DocumentConnection {
  nodes: Document[];
  pageInfo: {
    hasNextPage: boolean;
    endCursor: string | null;
  };
}

interface DocumentsArgs {
  collectionId?: string;
  search?: string;
  isArchived?: boolean;
  take?: number;
  cursor?: string;
}

interface CollectionArgs {
  id: string;
}

export const resolvers = {
  Query: {
    collections: async (): Promise<Collection[]> => {
      return prisma.collection.findMany({
        orderBy: {
          createdAt: "desc",
        },
      });
    },

    collection: async (
      _parent: unknown,
      args: CollectionArgs,
    ): Promise<Collection | null> => {
      return prisma.collection.findUnique({
        where: {
          id: args.id,
        },
      });
    },

    documents: async (
      _parent: unknown,
      args: DocumentsArgs,
    ): Promise<DocumentConnection> => {
      const take = Math.min(Math.max(args.take ?? 10, 1), 50);

      const documents = await prisma.document.findMany({
        where: {
          ...(args.collectionId
            ? { collectionId: args.collectionId }
            : {}),
          ...(args.isArchived !== undefined
            ? { isArchived: args.isArchived }
            : {}),
          ...(args.search
            ? {
                OR: [
                  {
                    title: {
                      contains: args.search,
                      mode: "insensitive",
                    },
                  },
                  {
                    content: {
                      contains: args.search,
                      mode: "insensitive",
                    },
                  },
                ],
              }
            : {}),
        },
        orderBy: {
          id: "asc",
        },
        take: take + 1,
        ...(args.cursor
          ? {
              cursor: {
                id: args.cursor,
              },
              skip: 1,
            }
          : {}),
      });

      const hasNextPage = documents.length > take;
      const nodes = hasNextPage ? documents.slice(0, take) : documents;

      return {
        nodes,
        pageInfo: {
          hasNextPage,
          endCursor: nodes.length > 0 ? nodes[nodes.length - 1]!.id : null,
        },
      };
    },
  },
  
  Mutation: {
  createCollection: async (
  _parent: unknown,
  args: { input: { name: string; slug: string } },
): Promise<Collection> => {
  const name = args.input.name.trim();
  const slug = args.input.slug.trim();

  if (!name) {
    throw new GraphQLError("Collection name cannot be empty", {
      extensions: {
        code: "BAD_USER_INPUT",
      },
    });
  }

  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    throw new GraphQLError(
      "Invalid slug. Use lowercase letters, numbers, and single hyphens only.",
      {
        extensions: {
          code: "BAD_USER_INPUT",
        },
      },
    );
  }

  return prisma.collection.create({
    data: {
      name,
      slug,
    },
  });
},
 createDocument: async (
  _parent: unknown,
  args: {
    input: {
      title: string;
      content: string;
      tags?: string[];
      collectionId: string;
      isArchived?: boolean;
    };
  },
): Promise<Document> => {
  const title = args.input.title.trim();
  const content = args.input.content.trim();

  if (!title) {
    throw new GraphQLError("Document title cannot be empty", {
      extensions: {
        code: "BAD_USER_INPUT",
      },
    });
  }

  if (!content) {
    throw new GraphQLError("Document content cannot be empty", {
      extensions: {
        code: "BAD_USER_INPUT",
      },
    });
  }

  return prisma.document.create({
    data: {
      title,
      content,
      tags: args.input.tags ?? [],
      collectionId: args.input.collectionId,
      isArchived: args.input.isArchived ?? false,
    },
  });
},

 updateDocument: async (
  _parent: unknown,
  args: {
    id: string;
    input: {
      title?: string;
      content?: string;
      tags?: string[];
      isArchived?: boolean;
    };
  },
): Promise<Document> => {
  if (
    args.input.title !== undefined &&
    !args.input.title.trim()
  ) {
    throw new GraphQLError("Document title cannot be empty", {
      extensions: {
        code: "BAD_USER_INPUT",
      },
    });
  }

  if (
    args.input.content !== undefined &&
    !args.input.content.trim()
  ) {
    throw new GraphQLError("Document content cannot be empty", {
      extensions: {
        code: "BAD_USER_INPUT",
      },
    });
  }

  return prisma.document.update({
    where: {
      id: args.id,
    },
    data: {
      ...(args.input.title !== undefined
        ? { title: args.input.title.trim() }
        : {}),
      ...(args.input.content !== undefined
        ? { content: args.input.content.trim() }
        : {}),
      ...(args.input.tags !== undefined
        ? { tags: args.input.tags }
        : {}),
      ...(args.input.isArchived !== undefined
        ? { isArchived: args.input.isArchived }
        : {}),
    },
  });
},
  deleteDocument: async (
  _parent: unknown,
  args: { id: string },
): Promise<Document> => {
  return prisma.document.delete({
    where: {
      id: args.id,
    },
  });
},
moveDocument: async (
  _parent: unknown,
  args: {
    id: string;
    collectionId: string;
  },
): Promise<Document> => {
  return prisma.document.update({
    where: {
      id: args.id,
    },
    data: {
      collectionId: args.collectionId,
    },
  });
},
},
    Collection: {
    documents: async (
      parent: Collection,
      args: { take?: number; cursor?: string },
    ): Promise<DocumentConnection> => {
      const take = Math.min(Math.max(args.take ?? 10, 1), 50);

      const documents = await prisma.document.findMany({
        where: {
          collectionId: parent.id,
        },
        orderBy: {
          id: "asc",
        },
        take: take + 1,
        ...(args.cursor
          ? {
              cursor: {
                id: args.cursor,
              },
              skip: 1,
            }
          : {}),
      });

      const hasNextPage = documents.length > take;
      const nodes = hasNextPage
        ? documents.slice(0, take)
        : documents;

      return {
        nodes,
        pageInfo: {
          hasNextPage,
          endCursor:
            nodes.length > 0
              ? nodes[nodes.length - 1]!.id
              : null,
        },
      };
    },
  },

  Document: {
    collection: async (
      parent: Document,
    ): Promise<Collection> => {
      const collection = await prisma.collection.findUnique({
        where: {
          id: parent.collectionId,
        },
      });

      if (!collection) {
        throw new Error("Collection not found");
      }

      return collection;
    },
  },
};
