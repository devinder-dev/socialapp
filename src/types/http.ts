export type RegisterRequest = {
  username: string;
  visibility?: "private" | "public";
  profile_image?: string;
  bio?: string;
  display_name: string;
  email: string;
  phone: string;
  birthdate: string;
  password: string;
};

export type CreatePostRequest = {
  image: string;
  caption?: string;
};

// Vad en inloggad användare får ha tillgång till
export type User = {
  username: string;
  visibility: "private" | "public";
  profile_image: string | null;
  bio: string | null;
  display_name: string | null;
  email: string;
  phone: string;
  birthdate: Date;
  created_at: Date;
  updated_at: Date | null;
};

// DatabaseUser, som är den kompletta användaren som bara finns i databasen eller som admins kan se.

// AuthenticatedUser så som användaren själv ska få när den är inloggad

// PublicUser, vad andra användare kan se om användaren

export type LoginRequest = {
  username: string;
  password: string;
};

export type AuthResponse = {
  token: string;
  user: User;
};
