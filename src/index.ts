import fastify from "fastify";
import fastifyCors from "@fastify/cors";
import fastifyRateLimit from "@fastify/rate-limit";
import banner from "./banner";
import userRoutes from "./routes/userRoutes";
import auth from "./auth";
import fastifyMultipart from "@fastify/multipart";
import postRoutes from "./routes/postRoutes";

const httpServer = fastify({ logger: true });

const port = Number(process.env.PORT) || 3000;
const host = "0.0.0.0";

// Har fastify-instansen en error handler tillsatt?

httpServer.setErrorHandler((err: any, req, rep) => {
  if (err?.statusCode === 400) {
    return rep.status(400).send({ message: err.message });
  }

  console.log(err);

  return rep.status(500).send({
    message: "Unknown error occurred",
  });
});

// Vi har nu tillsatt en error handler

async function start() {
  await httpServer.register(fastifyCors, { origin: true });

  await httpServer.register(fastifyRateLimit, {
    global: true,
    max: 100,
    timeWindow: "1 minute",
  });

  await httpServer.register(auth);

  await httpServer.register(fastifyMultipart, {
    limits: {
      fileSize: 15_000_000,
      files: 1,
    },
  });

  // Vi har inga routes tillsatta på vår httpServer
  await httpServer.register(userRoutes);
  // Vi har userRoutes tillsatta på vår httpServer

  await httpServer.register(postRoutes);

  await httpServer.listen({ host, port });

  banner("TEST-SERVICE", "ENV: DEVELOPMENT", `HOST: ${host}:${port}`);
}

start();
