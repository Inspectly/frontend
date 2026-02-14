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
      }),
  }),
});

export const { useGetOffersByIssueIdQuery, useGetOffersByVendorIdQuery, useCreateOfferMutation, useUpdateOfferMutation, useDeleteOfferMutation } = issueOffersApi;
export const { getOffersByIssueId } = issueOffersApi.endpoints;
