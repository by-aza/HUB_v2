import { getOrCreateDriveFolder } from "../_shared/google_drive.ts";
import {
  DeleteObjectsCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from "npm:@aws-sdk/client-s3@3.1098.0";
import { getSignedUrl } from "npm:@aws-sdk/s3-request-presigner@3.1098.0";

type AuthenticatedUser = {
  id: string;
  email?: string;
};

type PreparedUpload = {
  itemId: string;
  internalId: string;
  compressedImage: File;
  thumbnail: File;
  sortOrder: number;
  isPrimary: boolean;
  requireR2: boolean;
};

const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/webp"]);
const MAX_COMPRESSED_IMAGE_BYTES = 2 * 1024 * 1024;
const MAX_THUMBNAIL_BYTES = 512 * 1024;
/* originile explicite permise pentru HUB, inclusiv productie si testare locala */
const HUB_ALLOWED_ORIGINS = new Set([
  "https://hub-v2-phi.vercel.app",
  "http://127.0.0.1:5500",
  "http://192.168.1.130:5500",
]);

type FolderTestRequest = {
  action: "test_folder";
  itemId: string;
  internalId: string;
};

type ViewFileRequest = {
  action: "view_file";
  itemId: string;
  fileId: string;
};

type R2SignedUrlRequest = {
  action: "get_r2_signed_url";
  itemId: string;
  objectKey: string;
};

type DeleteR2PhotoRequest = {
  action: "delete_r2_photo";
  itemId: string;
  photoId: string;
};

type PermanentlyDeleteItemRequest = {
  action: "permanently_delete_archived_item";
  itemId: string;
  internalId: string;
};

type R2TestRequest = {
  action: "test_r2";
};

type R2StorageStatusRequest = {
  action: "r2_storage_status";
};

type JsonActionRequest = FolderTestRequest
  | ViewFileRequest
  | R2SignedUrlRequest
  | DeleteR2PhotoRequest
  | PermanentlyDeleteItemRequest
  | R2TestRequest
  | R2StorageStatusRequest;

type DriveUploadCredentials = {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
};

type DriveUploadedFile = {
  id: string;
  name: string;
  mimeType?: string;
  size?: string;
  webViewLink?: string;
  webContentLink?: string;
};

type R2Credentials = {
  accessKeyId: string;
  secretAccessKey: string;
  endpoint: string;
  bucketName: string;
};

const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const DRIVE_FILES_URL = "https://www.googleapis.com/drive/v3/files";
const DRIVE_UPLOAD_URL = "https://www.googleapis.com/upload/drive/v3/files";
const R2_SIGNED_URL_TTL_SECONDS = 5 * 60;
const R2_FREE_TIER_BYTES = 10_000_000_000;

/* permite originile HUB configurate si originile explicite de productie/test */
function corsHeaders(request: Request): HeadersInit {
  const origin = request.headers.get("origin");
  const configuredOrigins = (Deno.env.get("HUB_ALLOWED_ORIGINS") || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  const allowedOrigins = new Set([...configuredOrigins, ...HUB_ALLOWED_ORIGINS]);
  const headers: Record<string, string> = {
    "access-control-allow-headers": "authorization, apikey, content-type, x-client-info",
    "access-control-allow-methods": "POST, OPTIONS",
    vary: "Origin",
  };

  if (origin && allowedOrigins.has(origin)) {
    headers["access-control-allow-origin"] = origin;
  }

  return headers;
}

/* raspunde uniform fara a expune detalii interne sau secrete */
function jsonResponse(request: Request, status: number, body: Record<string, unknown>): Response {
  return Response.json(body, { status, headers: corsHeaders(request) });
}

/* obtine cheia publica Supabase disponibila automat in functia Edge */
function getSupabasePublishableKey(): string {
  const publishableKeys = Deno.env.get("SUPABASE_PUBLISHABLE_KEYS");

  if (publishableKeys) {
    const parsedKeys = JSON.parse(publishableKeys);
    if (typeof parsedKeys.default === "string") return parsedKeys.default;
  }

  const legacyAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
  if (legacyAnonKey) return legacyAnonKey;
  throw new Error("Cheia publică Supabase nu este disponibilă în funcția Edge.");
}

/* obtine cheia server-side folosita numai dupa autorizarea explicita a Adminului */
function getSupabaseServiceRoleKey(): string {
  const secretKeys = Deno.env.get("SUPABASE_SECRET_KEYS");
  if (secretKeys) {
    const parsedKeys = JSON.parse(secretKeys);
    if (typeof parsedKeys.default === "string") return parsedKeys.default;
  }

  const secretKey = Deno.env.get("SUPABASE_SECRET_KEY")?.trim();
  if (secretKey) return secretKey;
  const legacyServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")?.trim();
  if (legacyServiceRoleKey) return legacyServiceRoleKey;
  throw new Error("Cheia server-side Supabase nu este disponibilă în funcția Edge.");
}

/* antetele server-side nu expun cheia secreta catre browser */
function supabaseServiceHeaders(): Record<string, string> {
  const serviceKey = getSupabaseServiceRoleKey();
  const headers: Record<string, string> = {
    apikey: serviceKey,
    accept: "application/json",
  };
  if (serviceKey.startsWith("eyJ")) headers.authorization = `Bearer ${serviceKey}`;
  return headers;
}

/* valideaza sesiunea HUB direct prin Supabase Auth */
async function authenticateHubUser(request: Request): Promise<AuthenticatedUser | null> {
  const authorization = request.headers.get("authorization");
  const supabaseUrl = Deno.env.get("SUPABASE_URL");

  if (!authorization?.startsWith("Bearer ") || !supabaseUrl) return null;

  const response = await fetch(`${supabaseUrl}/auth/v1/user`, {
    headers: {
      authorization,
      apikey: getSupabasePublishableKey(),
    },
  });

  if (!response.ok) return null;
  const user = await response.json();
  return typeof user.id === "string" ? user : null;
}

/* verifica permisiunea HUB existenta pentru modulul Dezmembrari */
async function authorizeDezmembrariUser(request: Request, userId: string): Promise<boolean> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const authorization = request.headers.get("authorization");
  if (!supabaseUrl || !authorization) return false;

  const searchParams = new URLSearchParams({
    id: `eq.${userId}`,
    select: "rol_id,permissions",
    limit: "1",
  });
  const response = await fetch(`${supabaseUrl}/rest/v1/auth_profiles?${searchParams}`, {
    headers: {
      authorization,
      apikey: getSupabasePublishableKey(),
      accept: "application/json",
    },
  });

  if (!response.ok) return false;
  const profiles = await response.json();
  const profile = Array.isArray(profiles) ? profiles[0] : null;
  const permissions = profile?.permissions || {};

  return Number(profile?.rol_id) === 1
    || permissions.dezmembrari_capture === true
    || permissions.dezmembrari_manage === true;
}

/* verifica dreptul de administrare necesar pentru stergerea obiectelor private */
async function authorizeDezmembrariManager(request: Request, userId: string): Promise<boolean> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const authorization = request.headers.get("authorization");
  if (!supabaseUrl || !authorization) return false;

  const searchParams = new URLSearchParams({
    id: `eq.${userId}`,
    select: "rol_id,permissions",
    limit: "1",
  });
  const response = await fetch(`${supabaseUrl}/rest/v1/auth_profiles?${searchParams}`, {
    headers: {
      authorization,
      apikey: getSupabasePublishableKey(),
      accept: "application/json",
    },
  });

  if (!response.ok) return false;
  const profiles = await response.json();
  const profile = Array.isArray(profiles) ? profiles[0] : null;
  return Number(profile?.rol_id) === 1 || profile?.permissions?.dezmembrari_manage === true;
}

