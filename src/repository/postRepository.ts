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

// TODO: Add pagination. Currently this will only return the first 25 posts only.
export async function getFeedForUser(username: string): Promise<FeedRow[]> {
  // Hämta inlägg från användare som den aktuella användaren följer.
  const feed = await db`WITH my_user_id AS (SELECT id
                    FROM users
                    WHERE username = ${username})
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
        OR p.user_id IN (SELECT followed_user_id
                         FROM follower_relationships
                         WHERE following_user_id = (SELECT id FROM my_user_id))
    )
ORDER BY p.created_at DESC
LIMIT 25`;

  return feed;
}
