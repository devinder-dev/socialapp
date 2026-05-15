import * as userRepository from "./userRepository";
import * as postRepository from "./postRepository";
import * as reactionsRepository from "./reactionsRepository";
import * as commentsRepository from "./commentsRepository";

export default {
  users: userRepository,
  posts: postRepository,
  reactions: reactionsRepository,
  comments: commentsRepository,
};
