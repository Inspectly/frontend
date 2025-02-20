import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { Listing, IssueType, ReportType, Vendor, Attachment, Comment } from "../types";

const BASE_URL = "/api/"; // Backend API

export const api = createApi({
  reducerPath: "api",
  baseQuery: fetchBaseQuery({ baseUrl: BASE_URL }),
  tagTypes: ["Attachments", "Comments"], 
  endpoints: (builder) => ({
    getListings: builder.query<Listing[], void>({
      query: () => "listings/",
    }),
    getListingById: builder.query<Listing, string>({
      query: (id) => `listings/${id}`,
    }),
    getIssues: builder.query<IssueType[], void>({
      query: () => "issues/",
    }),
    getIssueById: builder.query<IssueType, string>({
      query: (id) => `issues/${id}`,
    }),
    updateIssue: builder.mutation({
      query: ({ id, ...updates  }) => ({
        url: `issues/${id}`,
        method: "PUT",
        body: updates, // Send all updated fields
      }),
    }),
    getReports: builder.query<ReportType[], void>({
      query: () => "reports/",
    }),
    getReportById: builder.query<ReportType, string>({
      query: (id) => `reports/${id}`,
    }),
    getVendors: builder.query<Vendor[], void>({
      query: () => "vendors/",
    }),
    getVendorById: builder.query<Vendor, string>({
      query: (id) => `vendors/${id}`,
    }),
    getUserById: builder.query({
      query: (id) => `users/${id}`,
    }),

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
          type: file.type,
          url: URL.createObjectURL(file), // Convert to a temporary URL
        }),
      }),
      invalidatesTags: ["Attachments"], // Ensures UI updates after upload
    }),
    deleteAttachment: builder.mutation({
      query: (attachmentId: number) => ({
        url: `attachments/${attachmentId}`,
        method: "DELETE",
      }),
      invalidatesTags: [{ type: "Attachments", id: "LIST" }], // Ensure UI updates after deletion
    }),

    getComments: builder.query<Comment[], void>({
      query: () => "comments/",
      providesTags: [{ type: "Comments", id: "LIST" }],
    }),
    createComment: builder.mutation<any, { issueId: number; comment: string; userId: number }>({
      query: ({ issueId, comment, userId }) => ({
        url: "comments/",
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          issue_id: issueId,
          user_id: userId,
          comment,
        }),
      }),
      invalidatesTags: ["Comments"], // Ensures UI updates after upload
    }),
  }),
});

export const {
  useGetListingsQuery,
  useGetListingByIdQuery,
  useGetIssuesQuery,
  useGetIssueByIdQuery,
  useUpdateIssueMutation,
  useGetReportsQuery,
  useGetReportByIdQuery,
  useGetVendorsQuery,
  useGetVendorByIdQuery,
  useGetUserByIdQuery,
  useGetAttachmentsQuery,
  useCreateAttachmentMutation,
  useDeleteAttachmentMutation,
  useGetCommentsQuery,
  useCreateCommentMutation,
} = api;
