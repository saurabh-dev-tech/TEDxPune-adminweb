"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  Loader2, Trash2, Heart, MessageCircle, AlertTriangle,
  RefreshCw, Pencil, Image as ImageIcon, Video, BarChart2,
  Type, Plus, X, Edit2, Search,
} from "lucide-react";
import NextImage from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { api } from "@/lib/api";
import { formatDistanceToNow } from "@/lib/utils";
import type { PostAPI, PostCreatePayload, PostType, PostUpdatePayload } from "@/types";

const MAX_BODY = 3000;

const AVATAR_PALETTE = [
  "#0F172A", "#7C2D12", "#1E3A8A", "#14532D",
  "#581C87", "#78350F", "#831843", "#164E63",
];
function avatarColor(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return AVATAR_PALETTE[h % AVATAR_PALETTE.length];
}

function extractYoutubeId(url: string): string | null {
  const match =
    url.match(/youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/) ||
    url.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/) ||
    url.match(/youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/) ||
    url.match(/youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/);
  return match ? match[1] : null;
}

const POST_TYPE_META: Record<PostType, { label: string; icon: React.ReactNode; accent: string }> = {
  text: { label: "Text", icon: <Type className="h-3.5 w-3.5" />, accent: "bg-red" },
  image: { label: "Image", icon: <ImageIcon className="h-3.5 w-3.5" />, accent: "bg-blue-500" },
  video: { label: "Video", icon: <Video className="h-3.5 w-3.5" />, accent: "bg-purple-500" },
  poll: { label: "Poll", icon: <BarChart2 className="h-3.5 w-3.5" />, accent: "bg-amber-500" },
};

/* Shared auto-growing textarea + char counter */
function ComposerBody({ body, onChange, onKeyDown, placeholder, textareaRef }: {
  body: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  placeholder?: string;
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
}) {
  const remaining = MAX_BODY - body.length;
  const overLimit = remaining < 0;
  return (
    <div className="rounded-[10px] border border-hairline bg-mist/50 focus-within:border-slate/40 focus-within:bg-paper transition-colors">
      <textarea ref={textareaRef} value={body} onChange={onChange} onKeyDown={onKeyDown}
        placeholder={placeholder ?? "Share an idea worth spreading…"}
        rows={4}
        className="w-full resize-none bg-transparent rounded-[10px] px-4 py-3.5 text-[14.5px] leading-relaxed text-ink placeholder:text-faint outline-none font-sans"
        style={{ minHeight: 100, maxHeight: 300 }} />
      <div className="flex items-center justify-between px-4 pb-3 pt-1">
        <span className="kicker text-faint">⌘↵ to save</span>
        <span className={`kicker tabular ${overLimit ? "text-red font-bold" : remaining < 200 ? "text-amber-500" : "text-faint"}`}>
          {remaining.toLocaleString("en-IN")} / {MAX_BODY.toLocaleString("en-IN")}
        </span>
      </div>
    </div>
  );
}

