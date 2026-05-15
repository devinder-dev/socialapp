import type { FastifyReply, FastifyRequest } from "fastify";
import repository from "../repository";
import type { CreatePostRequest } from "../types/http";
import type { TokenPayload } from "../types/auth";
import uploadImageToS3 from "../adapters/s3";

export async function getFeed(
  request: FastifyRequest<{ Querystring: { page?: string } }>,
  reply: FastifyReply,
) {
  const { username } = request.user as TokenPayload;
  const page = Math.max(1, Number(request.query.page) || 1);
  const posts = await repository.posts.getFeedForUser(username, page);
  return reply.status(200).send(posts);
}

export async function deletePost(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply,
) {
  const { username } = request.user as TokenPayload;
  const postId = Number(request.params.id);

  if (isNaN(postId)) return reply.status(400).send({ message: "Invalid post id" });

  const deleted = await repository.posts.deleteOne(postId, username);
  if (!deleted) return reply.status(403).send({ message: "Post not found or not yours" });

  return reply.status(200).send({ message: "Post deleted" });
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
