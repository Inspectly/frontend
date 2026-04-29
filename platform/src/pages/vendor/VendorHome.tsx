import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Briefcase, DollarSign, Star, Clock, ChevronRight,
  TrendingUp, ArrowUpRight, Calendar, MapPin, Zap,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

const mockSchedule = [
  { id: "1", time: "9:00 AM", type: "Site Visit", address: "2-1781 Henrica Ave", task: "Panel inspection", image: "https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=100&h=80&fit=crop" },
  { id: "2", time: "2:00 PM", type: "Installation", address: "2 Grosvernor Drive", task: "Outdoor lighting", image: "https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=100&h=80&fit=crop" },
  { id: "3", time: "4:30 PM", type: "Follow-up", address: "45 Riverside Crescent", task: "Wiring assessment", image: "https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?w=100&h=80&fit=crop" },
  { id: "4", time: "6:00 PM", type: "Consultation", address: "88 Queen St", task: "GFCI outlet quote", image: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=100&h=80&fit=crop" },
];

const VendorHome = () => {
  const [showAllSchedule, setShowAllSchedule] = useState(false);
  const scheduleToShow = showAllSchedule ? mockSchedule : mockSchedule.slice(0, 3);

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto animate-fade-up">
      {/* Header with avatar */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <img
            src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&crop=face"
            alt="Mike"
            className="h-12 w-12 rounded-full object-cover"
          />
          <div>
            <h1 className="text-2xl lg:text-3xl font-display font-bold text-foreground">
              Good morning, Mike
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">Here's what's happening today</p>
          </div>
        </div>
        <Link to="/vendor/jobs">
          <Button variant="gold" className="gap-2">
            <Briefcase className="h-4 w-4" />
            Browse Jobs
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Active Projects", value: "3", icon: Briefcase, iconBg: "bg-primary/5", iconColor: "text-primary", trend: "+1 this week" },
          { label: "This Month", value: "$4,250", icon: DollarSign, iconBg: "bg-green-50", iconColor: "text-green-600", trend: "+12% vs last" },
          { label: "Avg. Rating", value: "4.8", icon: Star, iconBg: "bg-amber-50", iconColor: "text-amber-600", trend: "124 reviews" },
          { label: "Response Rate", value: "96%", icon: Zap, iconBg: "bg-blue-50", iconColor: "text-blue-600", trend: "< 2hr avg" },
        ].map((stat) => (
          <Card key={stat.label} className="border-border hover:shadow-sm transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className={`h-8 w-8 rounded-lg ${stat.iconBg} flex items-center justify-center`}>
                  <stat.icon className={`h-4 w-4 ${stat.iconColor}`} />
                </div>
              </div>
              <p className="text-2xl font-bold text-foreground">{stat.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
              <p className="text-[10px] text-primary mt-1 flex items-center gap-0.5">
                <ArrowUpRight className="h-3 w-3" />
                {stat.trend}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Two-column: Active projects + Earnings overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        {/* Active projects */}
        <Card className="lg:col-span-2 border-border">
          <CardContent className="p-0">
            <div className="flex items-center justify-between px-5 pt-4 pb-2">
              <h2 className="font-semibold text-foreground text-sm flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center">
                  <Briefcase className="h-4 w-4 text-muted-foreground" />
                </div>
                Active Projects
              </h2>
              <Link to="/vendor/projects" className="text-xs text-primary hover:underline flex items-center gap-0.5">
                View all <ChevronRight className="h-3 w-3" />
              </Link>
            </div>
            <div className="px-5 pb-4 space-y-2">
              {[
                { title: "Electrical Panel Upgrade", address: "2-1781 Henrica Ave", homeowner: "John D.", homeownerAvatar: "https://images.unsplash.com/photo-1599566150163-29194dcabd36?w=60&h=60&fit=crop&crop=face", amount: 2400, progress: 60, dueIn: "2 days", photo: "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=200&h=150&fit=crop" },
                { title: "Basement Wiring Repair", address: "45 Riverside Crescent", homeowner: "Sarah M.", homeownerAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=60&h=60&fit=crop&crop=face", amount: 1200, progress: 25, dueIn: "5 days", photo: "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=200&h=150&fit=crop" },
                { title: "Outdoor Lighting Install", address: "2 Grosvernor Drive", homeowner: "Alex K.", homeownerAvatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=60&h=60&fit=crop&crop=face", amount: 650, progress: 90, dueIn: "Today", photo: "https://images.unsplash.com/photo-1558171813-4c088753af8f?w=200&h=150&fit=crop" },
              ].map((project) => (
                <div key={project.title} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer">
                  <img src={project.photo} alt={project.title} className="h-12 w-16 rounded-lg object-cover shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{project.title}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                      <MapPin className="h-3 w-3" /> {project.address}
                    </p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <img src={project.homeownerAvatar} alt={project.homeowner} className="h-4 w-4 rounded-full object-cover" />
                      <span className="text-[10px] text-muted-foreground">{project.homeowner}</span>
                      <Progress value={project.progress} className="h-1.5 flex-1 max-w-20" />
                      <span className="text-[10px] text-muted-foreground">{project.progress}%</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-foreground">${project.amount.toLocaleString()}</p>
                    <p className="text-[10px] text-muted-foreground flex items-center gap-0.5 justify-end mt-0.5">
                      <Clock className="h-3 w-3" /> Due {project.dueIn}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Earnings + Schedule */}
        <div className="space-y-4">
          <Card className="border-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-4">
                <div className="h-8 w-8 rounded-lg bg-green-50 flex items-center justify-center">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                </div>
                <h2 className="font-semibold text-foreground text-sm">Earnings</h2>
              </div>
              <div className="space-y-3">
                {[
                  { label: "This Week", value: "$1,050" },
                  { label: "This Month", value: "$4,250" },
                  { label: "Total Earned", value: "$28,400" },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">{item.label}</span>
                    <span className="text-sm font-bold text-foreground">{item.value}</span>
                  </div>
                ))}
              </div>
              <Link to="/vendor/earnings">
                <Button variant="outline" size="sm" className="w-full mt-4 text-xs">
                  View Earnings Details
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Today's schedule with See All */}
          <Card className="border-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center">
                    <Calendar className="h-4 w-4 text-blue-600" />
                  </div>
                  <h2 className="font-semibold text-foreground text-sm">Today's Schedule</h2>
                </div>
                {mockSchedule.length > 3 && !showAllSchedule && (
                  <button onClick={() => setShowAllSchedule(true)} className="text-xs text-primary hover:underline flex items-center gap-0.5">
                    See All ({mockSchedule.length}) <ChevronRight className="h-3 w-3" />
                  </button>
                )}
                {showAllSchedule && (
                  <button onClick={() => setShowAllSchedule(false)} className="text-xs text-muted-foreground hover:underline">
                    Show Less
                  </button>
                )}
              </div>
              <div className="space-y-2">
                {scheduleToShow.map((item) => (
                  <div key={item.id} className="p-2.5 rounded-lg border border-border flex items-center gap-3">
                    <img src={item.image} alt="Property" className="h-10 w-14 rounded-md object-cover shrink-0" />
                    <div>
                      <p className="text-xs font-medium text-foreground">{item.time} — {item.type}</p>
                      <p className="text-[10px] text-muted-foreground">{item.address} · {item.task}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* New job opportunities — with Bid button, no budget */}
      <Card className="border-border">
        <CardContent className="p-0">
          <div className="flex items-center justify-between px-5 pt-4 pb-3">
            <h2 className="font-semibold text-foreground text-sm flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-primary/5 flex items-center justify-center">
                <Zap className="h-4 w-4 text-primary" />
              </div>
              New Job Opportunities
            </h2>
            <Link to="/vendor/jobs" className="text-xs text-primary hover:underline flex items-center gap-0.5">
              View all <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="px-5 pb-5 space-y-2">
            {[
              { title: "GFCI Outlet Installation", city: "Toronto, ON", posted: "2h ago", urgency: "Normal", photo: "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=200&h=150&fit=crop", homeownerAvatar: "https://images.unsplash.com/photo-1599566150163-29194dcabd36?w=60&h=60&fit=crop&crop=face", category: "Electrical" },
              { title: "Full Home Rewiring", city: "London, ON", posted: "5h ago", urgency: "Flexible", photo: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=200&h=150&fit=crop", homeownerAvatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=60&h=60&fit=crop&crop=face", category: "Electrical" },
              { title: "Emergency Panel Replacement", city: "Mississauga, ON", posted: "30m ago", urgency: "Urgent", photo: "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=200&h=150&fit=crop", homeownerAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=60&h=60&fit=crop&crop=face", category: "Electrical" },
            ].map((job) => (
              <div key={job.title} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer group">
                <img src={job.photo} alt={job.title} className="h-12 w-16 rounded-lg object-cover shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">{job.title}</p>
                    {job.urgency === "Urgent" && (
                      <Badge className="bg-destructive/10 text-destructive hover:bg-destructive/10 text-[10px] h-4">Urgent</Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                    <MapPin className="h-3 w-3" />{job.city} · {job.category} · Posted {job.posted}
                  </p>
                </div>
                <Button variant="gold" size="sm" className="shrink-0 h-8 px-4 text-xs">
                  Bid
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default VendorHome;
