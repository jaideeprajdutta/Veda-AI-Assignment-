import { Router } from "express";
import multer from "multer";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB (matches Figma)
});

const router = Router();

/**
 * POST /api/upload — extract text from an uploaded PDF/txt (optional feature).
 * Images (PNG/JPEG) are accepted by the form but not OCR'd here; we return an
 * empty sourceText so generation falls back to the typed instructions.
 */
router.post("/", upload.single("file"), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });
    const { mimetype, buffer, originalname } = req.file;
    const name = originalname.toLowerCase();

    let sourceText = "";
    if (mimetype === "application/pdf" || name.endsWith(".pdf")) {
      // Lazy import: pdf-parse runs module-level code we only want on demand.
      const pdf = (await import("pdf-parse")).default;
      const parsed = await pdf(buffer);
      sourceText = parsed.text;
    } else if (mimetype.startsWith("text/") || name.endsWith(".txt")) {
      sourceText = buffer.toString("utf8");
    } else if (mimetype.startsWith("image/")) {
      sourceText = ""; // no OCR; instructions drive generation
    } else {
      return res.status(415).json({ error: "Unsupported file type" });
    }

    return res.json({ sourceText: sourceText.slice(0, 20000) });
  } catch (err) {
    return next(err);
  }
});

export default router;
