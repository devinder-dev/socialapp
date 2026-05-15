import type { FastifyReply, FastifyRequest } from "fastify";
import type { TokenPayload } from "../types/auth";
import repository from "../repository";

export async function addComment(
  request: FastifyRequest<{ Params: { id: string }; Body: { text: string; parent_comment_id?: number } }>,
  reply: FastifyReply,
) {
  const { username } = request.user as TokenPayload;
  const postId = Number(request.params.id);

  if (isNaN(postId)) return reply.status(400).send({ message: "Invalid post id" });

  const { text, parent_comment_id } = request.body;
  if (!text?.trim()) return reply.status(400).send({ message: "Comment text is required" });

  const comment = await repository.comments.insertOne(postId, username, text.trim(), parent_comment_id);
  return reply.status(201).send(comment);
}

export async function getComments(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply,
) {
  const postId = Number(request.params.id);
  if (isNaN(postId)) return reply.status(400).send({ message: "Invalid post id" });

  const comments = await repository.comments.getForPost(postId);
  return reply.status(200).send(comments);
}
