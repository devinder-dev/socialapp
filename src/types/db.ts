export type UserRow = {
  id: number;
  username: string;
  visibility: "private" | "public";
  profile_image: string | null;
  bio: string | null;
  display_name: string | null;
  email: string;
  phone: string;
  birthdate: Date;
  password: string;
  created_at: Date;
  updated_at: Date | null;
};

export type PostRow = {
  id: number; // automatiskt
  status: "active" | "hidden" | "deleted"; // hårdkodar vi till active
  user_id: number; // hämtar vi genom username med SQL
  image: string;
  caption: string | null;
  created_at: Date; // sätter vi i koden (new Date().toISOString())
};

export type FeedRow = {
  id: number;
  image: string;
  caption: string | null;
  created_at: string;
  username: string;
  profile_image: string | null;
  user_display_name: string;
};

export type DiscoverUserRow = {
  username: string;
  display_name: string | null;
  profile_image: string | null;
  bio: string | null;
  visibility: "private" | "public";
  is_following: boolean;
};

export type ReactionRow = {
  user_id: number;
  post_id: number;
  reaction_type: string;
  created_at: Date;
};

export type CommentRow = {
  id: number;
  status: "active" | "deleted";
  user_id: number;
  post_id: number;
  parent_comment_id: number | null;
  text: string;
  created_at: Date;
  username: string;
};
