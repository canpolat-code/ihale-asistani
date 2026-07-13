import multer from "multer";

// Memory storage: uploaded files are parsed in-server and only the
// extracted structured data is persisted to Postgres, never raw bytes.
export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 },
});
