/**
 * Google Drive Integration
 *
 * Uses a service account to manage the Beyond Lens folder structure.
 * Root folder is shared with Niket's personal Drive so all files appear
 * in "Shared with me" → can be moved to "My Drive" at any time.
 *
 * Folder hierarchy:
 *   Beyond Lens (root)
 *   └── {Campaign}
 *       └── {Video Name}
 *           ├── V1 / original.mp4
 *           ├── V2 / revised.mp4
 *           └── approved / final.mp4
 */

import { google } from "googleapis";
import { JWT } from "google-auth-library";

// ─── Auth ─────────────────────────────────────────────────────────────────────
function getCredentials() {
  const email      = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, "\n");
  if (!email || !privateKey) {
    throw new Error("Missing GOOGLE_SERVICE_ACCOUNT_EMAIL or GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY");
  }
  return { email, privateKey };
}

function getDriveClient() {
  const { email, privateKey } = getCredentials();
  const auth = new google.auth.GoogleAuth({
    credentials: { client_email: email, private_key: privateKey },
    scopes: ["https://www.googleapis.com/auth/drive"],
  });
  return google.drive({ version: "v3", auth });
}

async function getAccessToken(): Promise<string> {
  const { email, privateKey } = getCredentials();
  const jwt = new JWT({
    email,
    key: privateKey,
    scopes: ["https://www.googleapis.com/auth/drive"],
  });
  const { token } = await jwt.getAccessToken();
  if (!token) throw new Error("Failed to obtain Google Drive access token");
  return token;
}

const ROOT_FOLDER_ID = process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID ?? "";

// ─── Folder helpers ───────────────────────────────────────────────────────────

/** Find a folder by name inside a parent, or create it if it doesn't exist. */
async function getOrCreateFolder(name: string, parentId: string): Promise<string> {
  const drive = getDriveClient();

  const res = await drive.files.list({
    q: `'${parentId}' in parents and name='${name}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
    fields: "files(id,name)",
    spaces: "drive",
  });

  if (res.data.files && res.data.files.length > 0) {
    return res.data.files[0].id!;
  }

  const created = await drive.files.create({
    requestBody: {
      name,
      mimeType: "application/vnd.google-apps.folder",
      parents: [parentId],
    },
    fields: "id",
  });

  return created.data.id!;
}

/**
 * Resolve (and create if needed) the full folder path for a video version.
 * Returns the folder ID for: Beyond Lens / {campaign} / {videoName} / V{version}
 */
export async function resolveVersionFolder(
  campaign: string,
  videoName: string,
  version: number
): Promise<string> {
  const campaignFolder = await getOrCreateFolder(campaign, ROOT_FOLDER_ID);
  const videoFolder    = await getOrCreateFolder(videoName, campaignFolder);
  const versionFolder  = await getOrCreateFolder(`V${version}`, videoFolder);
  return versionFolder;
}

// ─── Resumable upload URL ─────────────────────────────────────────────────────

/**
 * Mint a resumable upload URL so the browser can stream the video
 * directly to Google Drive without routing through the Next.js server.
 *
 * Returns: { uploadUrl, fileId }
 * The client uses uploadUrl to PUT the file bytes, then calls /api/upload/complete.
 */
export async function createResumableUploadUrl(params: {
  fileName: string;
  mimeType: string;
  folderId: string;
  sizeBytes: number;
}): Promise<{ uploadUrl: string; fileId: string }> {
  const drive = getDriveClient();
  const token = await getAccessToken();

  // Create a placeholder file first to get the fileId
  const placeholder = await drive.files.create({
    requestBody: {
      name:    params.fileName,
      parents: [params.folderId],
    },
    fields: "id",
  });

  const fileId = placeholder.data.id!;

  // Request a resumable upload session
  const uploadRes = await fetch(
    `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=resumable`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "X-Upload-Content-Type": params.mimeType,
        "X-Upload-Content-Length": String(params.sizeBytes),
      },
      body: JSON.stringify({ name: params.fileName }),
    }
  );

  if (!uploadRes.ok) {
    const errText = await uploadRes.text();
    throw new Error(`Drive resumable init failed (${uploadRes.status}): ${errText}`);
  }

  const uploadUrl = uploadRes.headers.get("location");
  if (!uploadUrl) throw new Error("Drive did not return a resumable upload URL");

  return { uploadUrl, fileId };
}

// ─── Post-upload ──────────────────────────────────────────────────────────────

/**
 * After upload completes: make the file viewable by anyone with the link
 * (so thumbnails and playback work), and return a clean shareable URL.
 */
export async function finaliseUpload(fileId: string): Promise<{
  driveUrl: string;
  thumbnailUrl: string;
  webViewLink: string;
}> {
  const drive = getDriveClient();

  // Set reader permission for anyone with the link
  await drive.permissions.create({
    fileId,
    requestBody: { role: "reader", type: "anyone" },
  });

  const meta = await drive.files.get({
    fileId,
    fields: "id,name,webViewLink,thumbnailLink,size",
  });

  return {
    driveUrl:     meta.data.webViewLink ?? `https://drive.google.com/file/d/${fileId}/view`,
    thumbnailUrl: meta.data.thumbnailLink?.replace("=s220", "=s640") ?? "",
    webViewLink:  meta.data.webViewLink ?? "",
  };
}

// ─── Simple server-side upload (small files / thumbnails) ─────────────────────

/** Upload a Buffer directly — use for thumbnails or files under ~10MB. */
export async function uploadBuffer(params: {
  buffer: Buffer;
  fileName: string;
  mimeType: string;
  folderId: string;
}): Promise<{ fileId: string; driveUrl: string }> {
  const drive = getDriveClient();
  const { Readable } = await import("stream");

  const res = await drive.files.create({
    requestBody: {
      name:    params.fileName,
      parents: [params.folderId],
    },
    media: {
      mimeType: params.mimeType,
      body:     Readable.from(params.buffer),
    },
    fields: "id,webViewLink",
  });

  await drive.permissions.create({
    fileId: res.data.id!,
    requestBody: { role: "reader", type: "anyone" },
  });

  return {
    fileId:   res.data.id!,
    driveUrl: res.data.webViewLink ?? `https://drive.google.com/file/d/${res.data.id}/view`,
  };
}

// ─── Folder URL helper ────────────────────────────────────────────────────────

export function driveFolderUrl(folderId: string) {
  return `https://drive.google.com/drive/folders/${folderId}`;
}
