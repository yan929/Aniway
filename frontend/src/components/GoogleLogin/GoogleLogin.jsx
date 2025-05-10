import { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const GoogleLogin = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Add console logs for debugging
    console.log('GoogleLogin component mounted');
    
    axios
      .get(`/api/user`, { withCredentials: true })
      .then(res => {
        console.log('User data received:', res.data);
        setUser(res.data);
        
        // Extract the user ID correctly
        const userId = res.data?.id || res.data?._id || res.data?.google_id;
        
        if (userId) {
          console.log('User ID found, navigating to:', `/profile/${userId}`);
          // Use a small timeout to ensure state update completes
          setTimeout(() => {
            navigate(`/profile/${userId}`);
          }, 100);
        } else {
          console.error('No user ID found in response data:', res.data);
        }
      })
      .catch((err) => {
        console.error('Login error:', err);
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, [navigate]);

  const handleLogout = () => {
    axios
      .get(`/api/logout`, { withCredentials: true })
      .then(() => {
        setUser(null);
        navigate('/login');
      })
      .catch(err => {
        console.error('Logout error:', err);
      });
  };

  if (loading) return <p className="text-center mt-16">Loading user data...</p>;

  return (
    <div className="text-center mt-16">
      {user ? (
        <div>
          <h2 className="mb-2 text-xl font-semibold">Welcome, {user.name}</h2>
          <img
            src={user.avatar}
            alt="Profile"
            className="w-20 h-20 rounded-full mb-4 mx-auto"
          />
          <p className="text-sm text-gray-500 mb-2">
            User ID: {user.id || user._id || user.google_id || 'Unknown'}
          </p>
          <button
            onClick={handleLogout}
            className="px-5 py-2 text-white bg-red-600 hover:bg-red-700 rounded-md text-base"
          >
            Logout
          </button>
        </div>
      ) : (
        <a href={`/auth/google`}>
          <button
            className="px-6 py-3 text-white bg-green-600 hover:bg-blue-700 rounded-md text-lg"
          >
            Login with Google
          </button>
        </a>
      )}
    </div>
  );
};

export default GoogleLogin;
