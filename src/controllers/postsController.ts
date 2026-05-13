import type { FastifyReply, FastifyRequest } from "fastify";
import repository from "../repository";
import type { CreatePostRequest } from "../types/http";
import type { TokenPayload } from "../types/auth";
import uploadImageToS3 from "../adapters/s3";

export async function getFeed(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { username } = request.user as TokenPayload;
  const posts = await repository.posts.getFeedForUser(username);
  return reply.status(200).send(posts);
}

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

  const buffer = await multipartData.toBuffer();

  const uploadedUrl = await uploadImageToS3(
    buffer,
    multipartData.filename,
    multipartData.mimetype,
  );

  if (!uploadedUrl) {
    return reply.status(500).send({ message: "Failed to upload image" });
  }

  const captionField = multipartData.fields?.caption;
  const caption =
    captionField && !Array.isArray(captionField) && "value" in captionField
      ? (captionField.value as string)
      : undefined;

  const createdPost = await repository.posts.insertOne(
    caption,
    uploadedUrl,
    tokenPayload.username,
  );

  return reply.status(201).send(createdPost);
}
