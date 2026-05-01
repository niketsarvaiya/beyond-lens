"use client";

import { useState, useRef, useCallback } from "react";
import { useLensStore } from "@/store/lens-store";
import { CAMPAIGNS, PLATFORMS } from "@/lib/constants";
import type { Campaign, Platform, Video, VideoVersion } from "@/types";
import { cn } from "@/lib/utils";
import { Upload, X, CheckCircle2, AlertCircle, Loader2, CloudUpload, File, Link2 } from "lucide-react";

interface UploadPanelProps {
  onSuccess?: (video: Video) => void;
  existingVideo?: Video;
}

type UploadPhase = "idle" | "uploading" | "finalising" | "done" | "error";
type InputMode   = "file" | "link";

function formatBytes(bytes: number) {
  if (bytes < 1e6) return `${(bytes / 1e3).toFixed(0)} KB`;
  return `${(bytes / 1e6).toFixed(1)} MB`;
}

function thumbnailFromUrl(url: string): string {
  // YouTube
  const yt = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|shorts\/))([A-Za-z0-9_-]{11})/);
  if (yt) return `https://img.youtube.com/vi/${yt[1]}/hqdefault.jpg`;
  // Google Drive
  const gd = url.match(/\/file\/d\/([A-Za-z0-9_-]+)/);
  if (gd) return `https://drive.google.com/thumbnail?id=${gd[1]}&sz=w640`;
  return "";
}

