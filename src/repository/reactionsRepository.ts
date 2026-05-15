import { db } from "../db/client";

export async function toggleLike(username: string, postId: number): Promise<boolean> {
  const [existing] = await db`
    SELECT 1 FROM reactions
    WHERE user_id = (SELECT id FROM users WHERE username = ${username})
    AND post_id = ${postId}
    AND reaction_type = 'like'
  `;

  if (existing) {
    await db`
      DELETE FROM reactions
      WHERE user_id = (SELECT id FROM users WHERE username = ${username})
      AND post_id = ${postId}
      AND reaction_type = 'like'
    `;
    return false;
  } else {
    await db`
      INSERT INTO reactions (user_id, post_id, reaction_type, created_at)
      VALUES (
        (SELECT id FROM users WHERE username = ${username}),
        ${postId},
        'like',
        ${new Date().toISOString()}
      )
    `;
    return true;
  }
}

export async function getLikesForPost(
  postId: number,
  username: string,
): Promise<{ count: number; liked_by_me: boolean }> {
  const [result] = await db`
    SELECT
      COUNT(*) AS count,
      EXISTS(
        SELECT 1 FROM reactions
        WHERE post_id = ${postId}
        AND user_id = (SELECT id FROM users WHERE username = ${username})
        AND reaction_type = 'like'
      ) AS liked_by_me
    FROM reactions
    WHERE post_id = ${postId} AND reaction_type = 'like'
  `;

  return {
    count: Number(result?.count ?? 0),
    liked_by_me: result?.liked_by_me ?? false,
  };
}
