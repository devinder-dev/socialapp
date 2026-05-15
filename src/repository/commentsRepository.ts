import { db } from "../db/client";
import type { CommentRow } from "../types/db";

export async function insertOne(
  postId: number,
  username: string,
  text: string,
  parentCommentId?: number,
): Promise<CommentRow> {
  const [created] = await db<CommentRow[]>`
    INSERT INTO comments (status, user_id, post_id, parent_comment_id, text, created_at)
    VALUES (
      'active',
      (SELECT id FROM users WHERE username = ${username}),
      ${postId},
      ${parentCommentId ?? null},
      ${text},
      ${new Date().toISOString()}
    )
    RETURNING
      id, status, user_id, post_id, parent_comment_id, text, created_at,
      (SELECT username FROM users WHERE id = user_id) AS username
  `;

  if (!created) throw new Error("Failed to create comment!");
  return created;
}

export async function getForPost(postId: number): Promise<CommentRow[]> {
  const comments = await db<CommentRow[]>`
    SELECT
      c.id, c.status, c.user_id, c.post_id, c.parent_comment_id, c.text, c.created_at,
      u.username
    FROM comments c
    JOIN users u ON c.user_id = u.id
    WHERE c.post_id = ${postId} AND c.status = 'active'
    ORDER BY c.created_at ASC
  `;
  return comments;
}
