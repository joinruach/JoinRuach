#!/usr/bin/env tsx
/**
 * Unified Review Server
 * Web-based review interface for Scripture, Canon, and Library content
 * Provides side-by-side comparison and approval workflow
 */

import express, { Request, Response } from "express";
import { readFile, writeFile, readdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

const app = express();
const PORT = process.env.REVIEW_PORT || 4000;

// Middleware
app.use(express.json());
app.use(express.static(join(__dirname, "public")));

// Review status storage
interface ReviewStatus {
  [bookId: string]: {
    status: "pending" | "approved" | "rejected";
    reviewer?: string;
    timestamp?: string;
    checklist?: {
      content_complete: boolean;
      content_accurate: boolean;
      formatting_preserved: boolean;
      no_duplicates: boolean;
      special_chars_correct: boolean;
    };
    notes?: string;
    reason?: string;
  };
}

const REVIEW_STATUS_FILE = join(__dirname, "review-status.json");

/**
 * Load review status from file
 */
async function loadReviewStatus(): Promise<ReviewStatus> {
  try {
    if (existsSync(REVIEW_STATUS_FILE)) {
      const data = await readFile(REVIEW_STATUS_FILE, "utf-8");
      return JSON.parse(data);
    }
  } catch (error) {
    console.error("Error loading review status:", error);
  }
  return {};
}

/**
 * Save review status to file
 */
async function saveReviewStatus(status: ReviewStatus): Promise<void> {
  await writeFile(REVIEW_STATUS_FILE, JSON.stringify(status, null, 2));
}

/**
 * Get list of extractable content
 */
app.get("/api/extractions", async (req: Request, res: Response) => {
  try {
    const extractionsDir = join(__dirname, "../../extractions");
    const dirs = await readdir(extractionsDir, { withFileTypes: true });

    const extractions = dirs
      .filter((d) => d.isDirectory())
      .map((d) => ({
        id: d.name,
        name: d.name,
        path: join(extractionsDir, d.name),
      }));

    res.json(extractions);
  } catch (error) {
    res.status(500).json({ error: "Failed to list extractions" });
  }
});

/**
 * Get extraction metadata
 */
app.get("/api/extractions/:id/metadata", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const metadataPath = join(
      __dirname,
      "../../extractions",
      id,
      "extraction-metadata.json"
    );

    if (!existsSync(metadataPath)) {
      return res.status(404).json({ error: "Metadata not found" });
    }

    const metadata = JSON.parse(await readFile(metadataPath, "utf-8"));
    res.json(metadata);
  } catch (error) {
    res.status(500).json({ error: "Failed to load metadata" });
  }
});

/**
 * Get scripture works for review
 */
app.get("/api/extractions/:id/works", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const worksPath = join(__dirname, "../../extractions", id, "works.json");

    if (!existsSync(worksPath)) {
      return res.status(404).json({ error: "Works not found" });
    }

    const works = JSON.parse(await readFile(worksPath, "utf-8"));
    res.json(works);
  } catch (error) {
    res.status(500).json({ error: "Failed to load works" });
  }
});

/**
 * Get verses for a specific book/chapter
 */
app.get(
  "/api/extractions/:id/verses/:workId",
  async (req: Request, res: Response) => {
    try {
      const { id, workId } = req.params;
      const { chapter } = req.query;

      // Load all verse chunks
      const extractionDir = join(__dirname, "../../extractions", id);
      const files = await readdir(extractionDir);
      const verseFiles = files.filter(
        (f) => f.startsWith("verses_chunk_") && f.endsWith(".json")
      );

      let allVerses: any[] = [];
      for (const file of verseFiles) {
        const verses = JSON.parse(
          await readFile(join(extractionDir, file), "utf-8")
        );
        allVerses = allVerses.concat(verses);
      }

      // Filter by work and optionally chapter
      let filtered = allVerses.filter((v) => v.work_id === workId || v.work === workId);
      if (chapter) {
        filtered = filtered.filter((v) => v.chapter === parseInt(chapter as string));
      }

      // Sort by chapter and verse
      filtered.sort((a, b) => {
        if (a.chapter !== b.chapter) return a.chapter - b.chapter;
        return a.verse - b.verse;
      });

      res.json(filtered);
    } catch (error) {
      res.status(500).json({ error: "Failed to load verses" });
    }
  }
);

/**
 * Get validation report
 */
app.get("/api/extractions/:id/validation", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const validationPath = join(
      __dirname,
      "../../extractions",
      id,
      "validation-report.json"
    );

    if (!existsSync(validationPath)) {
      return res.status(404).json({ error: "Validation report not found" });
    }

    const validation = JSON.parse(await readFile(validationPath, "utf-8"));
    res.json(validation);
  } catch (error) {
    res.status(500).json({ error: "Failed to load validation report" });
  }
});

/**
 * Get review status
 */
