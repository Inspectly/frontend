import { useState } from "react";
import {
  MapPin, Clock, Search, Star, AlertTriangle, Calendar,
  SlidersHorizontal, ArrowUpDown, Zap, Wrench, Droplets, Hammer, Plug,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";

interface Job {
  id: string;
  title: string;
  description: string;
  city: string;
  posted: string;
  postedMinutes: number;
  urgency: "Urgent" | "Normal" | "Flexible";
  category: string;
  homeowner: string;
  homeownerRating: number;
  homeownerAvatar: string;
  photos: string[];
  propertyImage: string;
}

const mockJobs: Job[] = [
  { id: "1", title: "Emergency Panel Replacement", description: "200A panel is arcing and needs immediate replacement. Currently on a temporary bypass. ESA inspection required after completion.", city: "Mississauga, ON", posted: "30m ago", postedMinutes: 30, urgency: "Urgent", category: "Electrical", homeowner: "Lisa W.", homeownerRating: 4.9, homeownerAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=60&h=60&fit=crop&crop=face", photos: ["https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=400&h=300&fit=crop"], propertyImage: "https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?w=400&h=300&fit=crop" },
  { id: "2", title: "GFCI Outlet Installation", description: "Need 4 GFCI outlets installed in kitchen and 2 bathrooms. Currently have standard outlets. Home built in 1985.", city: "Toronto, ON", posted: "2h ago", postedMinutes: 120, urgency: "Normal", category: "Electrical", homeowner: "Tom R.", homeownerRating: 4.7, homeownerAvatar: "https://images.unsplash.com/photo-1599566150163-29194dcabd36?w=60&h=60&fit=crop&crop=face", photos: [], propertyImage: "https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=400&h=300&fit=crop" },
  { id: "3", title: "Full Home Rewiring", description: "1960s bungalow with aluminum wiring needs full copper rewiring. 1,800 sq ft, single storey plus finished basement.", city: "London, ON", posted: "5h ago", postedMinutes: 300, urgency: "Flexible", category: "Electrical", homeowner: "James M.", homeownerRating: 5.0, homeownerAvatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=60&h=60&fit=crop&crop=face", photos: ["https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=400&h=300&fit=crop"], propertyImage: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=400&h=300&fit=crop" },
  { id: "4", title: "EV Charger Installation", description: "Tesla Wall Connector installation in attached garage. 200A service already in place. Need dedicated 60A circuit.", city: "Hamilton, ON", posted: "1d ago", postedMinutes: 1440, urgency: "Normal", category: "Electrical", homeowner: "Nina P.", homeownerRating: 4.6, homeownerAvatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=60&h=60&fit=crop&crop=face", photos: [], propertyImage: "https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=400&h=300&fit=crop" },
  { id: "5", title: "Knob-and-Tube Removal", description: "Partial knob-and-tube still active in attic. Insurance requiring removal for policy renewal. Approx 400 sq ft area.", city: "Waterloo, ON", posted: "3h ago", postedMinutes: 180, urgency: "Urgent", category: "Electrical", homeowner: "Derek S.", homeownerRating: 4.8, homeownerAvatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=60&h=60&fit=crop&crop=face", photos: ["https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=400&h=300&fit=crop"], propertyImage: "https://images.unsplash.com/photo-1560185007-cde436f6a4d0?w=400&h=300&fit=crop" },
  { id: "6", title: "Bathroom Fan Replacement", description: "Exhaust fan in main bathroom stopped working. Possible motor failure. Would like a quieter model installed.", city: "Toronto, ON", posted: "4h ago", postedMinutes: 240, urgency: "Normal", category: "Electrical", homeowner: "Priya K.", homeownerRating: 4.5, homeownerAvatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=60&h=60&fit=crop&crop=face", photos: [], propertyImage: "https://images.unsplash.com/photo-1484154218962-a197022b5858?w=400&h=300&fit=crop" },
  { id: "7", title: "Basement Water Heater Issue", description: "Water heater is making strange noises and not heating properly. May need replacement. Current unit is 12 years old.", city: "London, ON", posted: "6h ago", postedMinutes: 360, urgency: "Urgent", category: "Plumbing", homeowner: "Mark T.", homeownerRating: 4.9, homeownerAvatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=60&h=60&fit=crop&crop=face", photos: ["https://images.unsplash.com/photo-1513694203232-719a280e022f?w=400&h=300&fit=crop"], propertyImage: "https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?w=400&h=300&fit=crop" },
  { id: "8", title: "Foundation Crack Repair", description: "Hairline crack in basement foundation wall, approximately 3 feet long. No active water seepage but want preventive repair.", city: "Mississauga, ON", posted: "1d ago", postedMinutes: 1440, urgency: "Flexible", category: "Structural", homeowner: "Anna L.", homeownerRating: 4.4, homeownerAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=60&h=60&fit=crop&crop=face", photos: [], propertyImage: "https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=400&h=300&fit=crop" },
];

const urgencyColors: Record<string, string> = {
  Urgent: "bg-destructive/10 text-destructive border-destructive/20",
  Normal: "bg-blue-50 text-blue-700 border-blue-200",
  Flexible: "bg-muted text-muted-foreground border-border",
};

const urgencyOrder: Record<string, number> = { Urgent: 0, Normal: 1, Flexible: 2 };

const categories = ["All", "Electrical", "Plumbing", "Structural", "HVAC", "General"];
const cities = ["All Cities", "Toronto, ON", "London, ON", "Mississauga, ON", "Hamilton, ON", "Waterloo, ON"];

const FindJobs = () => {
  const [search, setSearch] = useState("");
  const [urgencyFilter, setUrgencyFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [cityFilter, setCityFilter] = useState("All Cities");
  const [sortBy, setSortBy] = useState<"recent" | "urgency">("recent");
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);

  let filtered = mockJobs.filter((j) => {
    if (urgencyFilter !== "all" && j.urgency !== urgencyFilter) return false;
    if (categoryFilter !== "All" && j.category !== categoryFilter) return false;
    if (cityFilter !== "All Cities" && j.city !== cityFilter) return false;
    if (search && !j.title.toLowerCase().includes(search.toLowerCase()) && !j.city.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  // Sort
  filtered = [...filtered].sort((a, b) => {
    if (sortBy === "urgency") return urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
    return a.postedMinutes - b.postedMinutes;
  });

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto animate-fade-up">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl lg:text-3xl font-display font-bold text-foreground">Marketplace</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Find the perfect jobs for your expertise</p>
      </div>

      {/* Search & Filter Card */}
      <Card className="border-border mb-6">
        <CardContent className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold text-foreground">Search & Filter</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <div className="lg:col-span-2 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search jobs or location..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="text-sm">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c} value={c}>{c === "All" ? "All Types" : c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={cityFilter} onValueChange={setCityFilter}>
              <SelectTrigger className="text-sm">
                <SelectValue placeholder="City" />
              </SelectTrigger>
              <SelectContent>
                {cities.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex gap-2">
              <Button
                variant="gold"
                className="flex-1 text-sm"
                onClick={() => {}}
              >
                Search
              </Button>
              <Button
                variant="outline"
                className="text-sm"
                onClick={() => {
                  setSearch("");
                  setUrgencyFilter("all");
                  setCategoryFilter("All");
                  setCityFilter("All Cities");
                }}
              >
                Clear
              </Button>
            </div>
          </div>
          {/* Sort row */}
          <div className="flex items-center justify-between mt-4 pt-3 border-t border-border">
            <div className="flex items-center gap-3">
              <Select value={urgencyFilter} onValueChange={setUrgencyFilter}>
                <SelectTrigger className="w-[140px] text-xs h-8">
                  <SelectValue placeholder="All Urgencies" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Urgencies</SelectItem>
                  <SelectItem value="Urgent">Urgent</SelectItem>
                  <SelectItem value="Normal">Normal</SelectItem>
                  <SelectItem value="Flexible">Flexible</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Sort by:</span>
              <button
                onClick={() => setSortBy("recent")}
                className={`text-xs px-2.5 py-1 rounded-full transition-colors ${
                  sortBy === "recent" ? "bg-foreground text-background" : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                Most Recent
              </button>
              <button
                onClick={() => setSortBy("urgency")}
                className={`text-xs px-2.5 py-1 rounded-full transition-colors ${
                  sortBy === "urgency" ? "bg-foreground text-background" : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                Urgency
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-foreground">All Issues</h2>
        <p className="text-sm text-muted-foreground">{filtered.length} issues found</p>
      </div>

      {/* Grid of job cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filtered.map((job) => (
          <Card
            key={job.id}
            className="border-border hover:border-primary/20 hover:shadow-md transition-all duration-300 cursor-pointer group overflow-hidden"
            onClick={() => setSelectedJob(job)}
          >
            {/* Image */}
            <div className="relative h-44 overflow-hidden">
              <img
                src={job.propertyImage}
                alt={job.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              {/* Category badge on image */}
              <div className="absolute bottom-3 left-3">
                <Badge className="bg-foreground/80 text-background hover:bg-foreground/80 text-xs backdrop-blur-sm">
                  {job.category}
                </Badge>
              </div>
              {/* Urgency indicator */}
              {job.urgency === "Urgent" && (
                <div className="absolute top-3 right-3">
                  <Badge className="bg-destructive text-destructive-foreground hover:bg-destructive text-[10px] flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" /> Urgent
                  </Badge>
                </div>
              )}
            </div>

            {/* Content */}
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1 flex-1">
                  {job.title}
                </h3>
                <span className="text-xs text-muted-foreground flex items-center gap-1 shrink-0 ml-2">
                  <Clock className="h-3 w-3" /> {job.posted}
                </span>
              </div>

              <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" /> {job.city}
                </span>
                <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium border ${urgencyColors[job.urgency]}`}>
                  {job.urgency}
                </span>
                <span className="flex items-center gap-0.5 ml-auto">
                  <Star className="h-3 w-3 fill-primary text-primary" /> {job.homeownerRating}
                </span>
              </div>

              {/* Bid button */}
              <Button
                variant="gold"
                size="sm"
                className="w-full mt-3 text-xs h-8"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedJob(job);
                }}
              >
                Place Bid
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="py-16 text-center">
          <Search className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-50" />
          <h3 className="font-semibold text-foreground mb-1">No jobs found</h3>
          <p className="text-sm text-muted-foreground">Try adjusting your search or filters</p>
        </div>
      )}

      {/* Job Detail Dialog — no budget, city only */}
      <Dialog open={!!selectedJob} onOpenChange={() => setSelectedJob(null)}>
        <DialogContent className="sm:max-w-lg">
          {selectedJob && (
            <>
              {/* Property image */}
              <div className="relative h-48 -mx-6 -mt-6 mb-4 overflow-hidden rounded-t-lg">
                <img src={selectedJob.propertyImage} alt={selectedJob.title} className="w-full h-full object-cover" />
                <div className="absolute bottom-3 left-3">
                  <Badge className="bg-foreground/80 text-background hover:bg-foreground/80 text-xs backdrop-blur-sm">
                    {selectedJob.category}
                  </Badge>
                </div>
                {selectedJob.urgency === "Urgent" && (
                  <div className="absolute top-3 right-3">
                    <Badge className="bg-destructive text-destructive-foreground hover:bg-destructive text-xs flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" /> Urgent
                    </Badge>
                  </div>
                )}
              </div>

              <DialogHeader>
                <DialogTitle>{selectedJob.title}</DialogTitle>
                <DialogDescription className="flex items-center gap-2 flex-wrap">
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" /> {selectedJob.city}
                  </span>
                  <span className="text-muted-foreground/30">·</span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" /> Posted {selectedJob.posted}
                  </span>
                  <span className="text-muted-foreground/30">·</span>
                  <span className="flex items-center gap-1">
                    <img src={selectedJob.homeownerAvatar} alt={selectedJob.homeowner} className="h-4 w-4 rounded-full object-cover" />
                    {selectedJob.homeowner}
                    <Star className="h-3 w-3 fill-primary text-primary" /> {selectedJob.homeownerRating}
                  </span>
                </DialogDescription>
              </DialogHeader>

              {/* Issue photos */}
              {selectedJob.photos.length > 0 && (
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {selectedJob.photos.map((photo, i) => (
                    <img key={i} src={photo} alt={`Issue photo ${i + 1}`} className="h-28 w-36 rounded-lg object-cover shrink-0" />
                  ))}
                </div>
              )}

              <div className="space-y-4 py-2">
                <div>
                  <p className="text-xs font-medium text-foreground mb-1">Description</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">{selectedJob.description}</p>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${urgencyColors[selectedJob.urgency]}`}>
                    {selectedJob.urgency}
                  </span>
                  <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-muted text-muted-foreground">
                    {selectedJob.category}
                  </span>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setSelectedJob(null)}>Not Interested</Button>
                <Button variant="gold" onClick={() => setSelectedJob(null)}>Place Bid</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FindJobs;
