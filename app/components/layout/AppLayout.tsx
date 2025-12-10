import { Outlet } from "@remix-run/react";
import { Sidebar } from "./Sidebar";

export function AppLayout() {
  return (
    <div className="app-layout">
      <Sidebar />
      <main className="app-content">
        <Outlet />
      </main>

      <style>{`
        .app-layout {
          display: flex;
          height: 100vh;
          overflow: hidden;
        }
        .app-content {
          flex: 1;
          overflow-y: auto;
          background: #f6f6f7;
        }
      `}</style>
    </div>
  );
}