import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import axios from 'axios';
import GoogleLogin from './GoogleLogin';

// Mock axios globally
vi.mock('axios');

describe('GoogleLogin', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });



  it('renders login button when user is not authenticated', async () => {
    axios.get.mockRejectedValueOnce(new Error('Unauthorized'));

    render(<GoogleLogin />);

    await waitFor(() => {
      expect(screen.getByText(/login with google/i)).toBeInTheDocument();
    });
  });

  it('renders user info when authenticated', async () => {
    const mockUser = {
      displayName: 'Alice Johnson',
      photos: [{ value: 'http://example.com/photo.jpg' }],
    };

    axios.get.mockResolvedValueOnce({ data: mockUser });

    render(<GoogleLogin />);

    await waitFor(() => {
      expect(screen.getByText(`Welcome, ${mockUser.displayName}`)).toBeInTheDocument();
      expect(screen.getByRole('img')).toHaveAttribute('src', mockUser.photos[0].value);
      expect(screen.getByText(/logout/i)).toBeInTheDocument();
    });
  });

  it('logs out and shows login button again', async () => {
    const mockUser = {
      displayName: 'Alice Johnson',
      photos: [{ value: 'http://example.com/photo.jpg' }],
    };

    // First call returns user, second call is logout
    axios.get
      .mockResolvedValueOnce({ data: mockUser }) // /api/user
      .mockResolvedValueOnce();                  // /logout

    render(<GoogleLogin />);

    // Wait for user to appear
    await waitFor(() => {
      expect(screen.getByText(`Welcome, ${mockUser.displayName}`)).toBeInTheDocument();
    });

    // Simulate logout
    fireEvent.click(screen.getByText(/logout/i));

    // Login button should reappear
    await waitFor(() => {
      expect(screen.getByText(/login with google/i)).toBeInTheDocument();
    });
  });
});
