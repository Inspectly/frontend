import { useCallback, useEffect, useMemo } from "react";
import { useDispatch, useSelector, shallowEqual } from "react-redux";
import { AppDispatch, RootState } from "../store/store";
import { issuesApi } from "../features/api/issuesApi";
import { IssueType } from "../types";

/**
 * Fetches a specific set of issues by their IDs using per-issue queries.
 * Much faster than useGetIssuesQuery for vendor pages where the
 * relevant issue IDs are already known from offer data.
 */
export function useIssuesByIds(issueIds: number[] | undefined) {
  const dispatch = useDispatch<AppDispatch>();

  const idsKey = (issueIds ?? []).join(",");
  const ids = useMemo(() => issueIds ?? [], [idsKey]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (ids.length === 0) return;
    ids.forEach((id) => {
      dispatch(issuesApi.endpoints.getIssueById.initiate(String(id)));
    });
  }, [idsKey, dispatch]); // eslint-disable-line react-hooks/exhaustive-deps

  const issuesSelector = useMemo(
    () =>
      (state: RootState): IssueType[] => {
        if (ids.length === 0) return [];
        const result: IssueType[] = [];
        ids.forEach((id) => {
          const entry = issuesApi.endpoints.getIssueById.select(String(id))(state);
          if (entry.data) result.push(entry.data);
        });
        return result;
      },
    [idsKey] // eslint-disable-line react-hooks/exhaustive-deps
  );

  const loadingSelector = useMemo(
    () =>
      (state: RootState): boolean => {
        if (issueIds === undefined) return true;
        if (ids.length === 0) return false;
        return ids.some((id) => {
          const entry = issuesApi.endpoints.getIssueById.select(String(id))(state);
          return entry.isUninitialized || entry.isLoading;
        });
      },
    [idsKey, issueIds === undefined] // eslint-disable-line react-hooks/exhaustive-deps
  );

  const refetch = useCallback(() => {
    if (ids.length === 0) return;
    ids.forEach((id) => {
      dispatch(issuesApi.endpoints.getIssueById.initiate(String(id), { forceRefetch: true }));
    });
  }, [idsKey, dispatch]); // eslint-disable-line react-hooks/exhaustive-deps

  const issues = useSelector(issuesSelector, shallowEqual);
  const isLoading = useSelector(loadingSelector);

  return { data: issues, isLoading, refetch };
}
