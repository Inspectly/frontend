import { MapPin, Star, Wrench, Paintbrush, Zap, Droplets, Home, TreeDeciduous } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useScrollAnimation } from "@/components/hooks/useScrollAnimation";
import { useNavigate } from "react-router-dom";

const LandingListings = () => {
  const { ref, isVisible } = useScrollAnimation();
  const navigate = useNavigate();

  const listings = [
    {
      id: 1,
      title: "Kitchen Renovation",
      category: "Renovation",
      icon: Home,
      location: "Toronto, ON",
      description: "Full kitchen renovation including new cabinets, countertops, and appliances...",
      bids: 8,
      image: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=300&fit=crop",
    },
    {
      id: 2,
      title: "Bathroom Plumbing Repair",
      category: "Plumbing",
      icon: Droplets,
      location: "Vancouver, BC",
      description: "Fix leaking pipes under bathroom sink and replace old faucet fixtures.",
      bids: 12,
      image: "https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=400&h=300&fit=crop",
    },
    {
      id: 3,
      title: "Electrical Panel Upgrade",
      category: "Electrical",
      icon: Zap,
      location: "Calgary, AB",
      description: "Upgrade 100A panel to 200A for home addition. Licensed electrician required.",
      bids: 5,
      image: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=400&h=300&fit=crop",
    },
    {
      id: 4,
      title: "Interior Painting - 3 Rooms",
      category: "Painting",
      icon: Paintbrush,
      location: "Montreal, QC",
      description: "Paint living room, master bedroom, and office. Walls and ceiling, neutral colors.",
      bids: 15,
      image: "https://images.unsplash.com/photo-1562259949-e8e7689d7828?w=400&h=300&fit=crop",
    },
    {
      id: 5,
      title: "Deck Building",
      category: "Carpentry",
      icon: Wrench,
      location: "Ottawa, ON",
      description: "Build a 400 sq ft composite deck with railing and stairs in backyard.",
      bids: 7,
      image: "https://images.unsplash.com/photo-1591825729269-caeb344f6df2?w=400&h=300&fit=crop",
    },
    {
      id: 6,
      title: "Landscaping & Garden Design",
      category: "Landscaping",
      icon: TreeDeciduous,
      location: "Edmonton, AB",
      description: "Front yard landscaping including new sod, flower beds, and stone pathway.",
      bids: 9,
      image: "https://images.unsplash.com/photo-1558904541-efa843a96f01?w=400&h=300&fit=crop",
    },
  ];

  return (
    <section
      id="listings"
      ref={ref as React.RefObject<HTMLElement>}
      className={`py-14 lg:py-20 relative bg-white section-animate ${isVisible ? "visible" : ""}`}
    >
      {/* Top fade from How It Works */}
      <div className="absolute top-0 left-0 right-0 h-40 -z-10 bg-[radial-gradient(ellipse_at_top,_#fefcf7_0%,_#ffffff_80%)]" />
      {/* Bottom fade into Why Choose Inspectly */}
      <div className="absolute bottom-0 left-0 right-0 h-40 -z-10 bg-[radial-gradient(ellipse_at_bottom,_#fefcf7_0%,_#ffffff_80%)]" />
      <div className="container mx-auto px-4 lg:px-8 max-w-6xl">
        <div
          className="text-center mb-10"
          style={{
            opacity: isVisible ? 1 : 0,
            transform: isVisible ? "translateY(0)" : "translateY(20px)",
            transition: "all 0.6s ease-out",
          }}
        >
          <span className="inline-block px-4 py-1.5 bg-primary/10 text-primary font-medium rounded-full text-xs mb-4 border shadow-lg border-gold-muted hover:shadow-xl">
            Live Marketplace
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold text-foreground mb-3">
            Browse Active Projects
          </h2>
          <p className="text-base text-muted-foreground max-w-lg mx-auto">
            See real projects from homeowners looking for skilled contractors.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 mb-10">
          {listings.map((listing, index) => (
            <Card
              key={listing.id}
              className="group shadow-2xl overflow-hidden hover:shadow-xl transition-all duration-500 border-border hover:border-primary/30 hover:-translate-y-1"
              style={{
                opacity: isVisible ? 1 : 0,
                transform: isVisible ? "translateY(0) scale(1)" : "translateY(30px) scale(0.98)",
                transition: `all 0.6s ease-out ${0.1 + index * 0.08}s`,
              }}
            >
              <div className="relative h-44 overflow-hidden">
                <img
                  src={listing.image}
                  alt={listing.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-foreground/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="absolute top-3 left-3">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-background/95 backdrop-blur-sm rounded-full text-xs font-medium text-foreground shadow-sm">
                    <listing.icon className="w-3.5 h-3.5 text-primary" />
                    {listing.category}
                  </span>
                </div>
                <div className="absolute top-3 right-3">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-foreground text-background rounded-full text-xs font-medium shadow-sm">
                    <Star className="w-3 h-3 fill-current" />
                    {listing.bids} bids
                  </span>
                </div>
              </div>

              <CardContent className="p-5">
                <h3 className="font-semibold text-base text-foreground mb-2 group-hover:text-primary transition-colors duration-300">
                  {listing.title}
                </h3>
                <p className="text-sm text-muted-foreground mb-4 line-clamp-2 leading-relaxed">
                  {listing.description}
                </p>
                <div className="flex flex-wrap gap-3 text-xs text-muted-foreground mb-4">
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5" />
                    {listing.location}
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full text-sm h-9 group-hover:border-primary group-hover:text-primary group-hover:bg-primary/5 transition-all duration-300"
                  onClick={() => navigate("/signup")}
                >
                  View Details
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <div
          className="text-center"
          style={{
            opacity: isVisible ? 1 : 0,
            transform: isVisible ? "translateY(0)" : "translateY(20px)",
            transition: "all 0.6s ease-out 0.6s",
          }}
        >
          <Button variant="gold" onClick={() => navigate("/signup")}>
            View All Projects
          </Button>
          <p className="mt-4 text-sm text-muted-foreground">
            Or{" "}
            <button onClick={() => navigate("/signup")} className="text-primary hover:underline font-medium transition-colors">
              post your own project
            </button>{" "}
            to get started
          </p>
        </div>
      </div>
    </section>
  );
};

export default LandingListings;
