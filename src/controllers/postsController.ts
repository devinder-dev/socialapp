import type { FastifyReply, FastifyRequest } from "fastify";
import repository from "../repository";
import type { CreatePostRequest } from "../types/http";
import type { TokenPayload } from "../types/auth";

export async function createPost(
  request: FastifyRequest<{ Body: CreatePostRequest }>,
  reply: FastifyReply,
) {
  const tokenPayload = request.user as TokenPayload;

  const file = await request.file();

  const createdPost = await repository.posts.insertOne(
    request.body,
    tokenPayload.username,
  );

  return reply.status(201).send(createdPost);
}

/*

Att göra:

Slutför kopplingen mellan createPost och Amazon S3.

Så att man kan anropa POST /create och ladda upp en bild och spara länken i databasen. 

*/
