import { api } from "./apiSlice";
import { IssueOffer, IssueOfferStatus } from "../../types";

// Normalize offer status from backend format to frontend enum
const normalizeOfferStatus = (status: string): IssueOfferStatus => {
  const normalized = status?.toLowerCase().replace("bid_status.", "") || "";
  if (normalized === "accepted" || status === IssueOfferStatus.ACCEPTED) {
    return IssueOfferStatus.ACCEPTED;
  }
  if (normalized === "rejected" || status === IssueOfferStatus.REJECTED) {
    return IssueOfferStatus.REJECTED;
  }
  // Default to RECEIVED for "received" or any other status
  return IssueOfferStatus.RECEIVED;
};

// Transform offer to normalize status
const transformOffer = (offer: IssueOffer): IssueOffer => ({
  ...offer,
  status: normalizeOfferStatus(offer.status as unknown as string),
});

export const issueOffersApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getOffersByIssueId: builder.query<IssueOffer[], number>({
        query: (issueId) => `/issue_offers/issue/${issueId}`,
        transformResponse: (response: IssueOffer[]) => response.map(transformOffer),
        providesTags: (result) =>
          result
            ? [
                ...result.map((offer) => ({
                  type: "Offers" as const,
                  id: offer.id,
                })),
                { type: "Offers", id: "LIST" },
              ]
            : [{ type: "Offers", id: "LIST" }],
      }),
      getOffersByVendorId: builder.query<IssueOffer[], number>({
        query: (vendorId) => `/issue_offers/vendor/${vendorId}`,
        transformResponse: (response: IssueOffer[]) => response.map(transformOffer),
        providesTags: (result) =>
          result
            ? [
                ...result.map((offer) => ({
                  type: "Offers" as const,
                  id: offer.id,
                })),
                { type: "Offers", id: "LIST" },
              ]
            : [{ type: "Offers", id: "LIST" }],
      }),
      createOffer: builder.mutation({
        query: (body) => ({
          url: "issue_offers/",
          method: "POST",
          body,
        }),
        invalidatesTags: [{ type: "Offers", id: "LIST" }],
        async onQueryStarted(body, { dispatch, queryFulfilled }) {
          try {
            await queryFulfilled;
            if (body.issue_id) dispatch(issueOffersApi.endpoints.getOffersByIssueId.initiate(body.issue_id, { forceRefetch: true }));
            if (body.vendor_id) dispatch(issueOffersApi.endpoints.getOffersByVendorId.initiate(body.vendor_id, { forceRefetch: true }));
          } catch {}
        },
      }),
      updateOffer: builder.mutation({
        query: (body) => ({
          url: `issue_offers/${body.id}`,
          method: "PUT",
          body,
        }),
        invalidatesTags: (_result, _error, body) => [
          { type: "Offers", id: body.id },
          { type: "Offers", id: "LIST" },
        ],
        async onQueryStarted(body, { dispatch, queryFulfilled }) {
          try {
            await queryFulfilled;
            if (body.issue_id) dispatch(issueOffersApi.endpoints.getOffersByIssueId.initiate(body.issue_id, { forceRefetch: true }));
            if (body.vendor_id) dispatch(issueOffersApi.endpoints.getOffersByVendorId.initiate(body.vendor_id, { forceRefetch: true }));
          } catch {}
        },
      }),
      deleteOffer: builder.mutation({
        query: ({ id, issue_id }) => ({
          url: `issue_offers/${id}`,
          method: "DELETE",
          body: { issue_id },
        }),
        invalidatesTags: (_result, _error, { id }) => [
          { type: "Offers", id },
          { type: "Offers", id: "LIST" },
        ],
        async onQueryStarted({ id, issue_id, vendor_id }, { dispatch, queryFulfilled }) {
          // Optimistically drop the offer from the cached lists so the
          // marketplace card flips to "Write Offer" instantly, instead of
          // waiting on the background refetch round-trip. Roll back on failure.
          const patches: { undo: () => void }[] = [];
          const removeOffer = (list: IssueOffer[]) => {
            const idx = list.findIndex((o) => o.id === id);
            if (idx !== -1) list.splice(idx, 1);
          };
          if (vendor_id != null) {
            patches.push(
              dispatch(
                issueOffersApi.util.updateQueryData(
                  "getOffersByVendorId",
                  Number(vendor_id),
                  removeOffer
                )
              )
            );
          }
          if (issue_id != null) {
            patches.push(
              dispatch(
                issueOffersApi.util.updateQueryData(
                  "getOffersByIssueId",
                  Number(issue_id),
                  removeOffer
                )
              )
            );
          }
          try {
            await queryFulfilled;
            if (issue_id) dispatch(issueOffersApi.endpoints.getOffersByIssueId.initiate(Number(issue_id), { forceRefetch: true }));
            if (vendor_id) dispatch(issueOffersApi.endpoints.getOffersByVendorId.initiate(Number(vendor_id), { forceRefetch: true }));
          } catch {
            patches.forEach((p) => p.undo());
          }
        },
      }),
  }),
});

export const { useGetOffersByIssueIdQuery, useGetOffersByVendorIdQuery, useCreateOfferMutation, useUpdateOfferMutation, useDeleteOfferMutation } = issueOffersApi;
export const { getOffersByIssueId } = issueOffersApi.endpoints;
