import { db } from "../db/client";
import type { RegisterRequest } from "../types/http";
import type { UserRow } from "../types/db";

export async function insertOne(input: RegisterRequest) {
  const createdAt = new Date().toISOString();

  const [created] = await db<
    UserRow[]
  >`INSERT INTO users (username, visibility, profile_image, bio, display_name, email, phone, birthdate, password, created_at) VALUES (${input.username}, ${input.visibility}, ${input.profile_image}, ${input.bio}, ${input.display_name}, ${input.email}, ${input.phone}, ${input.birthdate}, ${input.password}, ${createdAt}) RETURNING *`;

  if (!created) throw new Error("Failed to create user!");

  return created;
}

export async function getByUsername(username: string) {
  const [user] = await db<UserRow[]>`
    SELECT * FROM users where username = ${username}
    `;

  return user || null;
}

// En repository-metod som tar emot två användarnamn och kollar om den ena följer den andra.

export async function isFollowing(
  followingUsername: string, // Den som följer
  followedUsername: string, // Den som blir följd
): Promise<boolean> {
  const [relation] = await db`
    SELECT * FROM follower_relationships
    WHERE following_user_id = (SELECT id from users WHERE username = ${followingUsername}) AND followed_user_id = (SELECT id from users WHERE username = ${followedUsername})
  `;

  return !!relation; // Om relation finns så returnera true, annars false
}

export async function addFollower(
  followingUsername: string,
  followedUsername: string,
) {
  const createdAt = new Date().toISOString();

  await db`INSERT INTO follower_relationships (following_user_id, followed_user_id, created_at) VALUES ((SELECT id FROM users WHERE username = ${followingUsername}), (SELECT id FROM users WHERE username = ${followedUsername}), ${createdAt})`;
}

export async function removeFollower(
  followingUsername: string,
  followedUsername: string,
) {
  await db`DELETE FROM follower_relationships WHERE following_user_id = (SELECT id from users WHERE username = ${followingUsername}) AND followed_user_id = (SELECT id from users WHERE username = ${followedUsername})`;
}

export async function getAllExcept(currentUsername: string, search?: string) {
  const users = await db`
    SELECT
      u.username,
      u.display_name,
      u.profile_image,
      u.bio,
      u.visibility,
      EXISTS(
        SELECT 1 FROM follower_relationships fr
        WHERE fr.following_user_id = (SELECT id FROM users WHERE username = ${currentUsername})
        AND fr.followed_user_id = u.id
      ) AS is_following
    FROM users u
    WHERE u.username != ${currentUsername}
      AND (
        ${search ? db`(u.username ILIKE ${"%" + search + "%"} OR u.display_name ILIKE ${"%" + search + "%"})` : db`TRUE`}
      )
    ORDER BY u.created_at DESC
    LIMIT 50
  `;
  return users;
}

export async function updateProfile(
  username: string,
  fields: { display_name?: string; bio?: string; profile_image?: string },
) {
  const [updated] = await db<{ username: string; display_name: string | null; bio: string | null; profile_image: string | null }[]>`
    UPDATE users SET
      display_name = COALESCE(${fields.display_name ?? null}, display_name),
      bio = COALESCE(${fields.bio ?? null}, bio),
      profile_image = COALESCE(${fields.profile_image ?? null}, profile_image),
      updated_at = ${new Date().toISOString()}
    WHERE username = ${username}
    RETURNING username, display_name, bio, profile_image
  `;
  return updated;
}
