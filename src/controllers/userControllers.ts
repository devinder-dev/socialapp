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

export async function toggleFollow(
  request: FastifyRequest<{ Params: { username: string } }>,
  reply: FastifyReply,
) {
  // Här behöver vi:
  // 1. Hämta ut den inloggade användarens username från JWT:n (finns i request.user)

  const usernameLoggedIn = request.user.username;

  // 2. Hämta ut den användare som vi vill följa/avfölja (finns i request.params.username)
  const usernameToFollow = request.params.username;

  // 3. Kolla om den inloggade användaren redan följer den andra användaren

  const alreadyFollowing = await repository.users.isFollowing(
    usernameLoggedIn,
    usernameToFollow,
  );

  if (alreadyFollowing) {
    await repository.users.removeFollower(usernameLoggedIn, usernameToFollow);

    return reply
      .status(200)
      .send({ message: `You have unfollowed ${usernameToFollow}` });
  } else {
    await repository.users.addFollower(usernameLoggedIn, usernameToFollow);

    return reply
      .status(200)
      .send({ message: `You are now following ${usernameToFollow}` });
  }
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
