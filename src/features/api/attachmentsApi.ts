import { api } from "./apiSlice";
import { Attachment } from "../../types";

export const attachmentsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getAttachments: builder.query<Attachment[], void>({
      query: () => "attachments/",
      providesTags: [{ type: "Attachments", id: "LIST" }],
    }),
    createAttachment: builder.mutation<any, { issueId: number; file: File; userId: number }>({
      query: ({ issueId, file, userId }) => ({
        url: "attachments/",
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          issue_id: issueId,
          user_id: userId,
          name: file.name,
          attachment_type: file.type,
          url: URL.createObjectURL(file),
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

export const { useGetAttachmentsQuery, useCreateAttachmentMutation, useDeleteAttachmentMutation } = attachmentsApi;