/* confirma strict rolul Admin existent; permisiunea manage nu este suficienta */
async function authorizeHubAdmin(userId: string): Promise<boolean> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  if (!supabaseUrl) return false;

  const searchParams = new URLSearchParams({
    id: `eq.${userId}`,
    select: "rol_id",
    limit: "1",
  });
  const response = await fetch(`${supabaseUrl}/rest/v1/auth_profiles?${searchParams}`, {
    headers: supabaseServiceHeaders(),
  });

  if (!response.ok) return false;
  const profiles = await response.json();
  return Number(Array.isArray(profiles) ? profiles[0]?.rol_id : null) === 1;
}

/* confirma prin RLS ca articolul si ID-ul intern indica acelasi rand */
async function verifyDezmembrariItem(request: Request, itemId: string, internalId: string): Promise<boolean> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const authorization = request.headers.get("authorization");
  if (!supabaseUrl || !authorization) return false;

  const searchParams = new URLSearchParams({
    id: `eq.${itemId}`,
    internal_id: `eq.${internalId}`,
    select: "id,internal_id",
    limit: "1",
  });
  const response = await fetch(`${supabaseUrl}/rest/v1/dezmembrari_items?${searchParams}`, {
    headers: {
      authorization,
      apikey: getSupabasePublishableKey(),
      accept: "application/json",
    },
  });

  if (!response.ok) return false;
  const rows = await response.json();
  return Array.isArray(rows) && rows.length === 1;
}

/* confirma prin RLS ca fisierul Drive apartine unei fotografii accesibile */
async function authorizeDrivePhotoFile(
  request: Request,
  itemId: string,
  fileId: string,
): Promise<string | null> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const authorization = request.headers.get("authorization");
  if (!supabaseUrl || !authorization) return null;

  const searchParams = new URLSearchParams({
    item_id: `eq.${itemId}`,
    or: `(drive_file_id.eq.${fileId},thumbnail_file_id.eq.${fileId})`,
    select: "mime_type",
    limit: "1",
  });
  const response = await fetch(`${supabaseUrl}/rest/v1/dezmembrari_photos?${searchParams}`, {
    headers: {
      authorization,
      apikey: getSupabasePublishableKey(),
      accept: "application/json",
    },
  });

  if (!response.ok) return null;
  const rows = await response.json();
  const mimeType = Array.isArray(rows) ? rows[0]?.mime_type : null;
  return typeof mimeType === "string" ? mimeType : null;
}

/* confirma prin RLS ca obiectul R2 apartine unei fotografii accesibile */
async function authorizeR2PhotoObject(
  request: Request,
  itemId: string,
  objectKey: string,
): Promise<string | null> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const authorization = request.headers.get("authorization");
  if (!supabaseUrl || !authorization) return null;

  const searchParams = new URLSearchParams({
    item_id: `eq.${itemId}`,
    or: `(drive_file_id.eq.${objectKey},thumbnail_file_id.eq.${objectKey})`,
    select: "mime_type",
    limit: "1",
  });
  const response = await fetch(`${supabaseUrl}/rest/v1/dezmembrari_photos?${searchParams}`, {
    headers: {
      authorization,
      apikey: getSupabasePublishableKey(),
      accept: "application/json",
    },
  });

  if (!response.ok) return null;
  const rows = await response.json();
  const mimeType = Array.isArray(rows) ? rows[0]?.mime_type : null;
  return typeof mimeType === "string" ? mimeType : null;
}

