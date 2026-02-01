# Discernment Dashboard - Quick Reference

## Files Created

### Backend (4 files)
1. **Service** (850 lines)
   - `/ruach-ministries-backend/src/api/library/services/ruach-discernment.ts`
   - Core analysis engine, Claude integration, pattern detection

2. **Controller** (200 lines)
   - `/ruach-ministries-backend/src/api/ruach-discernment/controllers/ruach-discernment.ts`
   - HTTP request handlers

3. **Routes** (50 lines)
   - `/ruach-ministries-backend/src/api/ruach-discernment/routes/ruach-discernment.ts`
   - REST endpoint definitions

4. **Content Type** (80 lines)
   - `/ruach-ministries-backend/src/api/discernment-analysis/content-types/discernment-analysis/schema.json`
   - Database schema

### Frontend (2 files)
1. **Dashboard** (650 lines)
   - `/apps/ruach-next/src/app/[locale]/studio/discernment/page.tsx`
   - React UI component with 3 tabs

2. **Layout** (15 lines)
   - `/apps/ruach-next/src/app/[locale]/studio/discernment/layout.tsx`
   - Page layout wrapper

### Documentation (4 files)
1. DISCERNMENT_SYSTEM.md - Complete system guide
2. DISCERNMENT_INTEGRATION.md - Developer guide
3. DISCERNMENT_IMPLEMENTATION_SUMMARY.md - Overview
4. DISCERNMENT_QUICK_REF.md - This file

## Quick Start (5 minutes)

```bash
# 1. Set environment variable
echo "CLAUDE_API_KEY=sk-ant-your-key" >> .env

# 2. Start servers
npm run dev

# 3. Access dashboard
# http://localhost:3000/[locale]/studio/discernment

# 4. Submit content for analysis
# Click "Submit Analysis" and paste content
```

## Key Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/ruach-discernment/analyze` | Analyze content |
| GET | `/api/ruach-discernment/analyses` | List analyses |
| GET | `/api/ruach-discernment/analyses/:id` | Get details |
| PUT | `/api/ruach-discernment/analyses/:id` | Update status |
| POST | `/api/ruach-discernment/analyses/:id/publish` | Publish |
| POST | `/api/ruach-discernment/trend-report` | Trend data |

## Service Methods

```typescript
// Analyze content
const result = await discernmentService.analyzeContent(
  sourceTitle,
  sourceUrl,
  sourceContent,
  useClaudeAPI
);

// Get trend report
const trends = await discernmentService.generateTrendReport(
  startDate,
  endDate
);

// List with filters
const { data, total } = await discernmentService.listAnalyses(
  { status, categoryFilter, minConcern, maxConcern, startDate, endDate },
  sort,
  { page, pageSize }
);

// Get single analysis
const analysis = await discernmentService.getAnalysisById(analysisId);
```

## Concern Score Meanings

| Score | Meaning | Action |
|-------|---------|--------|
| 0-0.3 | Safe | Safe to distribute |
| 0.3-0.6 | Caution | Review recommended |
| 0.6-0.85 | Warning | Significant issues |
| 0.85-1.0 | Critical | Urgent review needed |

## Theological Categories

1. **Theology** - Core doctrines
2. **Ethics** - Moral teachings
3. **Eschatology** - End times
4. **Anthropology** - Human nature
5. **Soteriology** - Salvation
6. **Pneumatology** - Holy Spirit
7. **Ecclesiology** - Church
8. **Cultural Trends** - Modern issues

## Major Patterns Detected

1. Universal Reconciliation (high severity)
2. Christology Denial (high severity)
3. Works-Based Salvation (high severity)
4. Spiritism/Occult (high severity)
5. Scripture Authority Denial (high severity)
6. Moralistic Therapeutic Deism (medium)
7. Gender Confusion (medium)

## Workflow States

```
pending → analyzed → reviewed → published

- pending: Initial state after submission
- analyzed: Analysis complete
- reviewed: Admin has reviewed and added notes
- published: Visible to stakeholders
```

## Environment Variables

```bash
# Required for Claude API analysis (optional)
CLAUDE_API_KEY=sk-ant-...

# If not set, system uses pattern-based fallback
```

