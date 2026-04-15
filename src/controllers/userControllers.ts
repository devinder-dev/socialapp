import type { FastifyReply, FastifyRequest } from "fastify";
import type {
  AuthResponse,
  LoginRequest,
  RegisterRequest,
} from "../types/http";
import repository from "../repository";
import type { TokenPayload } from "../types/auth";
import { USER_ROLE } from "../utils/constants";
import { mapToUser } from "./mapper";
import type { UserRow } from "../types/db";

/*
Vad är ansvarsområdeet för controllers?

Svar: Controllers är en del av vår HTTP-del, och har som ansvar att validera och plocka ut
indata från HTTP-requesten. Samt även ansvar att returnera en HTTP-respons.
*/

async function generateAuthResponse(
  user: UserRow,
  reply: FastifyReply,
): Promise<AuthResponse> {
  const tokenPayload: TokenPayload = {
    username: user.username,
    email: user.email,
    role: USER_ROLE,
  };

  const token = await reply.jwtSign(tokenPayload, {
    expiresIn: "100y",
  });

  return {
    token,
    user: mapToUser(user),
  };
}

export async function register(
  request: FastifyRequest<{ Body: RegisterRequest }>,
  reply: FastifyReply,
) {
  const user = await repository.users.insertOne(request.body);

  const response = await generateAuthResponse(user, reply);

  return reply.status(201).send(response);
}

export async function login(
  request: FastifyRequest<{ Body: LoginRequest }>,
  reply: FastifyReply,
) {
  const foundUser = await repository.users.getByUsername(request.body.username);

  // if (!foundUser) throw new NotFound("User not found!")
  if (!foundUser) return reply.status(404).send({ message: "User not found!" });

  if (foundUser.password !== request.body.password)
    return reply.status(401).send({ message: "Incorrect password!" });

  const response = await generateAuthResponse(foundUser, reply);

  return reply.status(200).send(response);
}
