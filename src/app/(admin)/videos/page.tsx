"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Loader2, Plus, RefreshCw, ArrowLeft, ExternalLink,
  Pencil, Trash2, AlertTriangle, PlayCircle, Eye, EyeOff,
} from "lucide-react";
import NextImage from "next/image";
import { Button } from "@/components/ui/button";
import { Input }  from "@/components/ui/input";
import { Label }  from "@/components/ui/label";
import { Badge }  from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { api } from "@/lib/api";
import { formatDistanceToNow, formatDate, formatDuration } from "@/lib/utils";
import type {
  PlaylistCreatePayload, PlaylistUpdatePayload,
  YouTubePlaylist, YouTubeVideo,
} from "@/types";

/* ─── Thumbnail helpers ─────────────────────────────────────────────────── */
function PlaylistThumbnail({ src, name }: { src: string | null; name: string }) {
  if (src) {
    return (
      <div className="relative h-[45px] w-[80px] rounded-[4px] overflow-hidden bg-mist border border-hairline shrink-0">
        <NextImage src={src} alt={name} fill sizes="80px" className="object-cover" unoptimized />
      </div>
    );
  }
  return (
    <div className="flex h-[45px] w-[80px] items-center justify-center rounded-[4px] bg-mist border border-hairline shrink-0">
      <PlayCircle className="h-5 w-5 text-faint stroke-[1.4]" />
    </div>
  );
}

function VideoThumbnail({ src, title }: { src: string | null; title: string }) {
  if (src) {
    return (
      <div className="relative h-[68px] w-[120px] rounded-[6px] overflow-hidden bg-mist border border-hairline shrink-0">
        <NextImage src={src} alt={title} fill sizes="120px" className="object-cover" unoptimized />
      </div>
    );
  }
  return (
    <div className="flex h-[68px] w-[120px] items-center justify-center rounded-[6px] bg-mist border border-hairline shrink-0">
      <PlayCircle className="h-6 w-6 text-faint stroke-[1.4]" />
    </div>
  );
}

