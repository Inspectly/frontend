import { useState } from "react";
import {
  FolderKanban, MapPin, Clock, CheckCircle2, ChevronRight,
  Calendar, MessageSquare,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Project {
  id: string;
  title: string;
  address: string;
  homeowner: string;
  homeownerAvatar: string;
  amount: number;
  status: "In Progress" | "Completed" | "Scheduled";
  progress: number;
  startDate: string;
  dueDate: string;
  lastMessage: string;
  propertyImage: string;
}

const mockProjects: Project[] = [
  { id: "1", title: "Electrical Panel Upgrade", address: "2-1781 Henrica Ave, London", homeowner: "John D.", homeownerAvatar: "https://images.unsplash.com/photo-1599566150163-29194dcabd36?w=60&h=60&fit=crop&crop=face", amount: 2400, status: "In Progress", progress: 60, startDate: "Mar 3", dueDate: "Mar 9", lastMessage: "Materials arrived, starting tomorrow", propertyImage: "https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=200&h=150&fit=crop" },
  { id: "2", title: "Outdoor Lighting Install", address: "2 Grosvernor Drive, London", homeowner: "Alex K.", homeownerAvatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=60&h=60&fit=crop&crop=face", amount: 650, status: "In Progress", progress: 90, startDate: "Mar 5", dueDate: "Mar 8", lastMessage: "Final fixture going up today", propertyImage: "https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=200&h=150&fit=crop" },
  { id: "3", title: "Basement Wiring Repair", address: "45 Riverside Crescent, Toronto", homeowner: "Sarah M.", homeownerAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=60&h=60&fit=crop&crop=face", amount: 1200, status: "Scheduled", progress: 0, startDate: "Mar 10", dueDate: "Mar 14", lastMessage: "See you Monday!", propertyImage: "https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?w=200&h=150&fit=crop" },
  { id: "4", title: "Kitchen GFCI Upgrade", address: "88 Queen St, Toronto", homeowner: "Tom R.", homeownerAvatar: "https://images.unsplash.com/photo-1599566150163-29194dcabd36?w=60&h=60&fit=crop&crop=face", amount: 350, status: "Completed", progress: 100, startDate: "Feb 20", dueDate: "Feb 20", lastMessage: "Thanks for the great work!", propertyImage: "https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=200&h=150&fit=crop" },
  { id: "5", title: "Garage Sub-Panel Install", address: "12 Maple Lane, London", homeowner: "James M.", homeownerAvatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=60&h=60&fit=crop&crop=face", amount: 1800, status: "Completed", progress: 100, startDate: "Feb 15", dueDate: "Feb 18", lastMessage: "Inspection passed ✓", propertyImage: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=200&h=150&fit=crop" },
];

const statusConfig: Record<string, { color: string; icon: typeof Clock }> = {
  "In Progress": { color: "bg-blue-100 text-blue-700", icon: Clock },
  Completed: { color: "bg-green-100 text-green-700", icon: CheckCircle2 },
  Scheduled: { color: "bg-amber-100 text-amber-700", icon: Calendar },
};

const MyProjects = () => {
  const [tab, setTab] = useState("active");

  const active = mockProjects.filter((p) => p.status !== "Completed");
  const completed = mockProjects.filter((p) => p.status === "Completed");
  const displayed = tab === "active" ? active : completed;

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto animate-fade-up">
      <div className="mb-6">
        <h1 className="text-2xl lg:text-3xl font-display font-bold text-foreground">My Projects</h1>
        <p className="text-sm text-muted-foreground mt-0.5">{active.length} active · {completed.length} completed</p>
      </div>

      <Tabs value={tab} onValueChange={setTab} className="mb-6">
        <TabsList className="bg-muted/50 h-9">
          <TabsTrigger value="active" className="text-sm px-4">Active ({active.length})</TabsTrigger>
          <TabsTrigger value="completed" className="text-sm px-4">Completed ({completed.length})</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="space-y-3">
        {displayed.map((project) => {
          const cfg = statusConfig[project.status];
          const StatusIcon = cfg.icon;
          return (
            <Card key={project.id} className="border-border hover:border-primary/20 hover:shadow-sm transition-all cursor-pointer group">
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <img src={project.propertyImage} alt={project.title} className="h-16 w-20 rounded-lg object-cover shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                        {project.title}
                      </h3>
                      <Badge className={`${cfg.color} text-[10px] h-5 flex items-center gap-0.5`}>
                        <StatusIcon className="h-3 w-3" />{project.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 flex items-center gap-3">
                      <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{project.address}</span>
                    </p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <img src={project.homeownerAvatar} alt={project.homeowner} className="h-5 w-5 rounded-full object-cover" />
                      <span className="text-xs text-muted-foreground">{project.homeowner}</span>
                    </div>
                    {project.status === "In Progress" && (
                      <div className="flex items-center gap-2 mt-2">
                        <Progress value={project.progress} className="h-1.5 flex-1 max-w-48" />
                        <span className="text-[10px] text-muted-foreground">{project.progress}%</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                      <MessageSquare className="h-3 w-3" />
                      <span className="line-clamp-1">{project.lastMessage}</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-base font-bold text-foreground">${project.amount.toLocaleString()}</p>
                    <p className="text-[10px] text-muted-foreground">{project.startDate} → {project.dueDate}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 mt-1" />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default MyProjects;
