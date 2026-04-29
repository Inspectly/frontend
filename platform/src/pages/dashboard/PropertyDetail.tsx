import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ArrowLeft, Upload, Plus, MapPin, Loader2, Home, AlertTriangle,
} from "lucide-react";
import PostJobDialog from "@/components/dashboard/PostJobDialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useGetListingByIdQuery } from "@/features/api/listingsApi";
import { useGetIssuesByListingIdQuery } from "@/features/api/issuesApi";
import listingPlaceholder from "@/assets/listing-placeholder.png";

const PropertyDetail = () => {
  const { id } = useParams();
  const { data: listing, isLoading } = useGetListingByIdQuery(Number(id), {
    skip: !id,
  });

  const { data: issues = [], isLoading: issuesLoading } = useGetIssuesByListingIdQuery(Number(id), {
    skip: !id,
  });
  const [postJobOpen, setPostJobOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="p-8 flex justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-xl font-semibold text-foreground">Property not found</h2>
        <Link to="/dashboard/properties" className="text-primary hover:underline text-sm mt-2 inline-block">
          Back to Properties
        </Link>
      </div>
    );
  }

  return (
    <div className="animate-fade-up">
      {/* Hero banner */}
      <div className="relative h-48 lg:h-56 overflow-hidden">
        <img
          src={listing.image_url && listing.image_url !== "None" ? listing.image_url : listingPlaceholder}
          alt={listing.address}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/70 via-foreground/20 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6 lg:p-8 flex items-end justify-between">
          <div>
            <Link
              to="/dashboard/properties"
              className="inline-flex items-center gap-1.5 text-sm text-background/80 hover:text-background transition-colors mb-3"
            >
              <ArrowLeft className="h-4 w-4" />
              Properties
            </Link>
            <h1 className="text-xl lg:text-2xl font-display font-bold text-background">
              {listing.address}
            </h1>
            <div className="flex items-center gap-1.5 text-xs text-background/80 mt-1">
              <MapPin className="h-3 w-3" />
              {listing.city}, {listing.state}
            </div>
          </div>
          {/* Action buttons on right */}
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-1.5 text-xs bg-background/90 hover:bg-background border-background/50">
              <Upload className="h-3.5 w-3.5" />
              Upload Report
            </Button>
            <Button variant="gold" size="sm" className="gap-1.5 text-xs" onClick={() => setPostJobOpen(true)}>
              <Plus className="h-3.5 w-3.5" />
              Post a Job
            </Button>
          </div>
        </div>
      </div>

      <div className="p-6 lg:p-8 max-w-5xl mx-auto">
        {/* Issues */}
        <h2 className="text-lg font-semibold text-foreground mb-4">
          Issues {issues.length > 0 && <span className="text-muted-foreground font-normal">({issues.length})</span>}
        </h2>
        {issuesLoading ? (
          <div className="py-10 flex justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : issues.length === 0 ? (
          <div className="py-10 flex flex-col items-center text-center">
            <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center mb-2">
              <Home className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">No issues found. Post a job or upload a report to get started.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {[...issues].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).map((issue) => (
              <Card key={issue.id} className="hover:shadow-md hover:border-primary/30 transition-all duration-300">
                <CardContent className="p-4 flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center shrink-0 mt-0.5">
                      <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-sm text-foreground line-clamp-1">
                        {issue.summary || issue.description || "Untitled issue"}
                      </p>
                      {issue.description && issue.summary && (
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{issue.description}</p>
                      )}
                      <div className="flex items-center gap-2 mt-1.5">
                        <Badge variant="outline" className="text-[10px] capitalize">{issue.type}</Badge>
                        {issue.severity && (
                          <Badge variant="outline" className="text-[10px] capitalize">{issue.severity}</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className={`text-[10px] capitalize shrink-0 ${
                      issue.status === "open" ? "border-yellow-500/50 text-yellow-600" :
                      issue.status === "in_progress" ? "border-blue-500/50 text-blue-600" :
                      issue.status === "completed" ? "border-green-500/50 text-green-600" :
                      ""
                    }`}
                  >
                    {issue.status.replace("_", " ")}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <PostJobDialog
          open={postJobOpen}
          onOpenChange={setPostJobOpen}
          propertyAddress={`${listing.address}, ${listing.city}, ${listing.state}`}
          listingId={listing.id}
        />
      </div>
    </div>
  );
};

export default PropertyDetail;
