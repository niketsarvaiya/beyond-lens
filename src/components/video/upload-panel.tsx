"use client";

import { useState, useRef, useCallback } from "react";
import { useLensStore } from "@/store/lens-store";
import { CAMPAIGNS, PLATFORMS } from "@/lib/constants";
import type { Campaign, Platform, Video, VideoVersion } from "@/types";
import { cn } from "@/lib/utils";
import { Upload, X, CheckCircle2, AlertCircle, Loader2, CloudUpload, File } from "lucide-react";

interface UploadPanelProps {
  onSuccess?: (video: Video) => void;
  existingVideo?: Video;   // pass to add a new version to an existing video
}

type UploadPhase = "idle" | "uploading" | "finalising" | "done" | "error";

function formatBytes(bytes: number) {
  if (bytes < 1e6) return `${(bytes / 1e3).toFixed(0)} KB`;
  return `${(bytes / 1e6).toFixed(1)} MB`;
}

export function UploadPanel({ onSuccess, existingVideo }: UploadPanelProps) {
  const [file,      setFile]      = useState<File | null>(null);
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
  const updateStatus  = useLensStore((s) => s.updateVideoStatus);

  const isDriveConfigured = true; // check at runtime via env

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped && dropped.type.startsWith("video/")) setFile(dropped);
  }, []);

  const handleUpload = async () => {
    if (!file || !name.trim()) return;
    setPhase("uploading");
    setProgress(0);
    setError("");

    try {
      const version = existingVideo ? existingVideo.currentVersion + 1 : 1;

      // ── Step 1: Get resumable upload URL from our server ──────────────────
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

      // ── Step 2: Stream file directly to Google Drive ──────────────────────
      await uploadWithProgress(uploadUrl, file, setProgress);

      // ── Step 3: Finalise — set permissions + get Drive URL ────────────────
      setPhase("finalising");
      const completeRes = await fetch("/api/upload/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileId }),
      });

      if (!completeRes.ok) throw new Error("Failed to finalise upload");
      const { driveUrl, thumbnailUrl } = await completeRes.json();

      // ── Step 4: Update store ──────────────────────────────────────────────
      const newVersion: VideoVersion = {
        id: `v_${Date.now()}`,
        version,
        driveUrl,
        thumbnailUrl,
        uploadedBy: currentUserId,
        uploadedAt: new Date().toISOString(),
        sizeBytes: file.size,
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
          id: `vid_${Date.now()}`,
          name: name.trim(),
          campaign,
          platform,
          project: project.trim() || undefined,
          status: "uploaded",
          goLiveDate: goLive || undefined,
          uploadedBy: currentUserId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          currentVersion: 1,
          thumbnailUrl,
          versions: [newVersion],
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

  if (phase === "done") {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center gap-3">
        <CheckCircle2 size={40} className="text-emerald-400" />
        <p className="text-sm font-medium text-zinc-200">
          {existingVideo ? "New version uploaded to Google Drive" : "Video uploaded to Google Drive"}
        </p>
        <p className="text-xs text-zinc-500">AI review will start shortly</p>
        <button
          onClick={() => { setPhase("idle"); setFile(null); setProgress(0); }}
          className="text-xs text-violet-400 hover:text-violet-300 transition-colors mt-2"
        >
          Upload another
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Drop zone */}
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
        <div className="flex items-center gap-2 bg-red-950/30 border border-red-900/50 rounded-lg px-3 py-2.5">
          <AlertCircle size={14} className="text-red-400 shrink-0" />
          <p className="text-xs text-red-300">{error}</p>
        </div>
      )}

      {/* Metadata fields (hide for new version — campaign/platform locked) */}
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
        onClick={handleUpload}
        disabled={!file || !name.trim() || phase === "uploading" || phase === "finalising"}
        className={cn(
          "w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all",
          file && name.trim() && phase === "idle"
            ? "bg-violet-600 hover:bg-violet-700 text-white"
            : "bg-zinc-800 text-zinc-500 cursor-not-allowed"
        )}
      >
        {phase === "uploading" || phase === "finalising" ? (
          <><Loader2 size={14} className="animate-spin" /> Uploading…</>
        ) : (
          <><Upload size={14} /> {existingVideo ? `Upload V${existingVideo.currentVersion + 1}` : "Upload to Google Drive"}</>
        )}
      </button>
    </div>
  );
}

// ─── Resumable upload with progress ──────────────────────────────────────────
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
      if (e.lengthComputable) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve();
      else reject(new Error(`Drive upload failed: ${xhr.status} ${xhr.statusText}`));
    };

    xhr.onerror = () => reject(new Error("Network error during upload"));
    xhr.send(file);
  });
}
