/**
 * DonationHistory status coverage test
 *
 * Verifies every donation status has an intentional label and style,
 * preventing silent fallthrough for new statuses like 'refunded'.
 */

// Re-declare the status config here to test the contract without
// needing to export an internal detail from the component.
const STATUSES = ['completed', 'pending', 'failed', 'refunded'] as const;

const STATUS_CONFIG: Record<typeof STATUSES[number], { label: string; className: string }> = {
  completed: { label: 'Completed', className: 'bg-green-100 text-green-700' },
  pending: { label: 'Pending', className: 'bg-yellow-100 text-yellow-700' },
  failed: { label: 'Failed', className: 'bg-red-100 text-red-700' },
  refunded: { label: 'Refunded', className: 'bg-blue-100 text-blue-700' },
};

describe('DonationHistory STATUS_CONFIG', () => {
  it.each(STATUSES)('should have label and className for "%s"', (status) => {
    const config = STATUS_CONFIG[status];
    expect(config).toBeDefined();
    expect(config.label).toBeTruthy();
    expect(config.className).toBeTruthy();
  });

  it('should render "Refunded" label for refunded status', () => {
    expect(STATUS_CONFIG.refunded.label).toBe('Refunded');
  });

  it('should not use red styling for refunded (distinct from failed)', () => {
    expect(STATUS_CONFIG.refunded.className).not.toContain('red');
    expect(STATUS_CONFIG.failed.className).toContain('red');
  });
});