/* ─── Add / Edit Playlist dialog ────────────────────────────────────────── */
function PlaylistDialog({ open, playlist, onClose, onSaved }: {
  open: boolean;
  playlist?: YouTubePlaylist;
  onClose: () => void;
  onSaved: (p: YouTubePlaylist) => void;
}) {
  const isEdit = !!playlist;

  const [name,     setName]     = useState("");
  const [url,      setUrl]      = useState("");
  const [category, setCategory] = useState("Talks");
  const [order,    setOrder]    = useState(0);
  const [active,   setActive]   = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [errors,   setErrors]   = useState<Partial<Record<"name" | "url", string>>>({});

  /* Sync form whenever the dialog opens or the target playlist changes */
  useEffect(() => {
    if (open) {
      setName(playlist?.playlist_name ?? "");
      setUrl(playlist?.playlist_url  ?? "");
      setCategory(playlist?.category  ?? "Talks");
      setOrder(playlist?.display_order ?? 0);
      setActive(playlist?.is_active   ?? true);
      setErrors({});
    }
  }, [open, playlist]);

  function validate(): boolean {
    const e: typeof errors = {};
    if (!name.trim())  e.name = "Playlist name is required.";
    if (!url.trim())   e.url  = "YouTube playlist URL is required.";
    else if (!url.includes("youtube.com/playlist") && !url.includes("list="))
      e.url = "Must be a valid YouTube playlist URL (…?list=…).";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      const payload: PlaylistCreatePayload | PlaylistUpdatePayload = {
        playlist_name: name.trim(),
        playlist_url:  url.trim(),
        category:      category.trim() || "Talks",
        display_order: order,
        is_active:     active,
      };
      const saved = isEdit && playlist
        ? await api.videos.updatePlaylist(playlist.id, payload)
        : await api.videos.createPlaylist(payload as PlaylistCreatePayload);
      toast.success(isEdit ? "Playlist updated." : "Playlist added.");
      onSaved(saved);
    } catch {
      toast.error(`Failed to ${isEdit ? "update" : "add"} playlist.`);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-paper border-hairline shadow-none rounded-[14px] max-w-md w-full">
        <DialogHeader>
          <span className="rule-red" />
          <p className="kicker text-faint mb-1">04 / videos · {isEdit ? "edit" : "add"}</p>
          <DialogTitle
            className="text-[22px] leading-[1.1] text-ink font-normal"
            style={{ fontFamily: "var(--font-instrument-serif), Georgia, serif" }}
          >
            {isEdit ? "Edit playlist" : "Add playlist"}
          </DialogTitle>
          <DialogDescription className="text-[12px] text-slate mt-0.5">
            {isEdit ? "Changes take effect immediately." : "Connect a YouTube playlist to the admin panel."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* Name */}
          <div className="space-y-1.5">
            <Label className="kicker text-slate">Playlist Name *</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)}
              placeholder="TEDx Pune Talks"
              className="h-9 bg-mist border-transparent focus:border-hairline focus:bg-paper rounded-[8px] text-[13px] text-ink placeholder:text-faint" />
            {errors.name && <p className="text-[11px] text-red">{errors.name}</p>}
          </div>

          {/* YouTube URL */}
          <div className="space-y-1.5">
            <Label className="kicker text-slate">YouTube Playlist URL *</Label>
            <Input value={url} onChange={(e) => setUrl(e.target.value)}
              placeholder="https://www.youtube.com/playlist?list=PL…"
              className="h-9 bg-mist border-transparent focus:border-hairline focus:bg-paper rounded-[8px] text-[13px] text-ink placeholder:text-faint font-mono" />
            {errors.url && <p className="text-[11px] text-red">{errors.url}</p>}
          </div>

          {/* Category + Order row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="kicker text-slate">Category</Label>
              <Input value={category} onChange={(e) => setCategory(e.target.value)}
                placeholder="Talks"
                className="h-9 bg-mist border-transparent focus:border-hairline focus:bg-paper rounded-[8px] text-[13px] text-ink placeholder:text-faint" />
            </div>
            <div className="space-y-1.5">
              <Label className="kicker text-slate">Display Order</Label>
              <Input type="number" min={0} value={order}
                onChange={(e) => setOrder(parseInt(e.target.value) || 0)}
                className="h-9 bg-mist border-transparent focus:border-hairline focus:bg-paper rounded-[8px] text-[13px] text-ink tabular" />
            </div>
          </div>

          {/* Active toggle */}
          <div className="flex items-center gap-3 py-1">
            <input
              type="checkbox"
              id="playlist-active"
              checked={active}
              onChange={(e) => setActive(e.target.checked)}
              className="h-4 w-4 accent-red cursor-pointer"
            />
            <Label htmlFor="playlist-active" className="text-[13px] text-ink cursor-pointer">
              Active — visible in the community app
            </Label>
          </div>

          <DialogFooter className="gap-2 sm:gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={onClose} disabled={saving}
              className="text-[13px] text-slate hover:text-ink hover:bg-mist rounded-[8px]">
              Discard
            </Button>
            <Button type="submit" disabled={saving}
              className="text-[13px] bg-ink hover:bg-ink/90 text-paper font-semibold rounded-[8px] min-w-[100px] disabled:opacity-40">
              {saving ? <><Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />Saving…</> : (isEdit ? "Save changes" : "Add playlist")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/* ─── Delete confirmation dialog ────────────────────────────────────────── */
function DeleteDialog({ playlist, onClose, onConfirm, loading }: {
  playlist: YouTubePlaylist | null;
  onClose: () => void;
  onConfirm: () => void;
  loading: boolean;
}) {
  return (
    <Dialog open={!!playlist} onOpenChange={onClose}>
      <DialogContent className="bg-paper border-hairline shadow-none max-w-sm rounded-[14px]">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-1">
            <div className="flex h-9 w-9 items-center justify-center rounded-[8px] bg-red-soft shrink-0">
              <AlertTriangle className="h-4 w-4 text-red stroke-[1.6]" />
            </div>
            <DialogTitle className="text-[17px] font-semibold text-ink">Delete playlist?</DialogTitle>
          </div>
          <DialogDescription className="text-[13px] text-slate leading-relaxed">
            Delete <span className="font-semibold text-ink">&ldquo;{playlist?.playlist_name}&rdquo;</span> and
            all its videos? This cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="ghost" onClick={onClose} disabled={loading}
            className="text-[13px] text-slate hover:text-ink hover:bg-mist rounded-[8px]">Cancel</Button>
          <Button onClick={onConfirm} disabled={loading}
            className="text-[13px] bg-red hover:bg-red/90 text-paper font-semibold rounded-[8px]">
            {loading ? <><Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />Deleting…</> : "Delete permanently"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ─── View 1: Playlists table ───────────────────────────────────────────── */
function PlaylistsView({
  playlists, loading,
  onSelectPlaylist, onEdit, onToggleActive, onDelete,
}: {
  playlists: YouTubePlaylist[];
  loading: boolean;
  onSelectPlaylist: (p: YouTubePlaylist) => void;
  onEdit: (p: YouTubePlaylist) => void;
  onToggleActive: (p: YouTubePlaylist) => void;
  onDelete: (p: YouTubePlaylist) => void;
}) {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-5 w-5 animate-spin text-faint" />
      </div>
    );
  }

  if (playlists.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-2 rounded-[10px] border border-dashed border-hairline bg-paper">
        <PlayCircle className="h-6 w-6 text-faint stroke-[1.4]" />
        <p className="kicker text-faint">No playlists yet.</p>
      </div>
    );
  }

  return (
    <div className="rounded-[10px] border border-hairline bg-paper overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="border-hairline hover:bg-transparent">
            <TableHead className="kicker text-faint py-3 w-[100px]">Thumbnail</TableHead>
            <TableHead className="kicker text-faint py-3">Playlist</TableHead>
            <TableHead className="kicker text-faint py-3 hidden sm:table-cell w-[80px] text-right">Order</TableHead>
            <TableHead className="kicker text-faint py-3 w-[100px]">Status</TableHead>
            <TableHead className="kicker text-faint py-3 text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {playlists.map((pl) => (
            <TableRow
              key={pl.id}
              className="border-hairline hover:bg-mist/50 transition-colors cursor-pointer group"
              onClick={() => onSelectPlaylist(pl)}
            >
              {/* Thumbnail */}
              <TableCell className="py-3" onClick={(e) => e.stopPropagation()}>
                <PlaylistThumbnail src={pl.thumbnail_url} name={pl.playlist_name} />
              </TableCell>

              {/* Name + category */}
              <TableCell className="py-3">
                <p className="text-[13px] font-semibold text-ink leading-tight">{pl.playlist_name}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="role-badge role-organizer">{pl.category}</span>
                  {pl.video_count !== undefined && (
                    <span className="kicker text-faint">{pl.video_count} videos</span>
                  )}
                </div>
              </TableCell>

              {/* Order */}
              <TableCell className="py-3 hidden sm:table-cell text-right kicker text-faint tabular">
                {pl.display_order}
              </TableCell>

              {/* Status */}
              <TableCell className="py-3">
                <span className={`role-badge ${pl.is_active ? "role-speaker" : "role-attendee"}`}>
                  {pl.is_active ? "Active" : "Inactive"}
                </span>
              </TableCell>

              {/* Actions */}
              <TableCell className="py-3 text-right" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button size="sm" variant="ghost"
                    onClick={() => onEdit(pl)}
                    className="h-7 px-2 text-[11px] font-medium text-slate hover:text-ink hover:bg-mist rounded-md">
                    <Pencil className="h-3 w-3 mr-1 stroke-[1.6]" />Edit
                  </Button>
                  <Button size="sm" variant="ghost"
                    onClick={() => onToggleActive(pl)}
                    className={`h-7 px-2 text-[11px] font-medium rounded-md ${
                      pl.is_active
                        ? "text-slate hover:text-amber-600 hover:bg-amber-50"
                        : "text-slate hover:text-green-600 hover:bg-green-50"
                    }`}>
                    {pl.is_active
                      ? <><EyeOff className="h-3 w-3 mr-1 stroke-[1.6]" />Deactivate</>
                      : <><Eye    className="h-3 w-3 mr-1 stroke-[1.6]" />Activate</>}
                  </Button>
                  <Button size="sm" variant="ghost"
                    onClick={() => onDelete(pl)}
                    className="h-7 px-2 text-[11px] font-medium text-slate hover:text-red hover:bg-red-soft rounded-md">
                    <Trash2 className="h-3 w-3 mr-1 stroke-[1.6]" />Delete
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

/* ─── View 2: Videos for a playlist ─────────────────────────────────────── */
function VideosView({
  playlist, videos, page, total, loading,
  onPageChange,
}: {
  playlist: YouTubePlaylist;
  videos: YouTubeVideo[];
  page: number;
  total: number;
  loading: boolean;
  onPageChange: (p: number) => void;
}) {
  const LIMIT      = 20;
  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div className="space-y-4">
      {/* Playlist meta */}
      <div className="flex items-center gap-3 rounded-[10px] border border-hairline bg-mist px-4 py-3">
        <PlaylistThumbnail src={playlist.thumbnail_url} name={playlist.playlist_name} />
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-semibold text-ink truncate">{playlist.playlist_name}</p>
          <div className="flex items-center gap-2 mt-1">
            <span className="role-badge role-organizer">{playlist.category}</span>
            <span className={`role-badge ${playlist.is_active ? "role-speaker" : "role-attendee"}`}>
              {playlist.is_active ? "Active" : "Inactive"}
            </span>
            {playlist.playlist_url && (
              <a href={playlist.playlist_url} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1 kicker text-slate hover:text-ink transition-colors">
                <ExternalLink className="h-3 w-3" />YouTube
              </a>
            )}
          </div>
        </div>
        <span className="kicker text-faint shrink-0 tabular">{total.toLocaleString("en-IN")} videos</span>
      </div>

      {/* Video table */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="h-5 w-5 animate-spin text-faint" />
        </div>
      ) : videos.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 gap-2 rounded-[10px] border border-dashed border-hairline bg-paper">
          <PlayCircle className="h-6 w-6 text-faint stroke-[1.4]" />
          <p className="kicker text-faint">No videos in this playlist yet. Try syncing.</p>
        </div>
      ) : (
        <div className="rounded-[10px] border border-hairline bg-paper overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-hairline hover:bg-transparent">
                <TableHead className="kicker text-faint py-3 w-[140px]">Thumbnail</TableHead>
                <TableHead className="kicker text-faint py-3">Title</TableHead>
                <TableHead className="kicker text-faint py-3 hidden md:table-cell w-[90px]">Duration</TableHead>
                <TableHead className="kicker text-faint py-3 hidden sm:table-cell w-[120px]">Published</TableHead>
                <TableHead className="kicker text-faint py-3 w-[60px] text-right">Link</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {videos.map((v) => (
                <TableRow key={v.id} className="border-hairline hover:bg-mist/50 transition-colors">
                  {/* Thumbnail */}
                  <TableCell className="py-3">
                    <VideoThumbnail src={v.thumbnail_url} title={v.title} />
                  </TableCell>

                  {/* Title */}
                  <TableCell className="py-3">
                    <p className="text-[13px] font-semibold text-ink leading-tight line-clamp-2">{v.title}</p>
                    {v.description && (
                      <p className="text-[11px] text-slate mt-0.5 line-clamp-1">{v.description}</p>
                    )}
                  </TableCell>

                  {/* Duration */}
                  <TableCell className="py-3 hidden md:table-cell">
                    {v.duration ? (
                      <span className="kicker text-slate tabular">{formatDuration(v.duration)}</span>
                    ) : (
                      <span className="kicker text-faint">—</span>
                    )}
                  </TableCell>

                  {/* Published */}
                  <TableCell className="py-3 hidden sm:table-cell">
                    {v.published_at ? (
                      <span className="kicker text-faint">{formatDistanceToNow(v.published_at)}</span>
                    ) : (
                      <span className="kicker text-faint">—</span>
                    )}
                  </TableCell>

                  {/* Link */}
                  <TableCell className="py-3 text-right">
                    <a href={v.video_url} target="_blank" rel="noopener noreferrer"
                      className="inline-flex h-7 w-7 items-center justify-center rounded-md text-slate hover:text-ink hover:bg-mist transition-colors">
                      <ExternalLink className="h-3.5 w-3.5 stroke-[1.6]" />
                    </a>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="kicker text-faint">Page {page} of {totalPages}</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1 || loading}
              onClick={() => onPageChange(page - 1)}
              className="h-8 text-[12px] border-hairline text-slate hover:text-ink hover:bg-mist rounded-[6px]">
              Previous
            </Button>
            <Button variant="outline" size="sm" disabled={page >= totalPages || loading}
              onClick={() => onPageChange(page + 1)}
              className="h-8 text-[12px] border-hairline text-slate hover:text-ink hover:bg-mist rounded-[6px]">
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Page ───────────────────────────────────────────────────────────────── */
export default function VideosPage() {
  type View = "playlists" | "videos";

  // View state
  const [view,             setView]             = useState<View>("playlists");
  const [selectedPlaylist, setSelectedPlaylist] = useState<YouTubePlaylist | null>(null);

  // Playlists
  const [playlists,        setPlaylists]        = useState<YouTubePlaylist[]>([]);
  const [playlistsLoading, setPlaylistsLoading] = useState(false);
  const [syncing,          setSyncing]          = useState(false);

  // Videos (for playlist detail view)
  const [videos,       setVideos]       = useState<YouTubeVideo[]>([]);
  const [videosPage,   setVideosPage]   = useState(1);
  const [videosTotal,  setVideosTotal]  = useState(0);
  const [videosLoading,setVideosLoading]= useState(false);

  // Dialogs
  const [dialogOpen,    setDialogOpen]    = useState(false);
  const [editingPl,     setEditingPl]     = useState<YouTubePlaylist | undefined>(undefined);
  const [deleteTarget,  setDeleteTarget]  = useState<YouTubePlaylist | null>(null);
  const [deleting,      setDeleting]      = useState(false);

  /* ── Data fetching ─────────────────────────────────────────────────── */
  const fetchPlaylists = useCallback(async () => {
    setPlaylistsLoading(true);
    try {
      const data = await api.videos.listPlaylists();
      setPlaylists(data);
    } catch {
      toast.error("Failed to load playlists.");
    } finally {
      setPlaylistsLoading(false);
    }
  }, []);

  const fetchVideos = useCallback(async () => {
    if (!selectedPlaylist) return;
    setVideosLoading(true);
    try {
      const res = await api.videos.getPlaylistVideos(selectedPlaylist.id, { page: videosPage, limit: 20 });
      setVideos(res.items);
      setVideosTotal(res.total);
    } catch {
      toast.error("Failed to load videos.");
    } finally {
      setVideosLoading(false);
    }
  }, [selectedPlaylist, videosPage]);

  useEffect(() => { fetchPlaylists(); }, [fetchPlaylists]);
  useEffect(() => { if (view === "videos") fetchVideos(); }, [view, fetchVideos]);

  /* ── Handlers ──────────────────────────────────────────────────────── */
  async function handleSync() {
    setSyncing(true);
    try {
      const result = await api.videos.syncAll();
      toast.success(
        `Synced ${result.playlistsSynced} playlists, ${result.videosInserted} new videos, ${result.videosUpdated} updated.`
      );
      fetchPlaylists();
      if (view === "videos" && selectedPlaylist) {
        setVideosPage(1);
        fetchVideos();
      }
    } catch {
      toast.error("Sync failed. Please try again.");
    } finally {
      setSyncing(false);
    }
  }

  function handleSelectPlaylist(pl: YouTubePlaylist) {
    setSelectedPlaylist(pl);
    setVideosPage(1);
    setVideos([]);
    setView("videos");
  }

  function handleBack() {
    setView("playlists");
    setSelectedPlaylist(null);
    setVideos([]);
  }

  function openAddDialog() {
    setEditingPl(undefined);
    setDialogOpen(true);
  }

  function openEditDialog(pl: YouTubePlaylist) {
    setEditingPl(pl);
    setDialogOpen(true);
  }

  async function handleToggleActive(pl: YouTubePlaylist) {
    try {
      const updated = await api.videos.updatePlaylist(pl.id, { is_active: !pl.is_active });
      setPlaylists((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
      if (selectedPlaylist?.id === updated.id) setSelectedPlaylist(updated);
      toast.success(`"${updated.playlist_name}" ${updated.is_active ? "activated" : "deactivated"}.`);
    } catch {
      toast.error("Failed to update playlist.");
    }
  }

  function handleSaved(saved: YouTubePlaylist) {
    if (editingPl) {
      setPlaylists((prev) => prev.map((p) => (p.id === saved.id ? saved : p)));
      if (selectedPlaylist?.id === saved.id) setSelectedPlaylist(saved);
    } else {
      setPlaylists((prev) => [...prev, saved].sort((a, b) => a.display_order - b.display_order));
    }
    setDialogOpen(false);
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.videos.deletePlaylist(deleteTarget.id);
      setPlaylists((prev) => prev.filter((p) => p.id !== deleteTarget.id));
      toast.success(`Deleted "${deleteTarget.playlist_name}".`);
      if (selectedPlaylist?.id === deleteTarget.id) handleBack();
      setDeleteTarget(null);
    } catch {
      toast.error("Deletion failed.");
    } finally {
      setDeleting(false);
    }
  }

  /* ── Render ────────────────────────────────────────────────────────── */
  return (
    <div className="space-y-6 max-w-7xl mx-auto">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          {view === "videos" && (
            <button
              onClick={handleBack}
              className="flex items-center gap-1.5 kicker text-slate hover:text-ink transition-colors mb-3"
            >
              <ArrowLeft className="h-3.5 w-3.5 stroke-[2]" />
              Back to playlists
            </button>
          )}
          <span className="rule-red" />
          <p className="kicker text-faint mb-1.5">04 / videos</p>
          <h1
            className="text-[28px] leading-[1.0] tracking-[-0.6px] text-ink"
            style={{ fontFamily: "var(--font-instrument-serif), Georgia, serif" }}
          >
            {view === "videos" && selectedPlaylist
              ? selectedPlaylist.playlist_name
              : "Video Management"}
          </h1>
          {view === "playlists" && (
            <p className="text-[13px] text-slate mt-1">
              Manage YouTube playlists and sync videos to the community feed.
            </p>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 mt-1 shrink-0">
          <Button
            variant="ghost" size="sm"
            onClick={handleSync} disabled={syncing}
            className="h-8 px-3 text-[12px] text-slate hover:text-ink hover:bg-mist rounded-[6px]"
          >
            <RefreshCw className={`h-3.5 w-3.5 mr-1.5 stroke-[1.6] ${syncing ? "animate-spin" : ""}`} />
            {syncing ? "Syncing…" : "Sync All"}
          </Button>
          {view === "playlists" && (
            <Button
              onClick={openAddDialog}
              className="h-8 px-4 text-[12px] font-semibold bg-red hover:bg-red/90 text-paper rounded-[8px]"
            >
              <Plus className="h-3.5 w-3.5 mr-1.5 stroke-[2]" />Add Playlist
            </Button>
          )}
        </div>
      </div>

      {/* Summary bar (playlists view only) */}
      {view === "playlists" && !playlistsLoading && playlists.length > 0 && (
        <div className="flex items-center gap-3 rounded-[8px] border border-hairline bg-mist px-4 py-2.5">
          <span className="kicker text-faint">{playlists.length} playlists</span>
          <span className="kicker text-faint">·</span>
          <span className="kicker text-faint">
            {playlists.filter((p) => p.is_active).length} active
          </span>
        </div>
      )}

      {/* Views */}
      {view === "playlists" ? (
        <PlaylistsView
          playlists={playlists}
          loading={playlistsLoading}
          onSelectPlaylist={handleSelectPlaylist}
          onEdit={openEditDialog}
          onToggleActive={handleToggleActive}
          onDelete={setDeleteTarget}
        />
      ) : selectedPlaylist ? (
        <VideosView
          playlist={selectedPlaylist}
          videos={videos}
          page={videosPage}
          total={videosTotal}
          loading={videosLoading}
          onPageChange={(p) => setVideosPage(p)}
        />
      ) : null}

      {/* Dialogs */}
      <PlaylistDialog
        open={dialogOpen}
        playlist={editingPl}
        onClose={() => setDialogOpen(false)}
        onSaved={handleSaved}
      />
      <DeleteDialog
        playlist={deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
      />
    </div>
  );
}
