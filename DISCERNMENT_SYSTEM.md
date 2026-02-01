# Discernment Dashboard - Biblical Content Analysis System

The Discernment Dashboard is an admin-level feature that analyzes external content for theological alignment with evangelical Christian doctrine. It uses both Claude AI API and pattern-based detection to identify theological concerns and provide biblical counter-references.

## System Architecture

### Backend Components

#### 1. Discernment Analysis Service
**Location:** `/ruach-ministries-backend/src/api/library/services/ruach-discernment.ts`

Core service responsible for content analysis with two analysis modes:

**Claude API Mode (Primary):**
- Uses Claude 3.5 Sonnet for semantic understanding
- Detects nuanced theological issues
- Produces more accurate concern scores
- Identifies multiple categories of theological concern
- Requires `CLAUDE_API_KEY` environment variable

**Pattern-Based Mode (Fallback):**
- Uses regex and keyword patterns for detection
- Available when Claude API unavailable
- Covers major theological red flags
- Faster processing but less comprehensive

**Key Methods:**
- `analyzeContent()` - Main entry point for analysis
- `analyzeWithClaude()` - Claude API analysis
- `analyzeWithPatterns()` - Pattern-based fallback
- `generateTrendReport()` - Multi-analysis trend data
- `listAnalyses()` - Query analyses with filters

**Analysis Categories:**
- Theology (core doctrines)
- Ethics (Christian worldview)
- Eschatology (end times)
- Anthropology (human nature)
- Soteriology (salvation)
- Pneumatology (Holy Spirit)
- Ecclesiology (church)
- Cultural Trends (contemporary issues)

#### 2. API Controller
**Location:** `/ruach-ministries-backend/src/api/ruach-discernment/controllers/ruach-discernment.ts`

HTTP request handlers:
- `analyze()` - Submit content for analysis
- `listAnalyses()` - Retrieve analyses with filtering
- `getAnalysis()` - Get specific analysis detail
- `updateAnalysis()` - Update status and notes
- `publishAnalysis()` - Publish for viewing
- `generateTrendReport()` - Create trend reports

#### 3. API Routes
**Location:** `/ruach-ministries-backend/src/api/ruach-discernment/routes/ruach-discernment.ts`

REST endpoints (all require admin authentication):
```
POST   /api/ruach-discernment/analyze
GET    /api/ruach-discernment/analyses
GET    /api/ruach-discernment/analyses/:analysisId
PUT    /api/ruach-discernment/analyses/:analysisId
POST   /api/ruach-discernment/analyses/:analysisId/publish
POST   /api/ruach-discernment/trend-report
```

#### 4. Content Type Schema
**Location:** `/ruach-ministries-backend/src/api/discernment-analysis/content-types/discernment-analysis/schema.json`

Database structure for storing analyses:
- `analysisId` (string, unique) - Unique identifier
- `sourceUrl` (string) - Source URL
- `sourceTitle` (string) - Content title
- `sourceContent` (richtext) - Content excerpt
- `analysisDate` (datetime) - When analyzed
- `concernScore` (decimal 0-1) - Overall concern level
- `categories` (json) - Theological categories affected
- `issues` (json) - Identified theological issues
- `biblicalResponse` (richtext) - Biblical counter-position
- `scriptureReferences` (json) - Bible verses referenced
- `status` (enum) - pending|analyzed|reviewed|published
- `reviewNotes` (richtext) - Admin review comments
- `trendPatterns` (json) - Historical pattern data
- `confidenceLevel` (decimal 0-1) - Analysis confidence
- `reviewedBy` (relation) - Reviewer user
- `createdBy` (relation) - Creator user

### Frontend Components

#### Discernment Dashboard Page
**Location:** `/apps/ruach-next/src/app/[locale]/studio/discernment/page.tsx`

React component with three main tabs:

**1. Submit Analysis Tab**
- URL/content input form
- Option to use Claude API vs patterns
- Real-time feedback on analysis status
- Source URL tracking

**2. All Analyses Tab**
- Sortable list of all analyses
- Filters: status, category, concern score, date range
- Pagination support
- Detail modal for expanded view
- Quick actions: View, Publish

**3. Trend Reports Tab**
- Date range selection
- Trend metrics (avg concern, direction)
- Key theological themes
- Analysis summary

## Usage Guide

### For Administrators