/* Shared poll options editor */
function PollOptionList({ options, onUpdate, onAdd, onRemove }: {
  options: string[];
  onUpdate: (i: number, val: string) => void;
  onAdd: () => void;
  onRemove: (i: number) => void;
}) {
  return (
    <div>
      <label className="kicker text-slate mb-2 block">Poll options (2–4)</label>
      <div className="space-y-2">
        {options.map((opt, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="kicker text-faint w-4 shrink-0">{i + 1}</span>
            <input type="text" value={opt} maxLength={100}
              onChange={(e) => onUpdate(i, e.target.value)}
              placeholder={`Option ${i + 1}`}
              className="flex-1 rounded-[8px] border border-hairline bg-mist/50 px-3 py-2 text-[13px] text-ink placeholder:text-faint outline-none focus:border-slate/40 focus:bg-paper transition-colors" />
            {options.length > 2 && (
              <button onClick={() => onRemove(i)} className="text-faint hover:text-red transition-colors shrink-0">
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        ))}
      </div>
      {options.length < 4 && (
        <button onClick={onAdd} className="mt-2 flex items-center gap-1.5 text-[12px] text-slate hover:text-ink transition-colors">
          <Plus className="h-3.5 w-3.5" />Add option
        </button>
      )}
    </div>
  );
}

/* Post card */
function PostCard({ post, onEdit, onDelete }: { post: PostAPI; onEdit: (p: PostAPI) => void; onDelete: (id: string) => void }) {
  const name = post.author?.full_name ?? "Unknown";
  const initials = name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  const meta = POST_TYPE_META[post.post_type ?? "text"];

  return (
    <article className="group relative rounded-[10px] border border-hairline bg-paper flex flex-col hover:border-slate/40 transition-colors overflow-hidden">
      <div className={`h-[3px] w-full ${meta.accent}`} />
      <div className="p-5 flex flex-col gap-3 flex-1">
        {/* Author */}
        <div className="flex items-start gap-3">
          <Avatar className="h-8 w-8 shrink-0">
            <AvatarImage src={post.author?.avatar_url ?? undefined} />
            <AvatarFallback className="text-[10px] font-bold text-paper" style={{ background: avatarColor(name) }}>
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-semibold text-ink leading-tight truncate">{name}</p>
            {post.author?.headline && <p className="text-[11px] text-slate truncate mt-0.5">{post.author.headline}</p>}
            <p className="kicker text-faint mt-1">{formatDistanceToNow(post.created_at)}</p>
          </div>
          <span className="flex items-center gap-1 kicker text-slate shrink-0">{meta.icon}{meta.label}</span>
        </div>

        {/* Body */}
        <p className="text-[14px] leading-relaxed text-ink line-clamp-4 flex-1">{post.body}</p>

        {/* Image preview */}
        {post.post_type === "image" && post.image_url && (
          <div className="relative h-40 rounded-[8px] overflow-hidden bg-mist border border-hairline">
            <NextImage src={post.image_url} alt="Post image" fill sizes="(max-width:640px) 100vw,400px" className="object-cover" unoptimized />
          </div>
        )}

        {/* Video preview */}
        {post.post_type === "video" && post.video_url && (() => {
          const ytId = extractYoutubeId(post.video_url);
          if (ytId) {
            return (
              <div className="relative aspect-video w-full rounded-[8px] overflow-hidden bg-black border border-hairline">
                <iframe
                  src={`https://www.youtube.com/embed/${ytId}`}
                  title="YouTube video player"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="absolute inset-0 w-full h-full"
                />
              </div>
            );
          }
          return (
            <div className="flex items-center gap-2.5 rounded-[8px] bg-mist border border-hairline px-3 py-2.5">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-purple-100">
                <Video className="h-3.5 w-3.5 text-purple-500 stroke-[1.6]" />
              </div>
              <span className="text-[12px] text-slate truncate flex-1">{post.video_url}</span>
            </div>
          );
        })()}

        {/* Poll preview */}
        {post.post_type === "poll" && post.poll_options && post.poll_options.length > 0 && (
          <div className="space-y-1.5">
            {post.poll_options.map((opt) => {
              const totalVotes = post.poll_options!.reduce((s, o) => s + (o.vote_count ?? 0), 0);
              const pct = totalVotes > 0 ? Math.round(((opt.vote_count ?? 0) / totalVotes) * 100) : 0;
              return (
                <div key={opt.id} className="relative rounded-[6px] border border-hairline bg-mist overflow-hidden">
                  <div className="absolute inset-y-0 left-0 bg-amber-100 transition-all" style={{ width: `${pct}%` }} />
                  <div className="relative flex items-center justify-between px-3 py-2">
                    <span className="text-[12px] text-ink">{opt.option_text}</span>
                    <span className="kicker text-faint tabular shrink-0 ml-2">{pct}%</span>
                  </div>
                </div>
              );
            })}
            <p className="kicker text-faint">
              {post.poll_options.reduce((s, o) => s + (o.vote_count ?? 0), 0).toLocaleString("en-IN")} votes
            </p>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-hairline">
          <span className="flex items-center gap-1.5 kicker text-faint tabular">
            <Heart className="h-3 w-3 text-red stroke-[1.6]" />
            {post.kudos_count ?? 0}
          </span>
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button size="sm" variant="ghost" onClick={() => onEdit(post)}
              className="h-7 px-2 text-[11px] font-medium text-slate hover:text-ink hover:bg-mist rounded-md">
              <Edit2 className="h-3 w-3 mr-1 stroke-[1.6]" />Edit
            </Button>
            <Button size="sm" variant="ghost" onClick={() => onDelete(post.id)}
              className="h-7 px-2 text-[11px] font-medium text-slate hover:text-red hover:bg-red-soft rounded-md">
              <Trash2 className="h-3 w-3 mr-1 stroke-[1.6]" />Delete
            </Button>
          </div>
        </div>
      </div>
    </article>
  );
}

/* Compose (Create) dialog */
function ComposeDialog({ open, onClose, onPublished }: {
  open: boolean; onClose: () => void; onPublished: (post: PostAPI) => void;
}) {
  const [postType, setPostType] = useState<PostType>("text");
  const [body, setBody] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [pollOptions, setPollOptions] = useState<string[]>(["", ""]);
  const [publishing, setPublishing] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const remaining = MAX_BODY - body.length;
  const overLimit = remaining < 0;
  const isEmpty = body.trim().length === 0;
  const pollValid = postType !== "poll" || pollOptions.filter((o) => o.trim()).length >= 2;

  function autoGrow() {
    const el = textareaRef.current;
    if (el) { el.style.height = "auto"; el.style.height = `${el.scrollHeight}px`; }
  }
  function handleClose() {
    setBody(""); setImageUrl(""); setVideoUrl(""); setPollOptions(["", ""]); setPostType("text");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
    onClose();
  }
  async function handlePublish() {
    if (isEmpty || overLimit || !pollValid) return;
    setPublishing(true);
    try {
      const payload: PostCreatePayload = {
        body: body.trim(), post_type: postType,
        ...(postType === "image" && imageUrl.trim() ? { image_url: imageUrl.trim() } : {}),
        ...(postType === "video" && videoUrl.trim() ? { video_url: videoUrl.trim() } : {}),
        ...(postType === "poll" ? { poll_options: pollOptions.filter((o) => o.trim()) } : {}),
      };
      const post = await api.posts.create(payload);
      toast.success("Post published to the feed.");
      onPublished(post); handleClose();
    } catch { toast.error("Failed to publish post."); }
    finally { setPublishing(false); }
  }
  function handleKeyDown(e: React.KeyboardEvent) {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") { e.preventDefault(); handlePublish(); }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="bg-paper border-hairline shadow-none rounded-[14px] max-w-lg w-full p-0 gap-0">
        <DialogHeader className="px-6 pt-6 pb-0">
          <span className="rule-red" /><p className="kicker text-faint mb-1">03 / posts · compose</p>
          <DialogTitle className="text-[22px] leading-[1.1] text-ink font-normal" style={{ fontFamily: "var(--font-instrument-serif), Georgia, serif" }}>New post</DialogTitle>
          <DialogDescription className="text-[12px] text-slate mt-0.5">Published immediately to the community feed.</DialogDescription>
        </DialogHeader>
        <div className="px-6 pt-4 pb-3 space-y-4">
          <div className="flex gap-1.5 flex-wrap">
            {(Object.entries(POST_TYPE_META) as [PostType, typeof POST_TYPE_META[PostType]][]).map(([type, { label, icon }]) => (
              <button key={type} onClick={() => setPostType(type)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] text-[11px] font-medium transition-colors ${postType === type ? "bg-ink text-paper" : "bg-mist text-slate hover:text-ink"}`}>
                {icon}{label}
              </button>
            ))}
          </div>
          <ComposerBody body={body} onChange={(e) => { setBody(e.target.value); autoGrow(); }} onKeyDown={handleKeyDown}
            placeholder={postType === "poll" ? "Poll question…" : "Share an idea worth spreading…"} textareaRef={textareaRef} />
          {postType === "image" && (
            <div>
              <label className="kicker text-slate mb-1.5 block">Image URL</label>
              <input type="url" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://example.com/image.jpg"
                className="w-full rounded-[8px] border border-hairline bg-mist/50 px-3 py-2 text-[13px] text-ink placeholder:text-faint outline-none focus:border-slate/40 focus:bg-paper transition-colors" />
              {imageUrl && (
                <div className="mt-2 relative h-32 rounded-[8px] overflow-hidden bg-mist border border-hairline">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={imageUrl} alt="Preview" className="w-full h-full object-cover"
                    onError={(e) => ((e.currentTarget as HTMLImageElement).style.display = "none")} />
                </div>
              )}
            </div>
          )}
          {postType === "video" && (
            <div>
              <label className="kicker text-slate mb-1.5 block">Video URL</label>
              <input type="url" value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} placeholder="https://youtube.com/watch?v=… or direct MP4"
                className="w-full rounded-[8px] border border-hairline bg-mist/50 px-3 py-2 text-[13px] text-ink placeholder:text-faint outline-none focus:border-slate/40 focus:bg-paper transition-colors" />
            </div>
          )}
          {postType === "poll" && (
            <PollOptionList options={pollOptions}
              onUpdate={(i, val) => setPollOptions((p) => p.map((o, idx) => idx === i ? val : o))}
              onAdd={() => setPollOptions((p) => [...p, ""])}
              onRemove={(i) => setPollOptions((p) => p.filter((_, idx) => idx !== i))} />
          )}
          {overLimit && (
            <p className="text-[11px] text-red flex items-center gap-1">
              <AlertTriangle className="h-3 w-3 stroke-[1.6] shrink-0" />Exceeds limit by {Math.abs(remaining).toLocaleString("en-IN")} characters.
            </p>
          )}
        </div>
        <DialogFooter className="px-6 pb-6 pt-2 gap-2 sm:gap-2">
          <Button variant="ghost" onClick={handleClose} disabled={publishing} className="text-[13px] text-slate hover:text-ink hover:bg-mist rounded-[8px]">Discard</Button>
          <Button onClick={handlePublish} disabled={isEmpty || overLimit || !pollValid || publishing}
            className="text-[13px] bg-red hover:bg-red/90 text-paper font-semibold rounded-[8px] min-w-[100px] disabled:opacity-40">
            {publishing ? <><Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />Publishing…</> : "Publish"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* Edit dialog */
function EditDialog({ post, onClose, onUpdated }: {
  post: PostAPI | null; onClose: () => void; onUpdated: (updated: PostAPI) => void;
}) {
  const [body, setBody] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [pollOptions, setPollOptions] = useState<string[]>(["", ""]);
  const [saving, setSaving] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!post) return;
    setBody(post.body);
    setImageUrl(post.image_url ?? "");
    setVideoUrl(post.video_url ?? "");
    setPollOptions(post.poll_options?.length ? post.poll_options.map((o) => o.option_text) : ["", ""]);
    requestAnimationFrame(() => {
      const el = textareaRef.current;
      if (el) { el.style.height = "auto"; el.style.height = `${el.scrollHeight}px`; }
    });
  }, [post]);

  const remaining = MAX_BODY - body.length;
  const overLimit = remaining < 0;
  const isEmpty = body.trim().length === 0;
  const pollValid = post?.post_type !== "poll" || pollOptions.filter((o) => o.trim()).length >= 2;
  const meta = post ? POST_TYPE_META[post.post_type ?? "text"] : null;

  function autoGrow() {
    const el = textareaRef.current;
    if (el) { el.style.height = "auto"; el.style.height = `${el.scrollHeight}px`; }
  }
  async function handleSave() {
    if (!post || isEmpty || overLimit || !pollValid) return;
    setSaving(true);
    try {
      const payload: PostUpdatePayload = {
        body: body.trim(),
        ...(post.post_type === "image" && imageUrl.trim() ? { image_url: imageUrl.trim() } : {}),
        ...(post.post_type === "video" && videoUrl.trim() ? { video_url: videoUrl.trim() } : {}),
        ...(post.post_type === "poll" ? { poll_options: pollOptions.filter((o) => o.trim()) } : {}),
      };
      const updated = await api.posts.update(post.id, payload);
      toast.success("Post updated."); onUpdated(updated); onClose();
    } catch { toast.error("Failed to update post."); }
    finally { setSaving(false); }
  }
  function handleKeyDown(e: React.KeyboardEvent) {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") { e.preventDefault(); handleSave(); }
  }

  return (
    <Dialog open={!!post} onOpenChange={onClose}>
      <DialogContent className="bg-paper border-hairline shadow-none rounded-[14px] max-w-lg w-full p-0 gap-0">
        <DialogHeader className="px-6 pt-6 pb-0">
          <span className="rule-red" /><p className="kicker text-faint mb-1">03 / posts · edit</p>
          <div className="flex items-center gap-3">
            <DialogTitle className="text-[22px] leading-[1.1] text-ink font-normal" style={{ fontFamily: "var(--font-instrument-serif), Georgia, serif" }}>Edit post</DialogTitle>
            {meta && (
              <span className={`flex items-center gap-1.5 kicker text-paper rounded-[4px] px-2 py-0.5 ${meta.accent}`}>
                {meta.icon}{meta.label}
              </span>
            )}
          </div>
          <DialogDescription className="text-[12px] text-slate mt-0.5">Edits go live immediately. Post type cannot be changed.</DialogDescription>
        </DialogHeader>
        <div className="px-6 pt-4 pb-3 space-y-4">
          <ComposerBody body={body} onChange={(e) => { setBody(e.target.value); autoGrow(); }} onKeyDown={handleKeyDown}
            placeholder={post?.post_type === "poll" ? "Poll question…" : "Share an idea worth spreading…"} textareaRef={textareaRef} />
          {post?.post_type === "image" && (
            <div>
              <label className="kicker text-slate mb-1.5 block">Image URL</label>
              <input type="url" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://example.com/image.jpg"
                className="w-full rounded-[8px] border border-hairline bg-mist/50 px-3 py-2 text-[13px] text-ink placeholder:text-faint outline-none focus:border-slate/40 focus:bg-paper transition-colors" />
              {imageUrl && (
                <div className="mt-2 relative h-32 rounded-[8px] overflow-hidden bg-mist border border-hairline">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={imageUrl} alt="Preview" className="w-full h-full object-cover"
                    onError={(e) => ((e.currentTarget as HTMLImageElement).style.display = "none")} />
                </div>
              )}
            </div>
          )}
          {post?.post_type === "video" && (
            <div>
              <label className="kicker text-slate mb-1.5 block">Video URL</label>
              <input type="url" value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} placeholder="https://youtube.com/watch?v=… or direct MP4"
                className="w-full rounded-[8px] border border-hairline bg-mist/50 px-3 py-2 text-[13px] text-ink placeholder:text-faint outline-none focus:border-slate/40 focus:bg-paper transition-colors" />
            </div>
          )}
          {post?.post_type === "poll" && (
            <PollOptionList options={pollOptions}
              onUpdate={(i, val) => setPollOptions((p) => p.map((o, idx) => idx === i ? val : o))}
              onAdd={() => setPollOptions((p) => [...p, ""])}
              onRemove={(i) => setPollOptions((p) => p.filter((_, idx) => idx !== i))} />
          )}
          {overLimit && (
            <p className="text-[11px] text-red flex items-center gap-1">
              <AlertTriangle className="h-3 w-3 stroke-[1.6] shrink-0" />Exceeds limit by {Math.abs(remaining).toLocaleString("en-IN")} characters.
            </p>
          )}
        </div>
        <DialogFooter className="px-6 pb-6 pt-2 gap-2 sm:gap-2">
          <Button variant="ghost" onClick={onClose} disabled={saving} className="text-[13px] text-slate hover:text-ink hover:bg-mist rounded-[8px]">Discard</Button>
          <Button onClick={handleSave} disabled={isEmpty || overLimit || !pollValid || saving}
            className="text-[13px] bg-ink hover:bg-ink/90 text-paper font-semibold rounded-[8px] min-w-[100px] disabled:opacity-40">
            {saving ? <><Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />Saving…</> : "Save changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* Page */
export default function PostsPage() {
  const [posts, setPosts] = useState<PostAPI[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [composing, setComposing] = useState(false);
  const [editPost, setEditPost] = useState<PostAPI | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.posts.list({ page, limit: 12, search: debouncedSearch.trim() || undefined });
      setPosts(res.items); setTotal(res.total);
    } catch { toast.error("Failed to load posts."); }
    finally { setLoading(false); }
  }, [page, debouncedSearch]);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  function handlePublished(post: PostAPI) { setPosts((prev) => [post, ...prev.slice(0, 11)]); setTotal((t) => t + 1); }
  function handleUpdated(updated: PostAPI) { setPosts((prev) => prev.map((p) => p.id === updated.id ? updated : p)); }

  async function handleDelete() {
    if (!confirmId) return;
    setDeleting(true);
    try {
      await api.posts.delete(confirmId);
      setPosts((prev) => prev.filter((p) => p.id !== confirmId)); setTotal((t) => t - 1);
      toast.success("Post permanently deleted.");
    } catch { toast.error("Deletion failed."); }
    finally { setConfirmId(null); setDeleting(false); }
  }

  const totalPages = Math.ceil(total / 12);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-start justify-between gap-4">
        <div>
          <span className="rule-red" />
          <p className="kicker text-faint mb-1.5">03 / posts</p>
          <h1 className="text-[28px] leading-[1.0] tracking-[-0.6px] text-ink" style={{ fontFamily: "var(--font-instrument-serif), Georgia, serif" }}>Post Moderation</h1>
          <p className="text-[13px] text-slate mt-1">Review, edit, remove or publish content to the community feed.</p>
        </div>
        <div className="flex items-center gap-2 mt-1 shrink-0">
          <Button variant="ghost" size="sm" onClick={fetchPosts} disabled={loading}
            className="h-8 px-3 text-[12px] text-slate hover:text-ink hover:bg-mist rounded-[6px]">
            <RefreshCw className={`h-3.5 w-3.5 mr-1.5 stroke-[1.6] ${loading ? "animate-spin" : ""}`} />Refresh
          </Button>
          <Button onClick={() => setComposing(true)} className="h-8 px-4 text-[12px] font-semibold bg-red hover:bg-red/90 text-paper rounded-[8px]">
            <Pencil className="h-3.5 w-3.5 mr-1.5 stroke-[2]" />New Post
          </Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-faint stroke-[1.6]" />
          <Input
            placeholder="Search posts…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 bg-mist border-transparent rounded-[8px] text-[13px] text-ink placeholder:text-faint focus:border-hairline focus:bg-paper w-full animate-in fade-in duration-200"
          />
        </div>
        {!loading && total > 0 && (
          <div className="flex items-center gap-2 ml-auto kicker text-faint">
            <span>{total.toLocaleString("en-IN")} posts</span>
            {totalPages > 1 && <><span>·</span><span>page {page} of {totalPages}</span></>}
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64"><Loader2 className="h-5 w-5 animate-spin text-faint" /></div>
      ) : posts.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 gap-3 rounded-[10px] border border-dashed border-hairline bg-paper">
          <MessageCircle className="h-6 w-6 text-faint stroke-[1.4]" />
          <p className="kicker text-faint">No posts yet.</p>
          <Button size="sm" onClick={() => setComposing(true)} className="h-7 px-3 text-[11px] font-semibold bg-red hover:bg-red/90 text-paper rounded-[6px]">
            Publish the first one
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
          {posts.map((post) => <PostCard key={post.id} post={post} onEdit={setEditPost} onDelete={setConfirmId} />)}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="kicker text-faint">Page {page} of {totalPages}</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1 || loading} onClick={() => setPage((p) => p - 1)}
              className="h-8 text-[12px] border-hairline text-slate hover:text-ink hover:bg-mist rounded-[6px]">Previous</Button>
            <Button variant="outline" size="sm" disabled={page >= totalPages || loading} onClick={() => setPage((p) => p + 1)}
              className="h-8 text-[12px] border-hairline text-slate hover:text-ink hover:bg-mist rounded-[6px]">Next</Button>
          </div>
        </div>
      )}

      <ComposeDialog open={composing} onClose={() => setComposing(false)} onPublished={handlePublished} />
      <EditDialog post={editPost} onClose={() => setEditPost(null)} onUpdated={handleUpdated} />

      <Dialog open={!!confirmId} onOpenChange={() => setConfirmId(null)}>
        <DialogContent className="bg-paper border-hairline shadow-none max-w-sm rounded-[14px]">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-1">
              <div className="flex h-9 w-9 items-center justify-center rounded-[8px] bg-red-soft shrink-0">
                <AlertTriangle className="h-4 w-4 text-red stroke-[1.6]" />
              </div>
              <DialogTitle className="text-[17px] font-semibold text-ink">Delete this post?</DialogTitle>
            </div>
            <DialogDescription className="text-[13px] text-slate leading-relaxed">This action is permanent and cannot be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-2">
            <Button variant="ghost" onClick={() => setConfirmId(null)} className="text-[13px] text-slate hover:text-ink hover:bg-mist rounded-[8px]">Cancel</Button>
            <Button onClick={handleDelete} disabled={deleting} className="text-[13px] bg-red hover:bg-red/90 text-paper font-semibold rounded-[8px]">
              {deleting ? <><Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />Deleting…</> : "Delete permanently"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
