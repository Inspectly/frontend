import { api } from "./apiSlice";
import { IssueAddress, IssueStatus, IssueType } from "../types";

export const issuesApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getIssues: builder.query<IssueType[], void>({
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
      query: ({ page, size, search = "", type = "", city = "", state = "", vendor_assigned }) => {
        const params = new URLSearchParams({
          page: page.toString(),
          size: size.toString(),
        });
        if (vendor_assigned !== undefined) params.append("vendor_assigned", vendor_assigned ? "true" : "false");
        if (search) params.append("search", search);
        if (type) params.append("type", type);
        if (city) params.append("city", city);
        if (state) params.append("state", state);
        return `/issues/filter?${params.toString()}`;
      },
      transformResponse: (response: { items: IssueType[]; total: number; page: number; size: number; pages: number }) => ({
        ...response,
        items: response.items.map((issue) => ({
          ...issue,
          status: issue.status?.startsWith("Status.")
            ? issue.status
            : (`Status.${(issue.status || "OPEN").toUpperCase()}` as IssueStatus),
        })),
      }),
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
      transformResponse: (response: IssueType) => ({
        ...response,
        status: response.status?.startsWith("Status.")
          ? response.status
          : (`Status.${(response.status || "OPEN").toUpperCase()}` as IssueStatus),
      }),
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
        const { id, ...bodyWithoutId } = body;
        return {
          url: `issues/${id}`,
          method: "PUT",
          body: bodyWithoutId,
        };
      },
      async onQueryStarted(updatedIssue, { dispatch, queryFulfilled }) {
        const optimisticIssue = { ...updatedIssue };
        if (optimisticIssue.status && !optimisticIssue.status.startsWith("Status.")) {
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
            if (index !== -1) draft[index] = { ...draft[index], ...optimisticIssue };
          })
        );

        try {
          await queryFulfilled;
        } catch {
          patchResult.undo();
          patchIssuesList.undo();
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
          const normalizedIssue = {
            ...newIssue,
            ...createdIssue,
            status: (createdIssue.status?.startsWith("Status.")
              ? createdIssue.status
              : `Status.${(createdIssue.status || "OPEN").toUpperCase()}`) as IssueStatus,
          };
          dispatch(
            issuesApi.util.updateQueryData("getIssues", undefined, (draft) => {
              if (!draft.find((i) => i.id === normalizedIssue.id)) {
                draft.push(normalizedIssue as IssueType);
              }
            })
          );
        } catch {}
      },
    }),

    deleteIssue: builder.mutation<void, number>({
      query: (id) => ({
        url: `issues/${id}`,
        method: "DELETE",
      }),
      async onQueryStarted(id, { dispatch, queryFulfilled }) {
        const patchList = dispatch(
          issuesApi.util.updateQueryData("getIssues", undefined, (draft) => {
            const idx = draft.findIndex((i) => i.id === id);
            if (idx !== -1) draft.splice(idx, 1);
          })
        );
        try {
          await queryFulfilled;
        } catch {
          patchList.undo();
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
