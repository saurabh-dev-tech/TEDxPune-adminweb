"use client";

import { useState, useRef } from "react";
import { UploadCloud, FileText, CheckCircle2, AlertCircle, Loader2, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { api } from "@/lib/api";
import { toast } from "sonner";

interface ParsedRow {
  email: string;
  full_name?: string;
  notes?: string;
  status: "valid" | "duplicate" | "invalid";
}

interface UploadWhitelistModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function UploadWhitelistModal({
  open,
  onOpenChange,
  onSuccess,
}: UploadWhitelistModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function resetState() {
    setFile(null);
    setParsedRows([]);
    setLoading(false);
  }

  function handleFileChange(selectedFile: File | null) {
    if (!selectedFile) return;
    setFile(selectedFile);

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (!text) return;

      const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
      const rows: ParsedRow[] = [];
      const seenEmails = new Set<string>();

      lines.forEach((line) => {
        // Handle CSV / TSV or raw text lines
        const parts = line.split(/[,;\t]/).map((p) => p.trim().replace(/^["']|["']$/g, ""));
        let foundEmail = "";
        let fullName = "";
        let notes = "";

        // Find part matching email format
        for (let i = 0; i < parts.length; i++) {
          if (EMAIL_REGEX.test(parts[i])) {
            foundEmail = parts[i].toLowerCase();
            // standard order: Name, Email, Notes or Email, Name, Notes
            if (i > 0) fullName = parts[0];
            else if (parts.length > 1) fullName = parts[1];
            if (parts.length > 2) notes = parts[parts.length - 1];
            break;
          }
        }

        // If no email found in parts, check if whole line has emails via regex
        if (!foundEmail) {
          const matches = line.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g);
          if (matches && matches.length > 0) {
            foundEmail = matches[0].toLowerCase();
          }
        }

        if (!foundEmail) {
          rows.push({
            email: parts[0] || line.slice(0, 30),
            status: "invalid",
          });
        } else if (seenEmails.has(foundEmail)) {
          rows.push({
            email: foundEmail,
            full_name: fullName || undefined,
            notes: notes || undefined,
            status: "duplicate",
          });
        } else {
          seenEmails.add(foundEmail);
          rows.push({
            email: foundEmail,
            full_name: fullName || undefined,
            notes: notes || undefined,
            status: "valid",
          });
        }
      });

      setParsedRows(rows);
    };

    reader.readAsText(selectedFile);
  }

  const validRows = parsedRows.filter((r) => r.status === "valid");
  const invalidCount = parsedRows.filter((r) => r.status === "invalid").length;
  const duplicateCount = parsedRows.filter((r) => r.status === "duplicate").length;

  async function handleImport() {
    if (validRows.length === 0) {
      toast.error("No valid emails to import.");
      return;
    }

    setLoading(true);
    try {
      const payload = validRows.map((r) => ({
        email: r.email,
        full_name: r.full_name,
        notes: r.notes || (file ? `Imported from ${file.name}` : undefined),
      }));

      const res = await api.whitelistedUsers.bulkAdd(payload);
      toast.success(
        `Successfully added ${res.added ?? validRows.length} whitelisted emails.`
      );
      onOpenChange(false);
      resetState();
      onSuccess();
    } catch {
      toast.error("Failed to import whitelisted emails.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(val) => {
        if (!val) resetState();
        onOpenChange(val);
      }}
    >
      <DialogContent className="sm:max-w-xl bg-paper border border-hairline p-6 rounded-[12px] shadow-xl max-h-[90vh] flex flex-col">
        <DialogHeader className="mb-2 shrink-0">
          <div className="flex items-center gap-2 mb-1">
            <div className="p-2 rounded-md bg-mist text-ink">
              <UploadCloud className="h-4 w-4 stroke-[1.8]" />
            </div>
            <DialogTitle className="text-lg font-semibold text-ink">
              Import Whitelist File
            </DialogTitle>
          </div>
          <DialogDescription className="text-[13px] text-slate">
            Upload a CSV, TSV, or TXT file with user emails. Emails will be automatically extracted and validated.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          {!file ? (
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragActive(true);
              }}
              onDragLeave={() => setDragActive(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragActive(false);
                if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                  handleFileChange(e.dataTransfer.files[0]);
                }
              }}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-[10px] p-8 text-center cursor-pointer transition-colors ${
                dragActive
                  ? "border-ink bg-mist/60"
                  : "border-hairline hover:border-slate/40 bg-mist/30"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.txt,.tsv"
                className="hidden"
                onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
              />
              <UploadCloud className="h-8 w-8 text-slate mx-auto mb-2 stroke-[1.4]" />
              <p className="text-[14px] font-medium text-ink">
                Click to upload or drag & drop file
              </p>
              <p className="text-[12px] text-slate mt-1">
                Supports CSV, TSV, TXT (up to 500 rows)
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* File Info Bar */}
              <div className="flex items-center justify-between p-3 bg-mist rounded-[8px] border border-hairline">
                <div className="flex items-center gap-2 min-w-0">
                  <FileText className="h-4 w-4 text-ink shrink-0" />
                  <span className="text-[13px] font-medium text-ink truncate">
                    {file.name}
                  </span>
                  <span className="text-[11px] text-slate">
                    ({(file.size / 1024).toFixed(1)} KB)
                  </span>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={resetState}
                  className="h-7 w-7 p-0 rounded-full text-slate hover:text-ink"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Extraction Summary */}
              <div className="grid grid-cols-3 gap-2">
                <div className="p-2.5 rounded-[8px] bg-green-50 border border-green-200 text-center">
                  <span className="text-[18px] font-bold text-green-700 block">
                    {validRows.length}
                  </span>
                  <span className="text-[11px] font-medium text-green-600">
                    Valid Emails
                  </span>
                </div>
                <div className="p-2.5 rounded-[8px] bg-amber-50 border border-amber-200 text-center">
                  <span className="text-[18px] font-bold text-amber-700 block">
                    {duplicateCount}
                  </span>
                  <span className="text-[11px] font-medium text-amber-600">
                    Duplicates Skipped
                  </span>
                </div>
                <div className="p-2.5 rounded-[8px] bg-red-50 border border-red-200 text-center">
                  <span className="text-[18px] font-bold text-red-700 block">
                    {invalidCount}
                  </span>
                  <span className="text-[11px] font-medium text-red-600">
                    Invalid Rows
                  </span>
                </div>
              </div>

              {/* Preview Table */}
              <div className="rounded-[8px] border border-hairline overflow-hidden max-h-48 overflow-y-auto">
                <Table>
                  <TableHeader className="sticky top-0 bg-mist">
                    <TableRow className="border-hairline">
                      <TableHead className="py-2 text-[11px] kicker text-faint">
                        Email / Content
                      </TableHead>
                      <TableHead className="py-2 text-[11px] kicker text-faint">
                        Name
                      </TableHead>
                      <TableHead className="py-2 text-[11px] kicker text-faint text-right">
                        Status
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {parsedRows.slice(0, 50).map((r, i) => (
                      <TableRow key={i} className="border-hairline text-[12px]">
                        <TableCell className="py-2 font-mono text-ink truncate max-w-[200px]">
                          {r.email}
                        </TableCell>
                        <TableCell className="py-2 text-slate truncate max-w-[120px]">
                          {r.full_name || "—"}
                        </TableCell>
                        <TableCell className="py-2 text-right">
                          {r.status === "valid" && (
                            <span className="inline-flex items-center text-[11px] font-medium text-green-600">
                              <CheckCircle2 className="h-3 w-3 mr-1" /> Valid
                            </span>
                          )}
                          {r.status === "duplicate" && (
                            <span className="inline-flex items-center text-[11px] font-medium text-amber-600">
                              <AlertCircle className="h-3 w-3 mr-1" /> Duplicate
                            </span>
                          )}
                          {r.status === "invalid" && (
                            <span className="inline-flex items-center text-[11px] font-medium text-red-600">
                              <AlertCircle className="h-3 w-3 mr-1" /> Invalid
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="mt-4 shrink-0 flex gap-2 justify-end pt-3 border-t border-hairline">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
            className="h-9 text-[13px] border-hairline rounded-[8px]"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleImport}
            disabled={loading || validRows.length === 0}
            className="h-9 text-[13px] bg-ink text-paper hover:bg-ink/90 rounded-[8px] px-4"
          >
            {loading ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                Importing…
              </>
            ) : (
              `Whitelist ${validRows.length} Emails`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
