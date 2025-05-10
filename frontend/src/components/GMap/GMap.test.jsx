import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import axios from 'axios';
import GMap from './GMap';

vi.mock('@react-google-maps/api', () => ({
  LoadScript: ({ children }) => <div>{children}</div>,
  GoogleMap: ({ children }) => <div data-testid="google-map">{children}</div>,
  Marker: ({ onClick, title, label }) => (
    <div onClick={onClick} data-testid={`marker-${label}`}>
      Marker {label}
    </div>
  ),
  InfoWindow: ({ children }) => (
    <div data-testid="info-window">{children}</div>
  ),
}));

vi.mock('axios');

describe('GMap Component', () => {
  const mockLocation = [
    {
      lat: 35.6895,
      lng: 139.6917,
      label: '1',
    },
  ];

  const mockPlaceDetails = {
    name: 'Mock Place',
    address: '123 Fake St',
    phone: '123-456-7890',
    rating: 4.5,
    total_ratings: 100,
    website: 'https://mockplace.com',
    open_now: true,
    opening_hours: ['Mon: 9AM - 5PM', 'Tue: 9AM - 5PM'],
    photo_reference: 'mock-photo-ref',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the map and markers', () => {
    render(<GMap locations={mockLocation} />);
    expect(screen.getByTestId('google-map')).toBeInTheDocument();
    expect(screen.getByTestId('marker-1')).toBeInTheDocument();
  });

  it('displays place info and photo when marker is clicked', async () => {
    const blob = new Blob(['image'], { type: 'image/jpeg' });

    axios.post
      .mockResolvedValueOnce({ data: mockPlaceDetails }) // /api/gmap/
      .mockResolvedValueOnce({ data: blob }); // /api/gmap/photo

    render(<GMap locations={mockLocation} />);

    fireEvent.click(screen.getByTestId('marker-1'));

    await waitFor(() => {
      expect(screen.getByTestId('info-window')).toBeInTheDocument();
    });
  });

});
