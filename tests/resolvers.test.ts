import { describe, expect, mock, test } from "bun:test";

const mockPrisma = {
  collection: {
    findMany: mock(),
    findUnique: mock(),
    create: mock(),
  },
  document: {
    findMany: mock(),
    findUnique: mock(),
    create: mock(),
    update: mock(),
    delete: mock(),
  },
};

mock.module("../src/lib/prisma", () => ({
  prisma: mockPrisma,
}));

const { resolvers } = await import("../src/resolvers/index");

describe("Collection resolvers", () => {
  test("collections returns collections ordered by createdAt", async () => {
    const collections = [
      {
        id: "collection-1",
        name: "My Documents",
        slug: "my-documents",
        createdAt: new Date(),
      },
    ];

    mockPrisma.collection.findMany.mockResolvedValue(collections);

    const result = await resolvers.Query.collections();

    expect(result).toEqual(collections);
    expect(mockPrisma.collection.findMany).toHaveBeenCalledWith({
      orderBy: {
        createdAt: "desc",
      },
    });
  });

  test("collection returns a collection by id", async () => {
    const collection = {
      id: "collection-1",
      name: "My Documents",
      slug: "my-documents",
      createdAt: new Date(),
    };

    mockPrisma.collection.findUnique.mockResolvedValue(collection);

    const result = await resolvers.Query.collection(
      {},
      { id: "collection-1" },
    );

    expect(result).toEqual(collection);
  });

  test("createCollection creates a collection", async () => {
    const collection = {
      id: "collection-1",
      name: "Archive",
      slug: "archive",
      createdAt: new Date(),
    };

    mockPrisma.collection.create.mockResolvedValue(collection);

    const result = await resolvers.Mutation.createCollection(
      {},
      {
        input: {
          name: "Archive",
          slug: "archive",
        },
      },
    );

    expect(result).toEqual(collection);
    expect(mockPrisma.collection.create).toHaveBeenCalledWith({
      data: {
        name: "Archive",
        slug: "archive",
      },
    });
  });
  test("createCollection rejects a malformed slug", async () => {
  await expect(
    resolvers.Mutation.createCollection(
      {},
      {
        input: {
          name: "Invalid Collection",
          slug: "Invalid Slug!",
        },
      },
    ),
  ).rejects.toMatchObject({
    message:
      "Invalid slug. Use lowercase letters, numbers, and single hyphens only.",
    extensions: {
      code: "BAD_USER_INPUT",
    },
  });
});
});

describe("Document resolvers", () => {
  test("createDocument creates a valid document", async () => {
    const document = {
      id: "document-1",
      title: "Test Document",
      content: "Test content",
      tags: ["test"],
      collectionId: "collection-1",
      isArchived: false,
      createdAt: new Date(),
    };

    mockPrisma.document.create.mockResolvedValue(document);

    const result = await resolvers.Mutation.createDocument(
      {},
      {
        input: {
          title: "Test Document",
          content: "Test content",
          tags: ["test"],
          collectionId: "collection-1",
          isArchived: false,
        },
      },
    );

    expect(result).toEqual(document);
    expect(mockPrisma.document.create).toHaveBeenCalled();
  });

  test("createDocument rejects an empty title", async () => {
  await expect(
    resolvers.Mutation.createDocument(
      {},
      {
        input: {
          title: "   ",
          content: "Valid content",
          collectionId: "collection-1",
        },
      },
    ),
  ).rejects.toMatchObject({
    message: "Document title cannot be empty",
    extensions: {
      code: "BAD_USER_INPUT",
    },
  });
});
  test("createDocument rejects empty content", async () => {
  await expect(
    resolvers.Mutation.createDocument(
      {},
      {
        input: {
          title: "Valid title",
          content: "   ",
          collectionId: "collection-1",
        },
      },
    ),
  ).rejects.toMatchObject({
    message: "Document content cannot be empty",
    extensions: {
      code: "BAD_USER_INPUT",
    },
  });
});

  test("updateDocument updates supplied fields", async () => {
    const document = {
      id: "document-1",
      title: "Updated Document",
      content: "Updated content",
      tags: ["updated"],
      collectionId: "collection-1",
      isArchived: false,
      createdAt: new Date(),
    };

    mockPrisma.document.update.mockResolvedValue(document);

    const result = await resolvers.Mutation.updateDocument(
      {},
      {
        id: "document-1",
        input: {
          title: "Updated Document",
          content: "Updated content",
          tags: ["updated"],
          isArchived: false,
        },
      },
    );

    expect(result).toEqual(document);
    expect(mockPrisma.document.update).toHaveBeenCalled();
  });

  test("deleteDocument deletes a document", async () => {
    const document = {
      id: "document-1",
      title: "Test",
      content: "Content",
      tags: [],
      collectionId: "collection-1",
      isArchived: false,
      createdAt: new Date(),
    };

    mockPrisma.document.delete.mockResolvedValue(document);

    const result = await resolvers.Mutation.deleteDocument(
      {},
      { id: "document-1" },
    );

    expect(result).toEqual(document);
  });

  test("moveDocument changes the collection", async () => {
    const document = {
      id: "document-1",
      title: "Moved Document",
      content: "Content",
      tags: [],
      collectionId: "collection-2",
      isArchived: false,
      createdAt: new Date(),
    };

    mockPrisma.document.update.mockResolvedValue(document);

    const result = await resolvers.Mutation.moveDocument(
      {},
      {
        id: "document-1",
        collectionId: "collection-2",
      },
    );

    expect(result).toEqual(document);

    expect(mockPrisma.document.update).toHaveBeenCalledWith({
      where: {
        id: "document-1",
      },
      data: {
        collectionId: "collection-2",
      },
    });
  });

  test("documents supports pagination", async () => {
    const documents = [
      {
        id: "document-1",
        title: "Document 1",
        content: "Content",
        tags: [],
        collectionId: "collection-1",
        isArchived: false,
        createdAt: new Date(),
      },
      {
        id: "document-2",
        title: "Document 2",
        content: "Content",
        tags: [],
        collectionId: "collection-1",
        isArchived: false,
        createdAt: new Date(),
      },
    ];

    mockPrisma.document.findMany.mockResolvedValue(documents);

    const result = await resolvers.Query.documents({}, { take: 1 });

    expect(result.nodes).toHaveLength(1);
    expect(result.nodes[0]?.id).toBe("document-1");
    expect(result.pageInfo.hasNextPage).toBe(true);
    expect(result.pageInfo.endCursor).toBe("document-1");
  });

  test("documents supports search", async () => {
    mockPrisma.document.findMany.mockResolvedValue([]);

    await resolvers.Query.documents(
      {},
      {
        search: "Move",
      },
    );

    expect(mockPrisma.document.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          OR: [
            {
              title: {
                contains: "Move",
                mode: "insensitive",
              },
            },
            {
              content: {
                contains: "Move",
                mode: "insensitive",
              },
            },
          ],
        }),
      }),
    );
  });

  test("documents supports archived filtering", async () => {
    mockPrisma.document.findMany.mockResolvedValue([]);

    await resolvers.Query.documents(
      {},
      {
        isArchived: true,
      },
    );

    expect(mockPrisma.document.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          isArchived: true,
        }),
      }),
    );
  });

  test("documents supports collection filtering", async () => {
    mockPrisma.document.findMany.mockResolvedValue([]);

    await resolvers.Query.documents(
      {},
      {
        collectionId: "collection-1",
      },
    );

    expect(mockPrisma.document.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          collectionId: "collection-1",
        }),
      }),
    );
  });
});