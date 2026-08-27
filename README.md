# Document Vault — GraphQL API

A small Document Vault backend API built with Bun, TypeScript, GraphQL Yoga, PostgreSQL, and Prisma.

The API allows users to organize documents into collections, search and filter documents, move documents between collections, and paginate document results using cursor-based pagination.

## Tech Stack

- Bun
- TypeScript
- GraphQL Yoga
- PostgreSQL
- Prisma ORM
- Docker Compose
- Bun Test

## Features

### Collections

- Create collections
- List collections
- Fetch a single collection
- Fetch documents nested inside a collection

### Documents

- Create documents
- Update documents
- Delete documents
- Move documents between collections
- Search by substring in title or content
- Filter by collection
- Filter by archived state
- Cursor-based pagination

### Validation

The API rejects:

- Empty collection names
- Malformed collection slugs
- Empty document titles
- Empty document content

Validation failures return GraphQL errors with the `BAD_USER_INPUT` code.

## Setup

Make sure Docker and Bun are installed.

From the project root, run:

```bash
docker compose up -d && bun install && bun run gendb && bun run dev