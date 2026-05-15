import { db } from "../db/client";
import type { FeedRow, PostRow } from "../types/db";

export async function insertOne(
  caption: string = "",
  image: string,
  username: string,
): Promise<PostRow> {
  const createdAt = new Date().toISOString();
  const status = "active";

  const [created] = await db<
    PostRow[]
  >`INSERT INTO posts (status, user_id, image, caption, created_at) VALUES (${status}, (SELECT id FROM users WHERE username = ${username}), ${image}, ${caption}, ${createdAt}) RETURNING *`;

  if (!created) throw new Error("Failed to create post!");

  return created;
}

export async function deleteOne(postId: number, username: string): Promise<boolean> {
  const result = await db`
    UPDATE posts SET status = 'deleted'
    WHERE id = ${postId}
    AND user_id = (SELECT id FROM users WHERE username = ${username})
    AND status = 'active'
  `;
  return result.count > 0;
}

export async function getFeedForUser(username: string, page: number = 1): Promise<FeedRow[]> {
  const limit = 25;
  const offset = (page - 1) * limit;

  const feed = await db`
    WITH my_user_id AS (SELECT id FROM users WHERE username = ${username})
    SELECT p.id,
           p.image,
           p.caption,
           p.created_at,
           u.username,
           u.profile_image,
           u.display_name AS user_display_name
    FROM posts AS p
    LEFT JOIN users AS u ON p.user_id = u.id
    WHERE p.status = 'active'
      AND (
        p.user_id = (SELECT id FROM my_user_id)
        OR p.user_id IN (
          SELECT followed_user_id FROM follower_relationships
          WHERE following_user_id = (SELECT id FROM my_user_id)
        )
      )
    ORDER BY p.created_at DESC
    LIMIT ${limit} OFFSET ${offset}
  `;

  return feed;
}
