import React, { useMemo } from "react";
import { useSelector } from "react-redux";
import { Star, ThumbsUp, Trophy, User } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { RootState } from "../store/store";
import { Client, IssueOfferStatus } from "../types";
import { useGetVendorReviewsByVendorUserIdQuery } from "../features/api/vendorReviewsApi";
import { useGetClientsQuery } from "../features/api/clientsApi";
import { useGetOffersByVendorIdQuery } from "../features/api/issueOffersApi";

const VendorReviews: React.FC = () => {
  const user = useSelector((s: RootState) => s.auth.user);
  const { data: reviews = [] } = useGetVendorReviewsByVendorUserIdQuery(Number(user?.id), {
    skip: !user?.id,
  });
  const { data: clients = [] } = useGetClientsQuery();
  const { data: vendorOffers = [] } = useGetOffersByVendorIdQuery(Number(user?.id), {
    skip: !user?.id,
  });

  const clientsByUserId = useMemo(
    () =>
      clients.reduce((acc, c) => {
        acc[c.user_id] = c;
        return acc;
      }, {} as Record<number, Client>),
    [clients]
  );

  const stats = useMemo(() => {
    const count = reviews.length;
    if (count === 0) {
      return {
        count: 0,
        avg: 0,
        distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 } as Record<1 | 2 | 3 | 4 | 5, number>,
        fiveStarRate: 0,
        repeatClientRate: 0,
      };
    }
    const distribution: Record<1 | 2 | 3 | 4 | 5, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    let sum = 0;
    const reviewsPerClient: Record<number, number> = {};
    reviews.forEach((r) => {
      const rating = Math.max(1, Math.min(5, Math.round(Number(r.rating) || 0))) as 1 | 2 | 3 | 4 | 5;
      distribution[rating]++;
      sum += Number(r.rating) || 0;
      reviewsPerClient[r.user_id] = (reviewsPerClient[r.user_id] || 0) + 1;
    });
    const uniqueClients = Object.keys(reviewsPerClient).length;
    const repeatClients = Object.values(reviewsPerClient).filter((n) => n > 1).length;
    const repeatClientRate = uniqueClients > 0 ? Math.round((repeatClients / uniqueClients) * 100) : 0;
    const fiveStarRate = Math.round((distribution[5] / count) * 100);
    return {
      count,
      avg: Math.round((sum / count) * 10) / 10,
      distribution,
      fiveStarRate,
      repeatClientRate,
    };
  }, [reviews]);

  const winRate = useMemo(() => {
    const total = vendorOffers.length;
    if (total === 0) return 0;
    const accepted = vendorOffers.filter((o) => o.status === IssueOfferStatus.ACCEPTED).length;
    return Math.round((accepted / total) * 100);
  }, [vendorOffers]);

  const sortedReviews = useMemo(() => {
    return [...reviews].sort(
      (a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
    );
  }, [reviews]);

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto animate-fade-up">
      <div className="mb-6">
        <h1 className="text-2xl lg:text-3xl font-display font-bold text-foreground">Reviews</h1>
        <p className="text-sm text-muted-foreground mt-0.5">What homeowners are saying about your work</p>
      </div>

      {/* Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <Card className="border-border">
          <CardContent className="p-5 text-center flex flex-col justify-center h-full">
            <p className="text-5xl font-bold text-foreground mb-2">
              {stats.count > 0 ? stats.avg.toFixed(1) : "—"}
            </p>
            <div className="flex items-center justify-center gap-0.5 mb-2">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star
                  key={s}
                  className={`h-5 w-5 ${
                    s <= Math.round(stats.avg) ? "fill-primary text-primary" : "text-muted"
                  }`}
                />
              ))}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {stats.count} review{stats.count === 1 ? "" : "s"}
            </p>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardContent className="p-5">
            <h3 className="text-sm font-semibold text-foreground mb-3">Rating Distribution</h3>
            <div className="space-y-2">
              {([5, 4, 3, 2, 1] as const).map((r) => (
                <div key={r} className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground w-3">{r}</span>
                  <Star className="h-3 w-3 fill-primary text-primary" />
                  <Progress
                    value={stats.count > 0 ? (stats.distribution[r] / stats.count) * 100 : 0}
                    className="h-1.5 flex-1"
                  />
                  <span className="text-xs text-muted-foreground w-6 text-right">
                    {stats.distribution[r]}
                  </span>
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
                { label: "Repeat Clients", value: `${stats.repeatClientRate}%`, icon: ThumbsUp },
                { label: "Win Rate", value: vendorOffers.length > 0 ? `${winRate}%` : "—", icon: Trophy },
                { label: "5-Star Rate", value: `${stats.fiveStarRate}%`, icon: Star },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-primary/5 flex items-center justify-center shrink-0">
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
        {sortedReviews.length > 0 ? (
          sortedReviews.map((review) => {
            const client = clientsByUserId[review.user_id];
            const clientName = client
              ? `${client.first_name || ""} ${client.last_name?.[0] ? client.last_name[0] + "." : ""}`.trim()
              : "Client";
            const date = review.created_at
              ? new Date(review.created_at).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })
              : "";
            const initial = (client?.first_name || "C")[0].toUpperCase();
            const roundedRating = Math.max(1, Math.min(5, Math.round(Number(review.rating) || 0)));

            return (
              <Card key={review.id} className="border-border">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 shrink-0 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-lg">
                      {initial}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-foreground">{clientName}</span>
                        <div className="flex items-center gap-0.5">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              className={`h-3 w-3 ${
                                s <= roundedRating ? "fill-primary text-primary" : "text-muted"
                              }`}
                            />
                          ))}
                        </div>
                        {date && <span className="text-xs text-muted-foreground">· {date}</span>}
                      </div>
                      <p className="text-sm text-muted-foreground mt-2 leading-relaxed whitespace-pre-wrap">
                        {review.review}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        ) : (
          <Card className="border-border">
            <CardContent className="py-12 flex flex-col items-center justify-center text-center">
              <div className="w-14 h-14 bg-muted rounded-xl flex items-center justify-center mb-4">
                <User className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-foreground font-semibold mb-1">No reviews yet</p>
              <p className="text-sm text-muted-foreground">
                Completed jobs with client feedback will appear here
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default VendorReviews;