app.get("/api/review-status", async (req: Request, res: Response) => {
  try {
    const status = await loadReviewStatus();
    res.json(status);
  } catch (error) {
    res.status(500).json({ error: "Failed to load review status" });
  }
});

/**
 * Get review status for specific book
 */
app.get("/api/review-status/:bookId", async (req: Request, res: Response) => {
  try {
    const { bookId } = req.params;
    const status = await loadReviewStatus();
    res.json(status[bookId] || { status: "pending" });
  } catch (error) {
    res.status(500).json({ error: "Failed to load review status" });
  }
});

/**
 * Approve book
 */
app.post("/api/review/:bookId/approve", async (req: Request, res: Response) => {
  try {
    const { bookId } = req.params;
    const { reviewer, checklist, notes } = req.body;

    const status = await loadReviewStatus();

    status[bookId] = {
      status: "approved",
      reviewer,
      timestamp: new Date().toISOString(),
      checklist,
      notes,
    };

    await saveReviewStatus(status);

    console.log(`✅ Book approved: ${bookId} by ${reviewer}`);

    res.json({ success: true, status: status[bookId] });
  } catch (error) {
    res.status(500).json({ error: "Failed to approve book" });
  }
});

/**
 * Reject book
 */
app.post("/api/review/:bookId/reject", async (req: Request, res: Response) => {
  try {
    const { bookId } = req.params;
    const { reviewer, reason, notes } = req.body;

    const status = await loadReviewStatus();

    status[bookId] = {
      status: "rejected",
      reviewer,
      timestamp: new Date().toISOString(),
      reason,
      notes,
    };

    await saveReviewStatus(status);

    console.log(`❌ Book rejected: ${bookId} by ${reviewer}`);

    res.json({ success: true, status: status[bookId] });
  } catch (error) {
    res.status(500).json({ error: "Failed to reject book" });
  }
});

/**
 * Reset review status for a book
 */
