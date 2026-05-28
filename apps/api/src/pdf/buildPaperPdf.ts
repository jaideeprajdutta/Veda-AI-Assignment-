import PDFDocument from "pdfkit";
import { resolve } from "node:path";
import { existsSync } from "node:fs";
import { DIFFICULTY_LABELS, type Difficulty, type QuestionPaper } from "@vedaai/shared";

const INK = "#303030";
const SOFT = "#5E5E5E";
const MUTED = "#A9A9A9";
const RULE = "#DADADA";
const DIFF_COLOR: Record<Difficulty, string> = {
  easy: "#1F9D55",
  medium: "#E58A00",
  hard: "#D4373E",
};

// Fonts resolved relative to the api working dir (apps/api).
const fontDir = resolve(process.cwd(), "src/assets/fonts");
const FONT = {
  reg: resolve(fontDir, "BricolageGrotesque-Regular.ttf"),
  med: resolve(fontDir, "BricolageGrotesque-Medium.ttf"),
  sb: resolve(fontDir, "BricolageGrotesque-SemiBold.ttf"),
  bold: resolve(fontDir, "BricolageGrotesque-Bold.ttf"),
  xbold: resolve(fontDir, "BricolageGrotesque-ExtraBold.ttf"),
};

interface PdfOptions {
  includeAnswerKey: boolean;
}

/**
 * Render a question paper to a PDF that mirrors the on-screen design
 * (Bricolage Grotesque, centered header, stacked student info, inline
 * [Difficulty] … [Marks], optional answer key). Pipes to the response.
 */
export function streamPaperPdf(
  paper: QuestionPaper,
  stream: NodeJS.WritableStream,
  opts: PdfOptions
): void {
  const doc = new PDFDocument({ size: "A4", margin: 54 });
  doc.pipe(stream);

  // Register Bricolage weights (fall back to built-ins if a file is missing).
  const haveFonts = existsSync(FONT.reg);
  const F = {
    reg: haveFonts ? "Bric" : "Helvetica",
    med: haveFonts ? "Bric-Med" : "Helvetica",
    sb: haveFonts ? "Bric-SB" : "Helvetica-Bold",
    bold: haveFonts ? "Bric-Bold" : "Helvetica-Bold",
    xbold: haveFonts ? "Bric-XBold" : "Helvetica-Bold",
  };
  if (haveFonts) {
    doc.registerFont("Bric", FONT.reg);
    doc.registerFont("Bric-Med", FONT.med);
    doc.registerFont("Bric-SB", FONT.sb);
    doc.registerFont("Bric-Bold", FONT.bold);
    doc.registerFont("Bric-XBold", FONT.xbold);
  }

  const pageW = doc.page.width - doc.page.margins.left - doc.page.margins.right;
  const left = doc.page.margins.left;
  const rule = () => {
    doc.moveDown(0.35);
    const y = doc.y;
    doc.strokeColor(RULE).lineWidth(1).moveTo(left, y).lineTo(left + pageW, y).stroke();
    doc.moveDown(0.5);
  };

  // ---- Header ----
  doc
    .font(F.xbold)
    .fontSize(17)
    .fillColor(INK)
    .text(paper.header.schoolName || "Question Paper", { align: "center" });
  if (paper.header.subject) {
    doc.font(F.reg).fontSize(11).fillColor(INK).text(`Subject: ${paper.header.subject}`, { align: "center" });
  }
  if (paper.header.grade) {
    doc.font(F.reg).fontSize(11).fillColor(INK).text(`Class: ${paper.header.grade}`, { align: "center" });
  }

  doc.moveDown(0.7);
  const metaY = doc.y;
  doc.font(F.reg).fontSize(10).fillColor(INK);
  doc.text(`Time Allowed: ${paper.header.timeAllowedMins} minutes`, left, metaY);
  doc.text(`Maximum Marks: ${paper.header.totalMarks}`, left, metaY, { width: pageW, align: "right" });

  if (paper.header.instructions) {
    doc.moveDown(0.4);
    doc.font(F.reg).fontSize(9.5).fillColor(SOFT).text(paper.header.instructions, left);
  }
  rule();

  // ---- Student info (stacked) ----
  doc.font(F.reg).fontSize(10.5).fillColor(INK);
  doc.text("Name: ______________________________", left);
  doc.moveDown(0.35);
  doc.text("Roll Number: ____________________", left);
  doc.moveDown(0.35);
  doc.text(
    `${paper.header.grade ? `Class: ${paper.header.grade}    ` : "Class: ____    "}Section: ____________`,
    left
  );
  rule();

  // ---- Sections ----
  paper.sections.forEach((section) => {
    const [letter, ...rest] = section.title.split(/\s*[—–-]\s*/);
    const groupName = rest.join(" — ");

    doc.moveDown(0.5);
    doc.font(F.bold).fontSize(12).fillColor(INK).text(letter.trim().toUpperCase(), { align: "center" });
    if (groupName) {
      doc.moveDown(0.2);
      doc.font(F.bold).fontSize(10.5).fillColor(INK).text(groupName, left);
    }
    if (section.instruction) {
      doc.font(F.reg).fontSize(9.5).fillColor(SOFT).text(section.instruction, left);
    }
    doc.moveDown(0.3);

    section.questions.forEach((q) => {
      doc.font(F.reg).fontSize(10.5);
      // "N. " (ink) + "[Difficulty] " (colored) + text (ink) + " [N Marks]" (muted)
      doc.fillColor(INK).text(`${q.number}.  `, left, doc.y, { continued: true });
      doc
        .font(F.sb)
        .fillColor(DIFF_COLOR[q.difficulty])
        .text(`[${DIFFICULTY_LABELS[q.difficulty]}] `, { continued: true });
      doc.font(F.reg).fillColor(INK).text(q.text, { continued: true });
      doc
        .font(F.reg)
        .fillColor(MUTED)
        .text(`  [${q.marks} ${q.marks === 1 ? "Mark" : "Marks"}]`);

      if (q.options && q.options.length) {
        q.options.forEach((opt, i) => {
          doc.font(F.reg).fontSize(10).fillColor(SOFT).text(`      ${String.fromCharCode(65 + i)}.  ${opt}`, left);
        });
      }
      doc.moveDown(0.4);
    });
  });

  doc.moveDown(0.5);
  doc.font(F.bold).fontSize(10.5).fillColor(INK).text("End of Question Paper", left);

  // ---- Answer key (optional) ----
  if (opts.includeAnswerKey && paper.answerKey.length) {
    doc.addPage();
    doc.font(F.xbold).fontSize(14).fillColor(INK).text("Answer Key", left);
    rule();
    paper.answerKey.forEach((a) => {
      doc.font(F.reg).fontSize(10.5);
      doc.fillColor(INK).text(`${a.number}.  `, left, doc.y, { continued: true });
      doc.fillColor(SOFT).text(a.answer);
      doc.moveDown(0.25);
    });
  }

  doc.end();
}
