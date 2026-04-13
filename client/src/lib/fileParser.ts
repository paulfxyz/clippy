/**
 * @file fileParser.ts
 * @description Client-side file text extraction for Clippy.
 *
 * This module handles converting uploaded files (PDF, DOCX, TXT, MD) into
 * plain text strings that can be sent to AI models for analysis.
 *
 * ALL extraction happens in the browser — no file is ever uploaded to a server.
 * This is the core privacy guarantee of Clippy.
 *
 * Supported formats:
 *   - PDF  → pdfjs-dist (Mozilla's PDF.js)
 *   - DOCX → mammoth.js
 *   - TXT  → Web API File.text()
 *   - MD   → Web API File.text()
 *
 * Architecture note on dynamic imports:
 * Both pdfjs-dist and mammoth are lazy-loaded via dynamic import(). This means
 * the ~2MB combined library code is only downloaded when a user actually drops
 * a PDF or DOCX file — it doesn't bloat the initial bundle for plain text users.
 */

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

/**
 * Extracts plain text content from an uploaded file.
 *
 * Routes to the appropriate parser based on file extension (not MIME type,
 * because MIME types are unreliable across operating systems and browsers).
 *
 * @param file - The File object from the file input or drag-and-drop event
 * @returns Promise resolving to the extracted plain text content
 * @throws Error if the file format is unsupported or extraction fails
 */
export async function extractTextFromFile(file: File): Promise<string> {
  // Determine file type by extension (lowercase, without the leading dot)
  const ext = file.name.split(".").pop()?.toLowerCase();

  if (ext === "txt" || ext === "md") {
    // Native Web API — simplest case, no library needed
    return await file.text();
  }

  if (ext === "pdf") {
    return extractFromPDF(file);
  }

  if (ext === "docx") {
    return extractFromDOCX(file);
  }

  // Unknown extension: attempt UTF-8 text read as a last resort.
  // This handles edge cases like .contract, .legal, or extension-less files.
  // If the file is binary, this will return garbage, but the AI will simply
  // report it can't parse the content — no crash, no security issue.
  return await file.text();
}

// ---------------------------------------------------------------------------
// PDF extraction (pdfjs-dist)
// ---------------------------------------------------------------------------

/**
 * Extracts text from a PDF file using Mozilla's pdf.js library.
 *
 * How pdf.js works:
 * PDF files contain text in compressed binary streams. pdf.js decodes these
 * streams and provides a structured `TextContent` object per page, with
 * individual text items that represent characters, words, or lines.
 *
 * Worker strategy:
 * pdf.js requires a Web Worker to do the heavy decoding off the main thread.
 * Rather than bundling the worker (which adds ~400KB to the build), we load
 * it from the cdnjs CDN. This means:
 *   - Initial bundle stays small
 *   - Worker is cached by the browser after first use
 *   - Downside: requires internet access even for local installs
 *
 * Limitations:
 *   - Password-protected PDFs: pdf.js cannot decrypt without the user password.
 *     These will throw an error.
 *   - Scanned PDFs (images only): pdf.js can only extract text from text layers.
 *     A scanned PDF with no text layer will return empty strings per page.
 *     OCR is not implemented.
 *
 * @param file - PDF File object
 * @returns Promise resolving to the full text content of all pages
 */
async function extractFromPDF(file: File): Promise<string> {
  // Lazy import — only downloaded when needed
  const { getDocument, GlobalWorkerOptions } = await import("pdfjs-dist");

  // Point pdf.js at the CDN worker.
  // Version must match the installed pdfjs-dist npm package version.
  // Check package.json for the exact version if updating this URL.
  GlobalWorkerOptions.workerSrc =
    `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.9.155/pdf.worker.min.js`;

  // Convert File to ArrayBuffer — required by pdf.js
  const arrayBuffer = await file.arrayBuffer();

  // Load the PDF document (triggers worker initialization)
  const pdf = await getDocument({ data: arrayBuffer }).promise;

  const texts: string[] = [];

  // Iterate each page and extract its text content
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();

    // Each item in content.items is a TextItem with a `str` field.
    // Joining with spaces reconstructs the readable text flow.
    // Note: this loses precise layout (columns, tables) but preserves all words.
    const pageText = content.items
      .map((item: any) => item.str)
      .join(" ");

    texts.push(pageText);
  }

  // Separate pages with double newlines for readability and context
  return texts.join("\n\n");
}

// ---------------------------------------------------------------------------
// DOCX extraction (mammoth.js)
// ---------------------------------------------------------------------------

/**
 * Extracts raw text from a DOCX file using mammoth.js.
 *
 * DOCX format:
 * A .docx file is a ZIP archive containing XML files. The main content is in
 * `word/document.xml`. mammoth.js extracts the text from these XML elements,
 * stripping all formatting (bold, tables, headers, footers) and returning
 * pure paragraph text.
 *
 * Why mammoth over docx-parser alternatives:
 * mammoth is specifically designed for content extraction (vs. format conversion).
 * `extractRawText()` is the simplest API and produces the cleanest output for
 * AI model consumption — no HTML tags, no style noise.
 *
 * Limitations:
 *   - Table content: mammoth linearizes tables into plain text, which can lose
 *     structural context (e.g. a fee schedule table becomes a flat list of numbers)
 *   - Headers/footers: may or may not be included depending on the document structure
 *   - Embedded images: ignored (text only)
 *
 * @param file - DOCX File object
 * @returns Promise resolving to the extracted plain text content
 */
async function extractFromDOCX(file: File): Promise<string> {
  // Lazy import — only downloaded when needed
  const mammoth = await import("mammoth");

  const arrayBuffer = await file.arrayBuffer();

  // extractRawText returns { value: string, messages: Message[] }
  // We only need the text value for AI analysis
  const result = await mammoth.extractRawText({ arrayBuffer });

  return result.value;
}
