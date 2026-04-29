import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import VendorSidebar from "./VendorSidebar";
import { Outlet, useLocation } from "react-router-dom";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const pageTitles: Record<string, string> = {
  "/vendor": "Dashboard",
  "/vendor/jobs": "Find Jobs",
  "/vendor/projects": "My Projects",
  "/vendor/earnings": "Earnings",
  "/vendor/reviews": "Reviews",
  "/vendor/messages": "Messages",
  "/vendor/settings": "Settings",
  "/vendor/faqs": "FAQs",
  "/vendor/terms": "Terms & Conditions",
};

const VendorLayout = () => {
  const location = useLocation();
  const pageTitle = pageTitles[location.pathname] || "";

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-muted/30">
        <VendorSidebar />
        <div className="flex-1 flex flex-col min-w-0">
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
                <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-primary" />
              </Button>
              <div className="flex items-center gap-2 ml-1">
                <div className="hidden sm:flex flex-col items-end">
                  <span className="text-sm font-medium text-foreground">Mike's Electrical</span>
                  <span className="text-[10px] text-muted-foreground">Licensed Electrician</span>
                </div>
                <Avatar className="h-7 w-7">
                  <AvatarFallback className="bg-primary/10 text-primary text-[11px] font-semibold">ME</AvatarFallback>
                </Avatar>
              </div>
            </div>
          </header>
          <main className="flex-1 overflow-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default VendorLayout;
