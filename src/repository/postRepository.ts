import { db } from "../db/client";
import type { PostRow } from "../types/db";
import type { CreatePostRequest } from "../types/http";

export async function insertOne(
  input: CreatePostRequest,
  username: string,
): Promise<PostRow> {
  const createdAt = new Date().toISOString();
  const status = "active";

  const [created] = await db<
    PostRow[]
  >`INSERT INTO posts (status, user_id, image, caption, created_at) VALUES (${status}, (SELECT id FROM users WHERE username = ${username}), ${input.image}, ${input.caption}, ${createdAt}) RETURNING *`;

  if (!created) throw new Error("Failed to create user!");

  return created;
}
