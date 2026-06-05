import axios, { AxiosInstance, InternalAxiosRequestConfig } from "axios";
import type {
  LoginResponse, Metrics, PaginatedResponse,
  PlaylistCreatePayload, PlaylistUpdatePayload,
  PostAPI, PostCreatePayload, PostUpdatePayload,
  SyncResult, User, UserStatus,
  YouTubePlaylist, YouTubeVideo,
} from "@/types";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";

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
