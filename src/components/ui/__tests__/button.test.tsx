import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Button } from '../button';

describe('Button Component', () => {
  it('should render correctly with default props', () => {
    render(<Button>Click me</Button>);
    
    const button = screen.getByRole('button', { name: /click me/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute('data-variant', 'default');
    expect(button).toHaveAttribute('data-size', 'default');
  });

  it('should apply variant classes correctly', () => {
    const { rerender } = render(<Button variant="outline">Outline</Button>);
    
    let button = screen.getByRole('button');
    expect(button).toHaveAttribute('data-variant', 'outline');
    
    rerender(<Button variant="destructive">Destructive</Button>);
    button = screen.getByRole('button');
    expect(button).toHaveAttribute('data-variant', 'destructive');
    
    rerender(<Button variant="ghost">Ghost</Button>);
    button = screen.getByRole('button');
    expect(button).toHaveAttribute('data-variant', 'ghost');
  });

  it('should apply size classes correctly', () => {
    const { rerender } = render(<Button size="sm">Small</Button>);
    
    let button = screen.getByRole('button');
    expect(button).toHaveAttribute('data-size', 'sm');
    
    rerender(<Button size="lg">Large</Button>);
    button = screen.getByRole('button');
    expect(button).toHaveAttribute('data-size', 'lg');
    
    rerender(<Button size="icon">Icon</Button>);
    button = screen.getByRole('button');
    expect(button).toHaveAttribute('data-size', 'icon');
  });

  it('should merge custom className', () => {
    render(<Button className="custom-class">Custom</Button>);
    
    const button = screen.getByRole('button');
    expect(button).toHaveClass('custom-class');
  });

  it('should be disabled when disabled prop is true', () => {
    render(<Button disabled>Disabled</Button>);
    
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
  });

  it('should support different button types', () => {
    render(<Button type="submit">Submit</Button>);
    
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('type', 'submit');
  });

  it('should handle click events', async () => {
    let clicked = false;
    const handleClick = () => {
      clicked = true;
    };
    
    render(<Button onClick={handleClick}>Click</Button>);
    
    const button = screen.getByRole('button');
    button.click();
    
    expect(clicked).toBe(true);
  });

  it('should render with icon size correctly', () => {
    render(<Button size="icon-xs">X</Button>);
    
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('data-size', 'icon-xs');
  });

  it('should support aria attributes', () => {
    render(
      <Button aria-label="Close dialog" aria-pressed="true">
        X
      </Button>
    );
    
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-label', 'Close dialog');
    expect(button).toHaveAttribute('aria-pressed', 'true');
  });

  it('should render as a slot when asChild is true', () => {
    render(
      <Button asChild>
        <a href="/test">Link Button</a>
      </Button>
    );
    
    const link = screen.getByRole('link', { name: /link button/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/test');
  });
});
