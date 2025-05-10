import { useEffect, useState } from "react";
import { useUser } from "../../UserContext.jsx";
import axios from "axios";

const GoogleLogin = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // const { currentUser, logout, loadingAuth, setLoadingAuth, userLogin } =
  //   useUser();

  // useEffect(() => {
  //   axios
  //     .get("/api/user", { withCredentials: true })
  //     .then((res) => userLogin(res.data))
  //     .catch(() => userLogin(null))
  //     .finally(() => setLoadingAuth(false));
  // }, []);
  // if (loadingAuth)
  //   return <p className="text-center mt-16">Loading authentication...</p>;

  useEffect(() => {
    axios
      .get("/api/user", { withCredentials: true })
      .then((res) => setUser(res.data))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const handleLogout = () => {
    axios.get("/logout", { withCredentials: true }).then(() => setUser(null));
  };

  if (loading) return <p className="text-center mt-16">Loading...</p>;

  return (
    <div className="text-center mt-16">
      {user ? (
        <div>
          <h2 className="mb-2 text-xl font-semibold">
            Welcome, {user.displayName}
          </h2>
          <img
            src={user.photos?.[0]?.value}
            alt="Profile"
            className="w-20 h-20 rounded-full mb-4 mx-auto"
          />
          <button
            onClick={handleLogout}
            className="px-5 py-2 text-white bg-red-600 hover:bg-red-700 rounded-md text-base"
          >
            Logout
          </button>
        </div>
      ) : (
        <a href="http://localhost:5050/auth/google">
          <button className="px-6 py-3 text-white bg-blue-600 hover:bg-blue-700 rounded-md text-lg">
            Login with Google
          </button>
        </a>
      )}
    </div>
  );
};

export default GoogleLogin;
