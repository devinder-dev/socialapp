import type { FastifyReply, FastifyRequest } from "fastify";
import repository from "../repository";
import type { CreatePostRequest } from "../types/http";
import type { TokenPayload } from "../types/auth";

export async function createPost(
  request: FastifyRequest<{ Body: CreatePostRequest }>,
  reply: FastifyReply,
) {
  const tokenPayload = request.user as TokenPayload;

  const createdPost = await repository.posts.insertOne(
    request.body,
    tokenPayload.username,
  );

  return reply.status(201).send(createdPost);
}
