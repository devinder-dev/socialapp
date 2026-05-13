import React, { useState, useEffect, useRef } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";

const API_URL = "http://localhost:3001";

// ─── Types ───────────────────────────────────────────────────────────────────

interface User {
  username: string;
  display_name: string | null;
  profile_image: string | null;
  bio: string | null;
  email: string;
  visibility: "public" | "private";
}

interface FeedPost {
  id: number;
  image: string;
  caption: string | null;
  created_at: string;
  username: string;
  profile_image: string | null;
  user_display_name: string | null;
}

interface DiscoverUser {
  username: string;
  display_name: string | null;
  profile_image: string | null;
  is_following: boolean;
}

interface AuthState {
  token: string;
  user: User;
}

// ─── API helper ───────────────────────────────────────────────────────────────

async function api<T>(path: string, options: RequestInit = {}, token?: string): Promise<T> {
  const headers: Record<string, string> = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;
  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: { ...headers, ...(options.headers as Record<string, string>) },
  });
  const data = await res.json() as Record<string, unknown>;
  if (!res.ok) throw new Error((data.message as string) || "Request failed");
  return data as T;
}

// ─── Local storage ────────────────────────────────────────────────────────────

function loadAuth(): AuthState | null {
  try {
    const raw = localStorage.getItem("auth");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveAuth(auth: AuthState | null) {
  if (auth) localStorage.setItem("auth", JSON.stringify(auth));
  else localStorage.removeItem("auth");
}

// ─── Utilities ────────────────────────────────────────────────────────────────

function timeAgo(dateStr: string): string {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

const AVATAR_COLORS = ["#4F46E5", "#7C3AED", "#EC4899", "#F59E0B", "#10B981", "#3B82F6"];

// ─── Avatar ───────────────────────────────────────────────────────────────────

function Avatar({ src, name, size = 36 }: { src?: string | null; name: string; size?: number }) {
  const initials = name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  const color = AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }}
      />
    );
  }

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        backgroundColor: color,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "white",
        fontSize: size * 0.35,
        fontWeight: 600,
        flexShrink: 0,
      }}
    >
      {initials}
    </div>
  );
}

// ─── PostCard ────────────────────────────────────────────────────────────────

function PostCard({
  post,
  isFollowing,
  isOwnPost,
  onToggleFollow,
}: {
  post: FeedPost;
  isFollowing: boolean;
  isOwnPost: boolean;
  onToggleFollow: (username: string) => void;
}) {
  const displayName = post.user_display_name || post.username;

  return (
    <div className="post-card">
      <div className="post-header">
        <div className="post-user">
          <Avatar src={post.profile_image} name={displayName} size={40} />
          <div className="post-user-info">
            <span className="post-username">{post.username}</span>
            {post.user_display_name && (
              <span className="post-display-name">{post.user_display_name}</span>
            )}
            <span className="post-time">{timeAgo(post.created_at)}</span>
          </div>
        </div>
        {isOwnPost ? (
          <span className="own-post-badge">You</span>
        ) : (
          <button
            className={`follow-btn ${isFollowing ? "following" : ""}`}
            onClick={() => onToggleFollow(post.username)}
          >
            {isFollowing ? "Following" : "Follow"}
          </button>
        )}
      </div>
      <div className="post-image-wrap">
        <img src={post.image} alt={post.caption || "Post"} className="post-image" />
      </div>
      {post.caption && <p className="post-caption">{post.caption}</p>}
    </div>
  );
}

// ─── DiscoverCard ─────────────────────────────────────────────────────────────

function DiscoverCard({
  user,
  isFollowing,
  onToggleFollow,
}: {
  user: DiscoverUser;
  isFollowing: boolean;
  onToggleFollow: (username: string) => void;
}) {
  const name = user.display_name || user.username;
  return (
    <div className="discover-card">
      <Avatar src={user.profile_image} name={name} size={36} />
      <div className="discover-info">
        <span className="discover-username">{user.username}</span>
        {user.display_name && <span className="discover-display">{user.display_name}</span>}
      </div>
      <button
        className={`follow-btn small ${isFollowing ? "following" : ""}`}
        onClick={() => onToggleFollow(user.username)}
      >
        {isFollowing ? "Unfollow" : "Follow"}
      </button>
    </div>
  );
}

// ─── CreatePostModal ──────────────────────────────────────────────────────────

