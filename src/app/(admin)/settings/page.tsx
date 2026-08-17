"use client";

import { useState } from "react";
import { Camera, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { api } from "@/lib/api";

/* Deterministic avatar palette */
const AVATAR_PALETTE = [
  "#0F172A","#7C2D12","#1E3A8A","#14532D",
  "#581C87","#78350F","#831843","#164E63",
];
function avatarColor(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return AVATAR_PALETTE[h % AVATAR_PALETTE.length];
}

export default function SettingsPage() {
  const { authUser, updateUserProfile } = useAuth();
  const [uploading, setUploading] = useState(false);

  if (!authUser) return null;

  const initials = authUser.fullName
    .split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

  const roleBadge = authUser.role === "SUPER_ADMIN"
    ? "role-badge role-speaker"   /* red */
    : "role-badge role-organizer"; /* ink */

  async function handleAvatarUpload(file: File) {
    if (!file) return;
    setUploading(true);
    try {
      toast.info("Uploading new profile picture...");
      const newAvatarUrl = await uploadToCloudinary(file, "avatars");
      
      // Call API to persist avatar_url
      await api.users.updateProfile(authUser!.sub, { avatar_url: newAvatarUrl });
      
      // Update local AuthContext state & localStorage
      updateUserProfile({ avatarUrl: newAvatarUrl });
      toast.success("Profile picture updated successfully!");
    } catch {
      toast.error("Failed to update profile picture.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-6 max-w-xl mx-auto">

      {/* Heading */}
      <div>
        <span className="rule-red" />
        <p className="kicker text-faint mb-1.5">04 / settings</p>
        <h1
          className="text-[28px] leading-[1.0] tracking-[-0.6px] text-ink"
          style={{ fontFamily: "var(--font-instrument-serif), Georgia, serif" }}
        >
          Account
        </h1>
      </div>

      {/* Profile card */}
      <div className="rounded-[10px] border border-hairline bg-paper overflow-hidden">
        {/* Dark banner */}
        <div className="h-20 bg-ink relative" />

        {/* Avatar overlap & edit button */}
        <div className="px-6 pb-6">
          <div className="-mt-8 mb-4 flex items-end gap-3">
            <div className="relative group">
              <Avatar className="h-16 w-16 border-[3px] border-paper ring-2 ring-red">
                <AvatarImage src={authUser.avatarUrl ?? undefined} />
                <AvatarFallback
                  className="text-base font-bold text-paper"
                  style={{ background: avatarColor(authUser.fullName) }}
                >
                  {initials}
                </AvatarFallback>
              </Avatar>

              {/* Upload overlay button */}
              <label
                className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
                title="Change profile picture"
              >
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  disabled={uploading}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleAvatarUpload(file);
                  }}
                />
                {uploading ? (
                  <Loader2 className="h-4 w-4 animate-spin text-white" />
                ) : (
                  <Camera className="h-4 w-4 text-white" />
                )}
              </label>
            </div>

            {/* Change Picture Button */}
            <label className="cursor-pointer">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                disabled={uploading}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleAvatarUpload(file);
                }}
              />
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] border border-hairline bg-mist text-[12px] font-medium text-ink hover:bg-mist/80 transition-colors">
                {uploading ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" /> Uploading…
                  </>
                ) : (
                  <>
                    <Camera className="h-3.5 w-3.5" /> Change Photo
                  </>
                )}
              </span>
            </label>
          </div>

          <div className="flex items-start justify-between">
            <div>
              <h2
                className="text-[22px] leading-[1.1] text-ink"
                style={{ fontFamily: "var(--font-instrument-serif), Georgia, serif" }}
              >
                {authUser.fullName}
              </h2>
              <p className="text-[13px] text-slate mt-0.5">{authUser.email}</p>
            </div>
            <span className={roleBadge}>{authUser.role.replace("_", " ")}</span>
          </div>
        </div>

        {/* Details rows */}
        <div className="border-t border-hairline divide-y divide-hairline">
          {[
            { label: "Tenant ID",        value: authUser.tenantId },
            { label: "User ID",          value: authUser.sub      },
            {
              label: "Session expires",
              value: new Date(authUser.exp * 1000).toLocaleString("en-IN"),
            },
          ].map(({ label, value }) => (
            <div key={label} className="flex items-center justify-between px-6 py-3">
              <p className="kicker text-faint">{label}</p>
              <p className="text-[12px] text-slate font-mono tabular truncate max-w-[240px]">
                {value}
              </p>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
