import { Star, ThumbsUp, MessageSquare } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

const reviews = [
  { id: "1", homeowner: "John D.", homeownerAvatar: "https://images.unsplash.com/photo-1599566150163-29194dcabd36?w=60&h=60&fit=crop&crop=face", rating: 5, date: "Mar 7, 2026", comment: "Mike did an outstanding job on our panel upgrade. Very professional, cleaned up after himself, and explained everything clearly. Highly recommend!", project: "Electrical Panel Upgrade", projectImage: "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=200&h=150&fit=crop" },
  { id: "2", homeowner: "Tom R.", homeownerAvatar: "https://images.unsplash.com/photo-1599566150163-29194dcabd36?w=60&h=60&fit=crop&crop=face", rating: 5, date: "Feb 20, 2026", comment: "Quick and efficient GFCI installation. Fair pricing and great communication throughout.", project: "Kitchen GFCI Upgrade", projectImage: "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=200&h=150&fit=crop" },
  { id: "3", homeowner: "James M.", homeownerAvatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=60&h=60&fit=crop&crop=face", rating: 4, date: "Feb 18, 2026", comment: "Good work on the sub-panel. Took slightly longer than estimated but the quality was excellent. Passed inspection first try.", project: "Garage Sub-Panel Install", projectImage: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=200&h=150&fit=crop" },
  { id: "4", homeowner: "Sarah M.", homeownerAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=60&h=60&fit=crop&crop=face", rating: 5, date: "Feb 10, 2026", comment: "Mike was punctual, professional, and reasonably priced. Would absolutely hire again.", project: "Bathroom Rewiring", projectImage: "https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=200&h=150&fit=crop" },
  { id: "5", homeowner: "Alex K.", homeownerAvatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=60&h=60&fit=crop&crop=face", rating: 5, date: "Jan 28, 2026", comment: "The outdoor lighting looks amazing! Mike suggested better fixtures than what I originally picked and it made a huge difference.", project: "Outdoor Lighting Install", projectImage: "https://images.unsplash.com/photo-1558171813-4c088753af8f?w=200&h=150&fit=crop" },
];

const ratingDistribution = [
  { stars: 5, count: 98 },
  { stars: 4, count: 20 },
  { stars: 3, count: 4 },
  { stars: 2, count: 1 },
  { stars: 1, count: 1 },
];

const Reviews = () => {
  const totalReviews = 124;
  const avgRating = 4.8;

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto animate-fade-up">
      <div className="mb-6">
        <h1 className="text-2xl lg:text-3xl font-display font-bold text-foreground">Reviews</h1>
        <p className="text-sm text-muted-foreground mt-0.5">What homeowners are saying about your work</p>
      </div>

      {/* Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <Card className="border-border">
          <CardContent className="p-5 text-center">
            <p className="text-5xl font-bold text-foreground mb-1">{avgRating}</p>
            <div className="flex items-center justify-center gap-0.5 mb-2">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star key={s} className={`h-5 w-5 ${s <= Math.round(avgRating) ? "fill-primary text-primary" : "text-muted"}`} />
              ))}
            </div>
            <p className="text-sm text-muted-foreground">{totalReviews} reviews</p>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardContent className="p-5">
            <h3 className="text-sm font-semibold text-foreground mb-3">Rating Distribution</h3>
            <div className="space-y-2">
              {ratingDistribution.map((r) => (
                <div key={r.stars} className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground w-3">{r.stars}</span>
                  <Star className="h-3 w-3 fill-primary text-primary" />
                  <Progress value={(r.count / totalReviews) * 100} className="h-1.5 flex-1" />
                  <span className="text-xs text-muted-foreground w-6 text-right">{r.count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardContent className="p-5">
            <h3 className="text-sm font-semibold text-foreground mb-3">Highlights</h3>
            <div className="space-y-3">
              {[
                { label: "Repeat Clients", value: "34%", icon: ThumbsUp },
                { label: "Response Rate", value: "96%", icon: MessageSquare },
                { label: "5-Star Rate", value: "79%", icon: Star },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-primary/5 flex items-center justify-center">
                    <item.icon className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground">{item.label}</p>
                  </div>
                  <p className="text-sm font-bold text-foreground">{item.value}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Reviews list */}
      <div className="space-y-3">
        {reviews.map((review) => (
          <Card key={review.id} className="border-border">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <img
                  src={review.homeownerAvatar}
                  alt={review.homeowner}
                  className="h-10 w-10 rounded-full object-cover shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-foreground">{review.homeowner}</span>
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star key={s} className={`h-3 w-3 ${s <= review.rating ? "fill-primary text-primary" : "text-muted"}`} />
                      ))}
                    </div>
                    <span className="text-xs text-muted-foreground">· {review.date}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <img src={review.projectImage} alt={review.project} className="h-6 w-8 rounded object-cover" />
                    <p className="text-xs text-primary">{review.project}</p>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{review.comment}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Reviews;
