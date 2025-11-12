# Phase 8.2: Advanced Analytics Dashboard

## Overview

Phase 8.2 implements a comprehensive analytics dashboard providing deep insights into content performance, user engagement, and platform metrics. Built with custom SVG-based chart components for optimal performance and zero external dependencies.

---

## Features Implemented

### 1. Analytics API

**Endpoint:** `/api/analytics`

**Query Parameters:**
- `metric` - Type of metrics to fetch (all, overview, timeSeries, topContent, demographics)
- `range` - Time range (7d, 30d, 90d, 1y, all)
- `contentType` - Filter by content type (media, courses, events, all)

**Response Structure:**
```typescript
{
  overview: {
    totalViews: { value: number, change: number, trend: 'up' | 'down' | 'stable' },
    totalLikes: { value: number, change: number, trend: 'up' | 'down' | 'stable' },
    totalDownloads: { value: number, change: number, trend: 'up' | 'down' | 'stable' },
    activeUsers: { value: number, change: number, trend: 'up' | 'down' | 'stable' },
    avgEngagement: { value: number, change: number, trend: 'up' | 'down' | 'stable' }
  },
  timeSeries: {
    views: [{ date: string, value: number }],
    likes: [{ date: string, value: number }],
    users: [{ date: string, value: number }]
  },
  topContent: [
    {
      id: string,
      title: string,
      type: string,
      views: number,
      likes: number,
      engagement: number
    }
  ],
  demographics: {
    byCountry: [{ country: string, count: number }],
    byDevice: [{ device: string, count: number }]
  }
}
```

**Authentication:**
- Requires authenticated session (NextAuth)
- Returns 401 if unauthorized

### 2. Chart Components

#### MetricCard Component

Displays key metrics with trend indicators.

**Location:** `src/components/analytics/MetricCard.tsx`

**Features:**
- Large value display with formatting
- Trend indicator (up/down/stable)
- Percentage change from previous period
- Optional icon
- Supports number, percentage, and currency formats

**Props:**
```typescript
interface MetricCardProps {
  title: string;
  value: string | number;
  change?: number;
  trend?: 'up' | 'down' | 'stable';
  icon?: React.ReactNode;
  format?: 'number' | 'percentage' | 'currency';
}
```

**Usage:**
```tsx
<MetricCard
  title="Total Views"
  value={125430}
  change={6.2}
  trend="up"
  format="number"
  icon={<EyeIcon />}
/>
```

#### LineChart Component

Time series visualization with SVG rendering.

**Location:** `src/components/analytics/LineChart.tsx`

**Features:**
- Responsive SVG chart
- Gradient area fill
- Optional grid lines
- Optional data point dots
- Auto-scaling Y-axis
- Formatted date labels
- Customizable colors
- Smooth animations

**Props:**
```typescript
interface LineChartProps {
  data: { date: string; value: number }[];
  height?: number;
  showGrid?: boolean;
  showDots?: boolean;
  color?: string;
  label?: string;
}
```

**Usage:**
```tsx
<LineChart
  data={[
    { date: '2025-01-01', value: 4200 },
    { date: '2025-01-02', value: 4350 },
    // ...
  ]}
  label="Daily Views"
  color="#f59e0b"
  showDots={true}
/>
```

#### BarChart Component

Horizontal or vertical bar visualization.

**Location:** `src/components/analytics/BarChart.tsx`

**Features:**
- Horizontal and vertical orientations
- Auto-scaling bars
- Value labels
- Customizable colors per bar
- Responsive design
- Smooth animations

**Props:**
```typescript
interface BarChartProps {
  data: { label: string; value: number; color?: string }[];
  height?: number;
  horizontal?: boolean;
  showValues?: boolean;
  title?: string;
}
```

**Usage:**
```tsx
<BarChart
  data={[
    { label: 'United States', value: 8420 },
    { label: 'Brazil', value: 3240 },
    { label: 'Nigeria', value: 2890 },
  ]}
  title="Users by Country"
  horizontal={true}
/>
```

#### PieChart Component

Pie/donut chart for distributions.

**Location:** `src/components/analytics/PieChart.tsx`

**Features:**
- Donut-style chart
- Interactive legend
- Percentage calculations
- Value formatting
- Auto color assignment
- Center total display

**Props:**
```typescript
interface PieChartProps {
  data: { label: string; value: number; color?: string }[];
  size?: number;
  showLegend?: boolean;
  title?: string;
}
```

**Usage:**
```tsx
<PieChart
  data={[
    { label: 'Mobile', value: 12340 },
    { label: 'Desktop', value: 8920 },
    { label: 'Tablet', value: 3240 },
  ]}
  title="Device Distribution"
  size={200}
/>
```

### 3. Analytics Dashboard Page

**Location:** `src/app/[locale]/analytics/page.tsx`

**Features:**
- **Overview Section** - 5 key metrics with trends
  - Total Views
  - Total Likes
  - Total Downloads
  - Active Users
  - Average Engagement

- **Time Series** - Line charts for trends
  - Views over time
  - Likes over time
  - Users over time

- **Top Content** - Ranked list of performing content
  - Title, type, and metrics
  - Engagement percentage
  - Visual ranking

