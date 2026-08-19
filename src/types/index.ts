export type UserRole = "USER" | "ADMIN" | "SUPER_ADMIN";
export type UserStatus = "PENDING_APPROVAL" | "ACTIVE" | "BLOCKED";
export type PostStatus = "ACTIVE" | "DELETED";
export type SocialProvider = "linkedin" | "google" | "apple";

export interface WhitelistedUser {
  id?: string;
  email: string;
  full_name?: string;
  notes?: string;
  created_at?: string;
}

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  is_active: boolean;
}

export interface User {
  id: string;
  tenant_id: string;
  supabase_uid: string;
  email: string;
  full_name: string;
  avatar_url: string;
  headline: string;
  role: UserRole;
  status: UserStatus;
  created_at: string;
  linkedin_id: string | null;
  google_id: string | null;
  apple_id: string | null;
}

/** Snake-case Post (kept for legacy references). */
export interface Post {
  id: string;
  tenant_id: string;
  author_id: string;
  body: string;
  status: PostStatus;
  created_at: string;
  author?: User;
  like_count?: number;
  comment_count?: number;
}

/** Embedded author shape returned by GET /admin/posts (camelCase). */
export interface PostAuthor {
  id: string;
  full_name: string;
  email: string;
  avatar_url: string | null;
  headline: string | null;
}

/** camelCase Post as returned by the Fastify backend. */
export interface PostAPI {
  id: string;
  body: string;
  post_type: PostType;
  image_url?: string | null;
  video_url?: string | null;
  status: PostStatus;
  created_at: string;
  author?: PostAuthor;
  kudos_count?: number;
  poll_options?: PollOption[];
  options?: PollOption[];
  pollOptions?: PollOption[];
  poll?: {
    id?: string;
    options?: PollOption[];
  };
}

export type PostType = 'text' | 'image' | 'video' | 'poll';

export interface PollVoter {
  id: string;
  full_name: string;
  email?: string;
  avatar_url?: string | null;
  headline?: string | null;
  voted_at?: string;
}

export interface PollVoteRecord {
  id: string;
  created_at: string;
  option_id: string;
  option_text: string;
  user: {
    id: string;
    full_name: string;
    email: string;
    avatar_url: string | null;
    headline?: string | null;
  };
}

export interface PollVotesResponse {
  post_id: string;
  post_body: string;
  total_votes: number;
  options: PollOption[];
  votes: PollVoteRecord[];
}

export interface PostLikeRecord {
  id: string;
  created_at: string;
  user: {
    id: string;
    full_name: string;
    email: string;
    avatar_url: string | null;
    headline?: string | null;
  };
}

export interface PostLikesResponse {
  post_id: string;
  total_likes: number;
  likes: PostLikeRecord[];
}

export interface PollOption {
  id: string;
  option_text: string;
  sort_order: number;
  vote_count: number;
  voters?: PollVoter[];
  votes?: { id?: string; created_at?: string; user?: PollVoter; full_name?: string; avatar_url?: string; email?: string }[];
}

/** Payload for POST /api/v1/posts */
export interface PostCreatePayload {
  body: string;
  post_type?: PostType;
  image_url?: string;
  video_url?: string;
  poll_options?: string[];
}

/** Payload for PATCH /api/v1/posts/:id */
export interface PostUpdatePayload {
  body?: string;
  image_url?: string;
  video_url?: string;
  poll_options?: string[];
}

export interface Metrics {
  totalUsers: number;
  activeUsers: number;
  pendingApprovals?: number;
  blockedUsers?: number;
  totalPosts: number;
  totalComments: number;
  totalLikes: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

/** Actual claims inside the JWT — only these fields are present. */
export interface JWTClaims {
  sub: string;
  tenantId: string;
  role: UserRole;
  iat: number;
  exp: number;
}

/** User profile returned by POST /auth/login (camelCase from the backend). */
export interface LoginUser {
  id: string;
  fullName: string;
  email: string;
  avatarUrl: string | null;
  role: UserRole;
  status: UserStatus;
}

/** Shape of the full login API response. */
export interface LoginResponse {
  accessToken: string;
  user: LoginUser;
}

/**
 * Merged auth identity used throughout the UI.
 * JWT claims (tenantId, exp …) + profile fields (fullName, email, avatarUrl).
 */
export interface AuthUser extends JWTClaims {
  fullName: string;
  email: string;
  avatarUrl: string | null;
}

/* ─── YouTube / Videos ────────────────────────────────────────────────── */

export interface YouTubePlaylist {
  id: string;
  playlist_name: string;
  playlist_id: string;
  playlist_url: string | null;
  category: string;
  thumbnail_url: string | null;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  video_count?: number;
}

export interface YouTubeVideo {
  id: string;
  youtube_video_id: string;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  video_url: string;
  published_at: string | null;
  duration: string | null;
  is_active: boolean;
}

export interface SyncResult {
  playlistsSynced: number;
  videosInserted: number;
  videosUpdated: number;
}

export interface PlaylistCreatePayload {
  playlist_name: string;
  playlist_url: string;
  category?: string;
  display_order?: number;
  is_active?: boolean;
}

export interface PlaylistUpdatePayload {
  playlist_name?: string;
  playlist_url?: string;
  category?: string;
  display_order?: number;
  is_active?: boolean;
}
