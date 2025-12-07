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
    getAssessmentsByUsersInteractionId: builder.query<CalendarReadyAssessment[], string>({
      query: (userInteractionId) => `issue_assessments/users_interaction/${userInteractionId}`,
    }),
    getAssessmentsByClientIdUsersInteractionId: builder.query<IssueAssessment[], number>({
      query: (clientId) => `issue_assessments/client_id_users_interaction_id/${clientId}`,
    }),
    getAssessmentsByVendorIdUsersInteractionId: builder.query<IssueAssessment[], number>({
      query: (vendor) => `issue_assessments/vendor_id_users_interaction_id/${vendor}`,
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

export const {
  useGetAssessmentsByIssueIdQuery,
  useGetAssessmentsByUserIdQuery,
  useGetAssessmentsByUsersInteractionIdQuery,
  useLazyGetAssessmentsByUsersInteractionIdQuery,
  useGetAssessmentsByClientIdUsersInteractionIdQuery,
  useGetAssessmentsByVendorIdUsersInteractionIdQuery,
  useCreateAssessmentMutation,
  useDeleteAssessmentMutation,
  useUpdateAssessmentMutation
} = issueAssessmentsApi;
