import React, { useMemo, useState } from "react";
import { Star, Shield, ChevronRight } from "lucide-react";
import { IssueOffer, IssueOfferStatus, IssueType, Vendor } from "../../types";

interface TrustedVendorsCardProps {
  offersByIssueId: Record<number, IssueOffer[]>;
  vendorMap: Record<number, Vendor>;
  issues: IssueType[];
  onVendorClick: (issue: IssueType) => void;
  /** Current homeowner's user id — used to defensively filter out
   *  the user's own account if it also happens to have a vendor record. */
  currentUserId?: number;
}

interface VendorAggregate {
  vendor: Vendor;
  jobCount: number;
  lastWorked: Date | null;
  /** Most relevant issue to deep-link to from the row click. */
  latestIssueId: number | null;
  /** Is the vendor currently engaged on at least one in-flight (non-completed) issue? */
  isCurrentlyWorking: boolean;
}

type VendorTab = "current" | "past";

const isIssueInFlight = (issue: IssueType): boolean =>
  issue.status === "Status.OPEN" ||
  issue.status === "Status.IN_PROGRESS" ||
  issue.status === "Status.REVIEW";

const TrustedVendorsCard: React.FC<TrustedVendorsCardProps> = ({
  offersByIssueId,
  vendorMap,
  issues,
  onVendorClick,
  currentUserId,
}) => {
  // All vendors the user has accepted an offer from — bucketed and ordered.
  const { currentVendors, pastVendors } = useMemo(() => {
    const issueById = new Map(issues.map((i) => [i.id, i]));
    const byVendor = new Map<number, VendorAggregate>();

    Object.entries(offersByIssueId).forEach(([issueIdStr, offers]) => {
      const issueId = Number(issueIdStr);
      const issue = issueById.get(issueId);

      offers.forEach((offer) => {
        if (offer.status !== IssueOfferStatus.ACCEPTED) return;
        const vendor = vendorMap[offer.vendor_id];
        if (!vendor) return;
        // Defensive: don't surface the homeowner's own vendor record (test
        // accounts can have both roles; backend may double-join).
        if (currentUserId && vendor.vendor_user_id === currentUserId) return;

        const ts = (offer as any).updated_at || (offer as any).created_at;
        const offerDate = ts ? new Date(ts) : null;
        const inFlightForThisOffer = issue ? isIssueInFlight(issue) : false;
        const existing = byVendor.get(offer.vendor_id);

        if (!existing) {
          byVendor.set(offer.vendor_id, {
            vendor,
            jobCount: 1,
            lastWorked: offerDate,
            latestIssueId: issueId,
            isCurrentlyWorking: inFlightForThisOffer,
          });
        } else {
          existing.jobCount += 1;
          if (offerDate && (!existing.lastWorked || offerDate > existing.lastWorked)) {
            existing.lastWorked = offerDate;
            existing.latestIssueId = issueId;
          }
          // Once a vendor has ANY in-flight engagement they count as "current".
          if (inFlightForThisOffer) existing.isCurrentlyWorking = true;
        }
      });
    });

    const all = Array.from(byVendor.values()).sort((a, b) => {
      if (a.lastWorked && b.lastWorked) return b.lastWorked.getTime() - a.lastWorked.getTime();
      return b.jobCount - a.jobCount;
    });
    return {
      currentVendors: all.filter((v) => v.isCurrentlyWorking),
      pastVendors: all.filter((v) => !v.isCurrentlyWorking),
    };
  }, [offersByIssueId, vendorMap, currentUserId, issues]);

  // Default tab — show wherever the user actually has vendors. Prefer "current".
  const initialTab: VendorTab =
    currentVendors.length === 0 && pastVendors.length > 0 ? "past" : "current";
  const [activeTab, setActiveTab] = useState<VendorTab>(initialTab);

  const visibleVendors = activeTab === "current" ? currentVendors : pastVendors;
  const totalVendors = currentVendors.length + pastVendors.length;

  const formatLastWorked = (d: Date | null) => {
    if (!d) return null;
    const now = new Date();
    const days = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
    if (days < 7) return "this week";
    if (days < 14) return "last week";
    if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
    if (days < 365) return `${Math.floor(days / 30)} mo ago`;
    return `${Math.floor(days / 365)}y ago`;
  };

  return (
    <div className="bg-card rounded-2xl border border-border/60 shadow-card overflow-hidden h-full flex flex-col">
      <div className="px-5 py-4 border-b border-border/60 flex-shrink-0">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Shield className="w-4 h-4 text-primary" />
          </div>
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-foreground tracking-tight">Your Vendors</h2>
            <p className="text-[11px] text-muted-foreground uppercase tracking-wider">
              People you've worked with
            </p>
          </div>
        </div>

        {totalVendors > 0 && (
          <div className="flex items-center gap-1 p-0.5 bg-muted/40 rounded-lg w-fit">
            <button
              onClick={() => setActiveTab("current")}
              className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-all whitespace-nowrap ${
                activeTab === "current"
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Currently working
              {currentVendors.length > 0 && (
                <span className="ml-1 tabular-nums text-muted-foreground/80">
                  {currentVendors.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab("past")}
              className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-all whitespace-nowrap ${
                activeTab === "past"
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Worked with
              {pastVendors.length > 0 && (
                <span className="ml-1 tabular-nums text-muted-foreground/80">
                  {pastVendors.length}
                </span>
              )}
            </button>
          </div>
        )}
      </div>

      <div className="p-3 flex-1 min-h-0 overflow-y-auto">
        {totalVendors === 0 ? (
          <div className="px-3 py-6 text-center text-xs text-muted-foreground">
            Vendors you accept will appear here.
          </div>
        ) : visibleVendors.length === 0 ? (
          <div className="px-3 py-6 text-center text-xs text-muted-foreground">
            {activeTab === "current"
              ? "No vendors are working on anything right now."
              : "Once a job wraps up, the vendor will show up here."}
          </div>
        ) : (
          // 1-up on narrow, 2-up on sm+ so the card stops feeling like
          // a giant single-row strip when only a couple vendors exist.
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {visibleVendors.map((agg) => {
              const { vendor, jobCount, lastWorked, latestIssueId } = agg;
              const displayName = vendor.company_name || vendor.name || "Vendor";
              const initials =
                displayName
                  .split(/\s+/)
                  .filter(Boolean)
                  .slice(0, 2)
                  .map((w) => w[0])
                  .join("")
                  .toUpperCase() || "V";
              const ratingNum = vendor.rating ? parseFloat(vendor.rating) : null;
              const lastWorkedLabel = formatLastWorked(lastWorked);

              const latestIssue = latestIssueId
                ? issues.find((i) => i.id === latestIssueId)
                : null;

              return (
                <button
                  key={vendor.id}
                  onClick={() => latestIssue && onVendorClick(latestIssue)}
                  disabled={!latestIssue}
                  className="group min-w-0 p-3 rounded-xl border border-border/60
                             hover:bg-muted/50 hover:border-border transition-colors
                             text-left flex items-center gap-3 disabled:cursor-default
                             disabled:hover:bg-transparent"
                >
                  {vendor.profile_image_url ? (
                    <img
                      src={vendor.profile_image_url}
                      alt={displayName}
                      className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0 font-semibold text-sm text-primary">
                      {initials}
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className="text-sm font-semibold text-foreground truncate">
                        {displayName}
                      </span>
                      {vendor.verified && (
                        <Shield
                          className="w-3 h-3 text-primary flex-shrink-0"
                          aria-label="Verified"
                        />
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                      {ratingNum !== null ? (
                        <span className="flex items-center gap-0.5">
                          <Star className="w-3 h-3 fill-primary text-primary" />
                          <span className="font-medium tabular-nums">{ratingNum.toFixed(1)}</span>
                        </span>
                      ) : (
                        <span className="text-muted-foreground/70">New</span>
                      )}
                      <span className="text-muted-foreground/40">·</span>
                      <span className="tabular-nums">
                        {jobCount} job{jobCount !== 1 ? "s" : ""}
                      </span>
                      {lastWorkedLabel && (
                        <>
                          <span className="text-muted-foreground/40">·</span>
                          <span className="truncate">{lastWorkedLabel}</span>
                        </>
                      )}
                    </div>
                  </div>

                  {latestIssue && (
                    <ChevronRight
                      className="w-4 h-4 text-muted-foreground/60 group-hover:text-foreground group-hover:translate-x-0.5 transition-all flex-shrink-0"
                      aria-hidden
                    />
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default TrustedVendorsCard;
