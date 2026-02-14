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
      invalidatesTags: ["Assessments"],
      async onQueryStarted(body, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          if (data?.issue_id) dispatch(issueAssessmentsApi.endpoints.getAssessmentsByIssueId.initiate(data.issue_id, { forceRefetch: true }));
          const interactionId = (data as any)?.users_interaction_id ?? (body as any).users_interaction_id ?? (body as any).interaction_id;
          if (interactionId && typeof interactionId === "string") {
            const parts = interactionId.split("_");
            if (parts.length >= 3) {
              const clientId = Number(parts[0]);
              const vendorId = Number(parts[1]);
              if (!isNaN(clientId)) dispatch(issueAssessmentsApi.endpoints.getAssessmentsByClientIdUsersInteractionId.initiate(clientId, { forceRefetch: true }));
              if (!isNaN(vendorId)) dispatch(issueAssessmentsApi.endpoints.getAssessmentsByVendorIdUsersInteractionId.initiate(vendorId, { forceRefetch: true }));
            }
          }
          if (data?.user_id) dispatch(issueAssessmentsApi.endpoints.getAssessmentsByUserId.initiate(data.user_id, { forceRefetch: true }));
        } catch {}
      },
    }),
    updateAssessment: builder.mutation({
      query: (body) => ({
        url: `issue_assessments/${body.id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["Assessments"],
      async onQueryStarted(body, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
          if (body.issue_id) dispatch(issueAssessmentsApi.endpoints.getAssessmentsByIssueId.initiate(body.issue_id, { forceRefetch: true }));
          const interactionId = (body as any).users_interaction_id ?? (body as any).interaction_id;
          if (interactionId && typeof interactionId === "string") {
            const parts = interactionId.split("_");
            if (parts.length >= 3) {
              const clientId = Number(parts[0]);
              const vendorId = Number(parts[1]);
              if (!isNaN(clientId)) dispatch(issueAssessmentsApi.endpoints.getAssessmentsByClientIdUsersInteractionId.initiate(clientId, { forceRefetch: true }));
              if (!isNaN(vendorId)) dispatch(issueAssessmentsApi.endpoints.getAssessmentsByVendorIdUsersInteractionId.initiate(vendorId, { forceRefetch: true }));
            }
          }
          const userId = (body as any).user_id;
          if (userId) dispatch(issueAssessmentsApi.endpoints.getAssessmentsByUserId.initiate(userId, { forceRefetch: true }));
        } catch {}
      },
    }),
    deleteAssessment: builder.mutation<void, { id: number; issue_id: number; interaction_id: string }>({
      query: ({ id, issue_id, interaction_id }) => ({
        url: `issue_assessments/${id}`,
        method: "DELETE",
        body: { issue_id, interaction_id },
      }),
      invalidatesTags: ["Assessments"],
      async onQueryStarted({ issue_id, interaction_id }, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
          if (issue_id) dispatch(issueAssessmentsApi.endpoints.getAssessmentsByIssueId.initiate(issue_id, { forceRefetch: true }));
          if (interaction_id && typeof interaction_id === "string") {
            const parts = interaction_id.split("_");
            if (parts.length >= 3) {
              const clientId = Number(parts[0]);
              const vendorId = Number(parts[1]);
              if (!isNaN(clientId)) dispatch(issueAssessmentsApi.endpoints.getAssessmentsByClientIdUsersInteractionId.initiate(clientId, { forceRefetch: true }));
              if (!isNaN(vendorId)) dispatch(issueAssessmentsApi.endpoints.getAssessmentsByVendorIdUsersInteractionId.initiate(vendorId, { forceRefetch: true }));
            }
          }
        } catch {}
      },
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
