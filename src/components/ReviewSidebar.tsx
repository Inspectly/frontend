import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlus,
  faCheck,
  faXmark,
  faCircle,
  faWrench,
  faBolt,
  faBuilding,
  faTint,
  faPaintRoller,
  faBroom,
  faWind,
  faHouse,
  faSnowflake,
  faGripLines,
  faLayerGroup,
  faHammer,
  faLeaf,
  faQuestionCircle,
  faCircleNotch,
} from "@fortawesome/free-solid-svg-icons";
import { IssueType } from "../types";

type IconMap = Record<string, any>;
const issueIcons: IconMap = {
  general: faWrench,
  structural: faBuilding,
  electrician: faBolt,
  plumber: faTint,
  painter: faPaintRoller,
  cleaner: faBroom,
  hvac: faWind,
  roofing: faHouse,
  insulation: faSnowflake,
  drywall: faGripLines,
  plaster: faLayerGroup,
  carpentry: faHammer,
  landscaping: faLeaf,
  other: faQuestionCircle,
};

function pickIcon(type?: string) {
  const key = String(type || "").toLowerCase();
  return issueIcons[key] || faWrench;
}

function snippet(text?: string, max = 42) {
  if (!text) return "—";
  const t = text.trim();
  return t.length <= max ? t : t.slice(0, max - 1) + "…";
}

export default function ReviewSidebar({
  issues,
  selectedIssueId,
  onSelectIssue,
  onCreateIssueClick,
  onAcceptOne,
  onDeleteOne,
  onAcceptAllClick,
  onCompleteClick,
  allReviewed,
  isCompletingAll,
  completeCount,
  completeErrors,
}: {
  issues: IssueType[];
  selectedIssueId: number | null;
  onSelectIssue: (id: number) => void;
  onCreateIssueClick: () => void;
  onAcceptOne: (issue: IssueType) => void;
  onDeleteOne: (issueId: number) => void;
  onAcceptAllClick: () => void;   // opens your "Accept All" modal or runs the loop
  onCompleteClick: () => void;    // opens your "Complete" modal
  allReviewed: boolean;
  isCompletingAll: boolean;
  completeCount: number;
  completeErrors: number;
}) {
  return (
    <aside className="w-80 shrink-0 bg-white border rounded-xl h-[calc(100vh-140px)] sticky top-[88px] overflow-hidden flex flex-col">
      {/* Top bar */}
      <div className="px-4 py-3 border-b flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold">Issues ({issues.length})</h2>
          <p className="text-xs text-neutral-500">Select an issue to review & update</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="inline-flex items-center gap-2 px-2.5 py-1.5 rounded-lg border hover:bg-neutral-50"
            title="Add Issue"
            onClick={onCreateIssueClick}
          >
            <FontAwesomeIcon color={"blue"} icon={faPlus} />
          </button>
        </div>
      </div>

      {/* Scrollable list */}
      <div className="flex-1 overflow-y-auto">
        {issues.length === 0 ? (
          <div className="p-4 text-sm text-neutral-600">No issues found for this report.</div>
        ) : (
          <ul className="p-2">
            {issues.map((issue) => {
              const active = issue.id === selectedIssueId;
              const reviewed = (issue as any).review_status === "completed";
              const icon = pickIcon(issue.type);

              return (
                <li key={issue.id} className="mb-2">
                  <div
                    onClick={() => onSelectIssue(issue.id)}
                    className={[
                      "w-full rounded-lg border p-2 transition",
                      active
                        ? "bg-blue-50 text-blue-700 border-blue-200"
                        : "hover:bg-neutral-50 border-transparent",
                    ].join(" ")}
                  >
                    {/* Row 1: icon + title + status dot */}
                    <div className="flex items-center gap-3">
                      <button className="shrink-0" title="Open" onClick={() => onSelectIssue(issue.id)}>
                        <FontAwesomeIcon icon={icon} className={active ? "" : "text-neutral-500"} />
                      </button>

                      <button
                        onClick={() => onSelectIssue(issue.id)}
                        className="min-w-0 text-left flex-1"
                        title="Open"
                      >
                        <div className="text-sm font-medium truncate">
                          {issue.type || "other"}
                        </div>
                      </button>

                      {/* Status dot */}
                      <span
                        className="inline-flex items-center justify-center w-5 h-5 rounded-full"
                        title={(issue as any).review_status || "not_reviewed"}
                      >
                        <FontAwesomeIcon
                          icon={faCircle}
                          className={
                            reviewed
                              ? "text-green-600"
                              : (issue as any).review_status === "in_review"
                                ? "text-amber-500"
                                : "text-neutral-300"
                          }
                        />
                      </span>
                    </div>

                    {/* Row 2: summary */}
                    <div className="text-xs text-neutral-500 truncate">{snippet(issue.summary)}</div>

                    {/* Row 3: actions (bottom-right) */}
                    <div className="mt-1 flex justify-end">
                      <div className="ml-2 flex gap-1">
                        {!reviewed && (
                          <button
                            className="inline-flex items-center justify-center w-8 h-8 rounded-md border hover:bg-green-50"
                            title="Accept issue"
                            onClick={(e) => {
                              e.stopPropagation();
                              onAcceptOne(issue);
                            }}
                          >
                            <FontAwesomeIcon icon={faCheck} className="text-green-600" />
                          </button>
                        )}
                        <button
                          className="inline-flex items-center justify-center w-8 h-8 rounded-md border hover:bg-red-50"
                          title="Delete issue"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteOne(issue.id);
                          }}
                        >
                          <FontAwesomeIcon icon={faXmark} className="text-red-600" />
                        </button>
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Footer actions */}
      <div className="border-t px-4 py-3 flex justify-end gap-2">
        <button
          type="button"
          className={[
            "inline-flex items-center gap-2 px-3 py-2 rounded-lg text-white text-sm font-semibold disabled:opacity-50",
            allReviewed ? "bg-green-600 hover:bg-green-700" : "bg-blue-600 hover:bg-blue-700",
          ].join(" ")}
          title={allReviewed ? "Complete" : "Accept All"}
          onClick={allReviewed ? onCompleteClick : onAcceptAllClick}
          disabled={issues.length === 0 || isCompletingAll}
        >
          {isCompletingAll ? (
            <>
              <FontAwesomeIcon icon={faCircleNotch} spin />
              Accepting...
            </>
          ) : allReviewed ? (
            "Complete"
          ) : (
            "Accept All"
          )}
        </button>
      </div>

      {/* Progress area (shows while Accept All loop runs) */}
      {isCompletingAll && (
        <div className="px-4 pb-3 text-xs text-neutral-700">
          Completing issues… {completeCount}/{issues.length}
          {completeErrors > 0 && <span className="text-red-600"> • errors: {completeErrors}</span>}
          <div className="mt-1 h-1 w-full bg-neutral-200 rounded">
            <div
              className="h-1 bg-blue-600 rounded"
              style={{ width: `${(completeCount / Math.max(1, issues.length)) * 100}%` }}
            />
          </div>
        </div>
      )}
    </aside>
  );
}