/* citeste prin RLS numai cheile R2 ale randului foto cerut pentru stergere */
async function getAuthorizedR2PhotoKeys(
  request: Request,
  itemId: string,
  photoId: string,
): Promise<{ mainKey: string; thumbnailKey: string } | null> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const authorization = request.headers.get("authorization");
  if (!supabaseUrl || !authorization) return null;

  const searchParams = new URLSearchParams({
    id: `eq.${photoId}`,
    item_id: `eq.${itemId}`,
    select: "drive_file_id,thumbnail_file_id",
    limit: "1",
  });
  const response = await fetch(`${supabaseUrl}/rest/v1/dezmembrari_photos?${searchParams}`, {
    headers: {
      authorization,
      apikey: getSupabasePublishableKey(),
      accept: "application/json",
    },
  });

  if (!response.ok) return null;
  const rows = await response.json();
  const photo = Array.isArray(rows) ? rows[0] : null;
  const mainKey = typeof photo?.drive_file_id === "string" ? photo.drive_file_id : "";
  const thumbnailKey = typeof photo?.thumbnail_file_id === "string" ? photo.thumbnail_file_id : "";
  if (!/^DZ-\d{5,}\/\d{2}\.jpg$/.test(mainKey)
    || !/^DZ-\d{5,}\/\d{2}-thumb\.jpg$/.test(thumbnailKey)
    || thumbnailKey !== mainKey.replace(/\.jpg$/, "-thumb.jpg")) return null;

  return { mainKey, thumbnailKey };
}

/* valideaza actiunile JSON pentru testele temporare si vizualizare */
async function parseJsonActionRequest(request: Request): Promise<JsonActionRequest | null> {
  if (!request.headers.get("content-type")?.includes("application/json")) return null;

  const body = await request.json();
  if (body?.action === "test_r2") return { action: "test_r2" };
  if (body?.action === "r2_storage_status") return { action: "r2_storage_status" };

  if (body?.action === "get_r2_signed_url") {
    const itemId = String(body.item_id || "").trim();
    const objectKey = String(body.object_key || "").trim();
    if (!/^\d+$/.test(itemId)) throw new Error("item_id trebuie să fie ID-ul numeric al articolului.");
    if (!/^DZ-\d{5,}\/\d{2}(?:-thumb)?\.jpg$/.test(objectKey)) {
      throw new Error("object_key R2 nu este valid.");
    }
    return { action: "get_r2_signed_url", itemId, objectKey };
  }

  if (body?.action === "delete_r2_photo") {
    const itemId = String(body.item_id || "").trim();
    const photoId = String(body.photo_id || "").trim();
    if (!/^\d+$/.test(itemId)) throw new Error("item_id trebuie să fie ID-ul numeric al articolului.");
    if (!/^\d+$/.test(photoId)) throw new Error("photo_id trebuie să fie ID-ul numeric al fotografiei.");
    return { action: "delete_r2_photo", itemId, photoId };
  }

  if (body?.action === "permanently_delete_archived_item") {
    const itemId = String(body.item_id || "").trim();
    const internalId = String(body.internal_id || "").trim().toUpperCase();
    const confirmation = String(body.confirm_internal_id || "").trim().toUpperCase();
    if (!/^\d+$/.test(itemId)) throw new Error("item_id trebuie să fie ID-ul numeric al articolului.");
    if (!/^DZ-\d{5,}$/.test(internalId)) throw new Error("internal_id nu este valid.");
    if (confirmation !== internalId) throw new Error("Confirmarea ID-ului intern nu corespunde.");
    return { action: "permanently_delete_archived_item", itemId, internalId };
  }

  if (body?.action === "view_file") {
    const itemId = String(body.item_id || "").trim();
    const fileId = String(body.file_id || "").trim();
    if (!/^\d+$/.test(itemId)) throw new Error("item_id trebuie să fie ID-ul numeric al articolului.");
    if (!/^[A-Za-z0-9_-]{10,200}$/.test(fileId)) throw new Error("file_id nu este valid.");
    return { action: "view_file", itemId, fileId };
  }

  if (body?.action !== "test_folder") throw new Error("Acțiunea JSON nu este acceptată.");

  const itemId = String(body.item_id || "").trim();
  const internalId = String(body.internal_id || "").trim().toUpperCase();
  if (!/^\d+$/.test(itemId)) throw new Error("item_id trebuie să fie ID-ul numeric al articolului.");
  if (!/^DZ-\d{5,}$/.test(internalId)) throw new Error("internal_id nu este valid.");

  return { action: "test_folder", itemId, internalId };
}

