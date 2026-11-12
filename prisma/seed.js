// Fills your local database with fake users, posts, comments, likes and follows,
// so the app has something to show. Run it with `npm run db:seed`.
// Every fake user's password is: chalk-dev-password

// Seeding deletes everything first, so only ever run it against a database on this computer.
const databaseUrl = process.env.DATABASE_URL || '';
const isLocalDatabase = databaseUrl.includes('localhost') || databaseUrl.includes('127.0.0.1');
if (process.env.NODE_ENV === 'production' || !isLocalDatabase) {
  console.error('Refusing to seed: DATABASE_URL is not a local database, and seeding wipes all data.');
  process.exit(1);
}

// Imported after the check above, so nothing connects to the database unless it's safe.
const { default: prisma } = await import('../server/db.js');
const { hashPassword } = await import('../server/services/passwords.js');

const users = [
  { handle: 'chalk_admin', role: 'ADMIN', bio: 'I keep the lights on.' },
  { handle: 'mod_mango', role: 'MODERATOR', bio: 'Moderator. Mostly harmless.' },
  { handle: 'inkyfox', bio: 'Writes at 2am, regrets at 9am.' },
  { handle: 'mess_hall', bio: 'Opinions about food, mostly negative.' },
  { handle: 'lofi_leela', bio: 'Headphones on, world off.', theme: 'chalkboard' },
  { handle: 'quiet_kid', bio: '' },
];

const posts = [
  { handle: 'inkyfox', label: 'POETRY', title: 'Monday', body: 'The bell rings twice,\nonce for class,\nonce for the part of me\nthat stayed in bed.' },
  { handle: 'mess_hall', label: 'RANT', body: 'Why does the canteen run out of chai at exactly 10:58, two minutes before every break? Who planned this?' },
  { handle: 'lofi_leela', label: 'MUSIC', body: 'Current loop: rain sounds + piano. Highly recommend for anyone pretending to study.' },
  { handle: 'quiet_kid', label: 'FIXIT', body: 'The water cooler on the second floor has been leaking for a week. There is now a small lake. Please fix before it gets fish.' },
  { handle: 'inkyfox', label: 'MESS', body: 'Started three essays tonight. Finished zero. Named all three files final.docx.' },
  { handle: 'mess_hall', label: 'FIXIT', title: 'Library Wi-Fi', body: "Wi-Fi in the library drops every 20 minutes. It's the one place we actually need it." },
  { handle: 'lofi_leela', label: 'POETRY', body: 'small rooms,\nbig dreams,\nloud fans.' },
  { handle: 'mod_mango', label: 'MESS', body: 'Reminder: be kind in the comments. We are all first-years here.' },
  { handle: 'quiet_kid', label: 'MUSIC', body: 'Is it weird that I listen to the same song on repeat while writing? It helps.' },
  { handle: 'inkyfox', label: 'RANT', body: '8am classes should be illegal. That is the whole post.' },
];

const comments = [
  { postIndex: 1, handle: 'inkyfox', body: 'They hide it. I am sure of it.' },
  { postIndex: 1, handle: 'quiet_kid', body: 'The 10:58 chai shortage is real.' },
  { postIndex: 3, handle: 'mod_mango', body: 'Reported to the facilities office. Thanks for flagging!' },
  { postIndex: 4, handle: 'lofi_leela', body: 'final_final_v2.docx gang' },
  { postIndex: 0, handle: 'lofi_leela', body: 'This one hit hard.' },
];

// Each pair is [handle, postIndex]: that user likes that post.
const likes = [
  ['mess_hall', 0], ['lofi_leela', 0], ['quiet_kid', 0],
  ['inkyfox', 1], ['quiet_kid', 1],
  ['inkyfox', 2],
  ['inkyfox', 3], ['mess_hall', 3], ['mod_mango', 3],
  ['quiet_kid', 9], ['mess_hall', 9],
];

// Each pair is [follower, followed]: the first user follows the second.
const follows = [
  ['inkyfox', 'lofi_leela'], ['inkyfox', 'mess_hall'],
  ['quiet_kid', 'inkyfox'], ['quiet_kid', 'lofi_leela'],
  ['mess_hall', 'inkyfox'], ['lofi_leela', 'inkyfox'], ['mod_mango', 'inkyfox'],
];

async function createFollows(userIdByHandle) {
  for (const [follower, followed] of follows) {
    await prisma.follow.create({
      data: { followerId: userIdByHandle[follower], followingId: userIdByHandle[followed] },
    });
  }
}

async function clearDatabase() {
  // Deleting users also deletes their posts, comments, likes, follows and tokens (onDelete: Cascade).
  await prisma.user.deleteMany();
  await prisma.session.deleteMany();
}

async function createUsers() {
  const passwordHash = await hashPassword('chalk-dev-password');
  const userIdByHandle = {};

  for (const user of users) {
    const created = await prisma.user.create({
      data: {
        ...user,
        email: `${user.handle}@chalk.test`,
        passwordHash,
        emailVerifiedAt: new Date(),
      },
    });
    userIdByHandle[user.handle] = created.id;
  }
  return userIdByHandle;
}

async function createPosts(userIdByHandle) {
  const postIds = [];
  // Space the posts out over the last few days, newest last, so the feed looks real.
  for (const [i, post] of posts.entries()) {
    const hoursAgo = (posts.length - i) * 7;
    const created = await prisma.post.create({
      data: {
        authorId: userIdByHandle[post.handle],
        label: post.label,
        title: post.title,
        body: post.body,
        createdAt: new Date(Date.now() - hoursAgo * 60 * 60 * 1000),
      },
    });
    postIds.push(created.id);
  }
  return postIds;
}

async function createCommentsAndLikes(userIdByHandle, postIds) {
  for (const comment of comments) {
    await prisma.comment.create({
      data: {
        postId: postIds[comment.postIndex],
        authorId: userIdByHandle[comment.handle],
        body: comment.body,
      },
    });
  }
  for (const [handle, postIndex] of likes) {
    await prisma.like.create({
      data: { userId: userIdByHandle[handle], postId: postIds[postIndex] },
    });
  }
}

await clearDatabase();
const userIdByHandle = await createUsers();
const postIds = await createPosts(userIdByHandle);
await createCommentsAndLikes(userIdByHandle, postIds);
await createFollows(userIdByHandle);
await prisma.$disconnect();

console.log(
  `Seeded ${users.length} users, ${posts.length} posts, ${comments.length} comments, ` +
    `${likes.length} likes and ${follows.length} follows.`,
);
console.log('Log in as any of them, e.g. inkyfox@chalk.test, with the password: chalk-dev-password');