function CreatePostModal({
  token,
  currentUser,
  onClose,
  onCreated,
}: {
  token: string;
  currentUser: User;
  onClose: () => void;
  onCreated: (post: FeedPost) => void;
}) {
  const [caption, setCaption] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setError("");
  }

  async function handleSubmit(e: React.SyntheticEvent) {
    e.preventDefault();
    if (!file) return setError("Please select an image");
    setLoading(true);
    setError("");
    try {
      const form = new FormData();
      form.append("file", file);
      if (caption) form.append("caption", caption);
      const post = await api<FeedPost>("/create", { method: "POST", body: form }, token);
      onCreated({
        ...post,
        username: currentUser.username,
        user_display_name: currentUser.display_name,
        profile_image: currentUser.profile_image,
      });
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Create Post</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="upload-area" onClick={() => fileRef.current?.click()}>
            {preview ? (
              <img src={preview} alt="Preview" className="upload-preview" />
            ) : (
              <div className="upload-placeholder">
                <div className="upload-icon">📷</div>
                <p>Click to select an image</p>
                <span>JPG or PNG, max 15MB</span>
              </div>
            )}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png"
            style={{ display: "none" }}
            onChange={handleFile}
          />
          <textarea
            className="caption-input"
            placeholder="Write a caption..."
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            rows={3}
          />
          {error && <p className="error-text">{error}</p>}
          <button type="submit" className="btn btn-primary btn-full" disabled={loading || !file}>
            {loading ? "Uploading..." : "Share Post"}
          </button>
        </form>
      </div>
    </div>
  );
}

// ─── LoginForm ────────────────────────────────────────────────────────────────

function LoginForm({ onAuth, onSwitch }: { onAuth: (a: AuthState) => void; onSwitch: () => void }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.SyntheticEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const auth = await api<AuthState>("/login", {
        method: "POST",
        body: JSON.stringify({ username, password }),
      });
      onAuth(auth);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-card">
      <div className="auth-logo">
        <span className="logo-text">SocialApp</span>
      </div>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <input
            className="form-input"
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <input
            className="form-input"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        {error && <p className="error-text">{error}</p>}
        <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
          {loading ? "Logging in..." : "Log In"}
        </button>
      </form>
      <div className="auth-switch">
        Don't have an account?{" "}
        <button className="link-btn" onClick={onSwitch}>Sign up</button>
      </div>
    </div>
  );
}

// ─── RegisterForm ─────────────────────────────────────────────────────────────

