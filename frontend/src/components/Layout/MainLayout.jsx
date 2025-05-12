import React from "react";
import { Outlet, useLocation } from "react-router-dom";
import NavBar from "./NavBar";
import Footer from "./Footer";

const MainLayout = () => {
  const location = useLocation();
  const showFooter = location.pathname !== "/tripplanner";

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <NavBar />
      {/* The same height as the NavBar */}
      <div className="flex-col flex-shrink-0 h-14" />
      <Outlet />
      {showFooter && <Footer />}
    </div>
  );
};

export default MainLayout;
