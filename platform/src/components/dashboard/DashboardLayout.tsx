import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import DashboardSidebar from "./DashboardSidebar";
import { Outlet, useLocation } from "react-router-dom";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";

const pageTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/dashboard/properties": "Properties",
  "/dashboard/offers": "Offers",
  "/dashboard/chat": "Messages",
  "/dashboard/faqs": "FAQs",
  "/dashboard/terms": "Terms & Conditions",
};

const DashboardLayout = () => {
  const location = useLocation();
  const pageTitle = pageTitles[location.pathname] || "";

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-muted/30">
        <DashboardSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          {/* Top bar */}
          <header className="h-13 flex items-center justify-between border-b border-border bg-background px-4 shrink-0">
            <div className="flex items-center gap-3">
              <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
              {pageTitle && (
                <span className="text-sm font-medium text-muted-foreground hidden md:block">{pageTitle}</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground relative">
                <Bell className="h-4 w-4" />
                <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-primary" />
              </Button>
              <div className="flex items-center gap-2 ml-1">
                <span className="text-sm text-muted-foreground hidden sm:block">John</span>
                <Avatar className="h-7 w-7">
                  <AvatarFallback className="bg-primary/10 text-primary text-[11px] font-semibold">JD</AvatarFallback>
                </Avatar>
              </div>
            </div>
          </header>

          {/* Page content */}
          <main className="flex-1 overflow-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default DashboardLayout;
