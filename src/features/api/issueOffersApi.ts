import { api } from "./apiSlice";
import { IssueOffer } from "../../types";

export const issueOffersApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getOffersByIssueId: builder.query<IssueOffer[], number>({
        query: (issueId) => `/issue_offers/issue/${issueId}`,
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
      }),
      updateOffer: builder.mutation({
        query: (body) => ({
          url: `issue_offers/${body.id}`,
          method: "PUT",
          body,
        }),
        invalidatesTags: (_, __, body) => [{ type: "Offers", id: body.id }],
      }),
      deleteOffer: builder.mutation({
        query: ({ id, issue_id }) => ({
          url: `issue_offers/${id}`,
          method: "DELETE",
          body: { issue_id },
        }),
        invalidatesTags: (_, __, { id }) => [{ type: "Offers", id }],
      }),
  }),
});

export const { useGetOffersByIssueIdQuery, useGetOffersByVendorIdQuery, useCreateOfferMutation, useUpdateOfferMutation, useDeleteOfferMutation } = issueOffersApi;
export const { getOffersByIssueId } = issueOffersApi.endpoints;
