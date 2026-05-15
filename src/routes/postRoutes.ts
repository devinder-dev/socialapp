import type { FastifyInstance, FastifyPluginOptions } from "fastify";
import * as postsController from "../controllers/postsController";
import * as reactionsController from "../controllers/reactionsController";
import * as commentsController from "../controllers/commentsController";
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

  httpServer.route({
    method: "GET",
    url: "/feed",
    handler: postsController.getFeed,
    preHandler: [authenticate],
  });

  httpServer.route({
    method: "DELETE",
    url: "/posts/:id",
    handler: postsController.deletePost,
    preHandler: [authenticate],
  });

  httpServer.route({
    method: "POST",
    url: "/posts/:id/like",
    handler: reactionsController.toggleLike,
    preHandler: [authenticate],
  });

  httpServer.route({
    method: "GET",
    url: "/posts/:id/likes",
    handler: reactionsController.getLikes,
    preHandler: [authenticate],
  });

  httpServer.route({
    method: "POST",
    url: "/posts/:id/comments",
    handler: commentsController.addComment,
    preHandler: [authenticate],
  });

  httpServer.route({
    method: "GET",
    url: "/posts/:id/comments",
    handler: commentsController.getComments,
    preHandler: [authenticate],
  });
}

export default postRoutes;

/*

1. Routing – Kollar upp vilken URL anropet har gjorts till, och kollar om vi har en sådan route
i vår server. 

2. Deserialisering

3. Schema validation?

4. preHandlers:

- authenticate
- upload.single

5. controller/handler

*/
