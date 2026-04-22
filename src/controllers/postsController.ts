import type { FastifyReply, FastifyRequest } from "fastify";
import repository from "../repository";
import type { CreatePostRequest } from "../types/http";
import type { TokenPayload } from "../types/auth";
import uploadImageToS3 from "../adapters/s3";

export async function createPost(
  request: FastifyRequest<{ Body: CreatePostRequest }>,
  reply: FastifyReply,
) {
  const tokenPayload = request.user as TokenPayload;

  const multipartData = await request.file();

  if (!multipartData) {
    return reply.status(400).send({ message: "Image is required" });
  }

  // Accepterade filtyper
  const allowedMimeTypes = ["image/jpeg", "image/png"];

  if (!allowedMimeTypes.includes(multipartData.mimetype)) {
    return reply
      .status(400)
      .send({ message: "Only JPEG and PNG images are allowed" });
  }

  // Tar upp lite minne
  const buffer = await multipartData?.toBuffer();

  const uploadedUrl = await uploadImageToS3(
    buffer,
    multipartData.filename,
    multipartData.mimetype,
  );

  if (!uploadedUrl) {
    return reply.status(500).send({ message: "Failed to upload image" });
  }

  const caption = multipartData.fields?.caption?.value as string | undefined;

  const createdPost = await repository.posts.insertOne(
    caption,
    uploadedUrl,
    tokenPayload.username,
  );

  return reply.status(201).send(createdPost);
}

/*

Att göra:

Slutför kopplingen mellan createPost och Amazon S3.

Så att man kan anropa POST /create och ladda upp en bild och spara länken i databasen. 

*/
