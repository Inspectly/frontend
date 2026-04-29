import { api } from "./apiSlice";
import { DisputeDetails, IssueDispute } from "../../types";
import { uploadFileToImageUrl } from "../../utils/imageUpload";

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
      query: (issueOfferId) =>
        `issue_disputes/issue_offer/${issueOfferId}/details`,
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
      {
        issueDisputeId: number;
        issueOfferId: number;
        message: string;
        userType: string;
      }
    >({
      query: ({ issueDisputeId, message, userType }) => {
        const normalizedUserType = normalizeUserType(userType);
        return {
          url: `issue_dispute_messages/?issue_dispute_id=${issueDisputeId}`,
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message,
            user_type: normalizedUserType,
          }),
        };
      },
      invalidatesTags: (_result, _error, { issueOfferId }) => [
        { type: "Disputes", id: `details-${issueOfferId}` },
      ],
    }),
    createDisputeAttachment: builder.mutation<
      { id: number },
      {
        issueDisputeId: number;
        issueOfferId: number;
        file?: File;
        attachmentUrl?: string;
        userType: string;
      }
    >({
      async queryFn(
        { issueDisputeId, file, attachmentUrl, userType },
        _queryApi,
        _extraOptions,
        baseQuery
      ) {
        const normalizedUserType = normalizeUserType(userType);
        if (!normalizedUserType) {
          return { error: { status: "CUSTOM_ERROR", error: "Invalid user type." } };
        }

        let uploadedUrl: string | undefined = attachmentUrl;
        if (!uploadedUrl && file) {
          try {
            uploadedUrl = await uploadFileToImageUrl(file);
          } catch (err) {
            return { error: { status: "CUSTOM_ERROR", error: String(err) } };
          }
        }

        if (!uploadedUrl) {
          return { error: { status: "CUSTOM_ERROR", error: "No attachment provided." } };
        }

        const result = await baseQuery({
          url: `issue_dispute_attachments/?issue_dispute_id=${issueDisputeId}`,
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            attachment_url: uploadedUrl,
            user_type: normalizedUserType,
          }),
        });

        if (result.error) {
          return { error: result.error as any };
        }

        const data = result.data as { id?: number } | undefined;
        if (!data || typeof data.id !== "number") {
          return {
            error: { status: "CUSTOM_ERROR", error: "Invalid attachment response." },
          };
        }

        return { data: { id: data.id } };
      },
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
  useCreateDisputeAttachmentMutation,
} = issueDisputesApi;
