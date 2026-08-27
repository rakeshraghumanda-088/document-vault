import { describe, expect, test, afterAll } from "bun:test";
import { prisma } from "../src/lib/prisma";

describe("PostgreSQL integration", () => {
  const slug = `integration-test-${crypto.randomUUID()}`;

  afterAll(async () => {
    await prisma.$disconnect();
  });

  test("creates a collection and document in PostgreSQL", async () => {
    const collection = await prisma.collection.create({
      data: {
        name: "Integration Test Collection",
        slug,
      },
    });

    expect(collection.id).toBeDefined();
    expect(collection.name).toBe("Integration Test Collection");

    const document = await prisma.document.create({
      data: {
        title: "Integration Test Document",
        content: "Testing real PostgreSQL integration.",
        tags: ["integration", "test"],
        collectionId: collection.id,
        isArchived: false,
      },
    });

    expect(document.id).toBeDefined();
    expect(document.collectionId).toBe(collection.id);

    const savedDocument = await prisma.document.findUnique({
      where: {
        id: document.id,
      },
    });

    expect(savedDocument).not.toBeNull();
    expect(savedDocument?.title).toBe("Integration Test Document");

    await prisma.document.delete({
      where: {
        id: document.id,
      },
    });

    await prisma.collection.delete({
      where: {
        id: collection.id,
      },
    });
  });
});