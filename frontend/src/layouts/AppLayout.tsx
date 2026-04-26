import { Outlet } from "react-router-dom";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { BottomNav } from "@/components/layout/BottomNav";

export default function AppLayout() {
  return (
    <div className="min-h-screen w-full md:grid md:grid-cols-[260px_1fr] lg:grid-cols-[280px_1fr]">
      <Sidebar className="hidden md:block" />
      <div className="flex flex-col">
        <Topbar />
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 mb-16 md:mb-0">
          <Outlet />
        </main>
      </div>
      <BottomNav />
    </div>
  );
}