- **Demographics** - User distribution
  - By country (bar chart)
  - By device (pie chart)

- **Controls**
  - Date range selector (7d, 30d, 90d, 1y, all)
  - Export to JSON
  - Export to CSV

### 4. Data Export

**Formats Supported:**
- **JSON** - Complete analytics data structure
- **CSV** - Top content table format

**Export Functionality:**
- Client-side export (no server required)
- Automatic filename with date
- Browser download trigger

**Usage:**
```tsx
// Export JSON
const exportJSON = () => {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: 'application/json',
  });
  // Trigger download
};

// Export CSV
const exportCSV = () => {
  const csvContent = generateCSV(data.topContent);
  const blob = new Blob([csvContent], { type: 'text/csv' });
  // Trigger download
};
```

---

## Technical Architecture

### File Structure

```
src/
├── app/
│   ├── api/
│   │   └── analytics/
│   │       └── route.ts          # Analytics API endpoint
│   └── [locale]/
│       └── analytics/
│           └── page.tsx           # Dashboard page
└── components/
    └── analytics/
        ├── MetricCard.tsx         # Metric display
        ├── LineChart.tsx          # Time series chart
        ├── BarChart.tsx           # Bar chart
        └── PieChart.tsx           # Pie/donut chart
```

### Design Decisions

**1. Custom SVG Charts**
- **Why:** No external dependencies, smaller bundle size
- **Benefits:** Full control, better performance, easier customization
- **Trade-offs:** More code to maintain vs using chart library

**2. Client-Side Export**
- **Why:** Simple implementation, no server overhead
- **Benefits:** Fast, works offline, secure
- **Trade-offs:** Limited to JSON/CSV vs server-side PDF generation

**3. Mock Data in API**
- **Why:** Development and demonstration
- **Benefits:** Works without database setup
- **Migration:** Easy to replace with real database queries

**4. Real-time Updates**
- **Why:** useEffect with dependency on date range
- **Benefits:** Responsive to user interaction
- **Implementation:** Fetch on mount and range change

---

## Integration with Existing Systems

### Database Integration (Future)

Replace mock data with real queries:

```typescript
// Example: Fetch from database
const totalViews = await db.interactions.count({
  where: {
    type: 'view',
    createdAt: {
      gte: startDate,
      lte: endDate,
    },
  },
});

const previousViews = await db.interactions.count({
  where: {
    type: 'view',
    createdAt: {
      gte: previousStartDate,
      lte: previousEndDate,
    },
  },
});

return {
  value: totalViews,
  change: calculatePercentageChange(totalViews, previousViews),
  trend: totalViews > previousViews ? 'up' : 'down',
};
```

### Analytics Tracking

Integrate with existing tracking:

```typescript
// In media pages, courses, etc.
await fetch('/api/interactions', {
  method: 'POST',
  body: JSON.stringify({
    type: 'view',
    contentId: mediaItem.id,
    contentType: 'media',
    metadata: {
      device: navigator.userAgent,
      country: userCountry,
    },
  }),
});
```

### Plausible Integration

Optionally sync with Plausible Analytics:

```typescript
// Fetch Plausible data via their API
const plausibleData = await fetch(
  `https://plausible.io/api/v1/stats/aggregate?site_id=${siteId}`,
  {
    headers: { Authorization: `Bearer ${apiKey}` },
  }
);
```

---

## Usage Guide

### Accessing the Dashboard

1. **Navigate** to `/analytics` (requires authentication)
2. **Select** a date range from the dropdown
3. **View** metrics, charts, and insights
4. **Export** data as needed

### Understanding Metrics

**Total Views:**
- Count of all content views
- Change percentage vs previous period
- Trend indicator

**Total Likes:**
- Count of all user likes
- Change percentage vs previous period
- Trend indicator

**Total Downloads:**
- Count of all content downloads
- Change percentage vs previous period
- Trend indicator

**Active Users:**
- Unique users in selected period
- Change percentage vs previous period
- Trend indicator

**Average Engagement:**
- Calculated as: (likes + comments + shares) / views * 100
- Percentage value
- Trend indicator

### Interpreting Charts

**Line Charts:**
- X-axis: Date
- Y-axis: Metric value
- Hover to see exact values
- Gradient fill shows trends visually

**Bar Charts:**
- Horizontal: Best for labels with text
- Vertical: Best for time periods
- Values displayed on/near bars

**Pie Charts:**
- Center shows total
- Legend shows breakdown with percentages
- Colors auto-assigned

### Exporting Data

**JSON Export:**
- Full data structure
- Use for backups or custom processing
- Human-readable format

**CSV Export:**
- Top content only
- Use for spreadsheets
- Columns: Title, Type, Views, Likes, Engagement

---

## Customization

### Adding New Metrics

1. **Update API response:**
```typescript
// In /api/analytics/route.ts
response.overview.newMetric = calculateMetric(current, previous);
```

2. **Add to dashboard:**
```tsx
<MetricCard
  title="New Metric"
  value={data.overview.newMetric.value}
  change={data.overview.newMetric.change}
  trend={data.overview.newMetric.trend}
