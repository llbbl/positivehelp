import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import MessageList, { Message } from '@/components/MessageList';

// Mock fetch globally
global.fetch = jest.fn();

// Mock Next.js Link component
jest.mock('next/link', () => {
  return ({ children, href, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  );
});

const mockMessages: Message[] = [
  {
    id: 1,
    text: "This is a positive message",
    date: "2024-01-01",
    url: "positive-message",
    author: "Test Author"
  },
  {
    id: 2,
    text: "Another uplifting thought",
    date: "2024-01-02", 
    url: "uplifting-thought"
  }
];

describe('MessageList', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Clear any existing timers
    jest.clearAllTimers();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('renders initial messages correctly', () => {
    render(<MessageList initialMessages={mockMessages} />);
    
    expect(screen.getByText('This is a positive message')).toBeInTheDocument();
    expect(screen.getByText('Another uplifting thought')).toBeInTheDocument();
    expect(screen.getByText('(2024-01-01)')).toBeInTheDocument();
    expect(screen.getByText('(2024-01-02)')).toBeInTheDocument();
  });

  it('renders messages as links with correct hrefs', () => {
    render(<MessageList initialMessages={mockMessages} />);
    
    const links = screen.getAllByRole('link');
    expect(links[0]).toHaveAttribute('href', '/msg/positive-message');
    expect(links[1]).toHaveAttribute('href', '/msg/uplifting-thought');
  });

  it('fetches new messages on mount', async () => {
    const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => []
    } as Response);

    await act(async () => {
      render(<MessageList initialMessages={mockMessages} />);
    });

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/messages?t='),
        expect.objectContaining({
          cache: 'no-store',
          headers: expect.objectContaining({
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          })
        })
      );
    });
  });

  it('shows loading indicator when fetching messages', async () => {
    const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;
    let resolvePromise: (value: any) => void;
    const fetchPromise = new Promise(resolve => {
      resolvePromise = resolve;
    });
    
    mockFetch.mockReturnValue(fetchPromise as any);

    await act(async () => {
      render(<MessageList initialMessages={mockMessages} />);
    });

    expect(screen.getByText('Checking for new messages...')).toBeInTheDocument();
    
    // Clean up by resolving the promise
    await act(async () => {
      resolvePromise!({
        ok: true,
        json: async () => []
      });
      await fetchPromise;
    });
  });

  it('updates messages when new ones are fetched', async () => {
    const newMessage: Message = {
      id: 3,
      text: "Brand new message",
      date: "2024-01-03",
      url: "new-message"
    };

    const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [newMessage]
    } as Response);

    await act(async () => {
      render(<MessageList initialMessages={mockMessages} />);
    });

    await waitFor(() => {
      expect(screen.getByText('Brand new message')).toBeInTheDocument();
    });
  });

  it('handles fetch errors gracefully', async () => {
    const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    await act(async () => {
      render(<MessageList initialMessages={mockMessages} />);
    });

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith(
        'Error fetching latest messages:',
        expect.any(Error)
      );
    });

    consoleSpy.mockRestore();
  });

  it('sets up polling interval for fetching messages', async () => {
    const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => []
    } as Response);

    await act(async () => {
      render(<MessageList initialMessages={mockMessages} />);
    });

    // Fast-forward 30 seconds
    await act(async () => {
      jest.advanceTimersByTime(30000);
    });

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledTimes(2); // Initial call + one poll
    });
  });

  it('renders empty list when no messages provided', async () => {
    await act(async () => {
      render(<MessageList initialMessages={[]} />);
    });
    
    // Should not crash and container should exist
    const container = document.querySelector('.space-y-3');
    expect(container).toBeInTheDocument();
  });
});