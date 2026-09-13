const DRIVE_FILE_SCOPE = "https://www.googleapis.com/auth/drive.file";
const DRIVE_FOLDER_MIME_TYPE = "application/vnd.google-apps.folder";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const DRIVE_FILES_URL = "https://www.googleapis.com/drive/v3/files";

export type DriveFolder = {
  id: string;
  name: string;
  created: boolean;
};

type GoogleCredentials = {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
  rootFolderId: string;
};

/* citeste credentialele OAuth numai din secretele functiei Edge */
function readGoogleCredentials(): GoogleCredentials {
  const clientId = Deno.env.get("GOOGLE_OAUTH_CLIENT_ID")?.trim();
  const clientSecret = Deno.env.get("GOOGLE_OAUTH_CLIENT_SECRET")?.trim();
  const refreshToken = Deno.env.get("GOOGLE_OAUTH_REFRESH_TOKEN")?.trim();
  const rootFolderId = Deno.env.get("GOOGLE_DRIVE_ROOT_FOLDER_ID")?.trim();

  if (!clientId || !clientSecret || !refreshToken || !rootFolderId) {
    throw new Error("Configurația OAuth Google Drive a funcției Edge este incompletă.");
  }

  return { clientId, clientSecret, refreshToken, rootFolderId };
}

/* obtine un access token folosind refresh tokenul cu scope drive.file */
async function getGoogleAccessToken(credentials: GoogleCredentials): Promise<string> {
  const tokenBody = new URLSearchParams({
    client_id: credentials.clientId,
    client_secret: credentials.clientSecret,
    refresh_token: credentials.refreshToken,
    grant_type: "refresh_token",
  });
  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: tokenBody,
  });

  if (!response.ok) {
    throw new Error(`Google OAuth a refuzat autentificarea (${response.status}).`);
  }

  const tokenData = await response.json();
  const grantedScopes = typeof tokenData.scope === "string" ? tokenData.scope.split(" ") : [];
  if (grantedScopes.length > 0 && !grantedScopes.includes(DRIVE_FILE_SCOPE)) {
    throw new Error("Tokenul Google nu include scope-ul drive.file.");
  }
  if (typeof tokenData.access_token !== "string") {
    throw new Error("Google OAuth nu a returnat un token de acces.");
  }

  return tokenData.access_token;
}

/* protejeaza valorile introduse in expresiile de cautare Drive */
function escapeDriveQueryValue(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
}

/* cauta folderul DZ existent direct sub folderul radacina configurat */
async function findDriveFolder(
  accessToken: string,
  rootFolderId: string,
  internalId: string,
): Promise<DriveFolder | null> {
  const query = [
    `'${escapeDriveQueryValue(rootFolderId)}' in parents`,
    `name = '${escapeDriveQueryValue(internalId)}'`,
    `mimeType = '${DRIVE_FOLDER_MIME_TYPE}'`,
    "trashed = false",
  ].join(" and ");
  const searchParams = new URLSearchParams({
    q: query,
    fields: "files(id,name)",
    pageSize: "2",
    spaces: "drive",
    supportsAllDrives: "true",
    includeItemsFromAllDrives: "true",
  });
  const response = await fetch(`${DRIVE_FILES_URL}?${searchParams}`, {
    headers: { authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    throw new Error(`Căutarea folderului Google Drive a eșuat (${response.status}).`);
  }

  const data = await response.json();
  return Array.isArray(data.files) && data.files.length > 0
    ? { ...data.files[0], created: false }
    : null;
}

/* creeaza folderul DZ numai daca acesta nu a fost gasit */
async function createDriveFolder(
  accessToken: string,
  rootFolderId: string,
  internalId: string,
): Promise<DriveFolder> {
  const searchParams = new URLSearchParams({
    supportsAllDrives: "true",
    fields: "id,name",
  });
  const response = await fetch(`${DRIVE_FILES_URL}?${searchParams}`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${accessToken}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      name: internalId,
      mimeType: DRIVE_FOLDER_MIME_TYPE,
      parents: [rootFolderId],
      appProperties: { hub_module: "dezmembrari", internal_id: internalId },
    }),
  });

  if (!response.ok) {
    throw new Error(`Crearea folderului Google Drive a eșuat (${response.status}).`);
  }

  const folder = await response.json();
  return { ...folder, created: true };
}

/* punctul unic pregatit pentru obtinerea folderului unui articol DZ */
export async function getOrCreateDriveFolder(internalId: string): Promise<DriveFolder> {
  if (!/^DZ-\d{5,}$/i.test(internalId)) {
    throw new Error("ID-ul intern pentru folderul Drive nu este valid.");
  }

  const normalizedInternalId = internalId.toUpperCase();
  const credentials = readGoogleCredentials();
  const accessToken = await getGoogleAccessToken(credentials);
  const existingFolder = await findDriveFolder(
    accessToken,
    credentials.rootFolderId,
    normalizedInternalId,
  );

  return existingFolder || createDriveFolder(
    accessToken,
    credentials.rootFolderId,
    normalizedInternalId,
  );
}