## Dashboard Tabs

### 1. Submit Analysis
- Paste URL and content
- Choose analysis mode
- View results immediately

### 2. All Analyses
- Paginated list
- Filter by: status, category, concern, date
- View details, publish, or export

### 3. Trend Reports
- Select date range
- View average concern score
- See trend direction and key themes

## Common Tasks

### Submit Content for Analysis
1. Go to /studio/discernment
2. Click "Submit Analysis"
3. Fill title and content
4. Click "Analyze Content"
5. View results

### View High-Concern Items
1. Click "All Analyses"
2. Set Min Concern to 0.6
3. Filter by status if desired
4. Click "View" for details

### Generate Monthly Report
1. Click "Trend Reports"
2. Set start date to month beginning
3. Set end date to month end
4. Click "Generate Report"
5. Review metrics

### Publish Analysis
1. Click "All Analyses"
2. Find analysis in list
3. Click "Publish" button
4. Confirm action

## Filtering Examples

```javascript
// URL query parameters for API calls
?status=published          // Filter by status
&category=theology         // Filter by category
&minConcern=0.5           // Minimum concern score
&maxConcern=0.8           // Maximum concern score
&startDate=2025-01-01     // Start date
&endDate=2025-12-31       // End date
&sort=analysisDate:desc   // Sort by date descending
&page=1                   // Page number
&pageSize=25              // Items per page
```

## Error Handling

| Error | Cause | Solution |
|-------|-------|----------|
| 401 Unauthorized | No JWT token | Login to admin panel |
| 400 Bad Request | Missing fields | Ensure title and content provided |
| 500 Server Error | Claude API down | Check API key, use pattern mode |
| 404 Not Found | Invalid analysisId | Verify correct ID from list |

## Performance Tips

1. **Use Pattern Mode** for quick analysis (100ms vs 20s)
2. **Batch Analyses** - Don't submit hundreds at once
3. **Set Date Ranges** when generating reports
4. **Paginate Results** - Use page/pageSize params
5. **Cache Trends** - Trend reports don't change frequently

## Security Notes

- All endpoints require admin JWT
- Claude API key in environment only
- No sensitive data in logs
- User attribution tracked (createdBy, reviewedBy)
- Workflow prevents accidental publication

## Integration Example

```typescript
// Use in custom component or script
const response = await fetch('/api/ruach-discernment/analyze', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  },
  body: JSON.stringify({
    sourceTitle: 'My Article',
    sourceUrl: 'https://example.com',
    sourceContent: 'Article text...',
    useClaudeAPI: true,
  }),
});

const result = await response.json();
console.log(`Concern Score: ${result.data.concernScore}`);
```

## Troubleshooting Checklist

- [ ] Claude API key set in .env?
- [ ] Admin user logged in?
- [ ] Strapi backend running?
- [ ] Next.js frontend running?
- [ ] Content submitted with title and content?
- [ ] Database migrations completed?
- [ ] Correct locale in URL?

## Documentation Hierarchy

1. **DISCERNMENT_QUICK_REF.md** (this file) - 2 minute read
2. **DISCERNMENT_IMPLEMENTATION_SUMMARY.md** - 10 minute overview
3. **DISCERNMENT_INTEGRATION.md** - Developer deep dive
4. **DISCERNMENT_SYSTEM.md** - Complete reference

## Support Resources

- System architecture: See DISCERNMENT_SYSTEM.md
- API examples: See DISCERNMENT_INTEGRATION.md
- Full guide: See DISCERNMENT_SYSTEM.md
- Implementation: See DISCERNMENT_IMPLEMENTATION_SUMMARY.md

## Next Steps

1. Set CLAUDE_API_KEY in environment
2. Restart backend and frontend
3. Navigate to /studio/discernment
4. Submit test article
5. Review results
6. Publish when ready
7. Generate trend report
8. Show team and gather feedback

## Version Info

- Created: February 1, 2025
- Backend Framework: Strapi v4+
- Frontend Framework: Next.js 15+
- AI Model: Claude 3.5 Sonnet
- Language: TypeScript
- Database: PostgreSQL (via Strapi)

---

For detailed information, see the complete documentation files.
