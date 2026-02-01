# Discernment Dashboard - Integration Guide

## Quick Start

### 1. Environment Setup

Add to your `.env` file:

```bash
# Optional: Claude API for semantic analysis
CLAUDE_API_KEY=sk-ant-your-key-here

# If not set, system falls back to pattern-based detection
```

### 2. Database Migration

The content type schema is automatically picked up by Strapi. No manual migration needed.

### 3. Backend Service Registration

The service is automatically discovered by Strapi at:
- Service name: `api::library.ruach-discernment`
- Routes: `/api/ruach-discernment/*`

### 4. Frontend Navigation

Add to your studio navigation (if needed):

```tsx
import Link from 'next/link';

export function StudioNav() {
  return (
    <Link href={`/${locale}/studio/discernment`}>
      Discernment Dashboard
    </Link>
  );
}
```

## API Integration

### Using the Service Directly

```typescript
// In a Strapi action or controller
const discernmentService = strapi.service('api::library.ruach-discernment');

// Analyze content
const result = await discernmentService.analyzeContent(
  'Content Title',
  'https://example.com',
  'Content to analyze...',
  true // use Claude API
);

// Get trend report
const trends = await discernmentService.generateTrendReport(
  new Date('2025-01-01'),
  new Date('2025-02-01')
);

// List analyses
const { data, total } = await discernmentService.listAnalyses(
  { status: 'published', minConcern: 0.5 },
  'analysisDate:desc',
  { page: 1, pageSize: 25 }
);

// Get specific analysis
const analysis = await discernmentService.getAnalysisById('analysis_abc123');
```

### From Frontend

```typescript
// Submit analysis
const response = await fetch('/api/ruach-discernment/analyze', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${strapiJwt}`,
  },
  body: JSON.stringify({
    sourceTitle: 'Article',
    sourceUrl: 'https://example.com',
    sourceContent: 'Content here...',
    useClaudeAPI: true,
  }),
});

// List analyses
const response = await fetch(
  '/api/ruach-discernment/analyses?status=published&minConcern=0.5',
  {
    headers: {
      'Authorization': `Bearer ${strapiJwt}`,
    },
  }
);