/* valideaza contractul multipart pregatit pentru imaginile deja comprimate */
async function parsePreparedUpload(request: Request): Promise<PreparedUpload> {
  if (!request.headers.get("content-type")?.includes("multipart/form-data")) {
    throw new Error("Cererea trebuie trimisă ca multipart/form-data.");
  }

  const formData = await request.formData();
  const itemId = String(formData.get("item_id") || "").trim();
  const internalId = String(formData.get("internal_id") || "").trim().toUpperCase();
  const compressedImage = formData.get("compressed_image");
  const thumbnail = formData.get("thumbnail");
  const sortOrderText = String(formData.get("sort_order") || "").trim();
  const isPrimaryText = String(formData.get("is_primary") || "").trim().toLowerCase();
  const requireR2Text = String(formData.get("require_r2") || "false").trim().toLowerCase();
  const sortOrder = Number(sortOrderText);

  if (!/^\d+$/.test(itemId)) throw new Error("item_id trebuie să fie ID-ul numeric al articolului.");
  if (!/^DZ-\d{5,}$/.test(internalId)) throw new Error("internal_id nu este valid.");
  if (!(compressedImage instanceof File) || !ALLOWED_IMAGE_TYPES.has(compressedImage.type)) {
    throw new Error("compressed_image trebuie să fie JPEG sau WebP.");
  }
  if (!(thumbnail instanceof File) || !ALLOWED_IMAGE_TYPES.has(thumbnail.type)) {
    throw new Error("thumbnail trebuie să fie JPEG sau WebP.");
  }
  if (compressedImage.size === 0) throw new Error("Imaginea comprimată este goală.");
  if (thumbnail.size === 0) throw new Error("Thumbnail-ul este gol.");
  if (compressedImage.size > MAX_COMPRESSED_IMAGE_BYTES) throw new Error("Imaginea comprimată este prea mare.");
  if (thumbnail.size > MAX_THUMBNAIL_BYTES) throw new Error("Thumbnail-ul este prea mare.");
  if (!Number.isInteger(sortOrder) || sortOrder < 0 || sortOrder >= 99) {
    throw new Error("sort_order nu este valid.");
  }
  if (isPrimaryText !== "true" && isPrimaryText !== "false") {
    throw new Error("is_primary trebuie să fie true sau false.");
  }
  if (requireR2Text !== "true" && requireR2Text !== "false") {
    throw new Error("require_r2 trebuie să fie true sau false.");
  }

  return {
    itemId,
    internalId,
    compressedImage,
    thumbnail,
    sortOrder,
    isPrimary: isPrimaryText === "true",
    requireR2: requireR2Text === "true",
  };
}

/* citeste credentialele OAuth necesare uploadului numai din secrete */
function readDriveUploadCredentials(): DriveUploadCredentials {
  const clientId = Deno.env.get("GOOGLE_OAUTH_CLIENT_ID")?.trim();
  const clientSecret = Deno.env.get("GOOGLE_OAUTH_CLIENT_SECRET")?.trim();
  const refreshToken = Deno.env.get("GOOGLE_OAUTH_REFRESH_TOKEN")?.trim();

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error("Configurația OAuth Google Drive a funcției Edge este incompletă.");
  }

  return { clientId, clientSecret, refreshToken };
}

/* citeste configuratia privata pentru testul Cloudflare R2 */
function readR2Credentials(): R2Credentials {
  const accessKeyId = Deno.env.get("R2_ACCESS_KEY_ID")?.trim();
  const secretAccessKey = Deno.env.get("R2_SECRET_ACCESS_KEY")?.trim();
  const endpoint = Deno.env.get("R2_ENDPOINT")?.trim().replace(/\/$/, "");
  const bucketName = Deno.env.get("R2_BUCKET_NAME")?.trim();

  if (!accessKeyId || !secretAccessKey || !endpoint || !bucketName) {
    throw new Error("Configurația Cloudflare R2 a funcției Edge este incompletă.");
  }

  return { accessKeyId, secretAccessKey, endpoint, bucketName };
}

/* creeaza clientul S3 compatibil cu endpoint-ul privat Cloudflare R2 */
function createR2Client(credentials: R2Credentials): S3Client {
  return new S3Client({
    region: "auto",
    endpoint: credentials.endpoint,
    credentials: {
      accessKeyId: credentials.accessKeyId,
      secretAccessKey: credentials.secretAccessKey,
    },
  });
}

/* construieste URL-ul obiectului R2 pastrand cheia determinista */
function r2ObjectUrl(credentials: R2Credentials, objectKey: string): string {
  const encodedKey = objectKey.split("/").map(encodeURIComponent).join("/");
  return `${credentials.endpoint}/${encodeURIComponent(credentials.bucketName)}/${encodedKey}`;
}

/* calculeaza server-side dimensiunea reala a obiectelor din bucket-ul R2 configurat */
async function getR2StorageStatus(): Promise<{
  usedBytes: number;
  remainingBytes: number;
  percentageUsed: number;
  objectCount: number;
}> {
  const credentials = readR2Credentials();
  const client = createR2Client(credentials);
  let continuationToken: string | undefined;
  let usedBytes = 0;
  let objectCount = 0;

  try {
    do {
      const listed = await client.send(new ListObjectsV2Command({
        Bucket: credentials.bucketName,
        MaxKeys: 1000,
        ContinuationToken: continuationToken,
      }));

      for (const object of listed.Contents || []) {
        const size = Number(object.Size || 0);
        if (Number.isFinite(size) && size > 0) usedBytes += size;
        objectCount += 1;
      }

      if (listed.IsTruncated && !listed.NextContinuationToken) {
        throw new Error("R2 nu a returnat tokenul necesar pentru continuarea listării.");
      }
      continuationToken = listed.IsTruncated ? listed.NextContinuationToken : undefined;
    } while (continuationToken);

    return {
      usedBytes,
      remainingBytes: Math.max(0, R2_FREE_TIER_BYTES - usedBytes),
      percentageUsed: (usedBytes / R2_FREE_TIER_BYTES) * 100,
      objectCount,
    };
  } finally {
    client.destroy();
  }
}

/* genereaza acces GET temporar fara a transmite imaginea prin Edge Runtime */
async function createR2SignedGetUrl(objectKey: string): Promise<string> {
  const credentials = readR2Credentials();
  const client = createR2Client(credentials);

  try {
    return await getSignedUrl(
      client,
      new GetObjectCommand({ Bucket: credentials.bucketName, Key: objectKey }),
      { expiresIn: R2_SIGNED_URL_TTL_SECONDS },
    );
  } finally {
    client.destroy();
  }
}

