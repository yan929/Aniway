import { createContext, useContext, useState, useEffect } from "react";
import apiClient from "./util/api";

const UserContext = createContext(null);

export const useUser = () => useContext(UserContext);

export const UserProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  //   const checkAuthStatus = async () => {
  //     setLoadingAuth(true);
  //     try {
  //       const response = await apiClient.get("/api/user", {
  //         withCredentials: true,
  //       });
  //       if (response.data && response.data.id) {
  //         setCurrentUser(response.data);
  //       } else {
  //         setCurrentUser(null);
  //       }
  //     } catch (error) {
  //       console.error("Auth check failed:", error);
  //       setCurrentUser(null);
  //     } finally {
  //       setLoadingAuth(false);
  //     }
  //   };

  //   useEffect(() => {
  //     checkAuthStatus();
  //   }, []);

  const userLogin = (user) => {
    setCurrentUser(user);
  };

  const logout = async () => {
    try {
      await apiClient.get("/api/logout", { withCredentials: true });
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const userDelete = () => {
    setCurrentUser(null);
  };

  return (
    <UserContext.Provider
      value={{
        currentUser,
        userLogin,
        loadingAuth,
        logout,
        userDelete,
        setLoadingAuth,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};
