import { useEffect, useState } from 'react';

const GoogleLogin = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('http://localhost:5050/api/user', {
      credentials: 'include'
    })
      .then(res => {
        if (!res.ok) throw new Error('Not logged in');
        return res.json();
      })
      .then(data => setUser(data))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const handleLogout = () => {
    fetch('http://localhost:5050/logout', {
      credentials: 'include'
    }).then(() => setUser(null));
  };

  if (loading) return <p>Loading...</p>;

  return (
    <div style={{ textAlign: 'center', marginTop: '4rem' }}>
      {user ? (
        <div>
          <h2 style={{ marginBottom: '0.5rem' }}>Welcome, {user.displayName}</h2>
          <img
            src={user.photos?.[0]?.value}
            alt="Profile"
            style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              marginBottom: '1rem'
            }}
          />
          <br />
          <button
            onClick={handleLogout}
            style={{
              padding: '0.6rem 1.2rem',
              fontSize: '1rem',
              backgroundColor: '#d9534f',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            Logout
          </button>
        </div>
      ) : (
        <a href="http://localhost:5050/auth/google">
          <button
            style={{
              padding: '0.8rem 1.5rem',
              fontSize: '1.1rem',
              backgroundColor: '#4285F4',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            Login with Google
          </button>
        </a>
      )}
    </div>
  );
};

export default GoogleLogin;
