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
      {/* Main content area, Outlet renders the current page */}
      {/* pt-16 to offset content below fixed NavBar */}
      <main className="flex-grow pt-6">
        <Outlet />
      </main>
      {showFooter && <Footer />}
    </div>
  );
};

export default MainLayout;
