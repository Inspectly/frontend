import { apiSlice } from "./apiSlice";

export type IssueStatus = "open" | "review" | "in_progress" | "completed";

export interface Issue {
  id: number;
  report_id: number | null;
  listing_id: number;
  type: string;
  vendor_id: number | null;
  description: string | null;
  summary: string | null;
  severity: string | null;
  status: IssueStatus;
  active: boolean;
  image_urls: string[] | null;
  review_status: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateIssueBody {
  listing_id: number;
  type: string;
  status: IssueStatus;
  active: boolean;
  report_id?: number | null;
  vendor_id?: number | null;
  description?: string | null;
  summary?: string | null;
  severity?: string | null;
  image_urls?: string[] | null;
  review_status?: string | null;
}

export interface ImageUploadResponse {
  url: string;
  display_url: string;
}

export const issuesApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getIssuesByListingId: builder.query<Issue[], number>({
      query: (listingId) => `issues/listing/${listingId}`,
      providesTags: ["Issues"],
    }),
    createIssue: builder.mutation<Issue, CreateIssueBody>({
      query: (body) => ({
        url: "issues/",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Issues"],
    }),
    uploadImage: builder.mutation<ImageUploadResponse, File>({
      query: (file) => {
        const formData = new FormData();
        formData.append("image", file);
        return {
          url: "images/",
          method: "POST",
          body: formData,
        };
      },
    }),
  }),
});

export const {
  useGetIssuesByListingIdQuery,
  useCreateIssueMutation,
  useUploadImageMutation,
} = issuesApi;
