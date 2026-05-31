import { api } from "./apiSlice";
import { DisputeDetails, IssueDispute } from "../types";

const DEFAULT_DISPUTE_STATUS = "open";

const normalizeUserType = (userType: string) =>
  userType
    ?.replace(/user_type\./i, "")
    .replace(/usertype\./i, "")
    .toLowerCase()
    .trim();

export const issueDisputesApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getDisputesByIssueOfferId: builder.query<IssueDispute[], number>({
      query: (issueOfferId) => `issue_disputes/issue_offer/${issueOfferId}`,
      providesTags: (result, _error, issueOfferId) => [
        { type: "Disputes", id: `issue-offer-${issueOfferId}` },
        ...(result ?? []).map((dispute) => ({ type: "Disputes" as const, id: dispute.id })),
      ],
    }),
    getOpenDisputesByIssueOfferId: builder.query<IssueDispute[], number>({
      query: (issueOfferId) => `issue_disputes/issue_offer/${issueOfferId}/open`,
      providesTags: (result, _error, issueOfferId) => [
        { type: "Disputes", id: `open-issue-offer-${issueOfferId}` },
        ...(result ?? []).map((dispute) => ({ type: "Disputes" as const, id: dispute.id })),
      ],
    }),
    getDisputeDetailsByIssueOfferId: builder.query<DisputeDetails, number>({
      query: (issueOfferId) => `issue_disputes/issue_offer/${issueOfferId}/details`,
      providesTags: (_result, _error, issueOfferId) => [
        { type: "Disputes", id: `details-${issueOfferId}` },
      ],
    }),
    createDispute: builder.mutation<
      { id: number },
      { issueOfferId: number; statusMessage?: string | null; status?: string }
    >({
      query: ({ issueOfferId, statusMessage, status }) => ({
        url: "issue_disputes/",
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          issue_offer_id: issueOfferId,
          status: status ?? DEFAULT_DISPUTE_STATUS,
          status_message: statusMessage ?? null,
        }),
      }),
      invalidatesTags: (_result, _error, { issueOfferId }) => [
        { type: "Disputes", id: `issue-offer-${issueOfferId}` },
        { type: "Disputes", id: `details-${issueOfferId}` },
      ],
    }),
    createDisputeMessage: builder.mutation<
      { id: number },
      { issueDisputeId: number; issueOfferId: number; message: string; userType: string }
    >({
      query: ({ issueDisputeId, message, userType }) => ({
        url: `issue_dispute_messages/?issue_dispute_id=${issueDisputeId}`,
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message,
          user_type: normalizeUserType(userType),
        }),
      }),
      invalidatesTags: (_result, _error, { issueOfferId }) => [
        { type: "Disputes", id: `details-${issueOfferId}` },
      ],
    }),
  }),
});

export const {
  useGetDisputesByIssueOfferIdQuery,
  useLazyGetDisputesByIssueOfferIdQuery,
  useGetOpenDisputesByIssueOfferIdQuery,
  useGetDisputeDetailsByIssueOfferIdQuery,
  useCreateDisputeMutation,
  useCreateDisputeMessageMutation,
} = issueDisputesApi;
