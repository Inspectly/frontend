import { useState } from "react";
import {
  FileText, Clock, CheckCircle2, XCircle, DollarSign, MapPin,
  Calendar, Search, MessageSquare, Star, ChevronRight,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";

interface Offer {
  id: string;
  vendorName: string;
  vendorAvatar: string;
  vendorRating: number;
  vendorReviews: number;
  property: string;
  propertyImage: string;
  issue: string;
  issueType: string;
  amount: number;
  status: "Pending" | "Accepted" | "Declined";
  date: string;
  message: string;
  estimatedDays: number;
}

const mockOffers: Offer[] = [
  { id: "1", vendorName: "Mike's Electrical", vendorAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&crop=face", vendorRating: 4.8, vendorReviews: 124, property: "2-1781 Henrica Avenue", propertyImage: "https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=200&h=150&fit=crop", issue: "Electrical panel upgrade needed", issueType: "Electrical", amount: 2400, status: "Pending", date: "Mar 7, 2026", message: "Hi, I can start this week. The panel upgrade will include a 200A service with new breakers. All materials and labour included.", estimatedDays: 3 },
  { id: "2", vendorName: "AquaFix Plumbing", vendorAvatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&h=80&fit=crop&crop=face", vendorRating: 4.6, vendorReviews: 89, property: "2-1781 Henrica Avenue", propertyImage: "https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=200&h=150&fit=crop", issue: "Issue with Plumbing in basement", issueType: "Plumbing", amount: 850, status: "Accepted", date: "Mar 3, 2026", message: "We've completed basement plumbing jobs like this many times. Price includes parts and a 1-year warranty.", estimatedDays: 1 },
  { id: "3", vendorName: "ProPipe Solutions", vendorAvatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&h=80&fit=crop&crop=face", vendorRating: 4.3, vendorReviews: 56, property: "45 Riverside Crescent", propertyImage: "https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?w=200&h=150&fit=crop", issue: "Kitchen faucet leaking", issueType: "Plumbing", amount: 320, status: "Declined", date: "Mar 1, 2026", message: "Simple fix — I can replace the cartridge and check the lines. Should be done in under 2 hours.", estimatedDays: 1 },
  { id: "4", vendorName: "BuildRight Contractors", vendorAvatar: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=80&h=80&fit=crop&crop=face", vendorRating: 4.9, vendorReviews: 203, property: "2-1781 Henrica Avenue", propertyImage: "https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=200&h=150&fit=crop", issue: "Deck railing loose", issueType: "Structural", amount: 1100, status: "Pending", date: "Mar 6, 2026", message: "I'll reinforce the existing posts and add new brackets. Can also sand and re-stain if needed for an additional fee.", estimatedDays: 2 },
  { id: "5", vendorName: "Spark Electric Co.", vendorAvatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=80&h=80&fit=crop&crop=face", vendorRating: 4.5, vendorReviews: 67, property: "2-1781 Henrica Avenue", propertyImage: "https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=200&h=150&fit=crop", issue: "Electrical panel upgrade needed", issueType: "Electrical", amount: 2850, status: "Pending", date: "Mar 5, 2026", message: "Full panel replacement with surge protection included. ESA-certified and fully insured.", estimatedDays: 4 },
];

const statusConfig: Record<string, { color: string; icon: typeof Clock }> = {
  Pending: { color: "bg-amber-100 text-amber-700", icon: Clock },
  Accepted: { color: "bg-green-100 text-green-700", icon: CheckCircle2 },
  Declined: { color: "bg-red-100 text-red-700", icon: XCircle },
};

const Offers = () => {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [groupBy, setGroupBy] = useState<"none" | "address" | "issueType">("none");
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);

  const filtered = mockOffers.filter((o) => {
    if (statusFilter !== "all" && o.status !== statusFilter) return false;
    if (search && !o.vendorName.toLowerCase().includes(search.toLowerCase()) && !o.issue.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const pendingCount = mockOffers.filter((o) => o.status === "Pending").length;
  const acceptedCount = mockOffers.filter((o) => o.status === "Accepted").length;

  // Group offers
  const groupedOffers = (() => {
    if (groupBy === "none") return { "": filtered };
    const groups: Record<string, Offer[]> = {};
    filtered.forEach((o) => {
      const key = groupBy === "address" ? o.property : o.issueType;
      if (!groups[key]) groups[key] = [];
      groups[key].push(o);
    });
    return groups;
  })();

  const renderOfferCard = (offer: Offer) => {
    const cfg = statusConfig[offer.status];
    const StatusIcon = cfg.icon;
    return (
      <Card
        key={offer.id}
        className="border-border hover:border-primary/20 hover:shadow-sm transition-all duration-300 cursor-pointer group"
        onClick={() => setSelectedOffer(offer)}
      >
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <img
              src={offer.vendorAvatar}
              alt={offer.vendorName}
              className="h-11 w-11 rounded-full object-cover shrink-0"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                  {offer.vendorName}
                </h3>
                <div className="flex items-center gap-0.5 text-xs text-muted-foreground">
                  <Star className="h-3 w-3 fill-primary text-primary" />
                  {offer.vendorRating}
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                {offer.issue} · {offer.property}
              </p>
            </div>
            <img
              src={offer.propertyImage}
              alt={offer.property}
              className="hidden md:block h-10 w-14 rounded-md object-cover shrink-0"
            />
            <div className="hidden sm:flex items-center gap-3 shrink-0">
              <span className="text-lg font-bold text-foreground">${offer.amount.toLocaleString()}</span>
              <span className={`px-2.5 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${cfg.color}`}>
                <StatusIcon className="h-3 w-3" />
                {offer.status}
              </span>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
          </div>
          <div className="flex sm:hidden items-center gap-2 mt-3">
            <span className="text-sm font-bold text-foreground">${offer.amount.toLocaleString()}</span>
            <span className={`px-2.5 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${cfg.color}`}>
              <StatusIcon className="h-3 w-3" />
              {offer.status}
            </span>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto animate-fade-up">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl lg:text-3xl font-display font-bold text-foreground">Offers</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {pendingCount} pending · {acceptedCount} accepted
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <Card className="border-border">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
              <Clock className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{pendingCount}</p>
              <p className="text-xs text-muted-foreground">Pending</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center shrink-0">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{acceptedCount}</p>
              <p className="text-xs text-muted-foreground">Accepted</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <DollarSign className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">
                ${mockOffers.filter((o) => o.status === "Accepted").reduce((s, o) => s + o.amount, 0).toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground">Committed</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search vendor or issue..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px] text-sm">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="Pending">Pending</SelectItem>
            <SelectItem value="Accepted">Accepted</SelectItem>
            <SelectItem value="Declined">Declined</SelectItem>
          </SelectContent>
        </Select>
        <Select value={groupBy} onValueChange={(v) => setGroupBy(v as "none" | "address" | "issueType")}>
          <SelectTrigger className="w-[160px] text-sm">
            <SelectValue placeholder="Group By" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">No Grouping</SelectItem>
            <SelectItem value="address">By Address</SelectItem>
            <SelectItem value="issueType">By Issue Type</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Offers list */}
      {filtered.length === 0 ? (
        <Card className="py-16">
          <CardContent className="flex flex-col items-center text-center">
            <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center mb-4">
              <FileText className="h-7 w-7 text-muted-foreground" />
            </div>
            <h3 className="font-semibold text-foreground mb-1">No offers yet</h3>
            <p className="text-sm text-muted-foreground">Post a job from a property page to start receiving quotes from verified vendors.</p>
          </CardContent>
        </Card>
      ) : groupBy === "none" ? (
        <div className="space-y-3">
          {filtered.map(renderOfferCard)}
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedOffers).map(([group, offers]) => (
            <div key={group}>
              <div className="flex items-center gap-2 mb-3">
                {groupBy === "address" && <MapPin className="h-4 w-4 text-muted-foreground" />}
                <h3 className="text-sm font-semibold text-foreground">{group}</h3>
                <span className="text-xs text-muted-foreground">({offers.length})</span>
              </div>
              <div className="space-y-3">
                {offers.map(renderOfferCard)}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Offer detail dialog */}
      <Dialog open={!!selectedOffer} onOpenChange={() => setSelectedOffer(null)}>
        <DialogContent className="sm:max-w-lg">
          {selectedOffer && (() => {
            const cfg = statusConfig[selectedOffer.status];
            const StatusIcon = cfg.icon;
            return (
              <>
                <DialogHeader>
                  <div className="flex items-center gap-3 mb-1">
                    <img src={selectedOffer.vendorAvatar} alt={selectedOffer.vendorName} className="h-10 w-10 rounded-full object-cover" />
                    <div>
                      <DialogTitle className="flex items-center gap-2">
                        {selectedOffer.vendorName}
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-1 ${cfg.color}`}>
                          <StatusIcon className="h-3 w-3" />
                          {selectedOffer.status}
                        </span>
                      </DialogTitle>
                      <DialogDescription className="flex items-center gap-1">
                        <Star className="h-3.5 w-3.5 fill-primary text-primary" />
                        {selectedOffer.vendorRating} ({selectedOffer.vendorReviews} reviews)
                      </DialogDescription>
                    </div>
                  </div>
                </DialogHeader>

                {/* Property preview */}
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border border-border">
                  <img src={selectedOffer.propertyImage} alt={selectedOffer.property} className="h-12 w-16 rounded-md object-cover shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-foreground">{selectedOffer.issue}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                      <MapPin className="h-3 w-3" /> {selectedOffer.property}
                    </p>
                  </div>
                </div>

                <div className="space-y-4 py-2">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-muted/50 rounded-lg p-3">
                      <p className="text-xs text-muted-foreground mb-1">Quote Amount</p>
                      <p className="text-lg font-bold text-foreground">${selectedOffer.amount.toLocaleString()}</p>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-3">
                      <p className="text-xs text-muted-foreground mb-1">Est. Duration</p>
                      <p className="text-lg font-bold text-foreground">{selectedOffer.estimatedDays} day{selectedOffer.estimatedDays > 1 ? "s" : ""}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Calendar className="h-3.5 w-3.5" /> {selectedOffer.date}
                  </div>
                  <div className="bg-muted/30 rounded-lg p-4 border border-border">
                    <div className="flex items-center gap-1.5 text-xs font-medium text-foreground mb-2">
                      <MessageSquare className="h-3.5 w-3.5" /> Vendor Message
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">{selectedOffer.message}</p>
                  </div>
                </div>
                {selectedOffer.status === "Pending" && (
                  <DialogFooter className="gap-2">
                    <Button variant="outline" onClick={() => setSelectedOffer(null)}>Decline</Button>
                    <Button variant="gold" onClick={() => setSelectedOffer(null)}>Accept Offer</Button>
                  </DialogFooter>
                )}
              </>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Offers;
