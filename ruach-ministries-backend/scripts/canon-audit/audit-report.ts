/**
 * Canon Audit Report Generator
 * Runs validators and generates severity-coded reports
 */

import type {
  NotionNode,
  AuditResult,
  AuditReport,
  AuditSeverity,
  AxiomConflict
} from './types';
import { PHASE_CONSTRAINTS } from './types';
import { validateNode } from './axiom-validators';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Severity emoji indicators
 */
const SEVERITY_ICONS = {
  safe: '🟢',
  warning: '🟡',
  error: '🔴'
};

/**
 * Audit a single node
 */
export function auditNode(node: NotionNode): AuditResult {
  const conflicts = validateNode(node, PHASE_CONSTRAINTS);

  // Determine overall severity
  let severity: AuditSeverity = 'safe';
  if (conflicts.some(c => c.severity === 'error')) {
    severity = 'error';
  } else if (conflicts.some(c => c.severity === 'warning')) {
    severity = 'warning';
  }

  // Generate summary
  const summary = generateNodeSummary(node, conflicts, severity);

  return {
    nodeId: node.id,
    nodeTitle: node.title,
    phase: node.phase,
    severity,
    conflicts,
    summary
  };
}

/**
 * Generate summary text for a node
 */
function generateNodeSummary(
  node: NotionNode,
  conflicts: AxiomConflict[],
  severity: AuditSeverity
): string {
  if (severity === 'safe') {
    return 'No axiom conflicts detected. Canon-safe.';
  }

  const errorCount = conflicts.filter(c => c.severity === 'error').length;
  const warningCount = conflicts.filter(c => c.severity === 'warning').length;

  const parts: string[] = [];
  if (errorCount > 0) {
    parts.push(`${errorCount} critical issue${errorCount > 1 ? 's' : ''}`);
  }
  if (warningCount > 0) {
    parts.push(`${warningCount} warning${warningCount > 1 ? 's' : ''}`);
  }

  return `Found ${parts.join(' and ')}. Requires review.`;
}

/**
 * Audit all nodes
 */
export function auditAllNodes(nodes: NotionNode[]): AuditReport {
  console.log(`\n🔍 Starting audit of ${nodes.length} nodes...\n`);

  const results: AuditResult[] = [];

  for (const node of nodes) {
    const result = auditNode(node);
    results.push(result);

    // Log immediate feedback
    const icon = SEVERITY_ICONS[result.severity];
    console.log(`${icon} ${result.nodeTitle} ${result.phase ? `[${result.phase}]` : ''}`);
    if (result.conflicts.length > 0) {
      result.conflicts.forEach(conflict => {
        const conflictIcon = SEVERITY_ICONS[conflict.severity];
        console.log(`   ${conflictIcon} ${conflict.type}: ${conflict.message}`);
      });
    }
  }

  // Calculate totals
  const safeNodes = results.filter(r => r.severity === 'safe').length;
  const warningNodes = results.filter(r => r.severity === 'warning').length;
  const errorNodes = results.filter(r => r.severity === 'error').length;

  const report: AuditReport = {
    timestamp: new Date().toISOString(),
    totalNodes: nodes.length,
    safeNodes,
    warningNodes,
    errorNodes,
    results
  };

  return report;
}

/**
 * Format report as markdown
 */
