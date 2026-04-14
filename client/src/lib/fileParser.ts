/**
 * @file fileParser.ts
 * @description Client-side file text extraction for Clippy v3.0.1.
 *
 * This module handles converting uploaded files (PDF, DOCX, TXT, MD) into
 * plain text strings that can be sent to AI models for analysis.
 *
 * ALL extraction happens in the browser — no file is ever uploaded to a server.
 * This is the core privacy guarantee of Clippy.
 *
 * WHAT'S NEW IN v3.0.1
 * --------------------
 * - File size limit check (10MB) with a descriptive user-facing error
 * - Scanned PDF detection: warns if extracted text is suspiciously short
 *   (a PDF with no text layer returns empty strings per page — this is a
 *   common failure mode for scanned documents)
 * - Improved error messages for password-protected PDFs (pdfjs-dist throws a
 *   PasswordException — we catch it and surface a clear message)
 * - Explicit check for empty extraction result (DOCX or TXT with no content)
 *
 * SUPPORTED FORMATS
 * -----------------
 *   - PDF  → pdfjs-dist (Mozilla's PDF.js)
 *   - DOCX → mammoth.js
 *   - TXT  → Web API File.text()
 *   - MD   → Web API File.text()
 *
 * ARCHITECTURE NOTE: DYNAMIC IMPORTS
 * ------------------------------------
 * Both pdfjs-dist and mammoth are lazy-loaded via dynamic import(). This means
 * the ~2MB combined library code is only downloaded when a user actually drops
 * a PDF or DOCX file — it doesn't bloat the initial bundle for plain text users.
 *
 * LIMITATIONS
 * -----------
 * - Password-protected PDFs: pdf.js cannot decrypt without the user's password.
 *   These throw a PasswordException, which we surface as a clear error.
 * - Scanned PDFs (image-only): pdf.js can only extract text from text layers.
 *   A scanned PDF with no text layer returns empty strings. OCR is not implemented.
 * - DOCX table content: mammoth linearises tables into plain text, losing
 *   structural context (e.g., a fee schedule table becomes a flat list).
 */

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/**
 * Maximum file size accepted for analysis.
 * 10MB is a conservative limit that accommodates virtually all contract PDFs
 * while preventing accidentally uploading very large binary files that would
 * waste API tokens and produce poor analysis.
 */
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

/**
 * Minimum meaningful text length (characters) from a PDF.
 * If all pages combined yield fewer than this many characters, we warn the
 * user that the PDF may be scanned (image-only) rather than text-based.
 * Typical contracts have tens of thousands of characters.
 */
const SCANNED_PDF_THRESHOLD_CHARS = 100;

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

/**
 * Extracts plain text content from an uploaded file.
 *
 * Routes to the appropriate parser based on file extension (not MIME type,
 * because MIME types are unreliable across operating systems and browsers).
 *
 * ROUTING TABLE
 * -------------
 * .pdf    → extractFromPDF()   (pdfjs-dist, lazy-loaded)
 * .docx   → extractFromDOCX()  (mammoth.js, lazy-loaded)
 * .txt    → File.text()        (native Web API)
 * .md     → File.text()        (native Web API)
 * other   → File.text()        (last-resort fallback — binary files return garbage)
 *
 * @param file - The File object from the file input or drag-and-drop event
 * @returns Promise resolving to the extracted plain text content
 * @throws Error with a user-friendly message if the file is too large,
 *         password-protected, scanned-only, or in an unreadable format
 */
export async function extractTextFromFile(file: File): Promise<string> {
  // -------------------------------------------------------------------------
  // File size guard
  // Enforced before any parsing to avoid loading multi-MB PDFs into the
  // ArrayBuffer that pdfjs-dist uses — this would waste memory and time.
  // -------------------------------------------------------------------------
  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw new Error(
      `File is too large (${(file.size / 1024 / 1024).toFixed(1)} MB). ` +
      `Maximum supported size is 10 MB. For larger contracts, consider ` +
      `splitting the document or pasting the text directly.`
    );
  }

  // Determine file type by extension (lowercase, without the leading dot).
  // We use extension rather than MIME type because MIME types are unreliable:
  // some OSes report PDFs as "application/octet-stream", etc.
  const ext = file.name.split(".").pop()?.toLowerCase();

  if (ext === "txt" || ext === "md") {
    // Native Web API — simplest case, no library needed.
    // File.text() reads the file as UTF-8 text.
    const text = await file.text();
    if (!text.trim()) {
      throw new Error("The file appears to be empty. Please upload a contract with text content.");
    }
    return text;
  }

  if (ext === "pdf") {
    return extractFromPDF(file);
  }

  if (ext === "docx") {
    return extractFromDOCX(file);
  }

  // Unknown extension: attempt UTF-8 text read as a last resort.
  // This handles edge cases like .contract, .legal, or extension-less files.
  // If the file is binary, this will return garbled text — the AI will
  // simply report it can't parse the content. No crash, no security issue.
  return await file.text();
}

