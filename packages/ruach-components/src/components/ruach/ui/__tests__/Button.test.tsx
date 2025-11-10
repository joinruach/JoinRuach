import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from '../Button';

describe('Button', () => {
  describe('Rendering', () => {
    it('should render as button by default', () => {
      render(<Button>Click me</Button>);
      const button = screen.getByRole('button', { name: 'Click me' });
      expect(button).toBeInTheDocument();
      expect(button.tagName).toBe('BUTTON');
    });

    it('should render as link when as="a" and href provided', () => {
      render(<Button as="a" href="/test">Link Button</Button>);
      const link = screen.getByRole('link', { name: 'Link Button' });
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute('href', '/test');
    });

    it('should render children correctly', () => {
      render(<Button>Test Content</Button>);
      expect(screen.getByText('Test Content')).toBeInTheDocument();
    });
  });

  describe('Variants', () => {
    it('should apply black variant styles by default', () => {
      render(<Button>Black Button</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-black', 'text-white', 'hover:bg-black/90');
    });

    it('should apply white variant styles', () => {
      render(<Button variant="white">White Button</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-white', 'text-black', 'hover:bg-neutral-100');
    });

    it('should apply gold variant styles', () => {
      render(<Button variant="gold">Gold Button</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-amber-500', 'text-black', 'hover:bg-amber-400');
    });
  });

  describe('Sizes', () => {
    it('should apply medium size by default', () => {
      render(<Button>Medium Button</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('px-4', 'py-2');
    });

    it('should apply small size styles', () => {
      render(<Button size="sm">Small Button</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('px-3', 'py-1.5', 'text-sm');
    });
  });

  describe('Custom className', () => {
    it('should merge custom className with default styles', () => {
      render(<Button className="custom-class">Custom Button</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('custom-class');
      expect(button).toHaveClass('rounded-lg'); // Base class
    });

    it('should allow custom className to override defaults', () => {
      render(<Button className="bg-red-500">Override Button</Button>);
      const button = screen.getByRole('button');
      // With tailwind-merge, later classes override earlier ones
      expect(button).toHaveClass('bg-red-500');
    });
  });

  describe('Interactions', () => {
    it('should call onClick when clicked', async () => {
      const handleClick = vi.fn();
      const user = userEvent.setup();

      render(<Button onClick={handleClick}>Clickable</Button>);
      const button = screen.getByRole('button');

      await user.click(button);
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should not call onClick when disabled', async () => {
      const handleClick = vi.fn();
      const user = userEvent.setup();

      render(<Button onClick={handleClick} disabled>Disabled</Button>);
      const button = screen.getByRole('button');

      await user.click(button);
      expect(handleClick).not.toHaveBeenCalled();
    });

    it('should support focus', async () => {
      const user = userEvent.setup();
      render(<Button>Focus me</Button>);
      const button = screen.getByRole('button');

      await user.tab();
      expect(button).toHaveFocus();
    });
  });

  describe('HTML Attributes', () => {
    it('should pass through type attribute', () => {
      render(<Button type="submit">Submit</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('type', 'submit');
    });

    it('should pass through disabled attribute', () => {
      render(<Button disabled>Disabled</Button>);
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });

    it('should pass through aria attributes', () => {
      render(<Button aria-label="Custom label">Button</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-label', 'Custom label');
    });

    it('should pass through data attributes', () => {
      render(<Button data-testid="my-button">Button</Button>);
      const button = screen.getByTestId('my-button');
      expect(button).toBeInTheDocument();
    });
  });

  describe('Link Button', () => {
    it('should not render as link without href', () => {
      render(<Button as="a">No Href</Button>);
      // Without href, it should fall back to button
      const element = screen.getByRole('button');
      expect(element).toBeInTheDocument();
    });

    it('should handle external links', () => {
      render(<Button as="a" href="https://example.com">External</Button>);
      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('href', 'https://example.com');
    });

    it('should handle internal links', () => {
      render(<Button as="a" href="/about">About</Button>);
      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('href', '/about');
    });
  });

  describe('Accessibility', () => {
    it('should have correct role', () => {
      render(<Button>Accessible</Button>);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('should support keyboard navigation', async () => {
      const handleClick = vi.fn();
      const user = userEvent.setup();

      render(<Button onClick={handleClick}>Keyboard</Button>);
      const button = screen.getByRole('button');

      button.focus();
      await user.keyboard('{Enter}');
      expect(handleClick).toHaveBeenCalled();
    });

    it('should have visible text content', () => {
      render(<Button>Visible Text</Button>);
      expect(screen.getByText('Visible Text')).toBeVisible();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty children', () => {
      render(<Button></Button>);
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });

    it('should handle multiple variant and size combinations', () => {
      const { rerender } = render(<Button variant="black" size="sm">Test</Button>);
      let button = screen.getByRole('button');
      expect(button).toHaveClass('bg-black', 'text-white', 'px-3', 'py-1.5');

      rerender(<Button variant="gold" size="md">Test</Button>);
      button = screen.getByRole('button');
      expect(button).toHaveClass('bg-amber-500', 'px-4', 'py-2');
    });

    it('should handle rapid re-renders', () => {
      const { rerender } = render(<Button>First</Button>);
      rerender(<Button>Second</Button>);
      rerender(<Button>Third</Button>);
      expect(screen.getByText('Third')).toBeInTheDocument();
    });
  });
});
