import { useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  MapPin, Eye, EyeOff, MessageSquare, Clock,
  CheckCircle2, ChevronRight, Send, Calendar,
  AlertTriangle, Play, ChevronLeft, Share, Heart, Plus, ImagePlus,
} from "lucide-react";

interface Issue {
  id: string;
  summary: string;
  type: string;
  severity: "High" | "Medium" | "Low";
  status: "Open" | "In Progress" | "Completed";
  marketplace: boolean;
  date: string;
  source?: "inspection" | "manual";
  icon: React.ComponentType<{ className?: string }>;
}

interface IssueDetailDialogProps {
  issue: Issue | null;
  propertyAddress: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface AttentionIssue {
  id: string;
  summary: string;
  severity: "High" | "Medium";
  type: string;
}

const severityConfig: Record<string, { color: string; bg: string }> = {
  High: { color: "text-red-700", bg: "bg-red-100" },
  Medium: { color: "text-amber-700", bg: "bg-amber-100" },
  Low: { color: "text-green-700", bg: "bg-green-100" },
};

const statusConfig: Record<string, { color: string; bg: string; icon: typeof Clock }> = {
  Open: { color: "text-blue-700", bg: "bg-blue-100", icon: AlertTriangle },
  "In Progress": { color: "text-primary", bg: "bg-primary/10", icon: Clock },
  Completed: { color: "text-green-700", bg: "bg-green-100", icon: CheckCircle2 },
};

// Mock media for the gallery
const mockMedia = [
  { type: "image" as const, url: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=800&h=500&fit=crop", alt: "Electrical panel overview" },
  { type: "image" as const, url: "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=800&h=500&fit=crop", alt: "Close-up of wiring" },
  { type: "video" as const, url: "https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=800&h=500&fit=crop", alt: "Video walkthrough" },
  { type: "image" as const, url: "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=800&h=500&fit=crop", alt: "Basement area" },
  { type: "image" as const, url: "https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800&h=500&fit=crop", alt: "Kitchen area" },
];

const mockComments = [
  { id: "1", author: "You", initials: "JD", text: "Can we get this fixed by next week?", time: "Mar 5, 2026", isOwner: true },
  { id: "2", author: "Mike's Electrical", initials: "ME", text: "Yes, I can schedule it for Monday. I'll bring all the necessary parts and should be done by end of day.", time: "Mar 6, 2026", isOwner: false },
  { id: "3", author: "You", initials: "JD", text: "Sounds great, thank you!", time: "Mar 6, 2026", isOwner: true },
];

const mockAttentionIssues: AttentionIssue[] = [
  { id: "a1", summary: "Electrical panel arcing detected — immediate replacement recommended", severity: "High", type: "Electrical" },
  { id: "a2", summary: "Water stains on basement ceiling — possible pipe leak above", severity: "High", type: "Plumbing" },
];

// Attention Issues Detail Dialog
const AttentionIssuesDialog = ({ open, onOpenChange, issues }: { open: boolean; onOpenChange: (open: boolean) => void; issues: AttentionIssue[] }) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-destructive" />
          Issues Needing Attention
        </DialogTitle>
        <DialogDescription>
          These issues require immediate action based on severity and status.
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-3 py-2">
        {issues.map((issue) => {
          const sev = severityConfig[issue.severity];
          return (
            <div key={issue.id} className="p-4 rounded-lg border border-border hover:border-primary/20 transition-colors cursor-pointer">
              <div className="flex items-start gap-3">
                <div className={`h-8 w-8 rounded-full ${sev.bg} flex items-center justify-center shrink-0 mt-0.5`}>
                  <AlertTriangle className={`h-4 w-4 ${sev.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{issue.summary}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${sev.bg} ${sev.color}`}>
                      {issue.severity} Priority
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-muted text-muted-foreground">
                      {issue.type}
                    </span>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 mt-1" />
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>Close</Button>
      </div>
    </DialogContent>
  </Dialog>
);

const IssueDetailDialog = ({ issue, propertyAddress, open, onOpenChange }: IssueDetailDialogProps) => {
  const [commentText, setCommentText] = useState("");
  const [activeImage, setActiveImage] = useState(0);
  const [attentionOpen, setAttentionOpen] = useState(false);

  if (!issue) return null;

  const sev = severityConfig[issue.severity];
  const stat = statusConfig[issue.status];
  const StatusIcon = stat.icon;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-3xl max-h-[92vh] p-0 overflow-hidden gap-0">
          {/* Airbnb-style photo gallery */}
          <div className="relative bg-foreground/5">
            {/* Main image */}
            <div className="relative h-64 sm:h-72 overflow-hidden">
              <img
                src={mockMedia[activeImage].url}
                alt={mockMedia[activeImage].alt}
                className="w-full h-full object-cover transition-opacity duration-300"
              />
              {/* Video play overlay */}
              {mockMedia[activeImage].type === "video" && (
                <div className="absolute inset-0 flex items-center justify-center bg-foreground/20">
                  <div className="h-14 w-14 rounded-full bg-background/90 flex items-center justify-center shadow-lg cursor-pointer hover:scale-105 transition-transform">
                    <Play className="h-6 w-6 text-foreground ml-0.5" />
                  </div>
                </div>
              )}
              {/* Nav arrows */}
              {activeImage > 0 && (
                <button
                  onClick={() => setActiveImage((p) => p - 1)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-background/90 flex items-center justify-center shadow-sm hover:bg-background transition-colors"
                >
                  <ChevronLeft className="h-4 w-4 text-foreground" />
                </button>
              )}
              {activeImage < mockMedia.length - 1 && (
                <button
                  onClick={() => setActiveImage((p) => p + 1)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-background/90 flex items-center justify-center shadow-sm hover:bg-background transition-colors"
                >
                  <ChevronRight className="h-4 w-4 text-foreground" />
                </button>
              )}
              {/* Counter */}
              <div className="absolute bottom-3 right-3 bg-foreground/70 text-background text-xs px-2.5 py-1 rounded-full font-medium">
                {activeImage + 1} / {mockMedia.length}
              </div>
            </div>

            {/* Thumbnail strip with add button */}
            <div className="flex gap-1.5 px-4 py-2.5 overflow-x-auto items-center">
              {mockMedia.map((media, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImage(i)}
                  className={`relative h-12 w-16 rounded-md overflow-hidden shrink-0 transition-all duration-200 ${
                    i === activeImage
                      ? "ring-2 ring-primary ring-offset-1 ring-offset-background opacity-100"
                      : "opacity-50 hover:opacity-80"
                  }`}
                >
                  <img src={media.url} alt={media.alt} className="h-full w-full object-cover" />
                  {media.type === "video" && (
                    <div className="absolute inset-0 flex items-center justify-center bg-foreground/30">
                      <Play className="h-3 w-3 text-background fill-background" />
                    </div>
                  )}
                </button>
              ))}
              {/* Add more photos/videos button */}
              <button className="h-12 w-16 rounded-md border-2 border-dashed border-muted-foreground/30 flex flex-col items-center justify-center shrink-0 hover:border-primary/50 hover:bg-primary/5 transition-colors cursor-pointer">
                <ImagePlus className="h-4 w-4 text-muted-foreground" />
                <span className="text-[8px] text-muted-foreground mt-0.5">Add</span>
              </button>
            </div>
          </div>

          {/* Content */}
          <ScrollArea className="max-h-[calc(92vh-22rem)]">
            <div className="px-6 py-5">
              {/* Title row */}
              <div className="flex items-start justify-between gap-3 mb-1">
                <div className="flex-1">
                  <DialogHeader className="p-0 space-y-0">
                    <DialogTitle className="text-xl font-display leading-snug">{issue.summary}</DialogTitle>
                  </DialogHeader>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-muted-foreground">
                    <Share className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-muted-foreground">
                    <Heart className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Location + source */}
              <DialogDescription className="flex items-center gap-1.5 mb-4">
                <MapPin className="h-3 w-3" /> {propertyAddress}
              </DialogDescription>

              {/* Attention banner — clickable */}
              {mockAttentionIssues.length > 0 && (
                <button
                  onClick={() => setAttentionOpen(true)}
                  className="w-full mb-5 p-3 rounded-lg bg-destructive/5 border border-destructive/20 flex items-center gap-3 hover:bg-destructive/10 transition-colors text-left"
                >
                  <div className="h-8 w-8 rounded-full bg-destructive/10 flex items-center justify-center shrink-0">
                    <AlertTriangle className="h-4 w-4 text-destructive" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">{mockAttentionIssues.length} issues need attention</p>
                    <p className="text-xs text-muted-foreground">Click to review critical items</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                </button>
              )}

              {/* Metadata chips */}
              <div className="flex flex-wrap items-center gap-2 mb-5">
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${sev.bg} ${sev.color}`}>
                  {issue.severity} Priority
                </span>
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${stat.bg} ${stat.color}`}>
                  <StatusIcon className="h-3 w-3" /> {issue.status}
                </span>
                <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-muted text-muted-foreground">
                  {issue.type}
                </span>
                {issue.source && (
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                    issue.source === "inspection" ? "bg-purple-100 text-purple-700" : "bg-primary/10 text-primary"
                  }`}>
                    {issue.source === "inspection" ? "Inspection Report" : "Manually Posted"}
                  </span>
                )}
              </div>

              {/* Divider */}
              <div className="border-t border-border mb-5" />

              {/* Key details */}
              <div className="space-y-4 mb-5">
                <div className="flex items-start gap-3">
                  <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center shrink-0 mt-0.5">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">Reported on {issue.date}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {issue.source === "inspection"
                        ? "Identified during professional home inspection"
                        : "Submitted manually by homeowner"}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center shrink-0 mt-0.5">
                    {issue.marketplace ? (
                      <Eye className="h-4 w-4 text-primary" />
                    ) : (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-foreground">Marketplace Visibility</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {issue.marketplace
                            ? "Vendors can view and submit quotes for this issue"
                            : "Not visible to vendors — enable to receive quotes"}
                        </p>
                      </div>
                      <Switch checked={issue.marketplace} className="shrink-0 ml-3" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Divider */}
              <div className="border-t border-border mb-5" />

              {/* Description */}
              <div className="mb-5">
                <h3 className="text-base font-semibold text-foreground mb-2">About this issue</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  The electrical panel in the main service room is a Federal Pacific Stab-Lok model,
                  which is known for breaker failure issues. The panel shows signs of overheating and
                  several breakers do not trip properly under load. A full 200A panel upgrade is
                  recommended to meet current electrical code requirements and ensure safety.
                </p>
              </div>

              {/* Divider */}
              <div className="border-t border-border mb-5" />

              {/* Conversation */}
              <div className="mb-2">
                <h3 className="text-base font-semibold text-foreground mb-4 flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Conversation
                  <span className="text-xs font-normal text-muted-foreground">({mockComments.length})</span>
                </h3>
                <div className="space-y-3 mb-4">
                  {mockComments.map((c) => (
                    <div key={c.id} className={`flex gap-2.5 ${c.isOwner ? "flex-row-reverse" : ""}`}>
                      <Avatar className="h-7 w-7 shrink-0 mt-0.5">
                        <AvatarFallback className={`text-[10px] font-semibold ${
                          c.isOwner ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                        }`}>
                          {c.initials}
                        </AvatarFallback>
                      </Avatar>
                      <div className={`max-w-[80%] ${c.isOwner ? "text-right" : ""}`}>
                        <div className={`rounded-2xl px-3.5 py-2.5 ${
                          c.isOwner
                            ? "bg-primary text-primary-foreground rounded-tr-md"
                            : "bg-muted/60 text-foreground rounded-tl-md"
                        }`}>
                          <p className="text-sm leading-relaxed">{c.text}</p>
                        </div>
                        <div className={`flex items-center gap-1.5 mt-1 ${c.isOwner ? "justify-end" : ""}`}>
                          <span className="text-[10px] text-muted-foreground">{c.author}</span>
                          <span className="text-muted-foreground/30">·</span>
                          <span className="text-[10px] text-muted-foreground">{c.time}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="Write a message..."
                    className="flex-1 text-sm h-10 rounded-full px-4"
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                  />
                  <Button
                    variant="gold"
                    size="icon"
                    className="h-10 w-10 rounded-full shrink-0"
                    disabled={!commentText.trim()}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </ScrollArea>

          {/* Sticky footer */}
          {issue.status === "Open" && (
            <div className="px-6 py-3 border-t border-border bg-background flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Ready to fix?</p>
                <p className="text-sm font-semibold text-foreground">Get quotes from verified vendors</p>
              </div>
              <Button variant="gold" className="gap-2 rounded-lg">
                Post a Job <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Attention Issues sub-dialog */}
      <AttentionIssuesDialog
        open={attentionOpen}
        onOpenChange={setAttentionOpen}
        issues={mockAttentionIssues}
      />
    </>
  );
};

export default IssueDetailDialog;
