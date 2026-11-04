import React from "react";
import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";

export const Layout: React.FC = () => {
  return (
    <div className="flex min-h-screen bg-bayora-workspace text-bayora-dark overflow-x-hidden">
      {/* Strict Vertical Left Sidebar Only - Primary Application Navigation */}
      <Sidebar />

      {/* Main Workspace Canvas */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen overflow-x-hidden">
        {/* Dynamic Page Content: pt-14 on mobile to accommodate mobile toggle, standard padding on desktop */}
        <main
          id="main-content"
          tabIndex={-1}
          className="flex-1 p-4 pt-14 sm:p-6 sm:pt-14 lg:p-8 lg:pt-8 max-w-7xl w-full mx-auto outline-none"
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
};