export function UploadPanel({ onSuccess, existingVideo }: UploadPanelProps) {
  const [mode,      setMode]      = useState<InputMode>("file");
  const [file,      setFile]      = useState<File | null>(null);
  const [link,      setLink]      = useState("");
  const [name,      setName]      = useState(existingVideo?.name ?? "");
  const [campaign,  setCampaign]  = useState<Campaign>(existingVideo?.campaign ?? "Beyond Series");
  const [platform,  setPlatform]  = useState<Platform>(existingVideo?.platform ?? "Instagram");
  const [project,   setProject]   = useState(existingVideo?.project ?? "");
  const [goLive,    setGoLive]    = useState(existingVideo?.goLiveDate ?? "");
  const [phase,     setPhase]     = useState<UploadPhase>("idle");
  const [progress,  setProgress]  = useState(0);
  const [error,     setError]     = useState("");
  const [dragging,  setDragging]  = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const currentUserId = useLensStore((s) => s.currentUserId);
  const videos        = useLensStore((s) => s.videos);
  const setVideos     = useLensStore((s) => s.setVideos);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped && dropped.type.startsWith("video/")) setFile(dropped);
  }, []);

  const canSubmit =
    phase === "idle" &&
    name.trim() !== "" &&
    (mode === "file" ? file !== null : link.trim() !== "");

  // ── Link-mode submit (no upload, just store the URL) ──────────────────────
  const handleLinkSubmit = () => {
    if (!name.trim() || !link.trim()) return;
    setError("");

    const version      = existingVideo ? existingVideo.currentVersion + 1 : 1;
    const driveUrl     = link.trim();
    const thumbnailUrl = thumbnailFromUrl(driveUrl);

    const newVersion: VideoVersion = {
      id:          `v_${Date.now()}`,
      version,
      driveUrl,
      thumbnailUrl,
      uploadedBy:  currentUserId,
      uploadedAt:  new Date().toISOString(),
      sizeBytes:   0,
    };

    if (existingVideo) {
      const updated = videos.map((v) =>
        v.id === existingVideo.id
          ? {
              ...v,
              currentVersion: version,
              status: "uploaded" as const,
              thumbnailUrl: thumbnailUrl || v.thumbnailUrl,
              updatedAt: new Date().toISOString(),
              versions: [...v.versions, newVersion],
            }
          : v
      );
      setVideos(updated);
      onSuccess?.(updated.find((v) => v.id === existingVideo.id)!);
    } else {
      const newVideo: Video = {
        id:             `vid_${Date.now()}`,
        name:           name.trim(),
        campaign,
        platform,
        project:        project.trim() || undefined,
        status:         "uploaded",
        goLiveDate:     goLive || undefined,
        uploadedBy:     currentUserId,
        createdAt:      new Date().toISOString(),
        updatedAt:      new Date().toISOString(),
        currentVersion: 1,
        thumbnailUrl,
        versions:       [newVersion],
      };
      setVideos([...videos, newVideo]);
      onSuccess?.(newVideo);
    }

    setPhase("done");
  };

  // ── File-mode submit (Drive resumable upload) ──────────────────────────────
  const handleFileUpload = async () => {
    if (!file || !name.trim()) return;
    setPhase("uploading");
    setProgress(0);
    setError("");

    try {
      const version = existingVideo ? existingVideo.currentVersion + 1 : 1;

      const initRes = await fetch("/api/upload/init", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: file.name,
          mimeType: file.type,
          sizeBytes: file.size,
          campaign,
          videoName: name.trim(),
          version,
        }),
      });

      if (!initRes.ok) {
        const err = await initRes.json();
        throw new Error(err.error ?? "Failed to initialise upload");
      }

      const { uploadUrl, fileId } = await initRes.json();
      await uploadWithProgress(uploadUrl, file, setProgress);

      setPhase("finalising");
      const completeRes = await fetch("/api/upload/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileId }),
      });

      if (!completeRes.ok) throw new Error("Failed to finalise upload");
      const { driveUrl, thumbnailUrl } = await completeRes.json();

      const newVersion: VideoVersion = {
        id:          `v_${Date.now()}`,
        version,
        driveUrl,
        thumbnailUrl,
        uploadedBy:  currentUserId,
        uploadedAt:  new Date().toISOString(),
        sizeBytes:   file.size,
      };

      if (existingVideo) {
        const updated = videos.map((v) =>
          v.id === existingVideo.id
            ? {
                ...v,
                currentVersion: version,
                status: "uploaded" as const,
                thumbnailUrl: thumbnailUrl || v.thumbnailUrl,
                updatedAt: new Date().toISOString(),
                versions: [...v.versions, newVersion],
              }
            : v
        );
        setVideos(updated);
        onSuccess?.(updated.find((v) => v.id === existingVideo.id)!);
      } else {
        const newVideo: Video = {
          id:             `vid_${Date.now()}`,
          name:           name.trim(),
          campaign,
          platform,
          project:        project.trim() || undefined,
          status:         "uploaded",
          goLiveDate:     goLive || undefined,
          uploadedBy:     currentUserId,
          createdAt:      new Date().toISOString(),
          updatedAt:      new Date().toISOString(),
          currentVersion: 1,
          thumbnailUrl,
          versions:       [newVersion],
        };
        setVideos([...videos, newVideo]);
        onSuccess?.(newVideo);
      }

      setPhase("done");
    } catch (err: any) {
      console.error(err);
      setError(err.message ?? "Upload failed");
      setPhase("error");
    }
  };

  // ── Done state ─────────────────────────────────────────────────────────────
  if (phase === "done") {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center gap-3">
        <CheckCircle2 size={40} className="text-emerald-400" />
        <p className="text-sm font-medium text-zinc-200">
          {mode === "link" ? "Video link added" : existingVideo ? "New version uploaded" : "Video uploaded to Google Drive"}
        </p>
        <p className="text-xs text-zinc-500">AI review will start shortly</p>
        <button
          onClick={() => { setPhase("idle"); setFile(null); setLink(""); setProgress(0); }}
          className="text-xs text-violet-400 hover:text-violet-300 transition-colors mt-2"
        >
          Add another
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Mode tabs */}
      <div className="flex gap-1 bg-[#111113] border border-white/[0.07] rounded-lg p-1 w-fit">
        <button
          onClick={() => { setMode("file"); setError(""); }}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors",
            mode === "file" ? "bg-zinc-700 text-zinc-100" : "text-zinc-500 hover:text-zinc-300"
          )}
        >
          <CloudUpload size={12} />
          Upload File
        </button>
        <button
          onClick={() => { setMode("link"); setError(""); }}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors",
            mode === "link" ? "bg-zinc-700 text-zinc-100" : "text-zinc-500 hover:text-zinc-300"
          )}
        >
          <Link2 size={12} />
          Paste Link
        </button>
      </div>

      {/* File drop zone */}
      {mode === "file" && (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={cn(
            "border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center gap-3 cursor-pointer transition-colors",
            dragging ? "border-violet-500 bg-violet-950/20" : "border-white/[0.12] hover:border-white/[0.2] bg-[#18181b]",
            file && "border-violet-600/50 bg-violet-950/10"
          )}
        >
          <input
            ref={inputRef}
            type="file"
            accept="video/*"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && setFile(e.target.files[0])}
          />
          {file ? (
            <div className="flex items-center gap-3 w-full">
              <File size={28} className="text-violet-400 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-zinc-200 truncate">{file.name}</p>
                <p className="text-xs text-zinc-500">{formatBytes(file.size)}</p>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); setFile(null); }}
                className="text-zinc-600 hover:text-zinc-300 transition-colors"
              >
                <X size={16} />
              </button>
            </div>
          ) : (
            <>
              <CloudUpload size={32} className="text-zinc-600" />
              <div className="text-center">
                <p className="text-sm text-zinc-300">Drop your video here</p>
                <p className="text-xs text-zinc-600 mt-0.5">or click to browse · MP4, MOV, WebM</p>
              </div>
            </>
          )}
        </div>
      )}

      {/* Link input */}
      {mode === "link" && (
        <div>
          <label className="block text-xs text-zinc-500 mb-1.5">Video URL</label>
          <input
            value={link}
            onChange={(e) => setLink(e.target.value)}
            placeholder="Paste a Google Drive, YouTube, or any video link…"
            className="w-full bg-[#111113] border border-white/[0.07] rounded-lg px-3 py-2.5 text-sm text-zinc-200 placeholder-zinc-600 outline-none focus:border-violet-600/50 transition-colors"
          />
          <p className="text-[11px] text-zinc-600 mt-1.5">
            Supports Google Drive share links, YouTube, Instagram, or any direct URL
          </p>
        </div>
      )}

      {/* Upload progress */}
      {(phase === "uploading" || phase === "finalising") && (
        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-zinc-400 flex items-center gap-1.5">
              <Loader2 size={11} className="animate-spin" />
              {phase === "uploading" ? `Uploading to Google Drive… ${progress}%` : "Finalising…"}
            </span>
            <span className="text-zinc-500">{progress}%</span>
          </div>
          <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-violet-500 transition-all duration-300"
              style={{ width: `${phase === "finalising" ? 100 : progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Error */}
      {phase === "error" && (
        <div className="flex items-start gap-2 bg-red-950/30 border border-red-900/50 rounded-lg px-3 py-2.5">
          <AlertCircle size={14} className="text-red-400 shrink-0 mt-0.5" />
          <p className="text-xs text-red-300">{error}</p>
        </div>
      )}

      {/* Metadata fields */}
      {!existingVideo && (
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <label className="block text-xs text-zinc-500 mb-1.5">Video Name *</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Smart Living Room Reveal"
              className="w-full bg-[#111113] border border-white/[0.07] rounded-lg px-3 py-2 text-sm text-zinc-200 placeholder-zinc-600 outline-none focus:border-violet-600/50 transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs text-zinc-500 mb-1.5">Campaign</label>
            <select
              value={campaign}
              onChange={(e) => setCampaign(e.target.value as Campaign)}
              className="w-full bg-[#111113] border border-white/[0.07] rounded-lg px-3 py-2 text-sm text-zinc-300 outline-none focus:border-violet-600/50"
            >
              {CAMPAIGNS.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-zinc-500 mb-1.5">Platform</label>
            <select
              value={platform}
              onChange={(e) => setPlatform(e.target.value as Platform)}
              className="w-full bg-[#111113] border border-white/[0.07] rounded-lg px-3 py-2 text-sm text-zinc-300 outline-none focus:border-violet-600/50"
            >
              {PLATFORMS.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-zinc-500 mb-1.5">Project (optional)</label>
            <input
              value={project}
              onChange={(e) => setProject(e.target.value)}
              placeholder="e.g. Prestige Hills"
              className="w-full bg-[#111113] border border-white/[0.07] rounded-lg px-3 py-2 text-sm text-zinc-200 placeholder-zinc-600 outline-none focus:border-violet-600/50 transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs text-zinc-500 mb-1.5">Go Live Date</label>
            <input
              type="date"
              value={goLive}
              onChange={(e) => setGoLive(e.target.value)}
              className="w-full bg-[#111113] border border-white/[0.07] rounded-lg px-3 py-2 text-sm text-zinc-300 outline-none focus:border-violet-600/50 [color-scheme:dark]"
            />
          </div>
        </div>
      )}

      {/* Submit */}
      <button
        onClick={mode === "link" ? handleLinkSubmit : handleFileUpload}
        disabled={!canSubmit}
        className={cn(
          "w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all",
          canSubmit
            ? "bg-violet-600 hover:bg-violet-700 text-white"
            : "bg-zinc-800 text-zinc-500 cursor-not-allowed"
        )}
      >
        {phase === "uploading" || phase === "finalising" ? (
          <><Loader2 size={14} className="animate-spin" /> Uploading…</>
        ) : mode === "link" ? (
          <><Link2 size={14} /> {existingVideo ? `Add V${existingVideo.currentVersion + 1} Link` : "Add Video"}</>
        ) : (
          <><Upload size={14} /> {existingVideo ? `Upload V${existingVideo.currentVersion + 1}` : "Upload to Google Drive"}</>
        )}
      </button>
    </div>
  );
}

// ─── Resumable upload with XHR progress ──────────────────────────────────────
async function uploadWithProgress(
  uploadUrl: string,
  file: File,
  onProgress: (pct: number) => void
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", uploadUrl);
    xhr.setRequestHeader("Content-Type", file.type);

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
    };

    xhr.onload  = () => xhr.status >= 200 && xhr.status < 300
      ? resolve()
      : reject(new Error(`Drive upload failed: ${xhr.status}`));
    xhr.onerror = () => reject(new Error("Network error during upload"));
    xhr.send(file);
  });
}
