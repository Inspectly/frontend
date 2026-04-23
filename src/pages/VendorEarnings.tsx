import React, { useMemo } from "react";
import { useSelector } from "react-redux";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowTrendUp,
  faCheckCircle,
  faClock,
  faDollarSign,
  faHouse,
} from "@fortawesome/free-solid-svg-icons";
import { RootState } from "../store/store";
import { IssueOfferStatus, IssueType, Listing, Client } from "../types";
import { useGetOffersByVendorIdQuery } from "../features/api/issueOffersApi";
import { useGetIssuesQuery } from "../features/api/issuesApi";
import { useGetListingsQuery } from "../features/api/listingsApi";
import { useGetClientsQuery } from "../features/api/clientsApi";
import ImageComponent from "../components/ImageComponent";
import { normalizeAndCapitalize } from "../utils/typeNormalizer";

const MONTHLY_GOAL = 6000;

const isCompleted = (status?: string) => {
  if (!status) return false;
  const s = status.toUpperCase();
  return s === "COMPLETED" || s === "STATUS.COMPLETED";
};

const VendorEarnings: React.FC = () => {
  const user = useSelector((s: RootState) => s.auth.user);
  const { data: vendorOffers = [] } = useGetOffersByVendorIdQuery(Number(user?.id), { skip: !user?.id });
  const { data: issues = [] } = useGetIssuesQuery();
  const { data: listings = [] } = useGetListingsQuery();
  const { data: clients = [] } = useGetClientsQuery();

  const issuesMap = useMemo(
    () => issues.reduce((acc, i) => { acc[i.id] = i; return acc; }, {} as Record<number, IssueType>),
    [issues]
  );
  const listingsMap = useMemo(
    () => listings.reduce((acc, l) => { acc[l.id] = l; return acc; }, {} as Record<number, Listing>),
    [listings]
  );
  const clientsByUserId = useMemo(
    () => clients.reduce((acc, c) => { acc[c.user_id] = c; return acc; }, {} as Record<number, Client>),
    [clients]
  );

  const metrics = useMemo(() => {
    const accepted = vendorOffers.filter((o) => o.status === IssueOfferStatus.ACCEPTED);
    const completed = accepted.filter((o) => isCompleted(issuesMap[o.issue_id]?.status));
    const pending = accepted.filter((o) => !isCompleted(issuesMap[o.issue_id]?.status));
    const totalEarned = completed.reduce((sum, o) => sum + (o.price || 0), 0);
    const pendingAmount = pending.reduce((sum, o) => sum + (o.price || 0), 0);

    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const thisMonth = completed
      .filter((o) => new Date(o.updated_at || o.created_at || 0) >= thisMonthStart)
      .reduce((sum, o) => sum + (o.price || 0), 0);
    const lastMonth = completed
      .filter((o) => {
        const d = new Date(o.updated_at || o.created_at || 0);
        return d >= lastMonthStart && d < thisMonthStart;
      })
      .reduce((sum, o) => sum + (o.price || 0), 0);

    return {
      totalEarned,
      thisMonth,
      lastMonth,
      pendingAmount,
      pendingCount: pending.length,
      completedCount: completed.length,
    };
  }, [vendorOffers, issuesMap]);

  const monthTrend = metrics.lastMonth > 0
    ? Math.round(((metrics.thisMonth - metrics.lastMonth) / metrics.lastMonth) * 100)
    : metrics.thisMonth > 0 ? 100 : 0;

  const goalProgress = Math.min(100, Math.round((metrics.thisMonth / MONTHLY_GOAL) * 100));
  const goalRemaining = Math.max(0, MONTHLY_GOAL - metrics.thisMonth);

  const recentTransactions = useMemo(() => {
    return vendorOffers
      .filter((o) => o.status === IssueOfferStatus.ACCEPTED)
      .sort((a, b) => new Date(b.updated_at || 0).getTime() - new Date(a.updated_at || 0).getTime())
      .slice(0, 8)
      .map((offer) => {
        const issue = issuesMap[offer.issue_id];
        const listing = issue ? listingsMap[issue.listing_id] : undefined;
        const client = listing ? clientsByUserId[listing.user_id] : undefined;
        return { offer, issue, listing, client, completed: isCompleted(issue?.status) };
      });
  }, [vendorOffers, issuesMap, listingsMap, clientsByUserId]);

  return (
    <div className="min-h-screen w-full bg-gray-100">
      <div className="w-full max-w-[1800px] mx-auto px-4 py-4 lg:px-6">
        {/* Title */}
        <div className="mb-6">
          <h1 className="text-3xl lg:text-4xl font-display font-bold text-gray-900">Earnings</h1>
          <p className="text-sm text-gray-500 mt-1">Track your income and payouts</p>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl p-5 shadow-lg">
            <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center mb-4">
              <FontAwesomeIcon icon={faDollarSign} className="text-emerald-600" />
            </div>
            <div className="text-3xl font-bold text-gray-900">${metrics.totalEarned.toLocaleString()}</div>
            <div className="text-sm text-gray-500 mt-0.5">Total Earned</div>
            <div className="text-xs text-gold font-medium mt-2">All time</div>
          </div>

          <div className="bg-white rounded-xl p-5 shadow-lg">
            <div className="w-10 h-10 bg-gold-100 rounded-lg flex items-center justify-center mb-4">
              <FontAwesomeIcon icon={faArrowTrendUp} className="text-gold" />
            </div>
            <div className="text-3xl font-bold text-gray-900">${metrics.thisMonth.toLocaleString()}</div>
            <div className="text-sm text-gray-500 mt-0.5">This Month</div>
            <div className="text-xs text-gold font-medium mt-2">
              {metrics.lastMonth > 0
                ? `${monthTrend >= 0 ? "+" : ""}${monthTrend}% vs last month`
                : metrics.thisMonth > 0 ? "First earnings" : "No earnings yet"}
            </div>
          </div>

          <div className="bg-white rounded-xl p-5 shadow-lg">
            <div className="w-10 h-10 bg-gold-100 rounded-lg flex items-center justify-center mb-4">
              <FontAwesomeIcon icon={faClock} className="text-gold" />
            </div>
            <div className="text-3xl font-bold text-gray-900">${metrics.pendingAmount.toLocaleString()}</div>
            <div className="text-sm text-gray-500 mt-0.5">Pending</div>
            <div className="text-xs text-gold font-medium mt-2">
              {metrics.pendingCount} payment{metrics.pendingCount !== 1 ? "s" : ""}
            </div>
          </div>

          <div className="bg-white rounded-xl p-5 shadow-lg">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
              <FontAwesomeIcon icon={faCheckCircle} className="text-blue-600" />
            </div>
            <div className="text-3xl font-bold text-gray-900">{metrics.completedCount}</div>
            <div className="text-sm text-gray-500 mt-0.5">Completed Jobs</div>
            <div className="text-xs text-gold font-medium mt-2">Since joining</div>
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-12 gap-6">
          {/* Monthly Goal */}
          <div className="col-span-12 lg:col-span-5 flex flex-col">
            <div className="bg-white rounded-xl p-6 shadow-lg flex-1 flex flex-col">
              <h2 className="text-lg font-semibold text-gray-900">Monthly Goal</h2>
              <div className="flex flex-col items-center justify-center flex-1 py-6">
                <div className="text-5xl font-bold text-gray-900">${metrics.thisMonth.toLocaleString()}</div>
                <div className="text-sm text-gray-500 mt-2">of ${MONTHLY_GOAL.toLocaleString()} target</div>
                <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden mt-10">
                  <div className="h-full bg-gold transition-all" style={{ width: `${goalProgress}%` }} />
                </div>
                <div className="text-sm text-gray-600 mt-4">
                  {goalProgress}% — ${goalRemaining.toLocaleString()} remaining
                </div>
              </div>
            </div>
          </div>

          {/* Recent Transactions */}
          <div className="col-span-12 lg:col-span-7">
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="px-6 py-5">
                <h2 className="text-lg font-semibold text-gray-900">Recent Transactions</h2>
              </div>
              <div className="divide-y divide-gray-100">
                {recentTransactions.length > 0 ? (
                  recentTransactions.map(({ offer, issue, listing, client, completed }) => {
                    const clientName = client
                      ? `${client.first_name || ""} ${client.last_name?.[0] ? client.last_name[0] + "." : ""}`.trim()
                      : "Client";
                    const date = new Date(offer.updated_at || offer.created_at || Date.now());
                    const dateStr = date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
                    const initial = (client?.first_name || "C")[0].toUpperCase();
                    return (
                      <div key={offer.id} className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors">
                        <div className="w-14 h-14 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                          {listing?.image_url ? (
                            <ImageComponent
                              src={listing.image_url}
                              fallback="/images/property_card_holder.jpg"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <FontAwesomeIcon icon={faHouse} className="text-gray-400" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-gray-900 truncate">
                            {issue?.summary || `${normalizeAndCapitalize(issue?.type || "")} Project`}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-500 mt-0.5">
                            <div className="w-5 h-5 rounded-full bg-gold flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
                              {initial}
                            </div>
                            <span className="truncate">
                              {clientName} · {dateStr}
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-col items-end flex-shrink-0">
                          <span className={`text-base font-bold ${completed ? "text-emerald-600" : "text-gray-900"}`}>
                            +${offer.price?.toLocaleString()}
                          </span>
                          <span
                            className={`mt-1 px-2 py-0.5 text-xs font-medium rounded ${
                              completed
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-gold-100 text-gold-700"
                            }`}
                          >
                            {completed ? "Received" : "Pending"}
                          </span>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="py-12 text-center">
                    <div className="w-14 h-14 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                      <FontAwesomeIcon icon={faDollarSign} className="text-gray-400 text-2xl" />
                    </div>
                    <p className="text-gray-900 font-semibold mb-1">No transactions yet</p>
                    <p className="text-sm text-gray-500">Completed and pending payments will show up here</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VendorEarnings;
