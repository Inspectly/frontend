import { api } from "./apiSlice";
import { IssueAddress, IssueStatus, IssueType } from "../../types";

export const issuesApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getIssues: builder.query<IssueType[], void>({
      // Fetch page 1 immediately so components show data fast, then background-fetch
      // remaining pages and patch the same cache entry so all subscribers update live.
      queryFn: async (_arg, queryApi, _extra, baseQuery) => {
        const normalize = (items: IssueType[]) =>
          items.map((issue) => ({
            ...issue,
            status: issue.status?.startsWith("Status.")
              ? issue.status
              : (`Status.${(issue.status || "OPEN").toUpperCase()}` as IssueStatus),
          }));

        const PAGE_SIZE = 50;
        const first = await baseQuery(`issues/?page=1&size=${PAGE_SIZE}`);
        if (first.error) return { error: first.error };

        const firstData = first.data as { items: IssueType[]; total: number; pages: number };
        const firstItems = normalize(firstData.items);

        // Background-fetch remaining pages and merge into the same cache entry
        if (firstData.pages > 1) {
          const remaining = Array.from({ length: firstData.pages - 1 }, (_, i) =>
            baseQuery(`issues/?page=${i + 2}&size=${PAGE_SIZE}`)
          );
          Promise.all(remaining).then((results) => {
            const extra = results.flatMap((r) => {
              const d = r.data as { items: IssueType[] } | undefined;
              return normalize(d?.items ?? []);
            });
            queryApi.dispatch(
              issuesApi.util.updateQueryData("getIssues", undefined, (draft) => {
                extra.forEach((issue) => {
                  if (!draft.find((i) => i.id === issue.id)) draft.push(issue);
                });
              })
            );
          });
        }

        return { data: firstItems };
      },
      providesTags: ["Issues"],
    }),

    getPaginatedIssues: builder.query<
      { items: IssueType[]; total: number; page: number; size: number; pages: number },
      {
        page: number;
        size: number;
        search?: string;
        type?: string;
        city?: string;
        state?: string;
        vendor_assigned?: boolean;
      }
    >({
      providesTags: ["Issues"],
      keepUnusedDataFor: 300, // 5 minutes — supports prefetch-on-login strategy
      query: ({ page, size, search = "", type = "", city = "", state = "", vendor_assigned }) => {
        const params = new URLSearchParams({
          page: page.toString(),
          size: size.toString(),
        });

        // Only add vendor_assigned if explicitly set (not undefined)
        if (vendor_assigned !== undefined) {
          params.append("vendor_assigned", vendor_assigned ? "true" : "false");
        }
        if (search) params.append("search", search);
        if (type) params.append("type", type);
        if (city) params.append("city", city);
        if (state) params.append("state", state);

        return `/issues/filter?${params.toString()}`;
      },
      transformResponse: (response: { items: IssueType[]; total: number; page: number; size: number; pages: number }) => {
        // Transform status from backend format to frontend format
        return {
          ...response,
          items: response.items.map(issue => ({
            ...issue,
            status: issue.status?.startsWith('Status.')
              ? issue.status
              : `Status.${(issue.status || 'OPEN').toUpperCase()}` as IssueStatus
          }))
        };
      },
    }),

    getIssuesByListingId: builder.query<IssueType[], number>({
      query: (listingId) => `issues/listing/${listingId}`,
      providesTags: (_result, _error, listingId) => [{ type: "Issues", id: `LISTING_${listingId}` }],
      transformResponse: (response: { items: IssueType[] } | IssueType[]) => {
        const items = Array.isArray(response) ? response : response.items;
        return items.map((issue) => ({
          ...issue,
          status: issue.status?.startsWith("Status.")
            ? issue.status
            : (`Status.${(issue.status || "OPEN").toUpperCase()}` as IssueStatus),
        }));
      },
    }),

    getIssueById: builder.query<IssueType, string>({
      query: (id) => `issues/${id}`,
      providesTags: (_result, _error, id) => [{ type: "Issues", id }],
      transformResponse: (response: IssueType) => {
        // Transform status from backend format to frontend format
        return {
          ...response,
          status: response.status?.startsWith('Status.') 
            ? response.status 
            : `Status.${(response.status || 'OPEN').toUpperCase()}` as IssueStatus
        };
      },
    }),

    getIssueAddressById: builder.query<IssueAddress, number>({
      query: (id) => `issues/address/${id}`,
    }),

    getAllIssueAddresses: builder.query<IssueAddress[], void>({
      query: () => "issues/addresses/all",
    }),

    getAddressesByIssueIds: builder.mutation<IssueAddress[], number[]>({
      query: (issueIds) => ({
        url: "issues/addresses/issue_ids",
        method: "POST",
        body: { issue_ids: issueIds },
      }),
    }),

    updateIssue: builder.mutation({
      query: (body) => {
        const { id, ...bodyWithoutId } = body; // Remove ID from body
        return {
          url: `issues/${id}`,
          method: "PUT",
          body: bodyWithoutId,
        };
      },
      async onQueryStarted(updatedIssue, { dispatch, queryFulfilled }) {
        // Transform status for optimistic update: backend expects "in_progress" but returns "Status.IN_PROGRESS"
        const optimisticIssue = { ...updatedIssue };
        if (optimisticIssue.status && !optimisticIssue.status.startsWith('Status.')) {
          optimisticIssue.status = `Status.${optimisticIssue.status.toUpperCase()}` as IssueStatus;
        }
        
        const patchResult = dispatch(
          issuesApi.util.updateQueryData("getIssueById", updatedIssue.id.toString(), (draft) => {
            Object.assign(draft, optimisticIssue);
          })
        );

        const patchIssuesList = dispatch(
          issuesApi.util.updateQueryData("getIssues", undefined, (draft) => {
            const index = draft.findIndex((issue) => issue.id === updatedIssue.id);
            if (index !== -1) {
              // Replace the entire object so React detects the change
              draft[index] = { ...draft[index], ...optimisticIssue };
            }
          })
        );

        const patchPaginatedIssues = dispatch(
          issuesApi.util.updateQueryData("getPaginatedIssues", {} as any, (draft) => {
            const index = draft.items.findIndex((issue) => issue.id === updatedIssue.id);
            if (index !== -1) {
              Object.assign(draft.items[index], optimisticIssue);
            }
          })
        );

        // Also patch listing-scoped cache so homeowner property pages update immediately
        const listingId = updatedIssue.listing_id;
        let patchListingIssues: { undo: () => void } | null = null;
        if (listingId) {
          patchListingIssues = dispatch(
            issuesApi.util.updateQueryData("getIssuesByListingId", Number(listingId), (draft) => {
              const index = draft.findIndex((issue) => issue.id === updatedIssue.id);
              if (index !== -1) {
                draft[index] = { ...draft[index], ...optimisticIssue };
              }
            })
          );
        }

        try {
          await queryFulfilled;
        } catch {
          patchResult.undo();
          patchIssuesList.undo();
          patchPaginatedIssues.undo();
          patchListingIssues?.undo();
        }
      },
      // No invalidatesTags — optimistic cache update handles sync instantly
    }),

    createIssue: builder.mutation<IssueType, Partial<IssueType>>({
      query: (newIssue) => ({
        url: "issues/",
        method: "POST",
        body: newIssue,
      }),
      async onQueryStarted(newIssue, { dispatch, queryFulfilled }) {
        try {
          const { data: createdIssue } = await queryFulfilled;
          // Add to cache without heavy base64 image data (backend returns proper URLs)
          const { image_urls: _submittedImages, ...newIssueWithoutImages } = newIssue as any;
          const normalizedIssue = {
            ...newIssueWithoutImages,
            ...createdIssue,
            status: (createdIssue.status?.startsWith('Status.')
              ? createdIssue.status
              : `Status.${(createdIssue.status || 'OPEN').toUpperCase()}`) as IssueStatus,
          };
          dispatch(
            issuesApi.util.updateQueryData("getIssues", undefined, (draft) => {
              if (!draft.find((i) => i.id === normalizedIssue.id)) {
                draft.push(normalizedIssue as IssueType);
              }
            })
          );
        } catch {
          // Error is handled by the component
        }
      },
      // No invalidatesTags here — we handle cache update optimistically above
      // invalidatesTags would wipe the cache and force a slow full refetch
    }),

    /** ---------- DELETE (optimistic removal) ---------- */
    deleteIssue: builder.mutation<void, number>({
      query: (id) => ({
        url: `issues/${id}`,
        method: "DELETE",
      }),
      async onQueryStarted(id, { dispatch, queryFulfilled }) {
        // Remove from the main issues list immediately
        const patchList = dispatch(
          issuesApi.util.updateQueryData("getIssues", undefined, (draft) => {
            const idx = draft.findIndex((i) => i.id === id);
            if (idx !== -1) draft.splice(idx, 1);
          })
        );

        // Remove from paginated issues and update count
        const patchPaginatedList = dispatch(
          issuesApi.util.updateQueryData("getPaginatedIssues", {} as any, (draft) => {
            const idx = draft.items.findIndex((i) => i.id === id);
            if (idx !== -1) {
              draft.items.splice(idx, 1);
              if (draft.total) {
                draft.total -= 1;
              }
            }
          })
        );

        // Optionally clear the detail cache for this id
        let patchDetail: { undo: () => void } | null = null;
        try {
          patchDetail = dispatch(
            issuesApi.util.updateQueryData("getIssueById", id.toString(), () => {
              // no-op; if a component uses this cache it will refetch or unmount
              // we keep this so we can undo cleanly if needed
            })
          );
        } catch {}

        try {
          await queryFulfilled;
        } catch {
          patchList.undo();
          patchPaginatedList.undo();
          patchDetail?.undo?.();
        }
      },
    }),
  }),
});

export const {
  useGetIssuesQuery,
  useGetIssuesByListingIdQuery,
  useGetIssueByIdQuery,
  useGetPaginatedIssuesQuery,
  useGetIssueAddressByIdQuery,
  useGetAllIssueAddressesQuery,
  useGetAddressesByIssueIdsMutation,
  useUpdateIssueMutation,
  useCreateIssueMutation,
  useDeleteIssueMutation,
} = issuesApi;

export const { getIssueById, getIssueAddressById } = issuesApi.endpoints;