/* sterge imaginea principala si thumbnail-ul aceleiasi fotografii din R2 */
async function deletePhotoObjectsFromR2(mainKey: string, thumbnailKey: string): Promise<void> {
  const credentials = readR2Credentials();
  const client = createR2Client(credentials);

  try {
    await client.send(new DeleteObjectCommand({ Bucket: credentials.bucketName, Key: mainKey }));
    await client.send(new DeleteObjectCommand({ Bucket: credentials.bucketName, Key: thumbnailKey }));
  } finally {
    client.destroy();
  }
}

/* sterge si reverifica toate obiectele aflate sub prefixul exact al articolului */
async function deleteItemPrefixFromR2(internalId: string): Promise<string[]> {
  const credentials = readR2Credentials();
  const client = createR2Client(credentials);
  const prefix = `${internalId}/`;
  const deletedKeys: string[] = [];

  try {
    while (true) {
      const listed = await client.send(new ListObjectsV2Command({
        Bucket: credentials.bucketName,
        Prefix: prefix,
        MaxKeys: 1000,
      }));
      const keys = (listed.Contents || [])
        .map((object) => object.Key)
        .filter((key): key is string => typeof key === "string" && key.startsWith(prefix));
      if (keys.length === 0) break;

      const deleted = await client.send(new DeleteObjectsCommand({
        Bucket: credentials.bucketName,
        Delete: {
          Objects: keys.map((key) => ({ Key: key })),
          Quiet: true,
        },
      }));
      if (deleted.Errors?.length) {
        throw new Error(`R2 nu a putut șterge ${deleted.Errors.length} obiect(e) din prefix.`);
      }
      deletedKeys.push(...keys);
    }

    const remaining = await client.send(new ListObjectsV2Command({
      Bucket: credentials.bucketName,
      Prefix: prefix,
      MaxKeys: 1,
    }));
    if ((remaining.Contents || []).length > 0) {
      throw new Error("Prefixul R2 conține încă obiecte după operația de curățare.");
    }
    return deletedKeys;
  } finally {
    client.destroy();
  }
}

/* citeste server-side numai articolul arhivat indicat prin ambele identificatoare */
async function findArchivedItemForPermanentDelete(
  itemId: string,
  internalId: string,
): Promise<{ id: number; internal_id: string } | null> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  if (!supabaseUrl) throw new Error("SUPABASE_URL nu este disponibil în funcția Edge.");

  const searchParams = new URLSearchParams({
    id: `eq.${itemId}`,
    internal_id: `eq.${internalId}`,
    status: "eq.archived",
    select: "id,internal_id",
    limit: "1",
  });
  const response = await fetch(`${supabaseUrl}/rest/v1/dezmembrari_items?${searchParams}`, {
    headers: supabaseServiceHeaders(),
  });
  if (!response.ok) throw new Error(`Verificarea articolului arhivat a eșuat (${response.status}).`);

  const rows = await response.json();
  const item = Array.isArray(rows) ? rows[0] : null;
  return Number(item?.id) === Number(itemId) && item?.internal_id === internalId ? item : null;
}

/* sterge articolul dupa curatarea R2; randurile foto sunt eliminate prin CASCADE */
async function deleteArchivedItemFromSupabase(itemId: string, internalId: string): Promise<boolean> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  if (!supabaseUrl) throw new Error("SUPABASE_URL nu este disponibil în funcția Edge.");

  const searchParams = new URLSearchParams({
    id: `eq.${itemId}`,
    internal_id: `eq.${internalId}`,
    status: "eq.archived",
    select: "id,internal_id",
  });
  const response = await fetch(`${supabaseUrl}/rest/v1/dezmembrari_items?${searchParams}`, {
    method: "DELETE",
    headers: {
      ...supabaseServiceHeaders(),
      prefer: "return=representation",
    },
  });
  if (!response.ok) throw new Error(`Ștergerea articolului din Supabase a eșuat (${response.status}).`);

  const rows = await response.json();
  return Array.isArray(rows)
    && rows.length === 1
    && Number(rows[0]?.id) === Number(itemId)
    && rows[0]?.internal_id === internalId;
}

/* incarca secvential imaginea principala si thumbnail-ul in Cloudflare R2 */
async function uploadPreparedPhotoToR2(upload: PreparedUpload): Promise<Record<string, unknown>> {
  const credentials = readR2Credentials();
  const client = createR2Client(credentials);
  const position = String(upload.sortOrder + 1).padStart(2, "0");
  const mainKey = `${upload.internalId}/${position}.jpg`;
  const thumbnailKey = `${upload.internalId}/${position}-thumb.jpg`;

  try {
    await client.send(new PutObjectCommand({
      Bucket: credentials.bucketName,
      Key: mainKey,
      Body: new Uint8Array(await upload.compressedImage.arrayBuffer()),
      ContentType: upload.compressedImage.type,
    }));
    await client.send(new PutObjectCommand({
      Bucket: credentials.bucketName,
      Key: thumbnailKey,
      Body: new Uint8Array(await upload.thumbnail.arrayBuffer()),
      ContentType: upload.thumbnail.type,
    }));

    return {
      action: "upload_photo",
      storage_provider: "r2",
      item_id: upload.itemId,
      internal_id: upload.internalId,
      sort_order: upload.sortOrder,
      is_primary: upload.isPrimary,
      main: {
        key: mainKey,
        url: r2ObjectUrl(credentials, mainKey),
        mime_type: upload.compressedImage.type,
        size_bytes: upload.compressedImage.size,
      },
      thumbnail: {
        key: thumbnailKey,
        url: r2ObjectUrl(credentials, thumbnailKey),
        mime_type: upload.thumbnail.type,
        size_bytes: upload.thumbnail.size,
      },
    };
  } finally {
    client.destroy();
  }
}

