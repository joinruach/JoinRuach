import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import LoadingSpinner from '../LoadingSpinner';

describe('LoadingSpinner', () => {
  it('should render with default label', () => {
    render(<LoadingSpinner />);
    expect(screen.getByText('Loading…')).toBeInTheDocument();
  });

  it('should render with custom label', () => {
    render(<LoadingSpinner label="Please wait" />);
    expect(screen.getByText('Please wait')).toBeInTheDocument();
  });

  it('should have correct structure', () => {
    const { container } = render(<LoadingSpinner />);
    const wrapper = container.firstChild as HTMLElement;

    expect(wrapper).toHaveClass('flex', 'items-center', 'gap-3', 'text-neutral-600');
  });

  it('should render spinner element with animation', () => {
    const { container } = render(<LoadingSpinner />);
    const spinner = container.querySelector('.animate-spin');

    expect(spinner).toBeInTheDocument();
    expect(spinner).toHaveClass('inline-block', 'h-4', 'w-4', 'rounded-full');
  });

  it('should render label text with correct styling', () => {
    render(<LoadingSpinner label="Loading data" />);
    const label = screen.getByText('Loading data');

    expect(label).toHaveClass('text-sm');
  });

  it('should handle empty label', () => {
    render(<LoadingSpinner label="" />);
    const wrapper = screen.getByText('').parentElement;

    expect(wrapper).toBeInTheDocument();
  });

  it('should be accessible', () => {
    const { container } = render(<LoadingSpinner label="Loading content" />);

    // Should have visible text for screen readers
    expect(screen.getByText('Loading content')).toBeInTheDocument();
  });

  it('should render multiple instances independently', () => {
    const { container } = render(
      <>
        <LoadingSpinner label="First" />
        <LoadingSpinner label="Second" />
      </>
    );

    expect(screen.getByText('First')).toBeInTheDocument();
    expect(screen.getByText('Second')).toBeInTheDocument();

    const spinners = container.querySelectorAll('.animate-spin');
    expect(spinners).toHaveLength(2);
  });
});