/>
```

### Custom Chart Colors

```tsx
<LineChart
  data={timeSeriesData}
  color="#your-color-hex"
/>

<BarChart
  data={barData.map(d => ({
    ...d,
    color: getColorForValue(d.value),
  }))}
/>
```

### Adding New Chart Types

Create a new component in `src/components/analytics/`:

```tsx
// ScatterChart.tsx
export default function ScatterChart({ data, ...props }) {
  // Render SVG scatter plot
  return (
    <svg viewBox="0 0 100 100">
      {data.map(point => (
        <circle cx={point.x} cy={point.y} r="2" />
      ))}
    </svg>
  );
}
```

---

## Performance Considerations

### Optimization Strategies

**1. Data Caching**
```typescript
// Cache analytics data
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

let cachedData = null;
let cacheTime = 0;

if (Date.now() - cacheTime < CACHE_TTL) {
  return cachedData;
}
```

**2. Pagination for Top Content**
```typescript
// Limit results
const topContent = await getTopContent({ limit: 10, offset: 0 });
```

**3. Lazy Loading Charts**
```tsx
const LineChart = lazy(() => import('@/components/analytics/LineChart'));

<Suspense fallback={<ChartSkeleton />}>
  <LineChart data={data} />
</Suspense>
```

**4. Debounce Date Range Changes**
```typescript
const [range, setRange] = useState('30d');
const debouncedRange = useDebounce(range, 500);

useEffect(() => {
  fetchAnalytics(debouncedRange);
}, [debouncedRange]);
```

---

## Accessibility

All components follow accessibility best practices:

- **Semantic HTML** - Proper heading hierarchy
- **ARIA labels** - Screen reader support
- **Keyboard navigation** - All interactive elements
- **Color contrast** - WCAG AA compliant
- **Focus indicators** - Visible focus states
- **Alternative text** - For all data visualizations

**Example:**
```tsx
<div role="img" aria-label="Line chart showing views over time">
  <LineChart data={viewsData} />
</div>

<table className="sr-only">
  {/* Accessible data table for screen readers */}
</table>
```

---

## Future Enhancements

### Planned Features

1. **Real-time Updates**
   - WebSocket connection
   - Live data streaming
   - Auto-refresh option

2. **Advanced Filters**
   - Filter by content type
   - Filter by speaker
   - Filter by category
   - Custom date ranges

3. **Comparative Analysis**
   - Compare multiple time periods
   - Year-over-year comparison
   - A/B test results

4. **Predictive Analytics**
   - Trend forecasting
   - Growth projections
   - Anomaly detection

5. **Custom Dashboards**
   - User-configurable widgets
   - Saved dashboard layouts
   - Dashboard templates

6. **More Export Formats**
   - PDF reports
   - Excel spreadsheets
   - Scheduled email reports

7. **Additional Charts**
   - Heatmaps
   - Scatter plots
   - Area charts
   - Funnel charts

8. **Alerts & Notifications**
   - Threshold alerts
   - Anomaly notifications
   - Daily/weekly summaries

---

## Troubleshooting

### Issue: Charts not rendering

**Solution:**
- Check data format matches expected structure
- Verify data is not empty
- Check browser console for errors
- Ensure SVG viewBox is set correctly

### Issue: Export not working

**Solution:**
- Check browser permissions for downloads
- Verify data exists before export
- Check blob creation and URL generation
- Ensure filename is valid

### Issue: Slow performance

**Solution:**
- Reduce data points in time series
- Implement data caching
- Use pagination for large datasets
- Lazy load charts

### Issue: Incorrect trends

**Solution:**
- Verify date range calculations
- Check percentage change formula
- Ensure previous period data is accurate
- Review trend threshold logic

---

## Testing

### Manual Testing Checklist

- [ ] Dashboard loads without errors
- [ ] All metrics display correctly
- [ ] Date range selector works
- [ ] Charts render with data
- [ ] Empty states show properly
- [ ] Export JSON works
- [ ] Export CSV works
- [ ] Responsive on mobile
- [ ] Dark mode support
- [ ] Loading states display

### Automated Testing (Future)

```typescript
import { render, screen, waitFor } from '@testing-library/react';
import AnalyticsPage from './page';

test('renders analytics dashboard', async () => {
  render(<AnalyticsPage />);

  await waitFor(() => {
    expect(screen.getByText('Analytics Dashboard')).toBeInTheDocument();
  });

  expect(screen.getByText('Total Views')).toBeInTheDocument();
});
```

---

## Summary

Phase 8.2 successfully implements a comprehensive analytics dashboard:

✅ **Analytics API** with multiple metric types
✅ **4 Chart Components** (MetricCard, LineChart, BarChart, PieChart)
✅ **Full Dashboard** with overview, trends, and demographics
✅ **Data Export** (JSON and CSV)
✅ **Responsive Design** with dark mode support
✅ **Zero Dependencies** for charts (custom SVG)
✅ **Performance Optimized** with efficient rendering
✅ **Accessible** following WCAG guidelines

The dashboard provides valuable insights into content performance and user engagement, with a solid foundation for future enhancements! 📊
