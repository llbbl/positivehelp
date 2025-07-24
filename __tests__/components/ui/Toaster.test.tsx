import * as React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Toaster } from '@/components/ui/toaster';
import { useToast } from '@/hooks/use-toast';

// Mock the lucide-react icon
jest.mock('lucide-react', () => ({
  X: ({ className }: { className?: string }) => (
    <div data-testid="x-icon" className={className}>
      X
    </div>
  ),
}));

// Helper component to test useToast hook integration
const TestComponent = () => {
  const { toast } = useToast();

  return (
    <>
      <button
        onClick={() =>
          toast({
            title: 'Test Title',
            description: 'Test Description',
          })
        }
      >
        Show Toast
      </button>
      <button
        onClick={() =>
          toast({
            title: 'Error',
            description: 'Something went wrong',
            variant: 'destructive',
          })
        }
      >
        Show Error Toast
      </button>
      <button
        onClick={() =>
          toast({
            description: 'Description only toast',
          })
        }
      >
        Show Description Only
      </button>
      <Toaster />
    </>
  );
};

describe('Toaster', () => {
  beforeEach(() => {
    // Clear any existing toasts before each test
    jest.clearAllMocks();
  });

  it('renders with default props', () => {
    render(<Toaster />);
    
    // Toaster should render ToastProvider and ToastViewport
    expect(screen.getByRole('region')).toBeInTheDocument();
  });

  it('displays toast when triggered', async () => {
    render(<TestComponent />);
    
    const showToastButton = screen.getByText('Show Toast');
    fireEvent.click(showToastButton);
    
    await waitFor(() => {
      expect(screen.getByText('Test Title')).toBeInTheDocument();
      expect(screen.getByText('Test Description')).toBeInTheDocument();
    });
  });

  it('displays destructive toast variant', async () => {
    render(<TestComponent />);
    
    const showErrorButton = screen.getByText('Show Error Toast');
    fireEvent.click(showErrorButton);
    
    await waitFor(() => {
      expect(screen.getByText('Error')).toBeInTheDocument();
      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    });
    
    // Check if the toast has the destructive variant class
    const toasts = screen.getAllByRole('status');
    const toast = toasts.find(el => el.textContent?.includes('Error'));
    expect(toast).toHaveClass('destructive');
  });

  it('displays toast with description only', async () => {
    render(<TestComponent />);
    
    const showDescriptionButton = screen.getByText('Show Description Only');
    fireEvent.click(showDescriptionButton);
    
    await waitFor(() => {
      expect(screen.getByText('Description only toast')).toBeInTheDocument();
    });
    
    // Title should not be present
    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
  });

  it('renders toast close button', async () => {
    render(<TestComponent />);
    
    const showToastButton = screen.getByText('Show Toast');
    fireEvent.click(showToastButton);
    
    await waitFor(() => {
      expect(screen.getByTestId('x-icon')).toBeInTheDocument();
    });
    
    const closeButton = screen.getByRole('button', { name: 'X' });
    expect(closeButton).toBeInTheDocument();
  });

  it('closes toast when close button is clicked', async () => {
    render(<TestComponent />);
    
    const showToastButton = screen.getByText('Show Toast');
    fireEvent.click(showToastButton);
    
    await waitFor(() => {
      expect(screen.getByText('Test Title')).toBeInTheDocument();
    });
    
    const closeButton = screen.getByRole('button', { name: 'X' });
    fireEvent.click(closeButton);
    
    await waitFor(() => {
      expect(screen.queryByText('Test Title')).not.toBeInTheDocument();
    });
  });

  it('handles toast with action', async () => {
    const TestComponentWithAction = () => {
      const { toast } = useToast();

      return (
        <>
          <button
            onClick={() =>
              toast({
                title: 'Toast with Action',
                description: 'This toast has an action button',
                action: (
                  <button onClick={() => console.log('Action clicked')}>
                    Undo
                  </button>
                ),
              })
            }
          >
            Show Toast with Action
          </button>
          <Toaster />
        </>
      );
    };

    render(<TestComponentWithAction />);
    
    const showToastButton = screen.getByText('Show Toast with Action');
    fireEvent.click(showToastButton);
    
    await waitFor(() => {
      expect(screen.getByText('Toast with Action')).toBeInTheDocument();
      expect(screen.getByText('This toast has an action button')).toBeInTheDocument();
      expect(screen.getByText('Undo')).toBeInTheDocument();
    });
  });

  it('renders proper grid structure for title and description', async () => {
    render(<TestComponent />);
    
    const showToastButton = screen.getByText('Show Toast');
    fireEvent.click(showToastButton);
    
    await waitFor(() => {
      const toasts = screen.getAllByRole('status');
      const toast = toasts.find(el => el.textContent?.includes('Test Title'));
      const gridContainer = toast?.querySelector('.grid.gap-1');
      expect(gridContainer).toBeInTheDocument();
    });
  });

  it('limits the number of displayed toasts', async () => {
    const TestComponentMultiple = () => {
      const { toast } = useToast();

      return (
        <>
          <button
            onClick={() => {
              // Try to create multiple toasts
              for (let i = 1; i <= 5; i++) {
                toast({
                  title: `Toast ${i}`,
                  description: `Description ${i}`,
                });
              }
            }}
          >
            Show Multiple Toasts
          </button>
          <Toaster />
        </>
      );
    };

    render(<TestComponentMultiple />);
    
    const showMultipleButton = screen.getByText('Show Multiple Toasts');
    fireEvent.click(showMultipleButton);
    
    await waitFor(() => {
      // Based on the TOAST_LIMIT in use-toast.ts, only 1 toast should be visible
      const toasts = screen.getAllByRole('status');
      const visibleToasts = toasts.filter(el => el.textContent?.includes('Toast'));
      expect(visibleToasts).toHaveLength(1);
    });
  });

  it('integrates properly with ToastProvider and ToastViewport', () => {
    render(<Toaster />);
    
    // Should render the ToastViewport with proper region role
    const viewport = screen.getByRole('region');
    expect(viewport).toBeInTheDocument();
    expect(viewport).toHaveAttribute('aria-label', 'Notifications (F8)');
    
    // The list should also be present
    const list = screen.getByRole('list');
    expect(list).toBeInTheDocument();
  });
});