// ---------------------------------------------------------------------------
// PDF extraction (pdfjs-dist)
// ---------------------------------------------------------------------------

/**
 * Extracts text from a PDF file using Mozilla's pdf.js library.
 *
 * HOW PDF.JS WORKS
 * ----------------
 * PDF files contain text in compressed binary streams. pdf.js decodes these
 * streams and provides a structured `TextContent` object per page, with
 * individual text items that represent characters, words, or lines. We
 * concatenate these items with spaces and join pages with double newlines.
 *
 * WORKER STRATEGY
 * ---------------
 * pdf.js requires a Web Worker to do the heavy decoding off the main thread.
 * Rather than bundling the worker (~400KB), we load it from the cdnjs CDN.
 * This keeps the main bundle small but requires an internet connection.
 * The version MUST match the installed pdfjs-dist npm package version —
 * check package.json if you update pdfjs-dist.
 *
 * SCANNED PDF DETECTION
 * ---------------------
 * A scanned PDF (photographed pages, no text layer) passes through the pdf.js
 * pipeline without errors but returns empty or near-empty text per page.
 * We detect this by checking if the total extracted character count is below
 * SCANNED_PDF_THRESHOLD_CHARS and throw an informative error.
 *
 * LIMITATIONS
 * -----------
 * - Password-protected PDFs: pdf.js cannot decrypt without the user password.
 *   pdfjs-dist throws a PasswordException — we catch it and rethrow with a
 *   clear user-facing message.
 * - Scanned PDFs (image-only): no text layer to extract. OCR not implemented.
 * - Column layouts: items are extracted in logical reading order per pdf.js,
 *   but multi-column layouts may interleave text from adjacent columns.
 *
 * @param file - PDF File object
 * @returns Promise resolving to the full text content of all pages
 * @throws Error with a user-friendly message on failure
 */
