import type { FastifyReply, FastifyRequest } from "fastify";
import type { TokenPayload } from "../types/auth";
import repository from "../repository";

export async function toggleLike(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply,
) {
  const { username } = request.user as TokenPayload;
  const postId = Number(request.params.id);

  if (isNaN(postId)) return reply.status(400).send({ message: "Invalid post id" });

  const liked = await repository.reactions.toggleLike(username, postId);
  return reply.status(200).send({ liked });
}

export async function getLikes(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply,
) {
  const { username } = request.user as TokenPayload;
  const postId = Number(request.params.id);

  if (isNaN(postId)) return reply.status(400).send({ message: "Invalid post id" });

  const likes = await repository.reactions.getLikesForPost(postId, username);
  return reply.status(200).send(likes);
}
