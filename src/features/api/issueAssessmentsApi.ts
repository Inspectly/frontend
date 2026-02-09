import { api } from "./apiSlice";
import { CalendarReadyAssessment, IssueAssessment } from "../../types";

export const issueAssessmentsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getAssessmentsByIssueId: builder.query<IssueAssessment[], number>({
      query: (issueId) => `issue_assessments/issue/${issueId}`,
      providesTags: (result, error, issueId) => [
        { type: "Assessments", id: `issue-${issueId}` },
        { type: "Assessments", id: "LIST" },
      ],
    }),
    getAssessmentsByUserId: builder.query<IssueAssessment[], number>({
      query: (userId) => `issue_assessments/user_id/${userId}`,
      providesTags: (result, error, userId) => [
        { type: "Assessments", id: `user-${userId}` },
        { type: "Assessments", id: "LIST" },
      ],
    }),
    getAssessmentsByUsersInteractionId: builder.query<CalendarReadyAssessment[], string>({
      query: (userInteractionId) => `issue_assessments/users_interaction/${userInteractionId}`,
      providesTags: (result, error, interactionId) => [
        { type: "Assessments", id: `interaction-${interactionId}` },
        { type: "Assessments", id: "LIST" },
      ],
    }),
    getAssessmentsByClientIdUsersInteractionId: builder.query<IssueAssessment[], number>({
      query: (clientId) => `issue_assessments/client_id_users_interaction_id/${clientId}`,
      providesTags: (result, error, clientId) => [
        { type: "Assessments", id: `client-${clientId}` },
        { type: "Assessments", id: "LIST" },
      ],
    }),
    getAssessmentsByVendorIdUsersInteractionId: builder.query<IssueAssessment[], number>({
      query: (vendor) => `issue_assessments/vendor_id_users_interaction_id/${vendor}`,
      providesTags: (result, error, vendorId) => [
        { type: "Assessments", id: `vendor-${vendorId}` },
        { type: "Assessments", id: "LIST" },
      ],
    }),
    createAssessment: builder.mutation({
      query: (body) => ({
        url: "issue_assessments/",
        method: "POST",
        body,
      }),
      // Invalidate all assessment caches when a new one is created
      invalidatesTags: ["Assessments"],
    }),
    updateAssessment: builder.mutation({
      query: (body) => ({
        url: `issue_assessments/${body.id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["Assessments"],
    }),
    deleteAssessment: builder.mutation<void, { id: number; issue_id: number; interaction_id: string }>({
      query: ({ id, issue_id, interaction_id }) => ({
        url: `issue_assessments/${id}`,
        method: "DELETE",
        body: { issue_id, interaction_id },
      }),
      invalidatesTags: ["Assessments"],
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
