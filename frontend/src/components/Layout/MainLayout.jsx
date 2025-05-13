import React from "react";
import { Outlet, useLocation } from "react-router-dom";
import NavBar from "./NavBar";
import Footer from "./Footer";

const MainLayout = () => {
  const location = useLocation();
  const showFooter = location.pathname !== "/tripplanner";

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <NavBar />
      {/* This main area will hold the Outlet. Its height should be viewport height minus NavBar height. */}
      <main
        className="flex-1 overflow-hidden"
        style={{ paddingTop: '3.5rem', height: 'calc(100vh - 3.5rem)' }}
      >
        <Outlet />
      </main>
      {showFooter && <Footer className="shrink-0" />}
    </div>
  );
};

export default MainLayout;
