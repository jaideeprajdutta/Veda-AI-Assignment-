import { Router } from "express";
import { isValidObjectId } from "mongoose";
import { CreateAssignmentSchema } from "@vedaai/shared";
import { Assignment, assignmentToDTO } from "../models/Assignment";
import { QuestionPaper, paperToShape } from "../models/QuestionPaper";
import { getJobState } from "../queue/jobState";
import { enqueueGeneration } from "../queue/enqueue";
import { streamPaperPdf } from "../pdf/buildPaperPdf";

const router = Router();

/** POST /api/assignments — validate, store, enqueue generation. */
router.post("/", async (req, res, next) => {
  try {
    const parsed = CreateAssignmentSchema.safeParse(req.body);
    if (!parsed.success) {
      return res
        .status(400)
        .json({ error: "Validation failed", issues: parsed.error.flatten() });
    }
    const input = parsed.data;
    const doc = await Assignment.create({
      ...input,
      dueDate: new Date(input.dueDate),
    });
    const jobId = await enqueueGeneration(doc.id);
    return res.status(201).json({ assignmentId: doc.id, jobId });
  } catch (err) {
    return next(err);
  }
});

/** GET /api/assignments — list for the dashboard. */
router.get("/", async (_req, res, next) => {
  try {
    const docs = await Assignment.find().sort({ createdAt: -1 }).limit(100);
    return res.json(docs.map(assignmentToDTO));
  } catch (err) {
    return next(err);
  }
});

/** GET /api/assignments/:id — assignment + latest paper + job state. */
router.get("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) return res.status(404).json({ error: "Not found" });
    const doc = await Assignment.findById(id);
    if (!doc) return res.status(404).json({ error: "Not found" });
    const paperDocs = await QuestionPaper.find({ assignmentId: doc.id }).sort({ version: -1 });
    const versions = paperDocs.map((d) => ({
      version: d.version ?? 1,
      createdAt: (d.get("createdAt") as Date).toISOString(),
      model: d.model ?? undefined,
      paper: paperToShape(d),
    }));
    const job = doc.jobId ? await getJobState(doc.jobId) : null;
    return res.json({
      assignment: assignmentToDTO(doc),
      paper: versions[0]?.paper ?? null,
      versions,
      job,
    });
  } catch (err) {
    return next(err);
  }
});

/** GET /api/assignments/:id/pdf — stream the paper as a formatted PDF. */
router.get("/:id/pdf", async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) return res.status(404).json({ error: "Not found" });
    const doc = await Assignment.findById(id);
    if (!doc) return res.status(404).json({ error: "Not found" });

    const version = req.query.version ? Number(req.query.version) : undefined;
    const includeAnswerKey = req.query.answerKey === "true";
    const paperDoc = version
      ? await QuestionPaper.findOne({ assignmentId: doc.id, version })
      : await QuestionPaper.findOne({ assignmentId: doc.id }).sort({ version: -1 });
    if (!paperDoc) return res.status(404).json({ error: "No paper generated yet" });

    const base = (doc.title || doc.subject || "Assignment").replace(/[^a-z0-9 ]+/gi, "").trim() || "Assignment";
    const kind = includeAnswerKey ? "Question Paper + Key" : "Only Question Paper";
    const v = version ? ` v${version}` : "";
    // Content-Disposition needs ASCII; quoting handles the spaces.
    const fileName = `${base}${v} - ${kind}.pdf`;
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
    res.setHeader("Cache-Control", "no-store");
    streamPaperPdf(paperToShape(paperDoc), res, { includeAnswerKey });
  } catch (err) {
    return next(err);
  }
});

/** DELETE /api/assignments/:id/versions/:version — remove one paper version. */
router.delete("/:id/versions/:version", async (req, res, next) => {
  try {
    const { id, version } = req.params;
    if (!isValidObjectId(id)) return res.status(404).json({ error: "Not found" });
    const count = await QuestionPaper.countDocuments({ assignmentId: id });
    if (count <= 1) {
      return res.status(400).json({ error: "Can't delete the only version" });
    }
    const del = await QuestionPaper.findOneAndDelete({
      assignmentId: id,
      version: Number(version),
    });
    if (!del) return res.status(404).json({ error: "Version not found" });
    return res.json({ ok: true });
  } catch (err) {
    return next(err);
  }
});

/** DELETE /api/assignments/:id — remove an assignment and its papers. */
router.delete("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) return res.status(404).json({ error: "Not found" });
    const doc = await Assignment.findByIdAndDelete(id);
    if (!doc) return res.status(404).json({ error: "Not found" });
    await QuestionPaper.deleteMany({ assignmentId: id });
    return res.json({ ok: true });
  } catch (err) {
    return next(err);
  }
});

/** POST /api/assignments/:id/regenerate — re-run generation. */
router.post("/:id/regenerate", async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) return res.status(404).json({ error: "Not found" });
    const doc = await Assignment.findById(id);
    if (!doc) return res.status(404).json({ error: "Not found" });
    const jobId = await enqueueGeneration(doc.id, true);
    return res.json({ jobId });
  } catch (err) {
    return next(err);
  }
});

export default router;
