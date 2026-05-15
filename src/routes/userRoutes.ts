import type { FastifyInstance, FastifyPluginOptions } from "fastify";
import * as userControllers from "../controllers/userControllers";
import { registerSchema } from "../schemas/registerUser";
import { loginSchema } from "../schemas/loginUser";
import authenticate from "../auth/authenticate";

/*

- Skapa konto
- Logga in
- Följa/avfölja en annan användare
- Skapa inlägg
- Hämta feed

*/

export async function userRoutes(
  httpServer: FastifyInstance,
  opts: FastifyPluginOptions,
) {
  httpServer.route({
    method: "POST",
    url: "/register",
    handler: userControllers.register,
    schema: registerSchema,
    config: { rateLimit: { max: 10, timeWindow: "10 minutes" } },
  });

  httpServer.route({
    method: "POST",
    url: "/login",
    handler: userControllers.login,
    schema: loginSchema,
    config: { rateLimit: { max: 10, timeWindow: "10 minutes" } },
  });

  httpServer.route({
    method: "POST",
    url: "/toggle-follow/:username",
    handler: userControllers.toggleFollow,
    preHandler: [authenticate],
  });

  httpServer.route({
    method: "GET",
    url: "/users",
    handler: userControllers.getUsers,
    preHandler: [authenticate],
  });

  httpServer.route({
    method: "PATCH",
    url: "/profile",
    handler: userControllers.editProfile,
    preHandler: [authenticate],
  });
}

export default userRoutes;
