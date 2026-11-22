import React from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../components/layout/Sidebar";
import Header from "../components/common/Header";
import { TourProvider } from "../context/TourContext";
import GuidedTour from "../components/common/GuidedTour";

export default function MainLayout() {
  return (
    <TourProvider>
      <div className="flex min-h-screen bg-app-bg">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <Header />
          <main className="flex-1 p-6 md:p-8 lg:p-10">
            <Outlet />
          </main>
        </div>
      </div>
      <GuidedTour />
    </TourProvider>
  );
}
