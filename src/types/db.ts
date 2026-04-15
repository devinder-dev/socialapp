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
  id: number;
  status: "active" | "hidden" | "deleted";
  user_id: number;
  image: string;
  caption: string | null;
  created_at: Date;
};
