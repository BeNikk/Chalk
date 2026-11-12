# Databases

## What a database is

A database is where an app keeps information that must survive after the server stops: accounts, posts, comments, likes. Chalk uses **PostgreSQL** ("Postgres"), one of the most popular databases in the world.

## Tables, rows and columns

Postgres stores data in **tables**, a lot like spreadsheets:

| id | handle | bio |
|---|---|---|
| 1 | inkyfox | Writes at 2am, regrets at 9am. |
| 2 | mess_hall | Opinions about food, mostly negative. |

- A **table** holds one kind of thing (`User`, `Post`, `Comment`…).
- Each **row** is one of those things (one user).
- Each **column** is one detail about it (`handle`, `bio`).

## Primary keys and relations

Every row has an `id` that is unique in its table: the **primary key**. Other tables point at it to say how things are connected. A post stores its author's id in `authorId`:

| id | authorId | body |
|---|---|---|
| 7 | 1 | 8am classes should be illegal. |

`authorId = 1` means "written by inkyfox". That link is a **relation** (also called a *foreign key*). It's how Chalk knows who wrote what, which post a comment belongs to, and who liked which post.

## Unique values and indexes

- **Unique**: no two rows may have the same value. Chalk makes `email` and `handle` unique, so two people can't share a handle.
- **Index**: a shortcut the database keeps so it can find rows fast, like the index at the back of a book. Posts are indexed by `createdAt` because the feed always wants the newest first.

## Where Chalk's database runs

| Where | What runs it | Why |
|---|---|---|
| Your laptop | Postgres in **Docker** (`docker-compose.yml`) | Free, private, and you can wipe it any time |
| The live site | **Supabase** (hosted Postgres) | Always on, backed up, reachable from Vercel |

It's the same kind of database in both places, so code that works on your laptop works live.

## How to look at your data

Run `npm run db:studio`. It opens Prisma Studio in your browser, where you can browse every table and row. See [prisma.md](prisma.md).

## Learn more

- [What is a relational database? (IBM)](https://www.ibm.com/think/topics/relational-databases)
- [PostgreSQL tutorial: the basics](https://www.postgresql.org/docs/current/tutorial-concepts.html)
- [SQLBolt](https://sqlbolt.com/): learn SQL with short interactive exercises