#### Submitting Content for Analysis

1. Navigate to Studio → Discernment Dashboard
2. Click "Submit Analysis" tab
3. Enter:
   - Source Title (required)
   - Source URL (optional)
   - Content to Analyze (required)
4. Choose analysis mode:
   - ✓ Use Claude API (recommended, slower, more accurate)
   - Use Pattern Detection (faster, basic)
5. Click "Analyze Content"
6. View results with concern score and identified issues

#### Reviewing Analyses

1. Click "All Analyses" tab
2. Use filters to find relevant analyses
3. Click "View" to see full details
4. Review identified issues and biblical responses
5. Click "Publish Analysis" when ready for stakeholders

#### Generating Trend Reports

1. Click "Trend Reports" tab
2. Select date range for analysis period
3. Click "Generate Report"
4. Review:
   - Average concern score
   - Trend direction (increasing/stable/decreasing)
   - Key theological areas of concern
   - Summary analysis

### For Developers

#### Setting Up Claude API

1. Add to `.env` or environment:
```bash
CLAUDE_API_KEY=sk-ant-...
```

2. Service automatically uses Claude when key available
3. Falls back to patterns if API unavailable or fails

#### Detecting Theological Issues

The system detects major categories:

**High Severity (blocking):**
- Universal reconciliation claims
- Denial of Christ's deity
- Works-based salvation
- Spiritism/occult promotion
- Scripture authority denial

**Medium Severity (warnings):**
- Moralistic therapeutic deism
- Gender identity confusion
- Prosperity gospel emphasis
- Mishandled eschatology

**Low Severity (guidance):**
- Minor doctrinal nuances
- Secondary theological concerns

#### Extending Pattern Detection

Add patterns in `getTheologicalPatterns()`:

```typescript
myNewIssue: {
  category: 'theology',
  title: 'Issue Title',
  description: 'What the issue is',
  biblicalCounterposition: 'Biblical position',
  scriptureCites: ['Matthew 1:1', 'John 1:1'],
  severity: 'high',
  weight: 2,
  patterns: [
    /search term/gi,
    /another pattern/gi,
  ],
}
```

## API Examples

### Analyze Content

```bash
curl -X POST http://localhost:1337/api/ruach-discernment/analyze \
  -H "Authorization: Bearer <admin-jwt>" \
  -H "Content-Type: application/json" \
  -d '{
    "sourceTitle": "Article Title",
    "sourceUrl": "https://example.com",
    "sourceContent": "Article content here...",
    "useClaudeAPI": true
  }'
```

Response:
```json
{
  "success": true,
  "data": {
    "analysisId": "analysis_abc123",
    "sourceTitle": "Article Title",
    "concernScore": 0.75,
    "confidenceLevel": 0.85,
    "categories": [
      {
        "category": "soteriology",
        "severity": "high",
        "description": "..."
      }
    ],
    "issues": [
      {
        "issueId": "issue_xyz",
        "title": "Works-Based Salvation",
        "category": "soteriology",
        "severity": "high",
        "biblicalCounterposition": "..."
      }
    ],
    "scriptureReferences": [
      {
        "reference": "Ephesians 2:8-9",
        "passage": "For by grace you have been saved...",
        "relevance": "..."
      }
    ],
    "biblicalResponse": "..."
  }
}
```

### List Analyses

```bash
curl -X GET "http://localhost:1337/api/ruach-discernment/analyses?status=published&minConcern=0.5" \
  -H "Authorization: Bearer <admin-jwt>"
```

### Generate Trend Report

```bash
curl -X POST http://localhost:1337/api/ruach-discernment/trend-report \
  -H "Authorization: Bearer <admin-jwt>" \
  -H "Content-Type: application/json" \
  -d '{
    "startDate": "2025-01-01",
    "endDate": "2025-02-01"
  }'
```

Response:
```json
{
  "success": true,
  "data": {
    "period": "2025-01-01 to 2025-02-01",
    "averageConcernScore": 0.62,
    "highestConcernCategory": "theology",
    "trendDirection": "increasing",
    "keyThemes": ["theology", "ethics", "eschatology"],
    "analysisSummary": "..."
  }
}
```

## Security Considerations

1. **Admin-Only Access**: All endpoints require authenticated admin users
2. **API Key Protection**: Claude API key stored in environment variables
3. **Content Storage**: Analyses stored in database with access controls
4. **Review Workflow**: Multi-step review process before publishing