function RegisterForm({ onAuth, onSwitch }: { onAuth: (a: AuthState) => void; onSwitch: () => void }) {
  const [form, setForm] = useState({
    username: "",
    display_name: "",
    email: "",
    phone: "",
    birthdate: "",
    password: "",
    visibility: "public" as "public" | "private",
    bio: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function set(key: string, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.SyntheticEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const body = { ...form, bio: form.bio || undefined };
      const auth = await api<AuthState>("/register", {
        method: "POST",
        body: JSON.stringify(body),
      });
      onAuth(auth);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-card auth-card-wide">
      <div className="auth-logo">
        <span className="logo-text">SocialApp</span>
      </div>
      <p className="auth-subtitle">Sign up to see photos from your friends.</p>
      <form onSubmit={handleSubmit}>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Username *</label>
            <input className="form-input" type="text" placeholder="username"
              value={form.username} onChange={(e) => set("username", e.target.value)}
              required minLength={3} maxLength={30} />
          </div>
          <div className="form-group">
            <label className="form-label">Display Name *</label>
            <input className="form-input" type="text" placeholder="Your name"
              value={form.display_name} onChange={(e) => set("display_name", e.target.value)} required />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Email *</label>
            <input className="form-input" type="email" placeholder="email@example.com"
              value={form.email} onChange={(e) => set("email", e.target.value)} required />
          </div>
          <div className="form-group">
            <label className="form-label">Phone *</label>
            <input className="form-input" type="tel" placeholder="+46701234567"
              value={form.phone} onChange={(e) => set("phone", e.target.value)} required />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Birthdate *</label>
            <input className="form-input" type="date"
              value={form.birthdate} onChange={(e) => set("birthdate", e.target.value)} required />
          </div>
          <div className="form-group">
            <label className="form-label">Visibility *</label>
            <select className="form-input" value={form.visibility}
              onChange={(e) => set("visibility", e.target.value)}>
              <option value="public">Public</option>
              <option value="private">Private</option>
            </select>
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Password * (min 8 chars)</label>
          <input className="form-input" type="password" placeholder="Password"
            value={form.password} onChange={(e) => set("password", e.target.value)}
            required minLength={8} />
        </div>
        <div className="form-group">
          <label className="form-label">Bio (optional)</label>
          <textarea className="form-input" placeholder="Tell us about yourself..."
            value={form.bio} onChange={(e) => set("bio", e.target.value)} rows={2} />
        </div>
        {error && <p className="error-text">{error}</p>}
        <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
          {loading ? "Creating account..." : "Sign Up"}
        </button>
      </form>
      <div className="auth-switch">
        Already have an account?{" "}
        <button className="link-btn" onClick={onSwitch}>Log in</button>
      </div>
    </div>
  );
}

// ─── FeedPage ────────────────────────────────────────────────────────────────

function FeedPage({ auth, onLogout }: { auth: AuthState; onLogout: () => void }) {
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [users, setUsers] = useState<DiscoverUser[]>([]);
  const [followingSet, setFollowingSet] = useState<Set<string>>(new Set());
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [loadingFeed, setLoadingFeed] = useState(true);
  const [loadingUsers, setLoadingUsers] = useState(true);

  useEffect(() => {
    fetchFeed();
    fetchUsers();
  }, []);

  async function fetchFeed() {
    setLoadingFeed(true);
    try {
      const data = await api<FeedPost[]>("/feed", {}, auth.token);
      setPosts(data);
    } catch (err) {
      console.error("Failed to load feed:", err);
    } finally {
      setLoadingFeed(false);
    }
  }

  async function fetchUsers() {
    setLoadingUsers(true);
    try {
      const data = await api<DiscoverUser[]>("/users", {}, auth.token);
      setUsers(data);
      setFollowingSet(new Set(data.filter((u) => u.is_following).map((u) => u.username)));
    } catch (err) {
      console.error("Failed to load users:", err);
    } finally {
      setLoadingUsers(false);
    }
  }

  async function handleToggleFollow(username: string) {
    try {
      await api(`/toggle-follow/${username}`, { method: "POST" }, auth.token);
      setFollowingSet((prev) => {
        const next = new Set(prev);
        if (next.has(username)) next.delete(username);
        else next.add(username);
        return next;
      });
    } catch (err) {
      console.error("Failed to toggle follow:", err);
    }
  }

  return (
    <div className="app">
      <header className="header">
        <div className="header-inner">
          <span className="logo-text">SocialApp</span>
          <div className="header-actions">
            <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
              + New Post
            </button>
            <div className="header-user">
              <Avatar
                src={auth.user.profile_image}
                name={auth.user.display_name || auth.user.username}
                size={32}
              />
              <span className="header-username">{auth.user.username}</span>
            </div>
            <button className="btn btn-ghost" onClick={onLogout}>Logout</button>
          </div>
        </div>
      </header>

      <main className="main-layout">
        <aside className="sidebar-left">
          <div className="profile-card">
            <Avatar
              src={auth.user.profile_image}
              name={auth.user.display_name || auth.user.username}
              size={56}
            />
            <div className="profile-info">
              <span className="profile-username">{auth.user.username}</span>
              {auth.user.display_name && (
                <span className="profile-display">{auth.user.display_name}</span>
              )}
              {auth.user.bio && <span className="profile-bio">{auth.user.bio}</span>}
            </div>
          </div>
        </aside>

        <div className="feed">
          {loadingFeed ? (
            <div className="loading-state">
              <div className="spinner" />
              <p>Loading feed...</p>
            </div>
          ) : posts.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📷</div>
              <h3>No posts yet</h3>
              <p>Follow people or create your first post!</p>
              <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
                Create a Post
              </button>
            </div>
          ) : (
            posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                isFollowing={followingSet.has(post.username)}
                isOwnPost={post.username === auth.user.username}
                onToggleFollow={handleToggleFollow}
              />
            ))
          )}
        </div>

        <aside className="sidebar-right">
          <p className="sidebar-title">Discover People</p>
          {loadingUsers ? (
            <p className="loading-text">Loading...</p>
          ) : users.length === 0 ? (
            <p className="loading-text">No other users yet.</p>
          ) : (
            users.map((user) => (
              <DiscoverCard
                key={user.username}
                user={user}
                isFollowing={followingSet.has(user.username)}
                onToggleFollow={handleToggleFollow}
              />
            ))
          )}
        </aside>
      </main>

      {showCreateModal && (
        <CreatePostModal
          token={auth.token}
          currentUser={auth.user}
          onClose={() => setShowCreateModal(false)}
          onCreated={(post) => setPosts((prev) => [post, ...prev])}
        />
      )}
    </div>
  );
}

// ─── AuthPage ────────────────────────────────────────────────────────────────

function AuthPage({ onAuth }: { onAuth: (a: AuthState) => void }) {
  const [view, setView] = useState<"login" | "register">("login");
  return (
    <div className="auth-page">
      {view === "login" ? (
        <LoginForm onAuth={onAuth} onSwitch={() => setView("register")} />
      ) : (
        <RegisterForm onAuth={onAuth} onSwitch={() => setView("login")} />
      )}
    </div>
  );
}

// ─── Root ────────────────────────────────────────────────────────────────────

function App() {
  const [auth, setAuth] = useState<AuthState | null>(loadAuth);

  function handleAuth(auth: AuthState) {
    saveAuth(auth);
    setAuth(auth);
  }

  function handleLogout() {
    saveAuth(null);
    setAuth(null);
  }

  return auth ? (
    <FeedPage auth={auth} onLogout={handleLogout} />
  ) : (
    <AuthPage onAuth={handleAuth} />
  );
}

createRoot(document.getElementById("root")!).render(<App />);