async function extractFromPDF(file: File): Promise<string> {
  // Lazy import — only downloaded when a PDF file is actually dropped.
  // This saves ~800KB from the initial bundle for non-PDF users.
  const { getDocument, GlobalWorkerOptions } = await import("pdfjs-dist");

  // WORKER STRATEGY — blob URL approach
  // ─────────────────────────────────────────────────────────────────────────
  // pdfjs-dist v5 ships only .mjs worker files. When deployed on SiteGround
  // (nginx), .mjs files may be served as `application/octet-stream` instead
  // of `text/javascript`, causing browsers to refuse loading them as workers.
  //
  // Fix: fetch the worker script as text, wrap it in a Blob with the correct
  // MIME type ("text/javascript"), and pass a blob: URL to GlobalWorkerOptions.
  // This bypasses the server's MIME type entirely — the browser gets the script
  // content inline, with the MIME type we set, and loads it happily as a worker.
  //
  // Fallback: if the fetch fails (offline, CSP, etc.), we fall back to the
  // CDN version with a pinned version matching the installed pdfjs-dist.
  // ─────────────────────────────────────────────────────────────────────────
  const workerUrl = new URL(
    "pdfjs-dist/build/pdf.worker.min.mjs",
    import.meta.url
  ).toString();

  try {
    const workerResponse = await fetch(workerUrl);
    if (!workerResponse.ok) throw new Error(`Worker fetch failed: ${workerResponse.status}`);
    const workerText = await workerResponse.text();
    const workerBlob = new Blob([workerText], { type: "text/javascript" });
    const blobUrl = URL.createObjectURL(workerBlob);
    GlobalWorkerOptions.workerSrc = blobUrl;
  } catch {
    // Fallback: unpkg CDN with pinned version matching installed pdfjs-dist
    // (cdnjs only has up to 5.4.x; unpkg always has the exact version)
    GlobalWorkerOptions.workerSrc =
      `https://unpkg.com/pdfjs-dist@5.6.205/build/pdf.worker.min.mjs`;
  }

  // Convert File to ArrayBuffer — required by pdf.js
  const arrayBuffer = await file.arrayBuffer();

  // Load the PDF document (triggers worker initialization).
  // We catch PasswordException specifically to give a clear error message.
  let pdf: any;
  try {
    pdf = await getDocument({ data: arrayBuffer }).promise;
  } catch (err: any) {
    // pdf.js throws a PasswordException for password-protected PDFs.
    // The name property is "PasswordException" in pdfjs-dist.
    if (err?.name === "PasswordException" || err?.message?.includes("password")) {
      throw new Error(
        "This PDF is password-protected. pdf.js cannot extract text without the password. " +
        "Please remove the password protection before uploading, or copy-paste the contract text directly."
      );
    }
    // Re-throw other errors (corrupt PDF, unsupported format, etc.)
    throw new Error(`Failed to read PDF: ${err?.message || "unknown error"}`);
  }

  const texts: string[] = [];

  // Iterate each page and extract its text content.
  // Pages are 1-indexed in pdf.js.
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();

    // Each item in content.items is a TextItem with a `str` field.
    // Joining with spaces reconstructs the readable text flow.
    // This loses precise layout (columns, tables) but preserves all words.
    const pageText = content.items
      .map((item: any) => item.str)
      .join(" ");

    texts.push(pageText);
  }

  // Join pages with double newlines for readability and context preservation
  const fullText = texts.join("\n\n");

  // Scanned PDF detection: if the total extracted text is suspiciously short,
  // the PDF is likely scanned (image-only) with no text layer.
  // We warn the user rather than silently sending empty text to the AI.
  if (fullText.trim().length < SCANNED_PDF_THRESHOLD_CHARS) {
    throw new Error(
      `This PDF appears to be scanned (image-only) — very little text was extracted ` +
      `(${fullText.trim().length} characters across ${pdf.numPages} page(s)). ` +
      `Clippy requires a PDF with a text layer (i.e., a digitally-created or OCR-processed PDF). ` +
      `Try copying and pasting the contract text manually, or use a DOCX version if available.`
    );
  }

  return fullText;
}

// ---------------------------------------------------------------------------
// DOCX extraction (mammoth.js)
// ---------------------------------------------------------------------------

/**
 * Extracts raw text from a DOCX file using mammoth.js.
 *
 * DOCX FORMAT
 * -----------
 * A .docx file is a ZIP archive containing XML files. The main content is in
 * `word/document.xml`. mammoth.js extracts the text from these XML elements,
 * stripping all formatting (bold, tables, headers, footers) and returning
 * pure paragraph text joined with newlines.
 *
 * WHY MAMMOTH OVER ALTERNATIVES
 * ------------------------------
 * mammoth is specifically designed for content extraction (vs. format conversion).
 * `extractRawText()` is the simplest API and produces the cleanest output for
 * AI model consumption — no HTML tags, no style noise, no embedded images.
 *
 * LIMITATIONS
 * -----------
 * - Table content: mammoth linearises tables into plain text, which can lose
 *   structural context (e.g., a fee schedule table becomes a flat list).
 * - Headers/footers: may or may not be included depending on document structure.
 * - Embedded images: ignored (text only).
 * - Password-protected DOCX: mammoth will throw — not currently caught as a
 *   specific case, but the generic error message is still informative.
 *
 * @param file - DOCX File object
 * @returns Promise resolving to the extracted plain text content
 * @throws Error if the file is not a valid DOCX or extraction fails
 */
async function extractFromDOCX(file: File): Promise<string> {
  // Lazy import — only downloaded when a DOCX file is actually dropped.
  const mammoth = await import("mammoth");

  const arrayBuffer = await file.arrayBuffer();

  // extractRawText returns { value: string, messages: Message[] }
  // We only need the text value; messages contain warnings about unrecognised elements.
  let result: { value: string; messages: any[] };
  try {
    result = await mammoth.extractRawText({ arrayBuffer });
  } catch (err: any) {
    throw new Error(`Failed to read DOCX file: ${err?.message || "unknown error"}. ` +
      `Ensure the file is a valid .docx (not .doc). ` +
      `If the file is password-protected, remove the protection first.`);
  }

  // Check for empty result — an empty DOCX is technically valid but useless for analysis
  if (!result.value.trim()) {
    throw new Error(
      "No text could be extracted from this DOCX file. " +
      "The document may be empty, image-only, or in an unsupported format."
    );
  }

  return result.value;
}