## Performance Notes

- Claude API analysis: 10-30 seconds per request
- Pattern-based analysis: 100-500ms
- Trend reports: Fast, uses cached data
- Database queries optimized with indexes on analysisDate and status

## Future Enhancements

1. **Fine-tuning**: Custom Claude model trained on theological corpus
2. **Historical Tracking**: Pattern analysis of individual content creators
3. **Comparative Analysis**: Side-by-side comparison of related content
4. **Export**: PDF/Excel report generation
5. **Webhooks**: Alert system for high-concern content
6. **Machine Learning**: Improved pattern detection over time

## Troubleshooting

**Claude API Not Available**
- Check CLAUDE_API_KEY is set in environment
- Verify API key is valid
- Service automatically falls back to pattern mode

**Analysis Takes Too Long**
- Use pattern-based mode for quick analysis
- Claude API typically takes 10-30 seconds

**No Analyses Appear**
- Verify admin authentication is valid
- Check user permissions in Strapi roles
- Ensure database connection is working

**Trend Report Shows No Data**
- Ensure analyses exist in the date range
- Check analysisDate field is populated correctly
- Verify date format is ISO 8601 (YYYY-MM-DD)

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend Dashboard                       │
│          /[locale]/studio/discernment/page.tsx             │
│  ┌─────────────────┬──────────────────┬──────────────────┐ │
│  │  Submit Analysis│  View Analyses   │  Trend Reports   │ │
│  └─────────────────┴──────────────────┴──────────────────┘ │
└──────────────────────┬──────────────────────────────────────┘
                       │ HTTP Requests
┌──────────────────────┴──────────────────────────────────────┐
│              API Controllers & Routes                        │
│          /ruach-discernment/controllers                     │
│          /ruach-discernment/routes                          │
└──────────────────────┬──────────────────────────────────────┘
                       │
┌──────────────────────┴──────────────────────────────────────┐
│         Discernment Analysis Service                         │
│  /library/services/ruach-discernment.ts                     │
│  ┌────────────────────┬────────────────────────────────────┐│
│  │   analyzeContent() │ generateTrendReport()              ││
│  ├────────────────────┴────────────────────────────────────┤│
│  │  ┌──────────────────────────────────────────────────┐  ││
│  │  │  Claude API Mode (Primary)                       │  ││
│  │  │  - Semantic analysis                             │  ││
│  │  │  - Deep theological detection                    │  ││
│  │  │  - Better accuracy, slower                       │  ││
│  │  └──────────────────────────────────────────────────┘  ││
│  │  ┌──────────────────────────────────────────────────┐  ││
│  │  │  Pattern Mode (Fallback)                         │  ││
│  │  │  - Regex/keyword matching                        │  ││
│  │  │  - Fast processing                               │  ││
│  │  │  - Detection of major issues                     │  ││
│  │  └──────────────────────────────────────────────────┘  ││
│  └────────────────────────────────────────────────────────┘│
└──────────────────────┬──────────────────────────────────────┘
                       │
┌──────────────────────┴──────────────────────────────────────┐
│  Discernment Analysis Content Type & Database               │
│  /discernment-analysis/content-types/schema.json            │
│                                                               │
│  Stores: analyses, issues, categories, scripture refs      │
└─────────────────────────────────────────────────────────────┘
```

## File Structure

```
ruach-monorepo/
├── ruach-ministries-backend/
│   └── src/api/
│       ├── library/services/
│       │   └── ruach-discernment.ts
│       └── ruach-discernment/
│           ├── controllers/
│           │   └── ruach-discernment.ts
│           ├── routes/
│           │   └── ruach-discernment.ts
│           └── services/
│               ├── index.ts
│               └── ruach-discernment.ts
│       └── discernment-analysis/
│           └── content-types/
│               └── discernment-analysis/
│                   ├── schema.json
│                   └── index.ts
│
└── apps/ruach-next/
    └── src/app/
        └── [locale]/studio/
            └── discernment/
                ├── page.tsx
                └── layout.tsx
```

## Support & Maintenance

For questions or issues with the Discernment Dashboard:

1. Check this documentation
2. Review API response errors
3. Check Claude API status if using API mode
4. Verify admin permissions in Strapi
5. Check server logs for detailed error messages