// Generate trend report
const response = await fetch('/api/ruach-discernment/trend-report', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${strapiJwt}`,
  },
  body: JSON.stringify({
    startDate: '2025-01-01',
    endDate: '2025-02-01',
  }),
});
```

## Customization

### Adding New Theological Patterns

Edit `/ruach-ministries-backend/src/api/library/services/ruach-discernment.ts`:

```typescript
export default ({ strapi }: { strapi: Core.Strapi }) => ({
  getTheologicalPatterns() {
    return {
      // Existing patterns...

      // Add new pattern
      yourNewPattern: {
        category: 'theology', // or ethics, eschatology, etc.
        title: 'Pattern Title',
        description: 'What this pattern detects',
        biblicalCounterposition: 'The biblical position',
        scriptureCites: ['Romans 1:1', 'John 1:1'],
        severity: 'high', // or medium, low
        weight: 2, // Impacts concern score calculation
        patterns: [
          /search pattern 1/gi,
          /search pattern 2/gi,
        ],
      },
    };
  },
});
```

### Modifying Concern Score Calculation

In the service's pattern-based analysis:

```typescript
// Current calculation (adjust multiplier as needed)
concernScore = Math.min(1, concernScore * 0.2);

// Or use different weighting:
const violationWeight = 0.3;
const warningWeight = 0.15;
concernScore = Math.min(1, (violations.length * violationWeight) + (warnings.length * warningWeight));
```

### Custom Claude Prompts

Edit the `buildAnalysisPrompt()` method to customize what Claude looks for:

```typescript
buildAnalysisPrompt(sourceTitle: string, sourceContent: string): string {
  return `Custom prompt here...

  Focus on:
  1. Your custom focus area 1
  2. Your custom focus area 2

  Provide analysis in JSON format...`;
}
```

## Advanced Usage

### Bulk Analysis

Create a script to analyze multiple articles:

```typescript
async function bulkAnalyze(articles: Array<{ title: string; url: string; content: string }>) {
  const service = strapi.service('api::library.ruach-discernment');
  const results = [];

  for (const article of articles) {
    const result = await service.analyzeContent(
      article.title,
      article.url,
      article.content,
      true
    );
    results.push(result);
    // Add delay to avoid API rate limits
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  return results;
}
```

### Creating Analysis Webhooks

Add to your middleware to notify when high-concern content is analyzed:

```typescript
// After analysis is stored
if (result.concernScore > 0.7) {
  // Send notification
  await notifyAdmins({
    title: result.sourceTitle,
    concernScore: result.concernScore,
    issues: result.issues,
  });
}
```

### Exporting Reports

Create PDF exports of trend reports:

```typescript
async function exportTrendReportPDF(trendReport: TrendReport) {
  const doc = new PDFDocument();

  doc.fontSize(24).text('Trend Report');
  doc.fontSize(12).text(`Period: ${trendReport.period}`);
  doc.text(`Average Concern: ${(trendReport.averageConcernScore * 100).toFixed(1)}%`);
  doc.text(`Trend: ${trendReport.trendDirection}`);

  // Add more content...

  return doc;
}
```

## Testing

### Unit Test Example

```typescript
import { describe, it, expect } from '@jest/globals';

describe('Ruach Discernment Service', () => {
  it('should detect works-based salvation language', async () => {
    const service = strapi.service('api::library.ruach-discernment');

    const result = await service.analyzeContent(
      'Test Article',
      undefined,
      'You must earn your salvation through good works',
      false // use patterns
    );

    expect(result.concernScore).toBeGreaterThan(0);
    expect(result.issues.length).toBeGreaterThan(0);
  });
});
```

### Integration Test Example

```typescript
describe('Discernment API', () => {
  it('should analyze content via HTTP endpoint', async () => {
    const response = await fetch('/api/ruach-discernment/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        sourceTitle: 'Test',
        sourceContent: 'Test content',
        useClaudeAPI: false,
      }),
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
  });
});
```

## Performance Optimization

### Database Indexes

Ensure these indexes exist for optimal performance:

```sql
CREATE INDEX idx_analysis_date ON discernment_analyses(analysisDate);
CREATE INDEX idx_analysis_status ON discernment_analyses(status);
CREATE INDEX idx_concern_score ON discernment_analyses(concernScore);
```

### Caching Strategy

Implement caching for trend reports (they're expensive to compute):

```typescript
const cacheKey = `trend_${startDate}_${endDate}`;
const cached = await cache.get(cacheKey);

if (cached) return cached;

const report = await discernmentService.generateTrendReport(startDate, endDate);
await cache.set(cacheKey, report, 3600); // 1 hour

return report;
```

## Monitoring

### Logging High-Risk Analyses

```typescript
// In analyzeContent()
if (result.concernScore > 0.8) {
  strapi.log.warn('HIGH CONCERN ANALYSIS', {
    analysisId: result.analysisId,
    title: result.sourceTitle,
    score: result.concernScore,
  });
}
```

### Metrics to Track

1. Average concern score over time
2. Most common theological issues
3. Analysis volume and frequency
4. Claude API usage and costs
5. Pattern detection accuracy

## Troubleshooting Integration

**Service not found**
- Ensure Strapi has restarted
- Check service file is in correct location
- Verify file naming convention

**Auth errors on API calls**
- Verify JWT token is valid
- Check user has admin role
- Ensure Authorization header is set correctly

**Claude API failures**
- Verify CLAUDE_API_KEY is set
- Check API key is valid in Anthropic console
- Review rate limiting (10+ analyses quickly)
- Check Claude API status page

**Database errors**
- Ensure content type migration ran
- Check database connection
- Verify discernment_analyses table exists

## Next Steps

1. Configure Claude API key in production
2. Set up admin user for testing
3. Submit test content for analysis
4. Review identified issues and concerns
5. Publish analyses for stakeholder viewing
6. Generate trend reports weekly/monthly
7. Monitor high-concern content
8. Gather feedback from reviewers
9. Refine theological patterns as needed
10. Consider fine-tuning Claude model over time

## Support Resources

- Main documentation: `DISCERNMENT_SYSTEM.md`
- API examples: See controller methods
- Frontend component: `page.tsx`
- Service implementation: `ruach-discernment.ts`
- Schema reference: `schema.json`
