import { api } from "./apiSlice";
import { IssueAddress, IssueStatus, IssueType } from "../../types";

export const issuesApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getIssues: builder.query<IssueType[], void>({
      query: () => "issues/",
      providesTags: ["Issues"],
      transformResponse: (response: IssueType[]) => {
        // Transform status from backend format to frontend format
        return response.map(issue => ({
          ...issue,
          status: issue.status?.startsWith('Status.') 
            ? issue.status 
            : `Status.${(issue.status || 'OPEN').toUpperCase()}` as IssueStatus
        }));
      },
    }),

    getPaginatedIssues: builder.query<
      { issues: IssueType[]; total: { count: number }, total_filtered?: { count: number} },
      {
        offset: number;
        limit: number;
        search?: string;
        type?: string;
        city?: string;
        state?: string;
        vendor_assigned?: boolean;
      }
    >({
      query: ({ offset, limit, search = "", type = "", city = "", state = "", vendor_assigned }) => {
        const params = new URLSearchParams({
          offset: offset.toString(),
          limit: limit.toString(),
          vendor_assigned: vendor_assigned ? "true" : "false",
        });
    
        if (search) params.append("search", search);
        if (type) params.append("type", type);
        if (city) params.append("city", city);
        if (state) params.append("state", state);
    
        return `/issues/filter?${params.toString()}`;
      },
      transformResponse: (response: { issues: IssueType[]; total: { count: number }, total_filtered?: { count: number} }) => {
        // Transform status from backend format to frontend format
        return {
          ...response,
          issues: response.issues.map(issue => ({
            ...issue,
            status: issue.status?.startsWith('Status.') 
              ? issue.status 
              : `Status.${(issue.status || 'OPEN').toUpperCase()}` as IssueStatus
          }))
        };
      },
    }),

    getIssueById: builder.query<IssueType, string>({
      query: (id) => `issues/${id}`,
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
              Object.assign(draft[index], optimisticIssue);
            }
          })
        );

        const patchPaginatedIssues = dispatch(
          issuesApi.util.updateQueryData("getPaginatedIssues", {} as any, (draft) => {
            const index = draft.issues.findIndex((issue) => issue.id === updatedIssue.id);
            if (index !== -1) {
              Object.assign(draft.issues[index], optimisticIssue);
            }
          })
        );

        try {
          await queryFulfilled;
        } catch {
          patchResult.undo();
          patchIssuesList.undo();
          patchPaginatedIssues.undo();
        }
      },
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
          
          // Add the new issue to the main issues list
          dispatch(
            issuesApi.util.updateQueryData("getIssues", undefined, (draft) => {
              draft.push(createdIssue);
            })
          );

          // Update paginated issues cache total count
          dispatch(
            issuesApi.util.updateQueryData("getPaginatedIssues", {} as any, (draft) => {
              if (draft.total) {
                draft.total.count += 1;
              }
            })
          );
        } catch {
          // Error is handled by the component
        }
      },
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
            const idx = draft.issues.findIndex((i) => i.id === id);
            if (idx !== -1) {
              draft.issues.splice(idx, 1);
              if (draft.total) {
                draft.total.count -= 1;
              }
            }
          })
        );

        // Optionally clear the detail cache for this id
        let patchDetail: { undo: () => void } | null = null;
        try {
          patchDetail = dispatch(
            issuesApi.util.updateQueryData("getIssueById", id.toString(), (draft) => {
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