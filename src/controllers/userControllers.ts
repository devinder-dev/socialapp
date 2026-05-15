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
    expiresIn: "7d",
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
  const hashedPassword = await Bun.password.hash(request.body.password);
  const user = await repository.users.insertOne({
    ...request.body,
    password: hashedPassword,
  });

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

  if (usernameLoggedIn === usernameToFollow)
    return reply.status(400).send({ message: "You cannot follow yourself" });

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

export async function getUsers(
  request: FastifyRequest<{ Querystring: { search?: string } }>,
  reply: FastifyReply,
) {
  const { username } = request.user;
  const users = await repository.users.getAllExcept(username, request.query.search);
  return reply.status(200).send(users);
}

export async function editProfile(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { username } = request.user;

  let display_name: string | undefined;
  let bio: string | undefined;
  let profile_image: string | undefined;

  const contentType = request.headers["content-type"] ?? "";

  if (contentType.includes("multipart")) {
    const multipartData = await request.file();
    if (multipartData) {
      const buffer = await multipartData.toBuffer();
      const { default: uploadImageToS3 } = await import("../adapters/s3");
      profile_image = await uploadImageToS3(buffer, multipartData.filename, multipartData.mimetype) ?? undefined;
      const fields = multipartData.fields;
      const dn = fields?.display_name;
      const b = fields?.bio;
      if (dn && !Array.isArray(dn) && "value" in dn) display_name = dn.value as string;
      if (b && !Array.isArray(b) && "value" in b) bio = b.value as string;
    }
  } else {
    const body = request.body as { display_name?: string; bio?: string };
    display_name = body?.display_name;
    bio = body?.bio;
  }

  const updated = await repository.users.updateProfile(username, { display_name, bio, profile_image });
  return reply.status(200).send(updated);
}

export async function login(
  request: FastifyRequest<{ Body: LoginRequest }>,
  reply: FastifyReply,
) {
  const foundUser = await repository.users.getByUsername(request.body.username);

  // if (!foundUser) throw new NotFound("User not found!")
  if (!foundUser) return reply.status(404).send({ message: "User not found!" });

  const passwordMatch = await Bun.password.verify(
    request.body.password,
    foundUser.password,
  );
  if (!passwordMatch)
    return reply.status(401).send({ message: "Incorrect password!" });

  const response = await generateAuthResponse(foundUser, reply);

  return reply.status(200).send(response);
}
