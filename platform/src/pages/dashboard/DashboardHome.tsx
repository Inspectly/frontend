import { useState } from "react";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  Building2, FileText, DollarSign,
  Calendar, CheckCircle2, ChevronRight, Plus, ClipboardCheck,
  MessageSquare, TrendingUp, Home, Loader2, X,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useGetListingByUserIdQuery } from "@/features/api/listingsApi";
import { useGetReportsByUserIdQuery } from "@/features/api/reportsApi";
import { RootState } from "@/store/store";
import listingPlaceholder from "@/assets/listing-placeholder.png";

const mockUpcomingVisits = [
  { id: "1", vendor: "Mike's Electrical", vendorAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=60&h=60&fit=crop&crop=face", date: "Mar 10, 9:00 AM", property: "2-1781 Henrica Ave", issue: "Panel inspection", propertyImage: "https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=200&h=150&fit=crop" },
  { id: "2", vendor: "AquaFix Plumbing", vendorAvatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=60&h=60&fit=crop&crop=face", date: "Mar 11, 2:00 PM", property: "45 Riverside Crescent", issue: "Basement leak assessment", propertyImage: "https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?w=200&h=150&fit=crop" },
  { id: "3", vendor: "BuildRight Co.", vendorAvatar: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=60&h=60&fit=crop&crop=face", date: "Mar 12, 10:00 AM", property: "2-1781 Henrica Ave", issue: "Deck railing check", propertyImage: "https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=200&h=150&fit=crop" },
  { id: "4", vendor: "ProPipe Solutions", vendorAvatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=60&h=60&fit=crop&crop=face", date: "Mar 13, 11:00 AM", property: "88 Queen St", issue: "Kitchen faucet", propertyImage: "https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=200&h=150&fit=crop" },
  { id: "5", vendor: "Spark Electric", vendorAvatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=60&h=60&fit=crop&crop=face", date: "Mar 14, 3:00 PM", property: "12 Maple Lane", issue: "Wiring assessment", propertyImage: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=200&h=150&fit=crop" },
];

const mockQuotes = [
  { id: "1", vendor: "Mike's Electrical", vendorAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=60&h=60&fit=crop&crop=face", issue: "Electrical panel upgrade", amount: "$2,400", property: "2-1781 Henrica Ave" },
  { id: "2", vendor: "Spark Electric Co.", vendorAvatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=60&h=60&fit=crop&crop=face", issue: "Electrical panel upgrade", amount: "$2,850", property: "2-1781 Henrica Ave" },
];

const mockVisitRequests = [
  { id: "1", vendor: "BuildRight Contractors", vendorAvatar: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=60&h=60&fit=crop&crop=face", issue: "Deck railing loose", requestedDate: "Mar 12, 10:00 AM", property: "2-1781 Henrica Ave" },
];

const DashboardHome = () => {
  const user = useSelector((state: RootState) => state.auth.user);
  const { data: listings = [], isLoading } = useGetListingByUserIdQuery(user?.id!, {
    skip: !user?.id,
  });
  const { data: reports = [] } = useGetReportsByUserIdQuery(user?.id!, {
    skip: !user?.id,
  });
  const [showAllVisits, setShowAllVisits] = useState(false);

  const totalIssues = 0;
  const openIssues = 0;
  const completedIssues = 0;
  const resolutionRate = totalIssues > 0 ? Math.round((completedIssues / totalIssues) * 100) : 0;

  const visitsToShow = showAllVisits ? mockUpcomingVisits : mockUpcomingVisits.slice(0, 3);

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto animate-fade-up">
      {/* Header row */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-lg font-bold text-primary">
              {user?.firebase_id?.charAt(0)?.toUpperCase() || "U"}
            </span>
          </div>
          <div>
            <h1 className="text-2xl lg:text-3xl font-display font-bold text-foreground">
              Today at a glance
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">Welcome back</p>
          </div>
        </div>
        <Link to="/dashboard/properties">
          <Button variant="gold" className="gap-2">
            <Plus className="h-4 w-4" />
            Create
          </Button>
        </Link>
      </div>

      {/* Top stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Properties", value: String(listings.length), icon: Building2, iconBg: "bg-primary/5", iconColor: "text-primary", href: "/dashboard/properties" },
          { label: "Reports", value: String(reports.length), icon: FileText, iconBg: "bg-blue-50", iconColor: "text-blue-600", href: "/dashboard/reports" },
          { label: "Approvals Needed", value: "0", icon: ClipboardCheck, iconBg: "bg-amber-50", iconColor: "text-amber-600" },
          { label: "Spent on Repairs", value: "$0", icon: DollarSign, iconBg: "bg-green-50", iconColor: "text-green-600" },
        ].map((stat) => {
          const card = (
            <Card key={stat.label} className="border-border hover:shadow-sm transition-shadow cursor-pointer">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className={`h-8 w-8 rounded-lg ${stat.iconBg} flex items-center justify-center`}>
                    <stat.icon className={`h-4 w-4 ${stat.iconColor}`} />
                  </div>
                </div>
                <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
              </CardContent>
            </Card>
          );
          return stat.href ? (
            <Link key={stat.label} to={stat.href}>{card}</Link>
          ) : (
            card
          );
        })}
      </div>

      {/* Two-column layout: Priority Inbox + Health */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        {/* Priority Inbox */}
        <Card className="lg:col-span-2 border-border">
          <CardContent className="p-0">
            <div className="flex items-center justify-between px-5 pt-4 pb-2">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center">
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                </div>
                <h2 className="font-semibold text-foreground text-sm">Priority Inbox</h2>
              </div>
              <Link to="/dashboard/offers" className="text-xs text-primary hover:underline flex items-center gap-0.5">
                View all <ChevronRight className="h-3 w-3" />
              </Link>
            </div>

            <Tabs defaultValue="quotes" className="px-5 pb-4">
              <TabsList className="bg-muted/50 h-8 mb-3">
                <TabsTrigger value="approvals" className="text-xs h-6 px-3">Approvals</TabsTrigger>
                <TabsTrigger value="quotes" className="text-xs h-6 px-3">Quotes ({mockQuotes.length})</TabsTrigger>
                <TabsTrigger value="visits" className="text-xs h-6 px-3">Visit Requests ({mockVisitRequests.length})</TabsTrigger>
              </TabsList>

              <TabsContent value="approvals" className="mt-0">
                <div className="py-6 text-center">
                  <CheckCircle2 className="h-8 w-8 text-green-500 mx-auto mb-2 opacity-50" />
                  <p className="text-sm text-muted-foreground">No approvals pending</p>
                </div>
              </TabsContent>

              <TabsContent value="quotes" className="mt-0">
                {mockQuotes.length === 0 ? (
                  <div className="py-6 text-center">
                    <CheckCircle2 className="h-8 w-8 text-green-500 mx-auto mb-2 opacity-50" />
                    <p className="text-sm text-muted-foreground">No quotes to review</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {mockQuotes.map((quote) => (
                      <div key={quote.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                        <img src={quote.vendorAvatar} alt={quote.vendor} className="h-9 w-9 rounded-full object-cover shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground">{quote.vendor}</p>
                          <p className="text-xs text-muted-foreground line-clamp-1">{quote.issue} · {quote.property}</p>
                        </div>
                        <p className="text-sm font-bold text-foreground shrink-0">{quote.amount}</p>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <Button variant="outline" size="sm" className="h-7 px-2.5 text-xs">Decline</Button>
                          <Button variant="gold" size="sm" className="h-7 px-2.5 text-xs">Accept</Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="visits" className="mt-0">
                {mockVisitRequests.length === 0 ? (
                  <div className="py-6 text-center">
                    <CheckCircle2 className="h-8 w-8 text-green-500 mx-auto mb-2 opacity-50" />
                    <p className="text-sm text-muted-foreground">No visit requests pending</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {mockVisitRequests.map((req) => (
                      <div key={req.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                        <img src={req.vendorAvatar} alt={req.vendor} className="h-9 w-9 rounded-full object-cover shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground">{req.vendor}</p>
                          <p className="text-xs text-muted-foreground line-clamp-1">{req.issue} · {req.property}</p>
                          <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                            <Calendar className="h-3 w-3" /> {req.requestedDate}
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <Button variant="outline" size="sm" className="h-7 px-2.5 text-xs">Decline</Button>
                          <Button variant="gold" size="sm" className="h-7 px-2.5 text-xs">Accept</Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Project Health + Upcoming Visits */}
        <div className="space-y-4">
          <Card className="border-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-4">
                <div className="h-8 w-8 rounded-lg bg-primary/5 flex items-center justify-center">
                  <TrendingUp className="h-4 w-4 text-primary" />
                </div>
                <h2 className="font-semibold text-foreground text-sm">Project Health</h2>
              </div>

              <div className="mb-4">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs text-muted-foreground">Resolution Rate</span>
                  <span className="text-sm font-bold text-foreground">{resolutionRate}%</span>
                </div>
                <Progress value={resolutionRate} className="h-2" />
              </div>

              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: "Total", value: totalIssues, color: "text-foreground" },
                  { label: "Open", value: openIssues, color: "text-amber-600" },
                  { label: "Done", value: completedIssues, color: "text-green-600" },
                ].map((item) => (
                  <div key={item.label} className="text-center rounded-lg bg-muted/40 p-2.5">
                    <p className={`text-lg font-bold ${item.color}`}>{item.value}</p>
                    <p className="text-[10px] text-muted-foreground">{item.label}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-green-50 flex items-center justify-center">
                    <Calendar className="h-4 w-4 text-green-600" />
                  </div>
                  <h2 className="font-semibold text-foreground text-sm">Upcoming Visits</h2>
                </div>
                {mockUpcomingVisits.length > 3 && !showAllVisits && (
                  <button onClick={() => setShowAllVisits(true)} className="text-xs text-primary hover:underline flex items-center gap-0.5">
                    See All ({mockUpcomingVisits.length}) <ChevronRight className="h-3 w-3" />
                  </button>
                )}
                {showAllVisits && (
                  <button onClick={() => setShowAllVisits(false)} className="text-xs text-muted-foreground hover:underline">
                    Show Less
                  </button>
                )}
              </div>
              {mockUpcomingVisits.length === 0 ? (
                <div className="py-4 text-center">
                  <p className="text-sm text-muted-foreground">No confirmed visits scheduled</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {visitsToShow.map((visit) => (
                    <div key={visit.id} className="p-2.5 rounded-lg border border-border flex items-center gap-3">
                      <img src={visit.propertyImage} alt={visit.property} className="h-10 w-14 rounded-md object-cover shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-foreground">{visit.date}</p>
                        <p className="text-[10px] text-muted-foreground line-clamp-1">{visit.property} · {visit.issue}</p>
                        <p className="text-[10px] text-muted-foreground">{visit.vendor}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Active Properties */}
      <Card className="border-border">
        <CardContent className="p-0">
          <div className="flex items-center justify-between px-5 pt-4 pb-3">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center">
                <Home className="h-4 w-4 text-muted-foreground" />
              </div>
              <h2 className="font-semibold text-foreground text-sm">Active Properties</h2>
            </div>
            <Link to="/dashboard/properties" className="text-xs text-primary hover:underline flex items-center gap-0.5">
              View all <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="px-5 pb-5">
            {isLoading ? (
              <div className="py-8 flex justify-center">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : listings.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-sm text-muted-foreground mb-3">No properties yet</p>
                <Link to="/dashboard/properties">
                  <Button variant="gold" size="sm" className="gap-2">
                    <Plus className="h-4 w-4" />
                    Add Property
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {listings.slice(0, 3).map((listing) => (
                  <Link key={listing.id} to={`/dashboard/properties/${listing.id}`} className="group">
                    <div className="rounded-xl overflow-hidden border border-border hover:border-primary/20 hover:shadow-sm transition-all">
                      <div className="relative h-36 overflow-hidden">
                        <img
                          src={listing.image_url && listing.image_url !== "None" ? listing.image_url : listingPlaceholder}
                          alt={listing.address}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 to-transparent" />
                        <div className="absolute bottom-3 left-3 text-background">
                          <p className="text-sm font-semibold">{listing.address}</p>
                          <p className="text-xs opacity-80">{listing.city}, {listing.state}</p>
                        </div>
                      </div>
                      <div className="px-3 py-2.5 flex items-center justify-end">
                        <span className="text-xs text-primary font-medium flex items-center gap-0.5 group-hover:underline">
                          View <ChevronRight className="h-3 w-3" />
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardHome;
