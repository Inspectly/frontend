import React, { useEffect, useMemo, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMagnifyingGlass } from "@fortawesome/free-solid-svg-icons";
import { MapPin } from "lucide-react";
import { IssueAddress, IssueType } from "../types";
import { getIssueImageUrlsFromIssue } from "../utils/issueImageUtils";
import { normalizeAndCapitalize } from "../utils/typeNormalizer";
import ImageComponent from "./ImageComponent";
import { PROPERTY_FALLBACK_IMAGE } from "../constants/assets";

interface MarketplaceSearchAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  /** Pool of jobs to suggest from (already loaded client-side). */
  issues: IssueType[];
  addressMap: Record<number, IssueAddress>;
  /** Opens the detail modal for the chosen job. */
  onSelectIssue: (issue: IssueType) => void;
  /** Runs the full-text filter (Enter with no active suggestion). */
  onSubmitSearch: () => void;
}

const MAX_SUGGESTIONS = 8;

const MarketplaceSearchAutocomplete: React.FC<MarketplaceSearchAutocompleteProps> = ({
  value,
  onChange,
  issues,
  addressMap,
  onSelectIssue,
  onSubmitSearch,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);

  const suggestions = useMemo(() => {
    const term = value.trim().toLowerCase();
    if (!term) return [];
    return issues
      .filter((issue) => {
        const summary = issue.summary?.toLowerCase() || "";
        const type = issue.type?.toLowerCase() || "";
        const description = issue.description?.toLowerCase() || "";
        return summary.includes(term) || type.includes(term) || description.includes(term);
      })
      .slice(0, MAX_SUGGESTIONS);
  }, [issues, value]);

  // Reset the active row whenever the suggestion list changes.
  useEffect(() => {
    setActiveIndex(-1);
  }, [value]);

  // Close on outside click.
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const showDropdown = isOpen && value.trim().length > 0;

  const selectIssue = (issue: IssueType) => {
    onSelectIssue(issue);
    setIsOpen(false);
    setActiveIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showDropdown || suggestions.length === 0) {
      if (e.key === "Enter") {
        onSubmitSearch();
        setIsOpen(false);
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setActiveIndex((prev) => (prev + 1) % suggestions.length);
        break;
      case "ArrowUp":
        e.preventDefault();
        setActiveIndex((prev) => (prev <= 0 ? suggestions.length - 1 : prev - 1));
        break;
      case "Enter":
        e.preventDefault();
        if (activeIndex >= 0 && activeIndex < suggestions.length) {
          selectIssue(suggestions[activeIndex]);
        } else {
          onSubmitSearch();
          setIsOpen(false);
        }
        break;
      case "Escape":
        setIsOpen(false);
        setActiveIndex(-1);
        break;
      default:
        break;
    }
  };

  return (
    <div ref={containerRef} className="relative w-full lg:flex-1 lg:min-w-[220px]">
      <FontAwesomeIcon
        icon={faMagnifyingGlass}
        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none z-10"
      />
      <input
        type="text"
        placeholder="Search open jobs..."
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
        onKeyDown={handleKeyDown}
        role="combobox"
        aria-expanded={showDropdown}
        aria-autocomplete="list"
        className="w-full pl-10 pr-3 py-2 border border-border rounded-xl focus:ring-2 focus:ring-primary/40 focus:border-primary transition-colors bg-card text-foreground placeholder:text-muted-foreground/70 text-sm"
      />

      {showDropdown && (
        <div className="absolute z-30 mt-1 w-full bg-card border border-border rounded-xl shadow-lg overflow-hidden max-h-[360px] overflow-y-auto">
          {suggestions.length === 0 ? (
            <div className="px-4 py-3 text-sm text-muted-foreground">No matching jobs</div>
          ) : (
            <ul role="listbox">
              {suggestions.map((issue, index) => {
                const thumb = getIssueImageUrlsFromIssue(issue)[0] || PROPERTY_FALLBACK_IMAGE;
                const city = addressMap[issue.id]?.city;
                const isActive = index === activeIndex;
                return (
                  <li key={issue.id} role="option" aria-selected={isActive}>
                    <button
                      type="button"
                      onMouseDown={(e) => {
                        // Prevent the input blur from closing the dropdown first.
                        e.preventDefault();
                        selectIssue(issue);
                      }}
                      onMouseEnter={() => setActiveIndex(index)}
                      className={`w-full flex items-center gap-3 px-3 py-2 text-left transition-colors ${
                        isActive ? "bg-muted" : "hover:bg-muted/60"
                      }`}
                    >
                      <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-muted">
                        <ImageComponent
                          src={thumb}
                          fallback={PROPERTY_FALLBACK_IMAGE}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-foreground truncate">
                          {issue.summary || normalizeAndCapitalize(issue.type)}
                        </p>
                        <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
                          <span>{normalizeAndCapitalize(issue.type)}</span>
                          {city && (
                            <>
                              <span aria-hidden>·</span>
                              <MapPin className="w-3 h-3 flex-shrink-0" />
                              <span className="truncate">{city}</span>
                            </>
                          )}
                        </p>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};

export default MarketplaceSearchAutocomplete;