export function formatReportMarkdown(report: AuditReport): string {
  const lines: string[] = [];

  lines.push('# Canon Audit Report\n');
  lines.push(`**Generated:** ${new Date(report.timestamp).toLocaleString()}\n`);
  lines.push('---\n');

  // Summary
  lines.push('## Summary\n');
  lines.push(`- **Total Nodes:** ${report.totalNodes}`);
  lines.push(`- ${SEVERITY_ICONS.safe} **Safe:** ${report.safeNodes}`);
  lines.push(`- ${SEVERITY_ICONS.warning} **Warnings:** ${report.warningNodes}`);
  lines.push(`- ${SEVERITY_ICONS.error} **Errors:** ${report.errorNodes}\n`);

  // Stats
  const safePercent = ((report.safeNodes / report.totalNodes) * 100).toFixed(1);
  const warningPercent = ((report.warningNodes / report.totalNodes) * 100).toFixed(1);
  const errorPercent = ((report.errorNodes / report.totalNodes) * 100).toFixed(1);

  lines.push(`**Canon Alignment:** ${safePercent}% safe, ${warningPercent}% warnings, ${errorPercent}% errors\n`);
  lines.push('---\n');

  // Group results by severity
  const errorResults = report.results.filter(r => r.severity === 'error');
  const warningResults = report.results.filter(r => r.severity === 'warning');
  const safeResults = report.results.filter(r => r.severity === 'safe');

  // Error nodes
  if (errorResults.length > 0) {
    lines.push(`## ${SEVERITY_ICONS.error} Critical Issues (${errorResults.length})\n`);
    lines.push('**These nodes must be corrected before publishing.**\n');
    for (const result of errorResults) {
      lines.push(`### ${result.nodeTitle} ${result.phase ? `[${result.phase}]` : ''}`);
      lines.push(`**Node ID:** ${result.nodeId}\n`);
      for (const conflict of result.conflicts) {
        if (conflict.severity === 'error') {
          lines.push(`- **${conflict.type}:** ${conflict.message}`);
          if (conflict.context) {
            lines.push(`  - *${conflict.context}*`);
          }
        }
      }
      lines.push('');
    }
    lines.push('---\n');
  }

  // Warning nodes
  if (warningResults.length > 0) {
    lines.push(`## ${SEVERITY_ICONS.warning} Warnings (${warningResults.length})\n`);
    lines.push('**These nodes should be reviewed for potential issues.**\n');
    for (const result of warningResults) {
      lines.push(`### ${result.nodeTitle} ${result.phase ? `[${result.phase}]` : ''}`);
      lines.push(`**Node ID:** ${result.nodeId}\n`);
      for (const conflict of result.conflicts) {
        const icon = SEVERITY_ICONS[conflict.severity];
        lines.push(`- ${icon} **${conflict.type}:** ${conflict.message}`);
        if (conflict.context) {
          lines.push(`  - *${conflict.context}*`);
        }
      }
      lines.push('');
    }
    lines.push('---\n');
  }

  // Safe nodes summary
  if (safeResults.length > 0) {
    lines.push(`## ${SEVERITY_ICONS.safe} Canon-Safe Nodes (${safeResults.length})\n`);
    for (const result of safeResults) {
      lines.push(`- ${result.nodeTitle} ${result.phase ? `[${result.phase}]` : ''}`);
    }
    lines.push('');
  }

  return lines.join('\n');
}

/**
 * Format report as JSON
 */
export function formatReportJSON(report: AuditReport): string {
  return JSON.stringify(report, null, 2);
}

/**
 * Save report to file
 */
export function saveReport(
  report: AuditReport,
  outputDir: string,
  format: 'markdown' | 'json' = 'markdown'
): void {
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().split('T')[0];

  if (format === 'markdown') {
    const mdPath = path.join(outputDir, `canon-audit-${timestamp}.md`);
    const markdown = formatReportMarkdown(report);
    fs.writeFileSync(mdPath, markdown, 'utf-8');
    console.log(`\n✅ Markdown report saved: ${mdPath}`);
  }

  // Always save JSON for programmatic access
  const jsonPath = path.join(outputDir, `canon-audit-${timestamp}.json`);
  const json = formatReportJSON(report);
  fs.writeFileSync(jsonPath, json, 'utf-8');
  console.log(`✅ JSON report saved: ${jsonPath}`);
}

/**
 * Print summary to console
 */
export function printSummary(report: AuditReport): void {
  console.log('\n' + '='.repeat(60));
  console.log('CANON AUDIT SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total Nodes: ${report.totalNodes}`);
  console.log(`${SEVERITY_ICONS.safe} Safe: ${report.safeNodes} (${((report.safeNodes / report.totalNodes) * 100).toFixed(1)}%)`);
  console.log(`${SEVERITY_ICONS.warning} Warnings: ${report.warningNodes} (${((report.warningNodes / report.totalNodes) * 100).toFixed(1)}%)`);
  console.log(`${SEVERITY_ICONS.error} Errors: ${report.errorNodes} (${((report.errorNodes / report.totalNodes) * 100).toFixed(1)}%)`);
  console.log('='.repeat(60) + '\n');

  if (report.errorNodes > 0) {
    console.log(`⚠️  ${report.errorNodes} node(s) require immediate correction.`);
  }
  if (report.warningNodes > 0) {
    console.log(`⚠️  ${report.warningNodes} node(s) should be reviewed.`);
  }
  if (report.errorNodes === 0 && report.warningNodes === 0) {
    console.log('✅ All nodes are canon-safe!');
  }
}
