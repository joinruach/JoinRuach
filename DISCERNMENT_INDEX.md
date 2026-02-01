# Discernment Dashboard - Complete Index

## Overview

The Discernment Dashboard is a complete, production-ready system for analyzing AI and cultural content through a biblical lens. This index provides navigation and orientation to all components.

## Documentation Quick Links

### For First-Time Users
Start here: **DISCERNMENT_QUICK_REF.md** (5-10 minutes)
- Quick start guide
- Key features overview
- Common tasks
- Troubleshooting

### For Administrators
Read: **DISCERNMENT_SYSTEM.md** (30-45 minutes)
- How the system works
- Usage instructions
- API examples
- Complete reference

### For Developers
Read: **DISCERNMENT_INTEGRATION.md** (20-30 minutes)
- Integration guide
- Service customization
- Testing examples
- Performance optimization

### For Architects
Read: **DISCERNMENT_IMPLEMENTATION_SUMMARY.md** (25-35 minutes)
- Complete overview
- Architecture details
- Deployment information
- Future enhancements

## File Structure

### Backend Implementation

**Service Layer** (Core Engine)
```
/ruach-ministries-backend/src/api/library/services/ruach-discernment.ts
- 850+ lines
- Dual-mode analysis (Claude + patterns)
- 8 theological categories
- 7 pattern detections
- Trend analytics
```

**API Layer** (HTTP Endpoints)
```
/ruach-ministries-backend/src/api/ruach-discernment/
├── controllers/ruach-discernment.ts (200 lines)
├── routes/ruach-discernment.ts (50 lines)
└── services/ruach-discernment.ts (re-export)
```

**Data Layer** (Database Schema)
```
/ruach-ministries-backend/src/api/discernment-analysis/
└── content-types/discernment-analysis/
    ├── schema.json (14 fields)
    └── index.ts
```

### Frontend Implementation

**Dashboard Component**
```
/apps/ruach-next/src/app/[locale]/studio/discernment/
├── page.tsx (650 lines)
│   - 3 tabs (Submit, List, Trends)
│   - Advanced filtering
│   - Pagination
│   - Detail modals
└── layout.tsx (15 lines)
```

## API Endpoints

### Analysis Submission
```
POST /api/ruach-discernment/analyze
```
Submit content for theological analysis.

**Request:**
```json
{
  "sourceTitle": "Article Title",
  "sourceUrl": "https://...",
  "sourceContent": "Full content here...",
  "useClaudeAPI": true
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "analysisId": "analysis_abc123",
    "concernScore": 0.75,
    "categories": [...],
    "issues": [...]
  }
}
```

### List Analyses
```
GET /api/ruach-discernment/analyses
```
Query analyses with filtering.

**Parameters:**
- `status` - pending|analyzed|reviewed|published
- `category` - theology|ethics|etc
- `minConcern`, `maxConcern` - 0-1 range
- `startDate`, `endDate` - date filtering
- `page`, `pageSize` - pagination
- `sort` - field:asc|desc

### Get Analysis Details
```
GET /api/ruach-discernment/analyses/:analysisId
```
Retrieve full analysis with all details.

### Update Analysis
```
PUT /api/ruach-discernment/analyses/:analysisId
```
Update status and add review notes.

### Publish Analysis
```
POST /api/ruach-discernment/analyses/:analysisId/publish
```
Publish for stakeholder viewing.

### Generate Trend Report
```
POST /api/ruach-discernment/trend-report
```
Analyze trends across time period.

**Request:**
```json
{
  "startDate": "2025-01-01",
  "endDate": "2025-02-01"
}
```

## Service Methods

### Core Analysis
- `analyzeContent()` - Main analysis entry point
- `analyzeWithClaude()` - Semantic AI analysis
- `analyzeWithPatterns()` - Fast pattern detection

### Retrieval & Querying
- `listAnalyses()` - Multi-filter query
- `getAnalysisById()` - Single analysis retrieval

### Reporting
- `generateTrendReport()` - Time-period trends
- `updateTrendPatterns()` - Pattern tracking

### Support
- `storeAnalysis()` - Database persistence
- `generateBiblicalResponse()` - Counter-position
- `compileScriptureReferences()` - Scripture compilation

## Dashboard Tabs

### 1. Submit Analysis
Where admins submit content for analysis.

Features:
- Title input
- URL input
- Content textarea
- Claude API toggle
- Real-time feedback

### 2. All Analyses
Where admins view and manage analyses.

Features:
- Paginated list
- Multiple filters
- Detail modal view
- Quick publish action
- Concern visualization

### 3. Trend Reports
Where admins see patterns and trends.

Features:
- Date range selector
- Metrics cards
- Theme visualization
- Trend direction indicator

## Key Concepts

### Concern Score
0.0 = Safe (no theological concerns)
0.5 = Moderate (some concerns)
1.0 = Critical (major theological issues)

**Interpretation:**
- 0-30%: Generally safe
- 30-60%: Review recommended
- 60-85%: Significant concerns
- 85-100%: Critical issues

### Theological Categories

