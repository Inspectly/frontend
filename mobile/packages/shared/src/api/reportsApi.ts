import { api } from "./apiSlice";
import { ReportType } from "../types";

type UpdateReportPutPayload = {
  id: number;
  user_id: number;
  listing_id: number;
  aws_link: string;
  name: string;
  review_status: string;
};

export const reportsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getReports: builder.query<ReportType[], void>({
      query: () => "reports/",
      providesTags: ["Reports"],
      transformResponse: (response: { items: ReportType[] }) => response.items,
    }),
    getReportById: builder.query<ReportType, number>({
      query: (id) => `reports/${id}`,
      providesTags: (_, __, id) => [{ type: "Reports", id }],
    }),
    getReportsByUserId: builder.query<ReportType[], number>({
      query: (userId) => `reports/user/${userId}`,
      providesTags: (result, _, userId) => [
        { type: "Reports", id: `USER_${userId}` },
        ...(result || []).map((report) => ({ type: "Reports" as const, id: report.id })),
      ],
    }),
    createReport: builder.mutation<ReportType, Partial<ReportType>>({
      query: (newReport) => ({
        url: "reports/",
        method: "POST",
        body: newReport,
      }),
      invalidatesTags: ["Reports"],
    }),
    updateReport: builder.mutation<ReportType, UpdateReportPutPayload>({
      query: ({ id, ...full }) => ({
        url: `reports/${id}`,
        method: "PUT",
        body: full,
      }),
      invalidatesTags: (_, __, { id }) => [{ type: "Reports", id }, "Reports"],
    }),
  }),
});

export const {
  useGetReportsQuery,
  useGetReportByIdQuery,
  useGetReportsByUserIdQuery,
  useCreateReportMutation,
  useUpdateReportMutation,
} = reportsApi;
