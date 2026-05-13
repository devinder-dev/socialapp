CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    username TEXT NOT NULL UNIQUE,
    visibility TEXT NOT NULL CHECK (visibility IN ('private', 'public')),
    profile_image TEXT,
    bio TEXT,
    display_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    phone TEXT NOT NULL,
    birthdate TIMESTAMPTZ NOT NULL,
    password TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS follower_relationships (
    following_user_id INTEGER NOT NULL REFERENCES users(id),
    followed_user_id INTEGER NOT NULL REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL,
    PRIMARY KEY (following_user_id, followed_user_id)
);

CREATE TABLE IF NOT EXISTS posts (
    id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    status TEXT NOT NULL CHECK (status IN ('active', 'hidden', 'deleted')),
    user_id INTEGER NOT NULL REFERENCES users(id),
    image TEXT NOT NULL,
    caption TEXT,
    created_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS comments (
    id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    status TEXT NOT NULL CHECK (status IN ('active', 'deleted')),
    user_id INTEGER NOT NULL REFERENCES users(id),
    post_id INTEGER NOT NULL REFERENCES posts(id),
    parent_comment_id INTEGER NULL REFERENCES comments(id),
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS reactions (
    user_id INTEGER NOT NULL REFERENCES users(id),
    post_id INTEGER NOT NULL REFERENCES posts(id),
    reaction_type TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL,
    PRIMARY KEY (user_id, post_id)
);