app.post("/api/review/:bookId/reset", async (req: Request, res: Response) => {
  try {
    const { bookId } = req.params;
    const status = await loadReviewStatus();

    if (status[bookId]) {
      delete status[bookId];
      await saveReviewStatus(status);
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to reset review status" });
  }
});

/**
 * Get review summary
 */
app.get("/api/review-summary", async (req: Request, res: Response) => {
  try {
    const status = await loadReviewStatus();

    const summary = {
      total: Object.keys(status).length,
      approved: Object.values(status).filter((s) => s.status === "approved").length,
      rejected: Object.values(status).filter((s) => s.status === "rejected").length,
      pending: Object.values(status).filter((s) => s.status === "pending").length,
    };

    res.json(summary);
  } catch (error) {
    res.status(500).json({ error: "Failed to generate summary" });
  }
});

/**
 * Health check
 */
app.get("/health", (req: Request, res: Response) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

/**
 * Main review UI (HTML)
 */
app.get("/", (req: Request, res: Response) => {
  res.send(`
<!DOCTYPE html>
<html>
<head>
    <title>Unified Content Review</title>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            background: #f5f5f5;
            padding: 20px;
        }
        .container { max-width: 1400px; margin: 0 auto; }
        h1 { margin-bottom: 20px; color: #333; }
        .stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            margin-bottom: 30px;
        }
        .stat-card {
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .stat-value { font-size: 32px; font-weight: bold; color: #0066cc; }
        .stat-label { color: #666; margin-top: 5px; }
        .books-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
            gap: 15px;
        }
        .book-card {
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            border-left: 4px solid #ddd;
        }
        .book-card.pending { border-left-color: #ffc107; }
        .book-card.approved { border-left-color: #4caf50; }
        .book-card.rejected { border-left-color: #f44336; }
        .book-title { font-size: 18px; font-weight: bold; margin-bottom: 10px; }
        .book-status {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 12px;
            font-size: 12px;
            font-weight: bold;
            text-transform: uppercase;
        }
        .status-pending { background: #fff3cd; color: #856404; }
        .status-approved { background: #d4edda; color: #155724; }
        .status-rejected { background: #f8d7da; color: #721c24; }
        .actions { margin-top: 15px; display: flex; gap: 10px; }
        button {
            padding: 8px 16px;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 500;
        }
        .btn-review { background: #0066cc; color: white; }
        .btn-approve { background: #4caf50; color: white; }
        .btn-reject { background: #f44336; color: white; }
        .btn-reset { background: #999; color: white; }
        button:hover { opacity: 0.9; }
        .loading { text-align: center; padding: 40px; color: #666; }
    </style>
</head>
<body>
    <div class="container">
        <h1>📖 Unified Content Review</h1>

        <div class="stats">
            <div class="stat-card">
                <div class="stat-value" id="stat-total">-</div>
                <div class="stat-label">Total Books</div>
            </div>
            <div class="stat-card">
                <div class="stat-value" id="stat-approved">-</div>
                <div class="stat-label">Approved</div>
            </div>
            <div class="stat-card">
                <div class="stat-value" id="stat-rejected">-</div>
                <div class="stat-label">Rejected</div>
            </div>
            <div class="stat-card">
                <div class="stat-value" id="stat-pending">-</div>
                <div class="stat-label">Pending Review</div>
            </div>
        </div>

        <div id="books-container" class="books-grid">
            <div class="loading">Loading...</div>
        </div>
    </div>

    <script>
        async function loadReviewData() {
            try {
                const [works, status, summary] = await Promise.all([
                    fetch('/api/extractions/latest/works').then(r => r.json()),
                    fetch('/api/review-status').then(r => r.json()),
                    fetch('/api/review-summary').then(r => r.json())
                ]);

                // Update stats
                document.getElementById('stat-total').textContent = summary.total || 0;
                document.getElementById('stat-approved').textContent = summary.approved || 0;
                document.getElementById('stat-rejected').textContent = summary.rejected || 0;
                document.getElementById('stat-pending').textContent = summary.pending || 0;

                // Render books
                const container = document.getElementById('books-container');
                container.innerHTML = works.map(work => {
                    const bookStatus = status[work.workId] || { status: 'pending' };
                    return \`
                        <div class="book-card \${bookStatus.status}">
                            <div class="book-title">\${work.canonicalName}</div>
                            <div>
                                <span class="book-status status-\${bookStatus.status}">
                                    \${bookStatus.status}
                                </span>
                            </div>
                            <div style="margin-top: 10px; font-size: 14px; color: #666;">
                                \${work.totalChapters} chapters • \${work.totalVerses} verses
                            </div>
                            \${bookStatus.reviewer ? \`
                                <div style="margin-top: 10px; font-size: 12px; color: #999;">
                                    By \${bookStatus.reviewer} • \${new Date(bookStatus.timestamp).toLocaleDateString()}
                                </div>
                            \` : ''}
                            <div class="actions">
                                <button class="btn-review" onclick="reviewBook('\${work.workId}', '\${work.canonicalName}')">
                                    Review
                                </button>
                                \${bookStatus.status !== 'approved' ? \`
                                    <button class="btn-approve" onclick="approveBook('\${work.workId}', '\${work.canonicalName}')">
                                        ✓ Approve
                                    </button>
                                \` : ''}
                                \${bookStatus.status !== 'rejected' ? \`
                                    <button class="btn-reject" onclick="rejectBook('\${work.workId}', '\${work.canonicalName}')">
                                        ✗ Reject
                                    </button>
                                \` : ''}
                                <button class="btn-reset" onclick="resetBook('\${work.workId}')">
                                    Reset
                                </button>
                            </div>
                        </div>
                    \`;
                }).join('');
            } catch (error) {
                console.error('Failed to load review data:', error);
                document.getElementById('books-container').innerHTML =
                    '<div class="loading">Error loading data</div>';
            }
        }

        function reviewBook(workId, bookName) {
            window.location.href = \`/review/\${workId}\`;
        }

        async function approveBook(workId, bookName) {
            const reviewer = prompt('Your name:');
            if (!reviewer) return;

            const notes = prompt('Notes (optional):');

            try {
                await fetch(\`/api/review/\${workId}/approve\`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        reviewer,
                        notes,
                        checklist: {
                            content_complete: true,
                            content_accurate: true,
                            formatting_preserved: true,
                            no_duplicates: true,
                            special_chars_correct: true
                        }
                    })
                });
                alert(\`✅ \${bookName} approved!\`);
                loadReviewData();
            } catch (error) {
                alert('Failed to approve book');
            }
        }

        async function rejectBook(workId, bookName) {
            const reviewer = prompt('Your name:');
            if (!reviewer) return;

            const reason = prompt('Reason for rejection:');
            if (!reason) return;

            try {
                await fetch(\`/api/review/\${workId}/reject\`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ reviewer, reason })
                });
                alert(\`❌ \${bookName} rejected\`);
                loadReviewData();
            } catch (error) {
                alert('Failed to reject book');
            }
        }

        async function resetBook(workId) {
            if (!confirm('Reset review status?')) return;

            try {
                await fetch(\`/api/review/\${workId}/reset\`, { method: 'POST' });
                loadReviewData();
            } catch (error) {
                alert('Failed to reset status');
            }
        }

        // Load on page load
        loadReviewData();

        // Refresh every 30 seconds
        setInterval(loadReviewData, 30000);
    </script>
</body>
</html>
  `);
});

/**
 * Start server
 */
app.listen(PORT, () => {
  console.log(`\n📖 Unified Review Server`);
  console.log(`🌐 Open: http://localhost:${PORT}`);
  console.log(`📊 Status: http://localhost:${PORT}/api/review-summary`);
  console.log(`\n✨ Ready for content review!\n`);
});
