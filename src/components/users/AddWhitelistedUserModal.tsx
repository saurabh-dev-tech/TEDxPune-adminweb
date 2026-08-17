"use client";

import { useState } from "react";
import { UserPlus, Loader2, ShieldCheck, ArrowLeft } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { toast } from "sonner";

interface AddWhitelistedUserModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function AddWhitelistedUserModal({
  open,
  onOpenChange,
  onSuccess,
}: AddWhitelistedUserModalProps) {
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [notes, setNotes] = useState("");
  const [step, setStep] = useState<"input" | "confirm">("input");
  const [loading, setLoading] = useState(false);

  function resetForm() {
    setEmail("");
    setFullName("");
    setNotes("");
    setStep("input");
    setLoading(false);
  }

  function handleFormSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      toast.error("Please enter a valid email address.");
      return;
    }
    setStep("confirm");
  }

  async function handleConfirmAdd() {
    const trimmedEmail = email.trim();
    setLoading(true);
    try {
      await api.whitelistedUsers.add({
        email: trimmedEmail,
        full_name: fullName.trim() || undefined,
        notes: notes.trim() || undefined,
      });
      toast.success(`${trimmedEmail} added to whitelisted users.`);
      resetForm();
      onOpenChange(false);
      onSuccess();
    } catch {
      toast.error("Failed to add whitelisted user.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(val) => {
        if (!val) resetForm();
        onOpenChange(val);
      }}
    >
      <DialogContent className="sm:max-w-md bg-paper border border-hairline p-6 rounded-[12px] shadow-xl">
        {step === "input" ? (
          <>
            <DialogHeader className="mb-4">
              <div className="flex items-center gap-2 mb-1">
                <div className="p-2 rounded-md bg-mist text-ink">
                  <UserPlus className="h-4 w-4 stroke-[1.8]" />
                </div>
                <DialogTitle className="text-lg font-semibold text-ink">
                  Add Whitelisted Email
                </DialogTitle>
              </div>
              <DialogDescription className="text-[13px] text-slate">
                When a user with this email signs up or logs in on the TEDxPune app, they will automatically be granted access.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[12px] font-medium text-ink">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <Input
                  type="email"
                  placeholder="e.g. member@tedxpune.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="bg-mist border-transparent focus:bg-paper focus:border-hairline rounded-[8px] text-[13px]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[12px] font-medium text-ink">
                  Full Name <span className="text-slate/60">(Optional)</span>
                </label>
                <Input
                  type="text"
                  placeholder="e.g. Rahul Sharma"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="bg-mist border-transparent focus:bg-paper focus:border-hairline rounded-[8px] text-[13px]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[12px] font-medium text-ink">
                  Notes / Category <span className="text-slate/60">(Optional)</span>
                </label>
                <Input
                  type="text"
                  placeholder="e.g. VIP Attendee, Speaker, Volunteer"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="bg-mist border-transparent focus:bg-paper focus:border-hairline rounded-[8px] text-[13px]"
                />
              </div>

              <DialogFooter className="mt-6 flex gap-2 justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  className="h-9 text-[13px] border-hairline rounded-[8px]"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="h-9 text-[13px] bg-ink text-paper hover:bg-ink/90 rounded-[8px] px-4 font-medium"
                >
                  Continue
                </Button>
              </DialogFooter>
            </form>
          </>
        ) : (
          /* Step 2: Confirmation Modal View */
          <div className="space-y-4">
            <DialogHeader>
              <div className="flex items-center gap-2 mb-1">
                <div className="p-2 rounded-md bg-green-50 text-green-600">
                  <ShieldCheck className="h-5 w-5 stroke-[1.8]" />
                </div>
                <DialogTitle className="text-lg font-semibold text-ink">
                  Confirm Whitelist User
                </DialogTitle>
              </div>
              <DialogDescription className="text-[13px] text-slate">
                Please double-check the details below before adding this user to the whitelist.
              </DialogDescription>
            </DialogHeader>

            <div className="p-4 rounded-[10px] bg-mist/60 border border-hairline space-y-2.5 text-[13px]">
              <div className="flex justify-between items-center pb-2 border-b border-hairline/60">
                <span className="text-slate font-medium">Email:</span>
                <span className="font-mono font-semibold text-ink">{email}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-hairline/60">
                <span className="text-slate font-medium">Full Name:</span>
                <span className="font-semibold text-ink">{fullName.trim() || "—"}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate font-medium">Category / Notes:</span>
                <span className="text-slate">{notes.trim() || "—"}</span>
              </div>
            </div>

            <DialogFooter className="mt-6 flex gap-2 justify-end pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep("input")}
                disabled={loading}
                className="h-9 text-[13px] border-hairline rounded-[8px]"
              >
                <ArrowLeft className="h-3.5 w-3.5 mr-1" /> Back
              </Button>
              <Button
                type="button"
                onClick={handleConfirmAdd}
                disabled={loading}
                className="h-9 text-[13px] bg-green-600 text-paper hover:bg-green-700 rounded-[8px] px-4 font-semibold"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                    Adding…
                  </>
                ) : (
                  "Confirm & Whitelist"
                )}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

