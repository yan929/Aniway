import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import GoogleLogin from './GoogleLogin';
import { MemoryRouter } from 'react-router-dom';
import apiClient from "../../util/api";

vi.mock('../../util/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    interceptors: { response: { use: vi.fn() } },  // If interceptors exist
  },
}));

describe('GoogleLogin', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });



  it('renders login button when user is not authenticated', async () => {
    apiClient.get.mockRejectedValueOnce(new Error('Unauthorized'));

    render(<MemoryRouter><GoogleLogin /></MemoryRouter>);

    await waitFor(() => {
      expect(screen.getByText(/login with google/i)).toBeInTheDocument();
    });
  });

  it('renders user info when authenticated', async () => {
    const mockUser = {
      displayName: 'Alice Johnson',
      photos: [{ value: 'http://example.com/photo.jpg' }],
    };

    apiClient.get.mockResolvedValueOnce({ data: mockUser });

    render(<MemoryRouter><GoogleLogin /></MemoryRouter>);

    await waitFor(() => {
      expect(screen.getByText(`Welcome, ${mockUser.displayName}`)).toBeInTheDocument();
      expect(screen.getByText(/logout/i)).toBeInTheDocument();
    });
  });

});