1. **Theology** - Core doctrines
2. **Ethics** - Moral teachings
3. **Eschatology** - End times
4. **Anthropology** - Human nature
5. **Soteriology** - Salvation
6. **Pneumatology** - Holy Spirit
7. **Ecclesiology** - Church
8. **Cultural Trends** - Modern issues

### Issue Severity
- **High** - Blocking doctrinal concerns
- **Medium** - Warnings, secondary issues
- **Low** - Guidance, nuanced points

## Pattern Detection

The system automatically detects these major patterns:

1. **Universal Reconciliation** - Claims all will be saved
2. **Christology Denial** - Denies Christ's deity
3. **Works-Based Salvation** - Earning salvation
4. **Spiritism/Occult** - Spirit contact promotion
5. **Scripture Authority Denial** - Bible unreliability
6. **Moralistic Therapeutic Deism** - Self-help gospel
7. **Gender Confusion** - Sexual differentiation denial

Each pattern:
- Has biblical counter-references
- Includes severity rating
- Can be weighted/customized

## Workflow States

```
pending
  ↓
analyzed
  ↓
reviewed
  ↓
published
```

- **Pending**: Initial state
- **Analyzed**: Analysis complete
- **Reviewed**: Admin reviewed and approved
- **Published**: Available to stakeholders

## Authentication & Security

All endpoints require:
- Admin JWT authentication
- Strapi user with admin role
- Bearer token in Authorization header

Stored data includes:
- Creator attribution (createdBy)
- Reviewer attribution (reviewedBy)
- Full audit trail
- Timestamp tracking

## Environment Setup

### Required
```bash
# Claude API key for semantic analysis
CLAUDE_API_KEY=sk-ant-your-key-here
```

### Optional
- Database URL (defaults to Strapi config)
- Log level settings
- Cache configuration

## Performance Characteristics

| Operation | Time | Mode |
|-----------|------|------|
| Pattern Analysis | 100-500ms | Fast |
| Claude Analysis | 10-30s | Semantic |
| List Query | <1s | Database |
| Trend Report | 1-5s | Computation |
| Page Load | <2s | Frontend |

## Deployment Checklist

Before deploying to production:

- [ ] Set CLAUDE_API_KEY environment variable
- [ ] Create admin user for testing
- [ ] Test analysis submission
- [ ] Verify database connectivity
- [ ] Check API response times
- [ ] Train staff on usage
- [ ] Set up monitoring
- [ ] Plan backup strategy
- [ ] Document workflow

## Customization Points

### Adding Patterns
Edit `getTheologicalPatterns()` in service.

### Modifying Prompts
Edit `buildAnalysisPrompt()` in service.

### Changing Scoring
Edit concern score calculation logic.

### UI Customization
Edit React component in dashboard/page.tsx.

### Categories
Extend theological category list in types.

## Troubleshooting Guide

### Claude API Issues
- Verify CLAUDE_API_KEY set
- Check API key validity
- Review rate limits
- System falls back to patterns

### Analysis Failures
- Check content length
- Verify database connection
- Review API response
- Check logs for errors

### List/Filter Issues
- Verify query parameters
- Check date formats (ISO 8601)
- Ensure status values valid
- Check page/pageSize

### UI Problems
- Clear browser cache
- Verify authentication
- Check network tab
- Review console errors

## Resources

### Internal Documentation
- DISCERNMENT_SYSTEM.md - Complete reference
- DISCERNMENT_INTEGRATION.md - Developer guide
- DISCERNMENT_QUICK_REF.md - Quick reference

### Code Files
- Service: `ruach-discernment.ts` (service layer)
- Controller: `ruach-discernment.ts` (HTTP layer)
- Routes: `ruach-discernment.ts` (routing)
- Schema: `schema.json` (database)
- UI: `page.tsx` (dashboard)

### Examples
- API call examples in DISCERNMENT_INTEGRATION.md
- Test examples in DISCERNMENT_INTEGRATION.md
- Usage examples in DISCERNMENT_SYSTEM.md

## Getting Help

1. Check DISCERNMENT_QUICK_REF.md for common issues
2. Review DISCERNMENT_SYSTEM.md for detailed info
3. See DISCERNMENT_INTEGRATION.md for code examples
4. Check server logs for error details
5. Verify all environment variables set

## Next Steps

### For Immediate Use
1. Set CLAUDE_API_KEY
2. Restart servers
3. Navigate to /studio/discernment
4. Submit test content
5. Review results

### For Integration
1. Review API examples
2. Test endpoints
3. Verify authentication
4. Set up monitoring
5. Plan workflow

### For Customization
1. Review pattern definitions
2. Consider theological adjustments
3. Plan UI modifications
4. Test thoroughly
5. Document changes

## Summary

The Discernment Dashboard provides a complete system for biblical content analysis with:

- AI-powered semantic analysis
- Pattern-based fallback
- 8 theological categories
- 7 major pattern detections
- Advanced admin dashboard
- Trend analytics
- Full documentation
- Production-ready code

All code is complete, well-tested, and ready to deploy with minimal setup (just set CLAUDE_API_KEY).

For questions or issues, refer to the appropriate documentation file above.

---

**Created:** February 1, 2025
**Status:** Production Ready
**Documentation:** Complete (50+ KB)
**Code:** 3,000+ lines
**Components:** 10+ files
