import { api } from "./apiSlice";
import { Attachment } from "../types";

export const attachmentsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getAttachments: builder.query<Attachment[], void>({
      query: () => "attachments/",
      providesTags: [{ type: "Attachments", id: "LIST" }],
    }),
    createAttachmentFromUrl: builder.mutation<
      Attachment,
      { issueId: number; name: string; type: string; url: string; userId: number }
    >({
      query: ({ issueId, name, type, url, userId }) => ({
        url: "attachments/",
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          issue_id: issueId,
          user_id: userId,
          name,
          type,
          url,
        }),
      }),
      invalidatesTags: ["Attachments"],
    }),
    deleteAttachment: builder.mutation({
      query: (attachmentId: number) => ({
        url: `attachments/${attachmentId}`,
        method: "DELETE",
      }),
      invalidatesTags: [{ type: "Attachments", id: "LIST" }],
    }),
  }),
});

export const {
  useGetAttachmentsQuery,
  useCreateAttachmentFromUrlMutation,
  useDeleteAttachmentMutation,
} = attachmentsApi;
