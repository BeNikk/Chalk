# Prisma

Prisma is how Chalk's server talks to the database. New to databases? Read [databases.md](databases.md) first.

## What an ORM is

Databases speak **SQL**:

```sql
SELECT * FROM "Post" WHERE "authorId" = 1 ORDER BY "createdAt" DESC;
```

An **ORM** (Object-Relational Mapper) lets you do the same thing with normal JavaScript:

```js
const posts = await prisma.post.findMany({
  where: { authorId: 1 },
  orderBy: { createdAt: 'desc' },
});
```

Prisma turns that into SQL for you, and gives you back plain JavaScript objects.

## The schema: `prisma/schema.prisma`

Every table is described once, as a **model**:

```prisma
model Post {
  id        Int      @id @default(autoincrement())
  authorId  Int
  author    User     @relation(fields: [authorId], references: [id])
  body      String
  createdAt DateTime @default(now())
}
```

- `Int`, `String`, `DateTime`: the type of each column. A `?` after the type (`String?`) means it can be empty.
- `@id`: the primary key. `@default(...)`: the value used when you don't give one.
- `@relation(...)`: links `authorId` to a `User`, so you can ask for `post.author`.
- `enum Label { RANT POETRY ... }`: a column that only allows those values.

## Migrations: changing the tables

You never edit the database by hand. Instead:

1. Change `prisma/schema.prisma` (say, add a column).
2. Run `npm run db:migrate -- --name add_something`.
3. Prisma writes a **migration**: a new folder in `prisma/migrations/` with the SQL for that change, and applies it to your database.
4. Commit the migration with your code. Everyone else (and the live site) applies the same file, so all databases stay identical.

When you pull someone else's new migration, run `npm run db:update` to apply it to your database. Your data stays.

Never edit an old migration; it has already run on other machines. Make a new one.

## Prisma Client and the generated code

`npm install` runs `prisma generate`, which reads the schema and writes ready-made code into `server/generated/prisma/` (not committed). The server creates **one** client from it in `server/db.js`, and the files in `server/models/` use it.

## Seeding: fake data

`prisma/seed.js` wipes your local database and fills it with fake users, posts, comments and likes. Every fake user's password is `chalk-dev-password`. It refuses to run in production.

## Commands you'll use

| Command | What it does |
|---|---|
| `npm run setup` | First time: starts the database, creates the tables, adds fake data |
| `npm run db:migrate -- --name what_changed` | After you edit the schema: creates and applies a migration |
| `npm run db:update` | After you pull: applies other people's new migrations |
| `npm run db:seed` | Reset your local data to the fake data |
| `npm run db:studio` | Browse your data in the browser |

## Learn more

- [Prisma: data model (schema) reference](https://www.prisma.io/docs/orm/prisma-schema/data-model/models)
- [Prisma: CRUD (create, read, update, delete)](https://www.prisma.io/docs/orm/prisma-client/queries/crud)
- [Prisma: relations](https://www.prisma.io/docs/orm/prisma-schema/data-model/relations)
- [Prisma Migrate](https://www.prisma.io/docs/orm/prisma-migrate/getting-started)
