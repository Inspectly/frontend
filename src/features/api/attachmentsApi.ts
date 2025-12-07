import { api } from "./apiSlice";
import { Attachment } from "../../types";

export const attachmentsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getAttachments: builder.query<Attachment[], void>({
      query: () => "attachments/",
      providesTags: [{ type: "Attachments", id: "LIST" }],
    }),
    createAttachment: builder.mutation<any, { issueId: number; file: File; userId: number; url: string }>({
      query: ({ issueId, file, userId, url }) => ({
        url: "attachments/",
        method: "POST",
        body: {
          issue_id: issueId,
          user_id: userId,
          name: file.name,
          type: file.name.split('.').pop()?.toLowerCase() || "file",
          url: url,
        },
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
