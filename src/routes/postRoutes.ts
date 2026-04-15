import type { FastifyInstance, FastifyPluginOptions } from "fastify";
import * as postsController from "../controllers/postsController";
import authenticate from "../auth/authenticate";

async function postRoutes(
  httpServer: FastifyInstance,
  options: FastifyPluginOptions,
) {
  httpServer.route({
    method: "POST",
    url: "/create",
    handler: postsController.createPost,
    preHandler: [authenticate],
  });
}
