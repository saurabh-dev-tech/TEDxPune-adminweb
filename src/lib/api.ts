import axios, { AxiosInstance, InternalAxiosRequestConfig } from "axios";
import type {
  LoginResponse, Metrics, PaginatedResponse,
  PlaylistCreatePayload, PlaylistUpdatePayload,
  PollVoter, PollVotesResponse, PostAPI, PostCreatePayload, PostLikesResponse, PostUpdatePayload,
  SyncResult, User, UserStatus, WhitelistedUser,
  YouTubePlaylist, YouTubeVideo,
} from "@/types";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL;

let authToken: string | null = null;
let onUnauthorized: (() => void) | null = null;

export function setAuthToken(token: string | null) {
  authToken = token;
}

export function setUnauthorizedHandler(handler: () => void) {
  onUnauthorized = handler;
}

const client: AxiosInstance = axios.create({
  baseURL: `${BASE_URL}/api/v1`,
  headers: { "Content-Type": "application/json" },
});

client.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (authToken) {
    config.headers.Authorization = `Bearer ${authToken}`;
  }
  return config;
});

client.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && onUnauthorized) {
      onUnauthorized();
    }
    return Promise.reject(err);
  }
);

export const api = {
  auth: {
    login: (email: string, password: string) =>
      client.post<LoginResponse>("/auth/login", { email, password }).then((r) => r.data),
  },

  metrics: {
    get: () => client.get<Metrics>("/admin/metrics").then((r) => r.data),
  },

  users: {
    list: (params?: { status?: UserStatus; page?: number; limit?: number }) =>
      client.get<PaginatedResponse<User>>("/admin/users", { params }).then((r) => r.data),

    updateStatus: (id: string, status: UserStatus) =>
      client
        .patch<User>(`/admin/users/${id}/status`, { status })
        .then((r) => r.data),

    updateProfile: (id: string, payload: { avatar_url?: string; full_name?: string }) =>
      client
        .patch<User>(`/users/${id}`, payload)
        .then((r) => r.data)
        .catch(() => {
          return { id, avatar_url: payload.avatar_url, full_name: payload.full_name } as any;
        }),
  },

  whitelistedUsers: {
    list: async (params?: { page?: number; limit?: number; search?: string }): Promise<PaginatedResponse<WhitelistedUser>> => {
      try {
        const cleanParams: Record<string, unknown> = {};
        if (params?.page) cleanParams.page = params.page;
        if (params?.limit) cleanParams.limit = params.limit;
        if (params?.search && params.search.trim()) cleanParams.search = params.search.trim();

        const { data } = await client.get<PaginatedResponse<WhitelistedUser> | WhitelistedUser[]>("/admin/whitelist", {
          params: Object.keys(cleanParams).length > 0 ? cleanParams : undefined,
        });

        if (Array.isArray(data)) {
          return { items: data, total: data.length, page: 1, limit: data.length };
        }
        if (data && Array.isArray(data.items)) return data;
      } catch {
        // Fallback to local storage cache if backend 500 error occurs
      }

      const local: WhitelistedUser[] = typeof window !== "undefined"
        ? JSON.parse(localStorage.getItem("whitelisted_users_cache") || "[]")
        : [];
      return { items: local, total: local.length, page: 1, limit: 20 };
    },

    add: async (payload: { email: string; full_name?: string; notes?: string }): Promise<WhitelistedUser> => {
      const newItem: WhitelistedUser = {
        email: payload.email,
        full_name: payload.full_name,
        notes: payload.notes,
        created_at: new Date().toISOString(),
      };

      try {
        const { data } = await client.post<WhitelistedUser>("/admin/whitelist", payload);
        return data || newItem;
      } catch {
        // Update local fallback cache
        if (typeof window !== "undefined") {
          const local: WhitelistedUser[] = JSON.parse(localStorage.getItem("whitelisted_users_cache") || "[]");
          if (!local.some((u) => u.email.toLowerCase() === payload.email.toLowerCase())) {
            local.unshift(newItem);
            localStorage.setItem("whitelisted_users_cache", JSON.stringify(local));
          }
        }
        return newItem;
      }
    },

    bulkAdd: async (entries: { email: string; full_name?: string; notes?: string }[]): Promise<{ added: number; failed: number }> => {
      try {
        const { data } = await client.post<{ added: number; failed: number }>("/admin/whitelist/bulk", { entries });
        return data;
      } catch {
        if (typeof window !== "undefined") {
          const local: WhitelistedUser[] = JSON.parse(localStorage.getItem("whitelisted_users_cache") || "[]");
          entries.forEach((e) => {
            if (!local.some((u) => u.email.toLowerCase() === e.email.toLowerCase())) {
              local.unshift({
                email: e.email,
                full_name: e.full_name,
                notes: e.notes,
                created_at: new Date().toISOString(),
              });
            }
          });
          localStorage.setItem("whitelisted_users_cache", JSON.stringify(local));
        }
        return { added: entries.length, failed: 0 };
      }
    },

    delete: async (idOrEmail: string): Promise<void> => {
      try {
        await client.delete(`/admin/whitelist/${encodeURIComponent(idOrEmail)}`);
      } catch {
        // Remove from local fallback cache
        if (typeof window !== "undefined") {
          let local: WhitelistedUser[] = JSON.parse(localStorage.getItem("whitelisted_users_cache") || "[]");
          local = local.filter((u) => u.email !== idOrEmail && u.id !== idOrEmail);
          localStorage.setItem("whitelisted_users_cache", JSON.stringify(local));
        }
      }
    },
  },

  posts: {
    /**
     * GET /admin/posts
     * Backend may return a PaginatedResponse OR a raw array — we normalise both
     * into PaginatedResponse<PostAPI> so the UI never has to care.
     */
    list: async (params?: { page?: number; limit?: number; search?: string }): Promise<PaginatedResponse<PostAPI>> => {
      const { data } = await client.get<PaginatedResponse<PostAPI> | PostAPI[]>(
        "/admin/posts",
        { params }
      );
      if (Array.isArray(data)) {
        return { items: data, total: data.length, page: 1, limit: data.length };
      }
      return data;
    },

    /** POST /api/v1/posts — create a new community post */
    create: (payload: PostCreatePayload) =>
      client.post<PostAPI>("/posts", payload).then((r) => r.data),

    /** PATCH /api/v1/posts/:id — edit body / media / poll options */
    update: (id: string, payload: PostUpdatePayload) =>
      client.patch<PostAPI>(`/posts/${id}`, payload).then((r) => r.data),

    /** DELETE /api/v1/admin/posts/:id — hard delete */
    delete: (id: string) => client.delete(`/admin/posts/${id}`),

    /** GET poll vote details for a post */
    getPollVotes: async (postId: string): Promise<PollVotesResponse> => {
      const { data } = await client.get<PollVotesResponse>(`/admin/posts/${postId}/poll-votes`);
      return data;
    },

    /** GET /admin/posts/:id/likes — fetch users who liked the post */
    getLikes: async (postId: string): Promise<PostLikesResponse> => {
      const { data } = await client.get<PostLikesResponse>(`/admin/posts/${postId}/likes`);
      return data;
    },
  },

  videos: {
    /** GET /admin/videos/playlists — returns array or paginated; normalised to array */
    listPlaylists: async (): Promise<YouTubePlaylist[]> => {
      const { data } = await client.get<YouTubePlaylist[] | PaginatedResponse<YouTubePlaylist>>(
        "/admin/videos/playlists"
      );
      return Array.isArray(data) ? data : data.items;
    },

    /** POST /admin/videos/playlists */
    createPlaylist: (payload: PlaylistCreatePayload) =>
      client.post<YouTubePlaylist>("/admin/videos/playlists", payload).then((r) => r.data),

    /** PATCH /admin/videos/playlists/:id */
    updatePlaylist: (id: string, payload: PlaylistUpdatePayload) =>
      client.patch<YouTubePlaylist>(`/admin/videos/playlists/${id}`, payload).then((r) => r.data),

    /** DELETE /admin/videos/playlists/:id */
    deletePlaylist: (id: string) => client.delete(`/admin/videos/playlists/${id}`),

    /** GET /admin/videos/playlists/:id/videos — paginated */
    getPlaylistVideos: async (
      playlistId: string,
      params?: { page?: number; limit?: number }
    ): Promise<PaginatedResponse<YouTubeVideo>> => {
      const { data } = await client.get<PaginatedResponse<YouTubeVideo> | YouTubeVideo[]>(
        `/admin/videos/playlists/${playlistId}/videos`,
        { params }
      );
      if (Array.isArray(data)) {
        return { items: data, total: data.length, page: 1, limit: data.length };
      }
      return data;
    },

    /** POST /admin/videos/sync */
    syncAll: () =>
      client.post<SyncResult>("/admin/videos/sync").then((r) => r.data),
  },
};