/* verifica temporar scrierea, citirea si stergerea unui obiect mic in R2 */
async function testR2Connection(): Promise<Record<string, unknown>> {
  const objectKey = `connectivity-tests/test-r2-${crypto.randomUUID()}.txt`;
  const expectedContent = "Dezmembrari Edge Function - Cloudflare R2 connectivity test.";
  let credentials: R2Credentials | null = null;
  let client: S3Client | null = null;
  let stage = "configuration";
  let uploaded = false;
  let read = false;
  let deleted = false;

  try {
    credentials = readR2Credentials();
    client = createR2Client(credentials);

    stage = "upload";
    await client.send(new PutObjectCommand({
      Bucket: credentials.bucketName,
      Key: objectKey,
      Body: expectedContent,
      ContentType: "text/plain; charset=utf-8",
    }));
    uploaded = true;

    stage = "read";
    const downloaded = await client.send(new GetObjectCommand({
      Bucket: credentials.bucketName,
      Key: objectKey,
    }));
    const actualContent = await downloaded.Body?.transformToString();
    read = actualContent === expectedContent;
    if (!read) throw new Error("Conținutul citit din R2 nu corespunde obiectului încărcat.");

    stage = "delete";
    await client.send(new DeleteObjectCommand({
      Bucket: credentials.bucketName,
      Key: objectKey,
    }));
    deleted = true;

    return {
      success: true,
      action: "test_r2",
      bucket: credentials.bucketName,
      object_key: objectKey,
      uploaded,
      read,
      deleted,
      message: "Conexiunea R2 funcționează: obiectul a fost încărcat, citit și șters.",
    };
  } catch (error) {
    if (client && credentials && uploaded && !deleted) {
      try {
        await client.send(new DeleteObjectCommand({
          Bucket: credentials.bucketName,
          Key: objectKey,
        }));
        deleted = true;
      } catch (cleanupError) {
        console.error(
          "Curățare test Cloudflare R2:",
          cleanupError instanceof Error ? cleanupError.message : cleanupError,
        );
      }
    }

    return {
      success: false,
      action: "test_r2",
      failed_stage: stage,
      bucket: credentials?.bucketName || null,
      object_key: objectKey,
      uploaded,
      read,
      deleted,
      message: error instanceof Error ? error.message : "Testul conexiunii R2 a eșuat.",
    };
  } finally {
    client?.destroy();
  }
}

/* obtine tokenul Google temporar pentru aceasta cerere */
async function getDriveAccessToken(credentials: DriveUploadCredentials): Promise<string> {
  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: credentials.clientId,
      client_secret: credentials.clientSecret,
      refresh_token: credentials.refreshToken,
      grant_type: "refresh_token",
    }),
  });

  if (!response.ok) throw new Error(`Google OAuth a refuzat autentificarea (${response.status}).`);
  const data = await response.json();
  if (typeof data.access_token !== "string") {
    throw new Error("Google OAuth nu a returnat un token de acces.");
  }

  return data.access_token;
}

