import { api } from "./apiSlice";
import { CalendarReadyAssessment, IssueAssessment } from "../../types";

export const issueAssessmentsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getAssessmentsByIssueId: builder.query<IssueAssessment[], number>({
      query: (issueId) => `issue_assessments/issue/${issueId}`,
    }),
    getAssessmentsByUserId: builder.query<IssueAssessment[], number>({
      query: (userId) => `issue_assessments/user_id/${userId}`,
    }),
    getAssessmentsByVendorId: builder.query<IssueAssessment[], number>({
      query: (vendorId) => `issue_assessments/vendor_id/${vendorId}`,
    }),
    getAssessmentsByUsersInteractionId: builder.query<CalendarReadyAssessment[], string>({
      query: (userInteractionId) => `issue_assessments/users_interaction/${userInteractionId}`,
    }),
    createAssessment: builder.mutation({
      query: (body) => ({
        url: "issue_assessments/",
        method: "POST",
        body,
      }),
    }),
    updateAssessment: builder.mutation({
      query: (body) => ({
        url: `issue_assessments/${body.id}`,
        method: "PUT",
        body,
      }),
    }),
    deleteAssessment: builder.mutation<void, { id: number; issue_id: number; interaction_id: string }>({
      query: ({ id, issue_id, interaction_id }) => ({
        url: `issue_assessments/${id}`,
        method: "DELETE",
        body: { issue_id, interaction_id },
      }),
    }),
  }),
});

export const { useGetAssessmentsByIssueIdQuery, useGetAssessmentsByUserIdQuery, useGetAssessmentsByVendorIdQuery, useGetAssessmentsByUsersInteractionIdQuery, useLazyGetAssessmentsByUsersInteractionIdQuery, useCreateAssessmentMutation, useDeleteAssessmentMutation, useUpdateAssessmentMutation } = issueAssessmentsApi;
