import { useEffect, useMemo } from "react";
import { useDispatch, useSelector, shallowEqual } from "react-redux";
import { AppDispatch, RootState } from "../store/store";
import { issuesApi } from "../features/api/issuesApi";
import { IssueType } from "../types";

export function useIssuesByListings(listingIds: number[] | undefined) {
  const dispatch = useDispatch<AppDispatch>();

  // Stable string key so effects/memos don't fire on every render
  const idsKey = (listingIds ?? []).join(",");
  const ids = useMemo(() => listingIds ?? [], [idsKey]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (ids.length === 0) return;
    ids.forEach((id) => {
      dispatch(issuesApi.endpoints.getIssuesByListingId.initiate(id));
    });
  }, [idsKey, dispatch]); // eslint-disable-line react-hooks/exhaustive-deps

  // Memoize the selector so it's a stable reference; shallowEqual prevents
  // re-renders when the returned array has the same items.
  const issuesSelector = useMemo(
    () =>
      (state: RootState): IssueType[] => {
        if (ids.length === 0) return [];
        const seen = new Set<number>();
        const result: IssueType[] = [];
        ids.forEach((id) => {
          const entry = issuesApi.endpoints.getIssuesByListingId.select(id)(state);
          (entry.data ?? []).forEach((issue) => {
            if (!seen.has(issue.id)) {
              seen.add(issue.id);
              result.push(issue);
            }
          });
        });
        return result;
      },
    [idsKey] // eslint-disable-line react-hooks/exhaustive-deps
  );

  const loadingSelector = useMemo(
    () =>
      (state: RootState): boolean => {
        if (listingIds === undefined) return true;
        if (ids.length === 0) return false;
        return ids.every((id) => {
          const entry = issuesApi.endpoints.getIssuesByListingId.select(id)(state);
          return entry.isUninitialized || entry.isLoading;
        });
      },
    [idsKey, listingIds === undefined] // eslint-disable-line react-hooks/exhaustive-deps
  );

  const issues = useSelector(issuesSelector, shallowEqual);
  const isLoading = useSelector(loadingSelector);

  return { data: issues, isLoading };
}
