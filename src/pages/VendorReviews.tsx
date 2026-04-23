import React, { useMemo } from "react";
import { useSelector } from "react-redux";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faStar, faThumbsUp, faComment, faUser } from "@fortawesome/free-solid-svg-icons";
import { faStar as faStarOutline } from "@fortawesome/free-regular-svg-icons";
import { RootState } from "../store/store";
import { Client, IssueOfferStatus } from "../types";
import { useGetVendorReviewsByVendorUserIdQuery } from "../features/api/vendorReviewsApi";
import { useGetClientsQuery } from "../features/api/clientsApi";
import { useGetOffersByVendorIdQuery } from "../features/api/issueOffersApi";

const StarRow: React.FC<{ value: number; size?: "sm" | "md" | "lg" }> = ({ value, size = "md" }) => {
  const px = size === "lg" ? "text-xl" : size === "sm" ? "text-xs" : "text-sm";
  return (
    <span className={`inline-flex items-center gap-0.5 ${px}`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <FontAwesomeIcon
          key={i}
          icon={i <= value ? faStar : faStarOutline}
          className={i <= value ? "text-gold" : "text-gray-300"}
        />
      ))}
    </span>
  );
};

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

  const responseRate = useMemo(() => {
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

  const maxBar = Math.max(
    1,
    stats.distribution[5],
    stats.distribution[4],
    stats.distribution[3],
    stats.distribution[2],
    stats.distribution[1]
  );

  return (
    <div className="min-h-screen w-full bg-gray-100">
      <div className="w-full max-w-[1800px] mx-auto px-4 py-4 lg:px-6">
        {/* Title */}
        <div className="mb-6">
          <h1 className="text-3xl lg:text-4xl font-display font-bold text-gray-900">Reviews</h1>
          <p className="text-sm text-gray-500 mt-1">What homeowners are saying about your work</p>
        </div>

        {/* Summary row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
          {/* Average rating */}
          <div className="bg-white rounded-xl p-6 shadow-lg flex flex-col items-center justify-center text-center">
            <div className="text-6xl font-bold text-gray-900">
              {stats.count > 0 ? stats.avg.toFixed(1) : "—"}
            </div>
            <div className="mt-3">
              <StarRow value={Math.round(stats.avg)} size="lg" />
            </div>
            <div className="text-sm text-gray-500 mt-4">
              {stats.count} review{stats.count === 1 ? "" : "s"}
            </div>
          </div>

          {/* Rating distribution */}
          <div className="bg-white rounded-xl p-6 shadow-lg">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Rating Distribution</h2>
            <div className="space-y-2">
              {([5, 4, 3, 2, 1] as const).map((rating) => {
                const n = stats.distribution[rating];
                const pct = (n / maxBar) * 100;
                return (
                  <div key={rating} className="flex items-center gap-3 text-sm">
                    <span className="w-3 text-gray-600">{rating}</span>
                    <FontAwesomeIcon icon={faStar} className="text-gold text-xs" />
                    <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gold transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="w-8 text-right text-gray-500">{n}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Highlights */}
          <div className="bg-white rounded-xl p-6 shadow-lg">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Highlights</h2>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gold-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <FontAwesomeIcon icon={faThumbsUp} className="text-gold" />
                </div>
                <span className="flex-1 text-sm text-gray-700">Repeat Clients</span>
                <span className="text-base font-bold text-gray-900">{stats.repeatClientRate}%</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gold-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <FontAwesomeIcon icon={faComment} className="text-gold" />
                </div>
                <span className="flex-1 text-sm text-gray-700">Response Rate</span>
                <span className="text-base font-bold text-gray-900">
                  {vendorOffers.length > 0 ? `${responseRate}%` : "—"}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gold-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <FontAwesomeIcon icon={faStar} className="text-gold" />
                </div>
                <span className="flex-1 text-sm text-gray-700">5-Star Rate</span>
                <span className="text-base font-bold text-gray-900">{stats.fiveStarRate}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Review list */}
        <div className="space-y-4">
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
              return (
                <div key={review.id} className="bg-white rounded-xl p-6 shadow-lg">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-gold flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                      {initial}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="font-semibold text-gray-900">{clientName}</span>
                        <StarRow value={Math.round(Number(review.rating) || 0)} size="sm" />
                        {date && <span className="text-sm text-gray-500">· {date}</span>}
                      </div>
                      {review.review && (
                        <p className="text-gray-700 mt-3 whitespace-pre-wrap">{review.review}</p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="bg-white rounded-xl p-12 shadow-lg text-center">
              <div className="w-14 h-14 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <FontAwesomeIcon icon={faUser} className="text-gray-400 text-2xl" />
              </div>
              <p className="text-gray-900 font-semibold mb-1">No reviews yet</p>
              <p className="text-sm text-gray-500">
                Completed jobs with client feedback will appear here
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VendorReviews;
