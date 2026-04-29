import { useState } from "react";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { Search, Plus, Building2, MapPin, LayoutGrid, List, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useGetListingByUserIdQuery } from "@/features/api/listingsApi";
import { RootState } from "@/store/store";
import AddListingModal from "@/components/dashboard/AddListingModal";
import listingPlaceholder from "@/assets/listing-placeholder.png";

const Properties = () => {
  const [search, setSearch] = useState("");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [addModalOpen, setAddModalOpen] = useState(false);

  const user = useSelector((state: RootState) => state.auth.user);
  const { data: listings = [], isLoading } = useGetListingByUserIdQuery(user?.id!, {
    skip: !user?.id,
  });

  const filtered = listings.filter(
    (l) =>
      l.address.toLowerCase().includes(search.toLowerCase()) ||
      l.city.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto animate-fade-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl lg:text-3xl font-display font-bold text-foreground">
            My Properties
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {listings.length} properties
          </p>
        </div>
        <Button variant="gold" className="gap-2 shrink-0" onClick={() => setAddModalOpen(true)}>
          <Plus className="h-4 w-4" />
          Add Property
        </Button>
      </div>

      {/* Search & view toggle */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by address or city..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex border border-border rounded-lg overflow-hidden shrink-0">
          <button
            onClick={() => setView("grid")}
            className={`px-3 py-2 transition-colors ${
              view === "grid" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted"
            }`}
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
          <button
            onClick={() => setView("list")}
            className={`px-3 py-2 transition-colors ${
              view === "list" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted"
            }`}
          >
            <List className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Loading */}
      {isLoading ? (
        <div className="py-16 flex justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <Card className="py-16">
          <CardContent className="flex flex-col items-center justify-center text-center">
            <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center mb-4">
              <Building2 className="h-7 w-7 text-muted-foreground" />
            </div>
            <h3 className="font-semibold text-foreground mb-1">No properties found</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {search ? "Try a different search term." : "Add a property to start posting jobs and getting quotes from verified vendors."}
            </p>
            {!search && (
              <Button variant="gold" className="gap-2" onClick={() => setAddModalOpen(true)}>
                <Plus className="h-4 w-4" />
                Add Your First Property
              </Button>
            )}
          </CardContent>
        </Card>
      ) : view === "grid" ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filtered.map((listing, index) => (
            <Link
              key={listing.id}
              to={`/dashboard/properties/${listing.id}`}
              className="group"
              style={{ animationDelay: `${index * 0.06}s` }}
            >
              <Card className="overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all duration-300 border-border hover:border-primary/30 h-full">
                <div className="relative h-40 overflow-hidden">
                  <img
                    src={listing.image_url && listing.image_url !== "None" ? listing.image_url : listingPlaceholder}
                    alt={listing.address}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <CardContent className="p-4">
                  <h3 className="font-semibold text-foreground text-sm group-hover:text-primary transition-colors mb-1.5 line-clamp-1">
                    {listing.address}
                  </h3>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5" />
                    {listing.city}, {listing.state}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((listing, index) => (
            <Link
              key={listing.id}
              to={`/dashboard/properties/${listing.id}`}
              className="group"
              style={{ animationDelay: `${index * 0.06}s` }}
            >
              <Card className="overflow-hidden hover:shadow-md hover:border-primary/30 transition-all duration-300">
                <CardContent className="p-0">
                  <div className="flex items-center gap-4 p-4">
                    <img
                      src={listing.image_url && listing.image_url !== "None" ? listing.image_url : listingPlaceholder}
                      alt={listing.address}
                      className="h-16 w-24 rounded-lg object-cover shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground text-sm group-hover:text-primary transition-colors line-clamp-1">
                        {listing.address}
                      </h3>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                        <MapPin className="h-3.5 w-3.5" />
                        {listing.city}, {listing.state}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      <AddListingModal open={addModalOpen} onOpenChange={setAddModalOpen} />
    </div>
  );
};

export default Properties;