/* transmite imaginea privata din Drive numai utilizatorului HUB autorizat */
async function fetchPrivateDriveImage(
  request: Request,
  accessToken: string,
  fileId: string,
  fallbackMimeType: string,
): Promise<Response> {
  const searchParams = new URLSearchParams({ alt: "media", supportsAllDrives: "true" });
  const response = await fetch(`${DRIVE_FILES_URL}/${encodeURIComponent(fileId)}?${searchParams}`, {
    headers: { authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok || !response.body) {
    throw new Error(`Citirea imaginii private din Google Drive a eșuat (${response.status}).`);
  }

  const googleContentType = response.headers.get("content-type")?.split(";")[0].trim() || "";
  const contentType = ALLOWED_IMAGE_TYPES.has(googleContentType) ? googleContentType : fallbackMimeType;
  if (!ALLOWED_IMAGE_TYPES.has(contentType)) {
    throw new Error("Fișierul solicitat nu este o imagine acceptată.");
  }

  const headers = new Headers(corsHeaders(request));
  headers.set("content-type", contentType);
  headers.set("cache-control", "private, max-age=300");
  headers.set("x-content-type-options", "nosniff");

  return new Response(response.body, {
    status: 200,
    headers,
  });
}

/* protejeaza valorile folosite la cautarea fisierelor in Drive */
function escapeDriveQueryValue(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
}

/* cauta fisierul determinist pentru a evita duplicatele la reincercare */
async function findDriveFile(
  accessToken: string,
  folderId: string,
  fileName: string,
): Promise<DriveUploadedFile | null> {
  const query = [
    `'${escapeDriveQueryValue(folderId)}' in parents`,
    `name = '${escapeDriveQueryValue(fileName)}'`,
    "trashed = false",
  ].join(" and ");
  const searchParams = new URLSearchParams({
    q: query,
    fields: "files(id,name,mimeType,size,webViewLink,webContentLink)",
    pageSize: "1",
    spaces: "drive",
    supportsAllDrives: "true",
    includeItemsFromAllDrives: "true",
  });
  const response = await fetch(`${DRIVE_FILES_URL}?${searchParams}`, {
    headers: { authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) throw new Error(`Căutarea imaginii în Google Drive a eșuat (${response.status}).`);
  const data = await response.json();
  return Array.isArray(data.files) && data.files.length > 0 ? data.files[0] : null;
}

/* creeaza corpul multipart cerut de API-ul Google Drive */
function createDriveMultipartBody(metadata: Record<string, unknown>, file: File, boundary: string): Blob {
  return new Blob([
    `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n`,
    JSON.stringify(metadata),
    `\r\n--${boundary}\r\nContent-Type: ${file.type}\r\n\r\n`,
    file,
    `\r\n--${boundary}--`,
  ]);
}

/* creeaza sau actualizeaza imaginea din folderul articolului */
async function uploadDriveFile(
  accessToken: string,
  folderId: string,
  file: File,
  fileName: string,
  appProperties: Record<string, string>,
): Promise<DriveUploadedFile> {
  const existingFile = await findDriveFile(accessToken, folderId, fileName);
  const metadata: Record<string, unknown> = {
    name: fileName,
    appProperties,
  };
  if (!existingFile) metadata.parents = [folderId];

  const boundary = `hub_${crypto.randomUUID().replace(/-/g, "")}`;
  const searchParams = new URLSearchParams({
    uploadType: "multipart",
    supportsAllDrives: "true",
    fields: "id,name,mimeType,size,webViewLink,webContentLink",
  });
  const endpoint = existingFile
    ? `${DRIVE_UPLOAD_URL}/${existingFile.id}?${searchParams}`
    : `${DRIVE_UPLOAD_URL}?${searchParams}`;
  const response = await fetch(endpoint, {
    method: existingFile ? "PATCH" : "POST",
    headers: {
      authorization: `Bearer ${accessToken}`,
      "content-type": `multipart/related; boundary=${boundary}`,
    },
    body: createDriveMultipartBody(metadata, file, boundary),
  });

  if (!response.ok) throw new Error(`Încărcarea imaginii în Google Drive a eșuat (${response.status}).`);
  const uploadedFile = await response.json();
  if (typeof uploadedFile.id !== "string") {
    throw new Error("Google Drive nu a returnat identificatorul imaginii.");
  }

  return uploadedFile;
}

/* construieste URL-ul Drive fara a face fisierul public */
function driveFileUrl(file: DriveUploadedFile): string {
  return file.webViewLink || `https://drive.google.com/file/d/${file.id}/view`;
}

/* stabileste extensia sigura pentru fisierele deja validate */
function driveFileExtension(file: File): string {
  return file.type === "image/webp" ? "webp" : "jpg";
}

/* endpointul autentificat pentru testarea folderului si uploadul foto */
Deno.serve(async (request: Request) => {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders(request) });
  }
  if (request.method !== "POST") {
    return jsonResponse(request, 405, { error: "METHOD_NOT_ALLOWED" });
  }

  try {
    const user = await authenticateHubUser(request);
    if (!user) return jsonResponse(request, 401, { error: "UNAUTHENTICATED" });
    const isAuthorized = await authorizeDezmembrariUser(request, user.id);
    if (!isAuthorized) return jsonResponse(request, 403, { error: "FORBIDDEN" });

    const jsonAction = await parseJsonActionRequest(request);
    if (jsonAction?.action === "test_r2") {
      const result = await testR2Connection();
      return jsonResponse(request, result.success === true ? 200 : 502, result);
    }

    if (jsonAction?.action === "r2_storage_status") {
      const canManage = await authorizeDezmembrariManager(request, user.id);
      if (!canManage) return jsonResponse(request, 403, { error: "DEZMEMBRARI_MANAGE_REQUIRED" });

      const status = await getR2StorageStatus();
      return jsonResponse(request, 200, {
        action: jsonAction.action,
        used_bytes: status.usedBytes,
        free_tier_limit_bytes: R2_FREE_TIER_BYTES,
        remaining_bytes: status.remainingBytes,
        percentage_used: status.percentageUsed,
        object_count: status.objectCount,
        measured_at: new Date().toISOString(),
        scope: "configured_bucket",
      });
    }

    if (jsonAction?.action === "get_r2_signed_url") {
      const mimeType = await authorizeR2PhotoObject(request, jsonAction.itemId, jsonAction.objectKey);
      if (!mimeType) return jsonResponse(request, 404, { error: "R2_OBJECT_NOT_FOUND_OR_FORBIDDEN" });

      const signedUrl = await createR2SignedGetUrl(jsonAction.objectKey);
      return jsonResponse(request, 200, {
        action: jsonAction.action,
        object_key: jsonAction.objectKey,
        url: signedUrl,
        expires_in: R2_SIGNED_URL_TTL_SECONDS,
        expires_at: new Date(Date.now() + R2_SIGNED_URL_TTL_SECONDS * 1000).toISOString(),
      });
    }

    if (jsonAction?.action === "delete_r2_photo") {
      const canManage = await authorizeDezmembrariManager(request, user.id);
      if (!canManage) return jsonResponse(request, 403, { error: "DEZMEMBRARI_MANAGE_REQUIRED" });

      const photoKeys = await getAuthorizedR2PhotoKeys(request, jsonAction.itemId, jsonAction.photoId);
      if (!photoKeys) return jsonResponse(request, 404, { error: "R2_PHOTO_NOT_FOUND_OR_FORBIDDEN" });

      await deletePhotoObjectsFromR2(photoKeys.mainKey, photoKeys.thumbnailKey);
      return jsonResponse(request, 200, {
        action: jsonAction.action,
        item_id: jsonAction.itemId,
        photo_id: jsonAction.photoId,
        deleted: true,
        object_keys: [photoKeys.mainKey, photoKeys.thumbnailKey],
      });
    }

    if (jsonAction?.action === "permanently_delete_archived_item") {
      const isAdmin = await authorizeHubAdmin(user.id);
      if (!isAdmin) return jsonResponse(request, 403, { error: "ADMIN_REQUIRED" });

      const archivedItem = await findArchivedItemForPermanentDelete(jsonAction.itemId, jsonAction.internalId);
      if (!archivedItem) {
        return jsonResponse(request, 409, {
          error: "ITEM_NOT_ARCHIVED_OR_NOT_FOUND",
          message: "Ștergerea definitivă este permisă numai pentru un articol arhivat existent.",
        });
      }

      /* baza de date ramane intacta daca listarea sau stergerea R2 esueaza */
      const deletedObjectKeys = await deleteItemPrefixFromR2(archivedItem.internal_id);
      const itemDeleted = await deleteArchivedItemFromSupabase(String(archivedItem.id), archivedItem.internal_id);
      if (!itemDeleted) {
        throw new Error("R2 a fost curățat, dar articolul nu a fost confirmat ca șters din Supabase.");
      }

      return jsonResponse(request, 200, {
        action: jsonAction.action,
        item_id: String(archivedItem.id),
        internal_id: archivedItem.internal_id,
        deleted: true,
        deleted_r2_objects: deletedObjectKeys.length,
      });
    }

    if (jsonAction?.action === "view_file") {
      const mimeType = await authorizeDrivePhotoFile(request, jsonAction.itemId, jsonAction.fileId);
      if (!mimeType) return jsonResponse(request, 404, { error: "PHOTO_NOT_FOUND_OR_FORBIDDEN" });

      const accessToken = await getDriveAccessToken(readDriveUploadCredentials());
      return await fetchPrivateDriveImage(request, accessToken, jsonAction.fileId, mimeType);
    }

    if (jsonAction?.action === "test_folder") {
      const itemExists = await verifyDezmembrariItem(request, jsonAction.itemId, jsonAction.internalId);
      if (!itemExists) return jsonResponse(request, 404, { error: "ITEM_NOT_FOUND_OR_FORBIDDEN" });

      const folder = await getOrCreateDriveFolder(jsonAction.internalId);
      return jsonResponse(request, 200, {
        action: jsonAction.action,
        item_id: jsonAction.itemId,
        internal_id: jsonAction.internalId,
        folder_id: folder.id,
        folder_name: folder.name,
        created: folder.created,
      });
    }

    const upload = await parsePreparedUpload(request);
    const itemExists = await verifyDezmembrariItem(request, upload.itemId, upload.internalId);
    if (!itemExists) return jsonResponse(request, 404, { error: "ITEM_NOT_FOUND_OR_FORBIDDEN" });

    try {
      const r2Upload = await uploadPreparedPhotoToR2(upload);
      return jsonResponse(request, 200, r2Upload);
    } catch (r2Error) {
      if (upload.requireR2) {
        throw new Error(`Încărcarea fotografiei în Cloudflare R2 a eșuat: ${
          r2Error instanceof Error ? r2Error.message : "eroare necunoscută"
        }`);
      }
      console.error(
        "Upload Cloudflare R2 eșuat; se folosește fallback-ul Google Drive:",
        r2Error instanceof Error ? r2Error.message : r2Error,
      );
    }

    const folder = await getOrCreateDriveFolder(upload.internalId);
    const accessToken = await getDriveAccessToken(readDriveUploadCredentials());
    const position = String(upload.sortOrder + 1).padStart(2, "0");
    const baseName = `${upload.internalId}-${position}`;
    const commonProperties = {
      hub_module: "dezmembrari",
      item_id: upload.itemId,
      internal_id: upload.internalId,
      sort_order: String(upload.sortOrder),
      is_primary: String(upload.isPrimary),
    };
    const mainFile = await uploadDriveFile(
      accessToken,
      folder.id,
      upload.compressedImage,
      `${baseName}.${driveFileExtension(upload.compressedImage)}`,
      { ...commonProperties, variant: "main" },
    );
    const thumbnailFile = await uploadDriveFile(
      accessToken,
      folder.id,
      upload.thumbnail,
      `${baseName}-thumb.${driveFileExtension(upload.thumbnail)}`,
      { ...commonProperties, variant: "thumbnail" },
    );

    return jsonResponse(request, 200, {
      action: "upload_photo",
      storage_provider: "google_drive",
      item_id: upload.itemId,
      internal_id: upload.internalId,
      folder_id: folder.id,
      folder_created: folder.created,
      sort_order: upload.sortOrder,
      is_primary: upload.isPrimary,
      main: {
        id: mainFile.id,
        name: mainFile.name,
        url: driveFileUrl(mainFile),
        mime_type: mainFile.mimeType || upload.compressedImage.type,
        size_bytes: Number(mainFile.size || upload.compressedImage.size),
      },
      thumbnail: {
        id: thumbnailFile.id,
        name: thumbnailFile.name,
        url: driveFileUrl(thumbnailFile),
        mime_type: thumbnailFile.mimeType || upload.thumbnail.type,
        size_bytes: Number(thumbnailFile.size || upload.thumbnail.size),
      },
    });
  } catch (error) {
    console.error("Pregătire upload foto Dezmembrări:", error instanceof Error ? error.message : error);
    return jsonResponse(request, 400, {
      error: "INVALID_UPLOAD_REQUEST",
      message: error instanceof Error ? error.message : "Cererea nu este validă.",
    });
  }
});
