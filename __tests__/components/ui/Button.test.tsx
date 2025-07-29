/**
 * Unit Tests for Button Component
 * 
 * Tests button variants, states, interactions, and accessibility
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Button, IconButton, SocialButton } from '@/components/ui/Button';

describe('Button Component', () => {
  describe('Basic Button', () => {
    it('should render with default props', () => {
      render(<Button>Click me</Button>);
      
      const button = screen.getByRole('button', { name: /click me/i });
      expect(button).toBeInTheDocument();
      expect(button).toHaveClass('inline-flex', 'items-center');
    });

    it('should handle click events', () => {
      const handleClick = jest.fn();
      render(<Button onClick={handleClick}>Click me</Button>);
      
      const button = screen.getByRole('button');
      fireEvent.click(button);
      
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should be disabled when loading', () => {
      render(<Button loading>Click me</Button>);
      
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    });

    it('should be disabled when disabled prop is true', () => {
      render(<Button disabled>Click me</Button>);
      
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });

    it('should render with different variants', () => {
      const { rerender } = render(<Button variant="primary">Primary</Button>);
      expect(screen.getByRole('button')).toHaveClass('bg-blue-600');

      rerender(<Button variant="success">Success</Button>);
      expect(screen.getByRole('button')).toHaveClass('bg-green-600');

      rerender(<Button variant="danger">Danger</Button>);
      expect(screen.getByRole('button')).toHaveClass('bg-red-600');
    });

    it('should render with different sizes', () => {
      const { rerender } = render(<Button size="sm">Small</Button>);
      expect(screen.getByRole('button')).toHaveClass('h-9');

      rerender(<Button size="lg">Large</Button>);
      expect(screen.getByRole('button')).toHaveClass('h-11');

      rerender(<Button size="xl">Extra Large</Button>);
      expect(screen.getByRole('button')).toHaveClass('h-12');
    });

    it('should render full width when specified', () => {
      render(<Button fullWidth>Full Width</Button>);
      expect(screen.getByRole('button')).toHaveClass('w-full');
    });

    it('should render with left and right icons', () => {
      render(
        <Button 
          leftIcon={<span data-testid="left-icon">←</span>}
          rightIcon={<span data-testid="right-icon">→</span>}
        >
          Button with icons
        </Button>
      );

      expect(screen.getByTestId('left-icon')).toBeInTheDocument();
      expect(screen.getByTestId('right-icon')).toBeInTheDocument();
    });

    it('should not render icons when loading', () => {
      render(
        <Button 
          loading
          leftIcon={<span data-testid="left-icon">←</span>}
          rightIcon={<span data-testid="right-icon">→</span>}
        >
          Loading button
        </Button>
      );

      expect(screen.queryByTestId('left-icon')).not.toBeInTheDocument();
      expect(screen.queryByTestId('right-icon')).not.toBeInTheDocument();
      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    });
  });

  describe('IconButton', () => {
    it('should render icon button with aria-label', () => {
      render(
        <IconButton 
          icon={<span data-testid="icon">⚙️</span>}
          aria-label="Settings"
        />
      );

      const button = screen.getByRole('button', { name: /settings/i });
      expect(button).toBeInTheDocument();
      expect(screen.getByTestId('icon')).toBeInTheDocument();
    });

    it('should have icon size by default', () => {
      render(
        <IconButton 
          icon={<span>⚙️</span>}
          aria-label="Settings"
        />
      );

      expect(screen.getByRole('button')).toHaveClass('h-10', 'w-10');
    });
  });

  describe('SocialButton', () => {
    it('should render Farcaster social button', () => {
      render(<SocialButton provider="farcaster" />);
      
      const button = screen.getByRole('button');
      expect(button).toHaveTextContent('Continue with Farcaster');
      expect(button).toHaveClass('bg-purple-600');
    });

    it('should render wallet social button', () => {
      render(<SocialButton provider="wallet" />);
      
      const button = screen.getByRole('button');
      expect(button).toHaveTextContent('Continue with Wallet');
      expect(button).toHaveClass('bg-blue-600');
    });

    it('should use custom provider name', () => {
      render(
        <SocialButton 
          provider="farcaster" 
          providerName="Custom Farcaster"
        />
      );
      
      expect(screen.getByRole('button')).toHaveTextContent('Continue with Custom Farcaster');
    });

    it('should use custom children text', () => {
      render(
        <SocialButton provider="wallet">
          Connect Your Wallet
        </SocialButton>
      );
      
      expect(screen.getByRole('button')).toHaveTextContent('Connect Your Wallet');
    });

    it('should be full width by default', () => {
      render(<SocialButton provider="farcaster" />);
      expect(screen.getByRole('button')).toHaveClass('w-full');
    });
  });

  describe('Accessibility', () => {
    it('should have proper button role', () => {
      render(<Button>Accessible Button</Button>);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('should support custom aria attributes', () => {
      render(
        <Button aria-describedby="help-text">
          Button with description
        </Button>
      );
      
      expect(screen.getByRole('button')).toHaveAttribute('aria-describedby', 'help-text');
    });

    it('should indicate loading state to screen readers', () => {
      render(<Button loading>Loading button</Button>);
      
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
      // Loading state is indicated by disabled state and spinner presence
    });
  });

  describe('Error Handling', () => {
    it('should handle undefined onClick gracefully', () => {
      render(<Button>No onClick handler</Button>);
      
      const button = screen.getByRole('button');
      expect(() => fireEvent.click(button)).not.toThrow();
    });

    it('should handle empty children', () => {
      render(<Button></Button>);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });
  });
});