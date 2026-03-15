import { api } from "./apiSlice";
import { Attachment } from "../../types";
import { uploadFileToImageUrl } from "../../utils/imageUpload";

export const attachmentsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getAttachments: builder.query<Attachment[], void>({
      query: () => "attachments/",
      providesTags: [{ type: "Attachments", id: "LIST" }],
    }),
    createAttachment: builder.mutation<Attachment, { issueId: number; file: File; userId: number }>({
      async queryFn({ issueId, file, userId }, _queryApi, _extraOptions, baseQuery) {
        let uploadedUrl: string;
        try {
          uploadedUrl = await uploadFileToImageUrl(file);
        } catch (err) {
          return { error: { status: "CUSTOM_ERROR", error: String(err) } };
        }

        const type = file.type.startsWith("image/") ? "image" : "document";

        const result = await baseQuery({
          url: "attachments/",
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            issue_id: issueId,
            user_id: userId,
            name: file.name,
            type,
            url: uploadedUrl,
          }),
        });

        if (result.data) {
          const data = result.data as Partial<Attachment>;
          return {
            data: {
              id: data.id ?? -1,
              issue_id: data.issue_id ?? issueId,
              name: data.name ?? file.name,
              type: data.type ?? type,
              url: data.url ?? uploadedUrl,
              user_id: data.user_id ?? String(userId),
              created_at: data.created_at ?? new Date().toISOString(),
            },
          };
        }

        return { error: result.error as any };
      },
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
