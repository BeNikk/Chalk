// Everything Chalk reads from or writes to the Post table.

import prisma from '../db.js';

export const PAGE_SIZE = 20;

// What to load with every post: a little about the author, the like and comment counts,
// and whether the person looking has liked it.
function postDetails(viewerId) {
  return {
    author: { select: { handle: true, avatarUrl: true } },
    _count: { select: { likes: true, comments: true } },
    likes: viewerId ? { where: { userId: viewerId }, select: { userId: true } } : false,
  };
}

// The shape every post has in API answers. Labels are lowercase in the API ("rant"),
// but uppercase in the database (RANT), because that's how Prisma enums are written.
function toPublicPost(post) {
  return {
    id: post.id,
    label: post.label.toLowerCase(),
    title: post.title,
    body: post.body,
    createdAt: post.createdAt,
    author: post.author,
    likeCount: post._count.likes,
    commentCount: post._count.comments,
    likedByMe: Boolean(post.likes?.length),
  };
}

// The newest posts first, PAGE_SIZE at a time. `before` is the id of the last post you already have.
// `followedBy`: only posts by people that user follows.
export async function listPosts({ label, authorId, before, viewerId, followedBy }) {
  const posts = await prisma.post.findMany({
    where: {
      label: label?.toUpperCase(),
      authorId,
      id: before ? { lt: before } : undefined,
      author: followedBy ? { followers: { some: { followerId: followedBy } } } : undefined,
    },
    orderBy: { id: 'desc' },
    take: PAGE_SIZE,
    include: postDetails(viewerId),
  });
  return posts.map(toPublicPost);
}

export async function findPost(id, viewerId) {
  const post = await prisma.post.findUnique({ where: { id }, include: postDetails(viewerId) });
  return post ? toPublicPost(post) : null;
}

export async function createPost({ authorId, label, title, body }) {
  const post = await prisma.post.create({
    data: { authorId, label: label.toUpperCase(), title, body },
    include: postDetails(authorId),
  });
  return toPublicPost(post);
}

export async function postExists(id) {
  const count = await prisma.post.count({ where: { id } });
  return count > 0;
}

// Just the author's id: enough to check who may delete the post.
export function findPostAuthorId(id) {
  return prisma.post.findUnique({ where: { id }, select: { authorId: true } });
}

export function deletePost(id) {
  return prisma.post.delete({ where: { id } });
}
