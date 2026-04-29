import {
  Home, Briefcase, FolderKanban, DollarSign, Star, MessageCircle,
  HelpCircle, ScrollText, LogOut, Settings,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
  SidebarFooter, useSidebar,
} from "@/components/ui/sidebar";
import logo from "@/assets/logo.png";

const mainNav = [
  { title: "Dashboard", url: "/vendor", icon: Home },
  { title: "Find Jobs", url: "/vendor/jobs", icon: Briefcase },
  { title: "My Projects", url: "/vendor/projects", icon: FolderKanban },
  { title: "Earnings", url: "/vendor/earnings", icon: DollarSign },
  { title: "Reviews", url: "/vendor/reviews", icon: Star },
  { title: "Messages", url: "/vendor/messages", icon: MessageCircle },
];

const supportNav = [
  { title: "Settings", url: "/vendor/settings", icon: Settings },
  { title: "FAQs", url: "/vendor/faqs", icon: HelpCircle },
  { title: "Terms", url: "/vendor/terms", icon: ScrollText },
];

const VendorSidebar = () => {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();

  const renderItem = (item: typeof mainNav[0]) => {
    const isActive =
      location.pathname === item.url ||
      (item.url !== "/vendor" && location.pathname.startsWith(item.url));
    return (
      <SidebarMenuItem key={item.title}>
        <SidebarMenuButton asChild>
          <NavLink
            to={item.url}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
              isActive
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            <item.icon className="h-[18px] w-[18px] shrink-0" />
            {!collapsed && <span>{item.title}</span>}
          </NavLink>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  };

  return (
    <Sidebar collapsible="icon" className="border-r border-border">
      <div className="flex items-center gap-2.5 px-4 py-4 border-b border-border">
        <img src={logo} alt="Inspectly" className="h-7 w-7 object-contain" />
        {!collapsed && (
          <div className="flex items-center gap-2">
            <span className="font-display font-bold text-base text-foreground">Inspectly</span>
            <span className="text-[10px] font-medium text-primary bg-primary/10 px-1.5 py-0.5 rounded">PRO</span>
          </div>
        )}
      </div>

      <SidebarContent className="pt-3">
        <SidebarGroup>
          {!collapsed && (
            <SidebarGroupLabel className="text-[10px] uppercase tracking-wider text-muted-foreground/60 px-3 mb-1">
              Main
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu>{mainNav.map(renderItem)}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          {!collapsed && (
            <SidebarGroupLabel className="text-[10px] uppercase tracking-wider text-muted-foreground/60 px-3 mb-1 mt-2">
              Support
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu>{supportNav.map(renderItem)}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-border p-3">
        <button className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all duration-150 w-full">
          <LogOut className="h-[18px] w-[18px] shrink-0" />
          {!collapsed && <span>Log Out</span>}
        </button>
      </SidebarFooter>
    </Sidebar>
  );
};

export default VendorSidebar;
