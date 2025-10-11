import { api } from "./apiSlice";
import { ReportType, UpdateReportPutPayload } from "../../types";

export const reportsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getReports: builder.query<ReportType[], void>({
      query: () => "reports/",
    }),
    getReportById: builder.query<ReportType, number>({
      query: (id) => `reports/${id}`,
    }),
    getReportsByUserId: builder.query<ReportType[], number>({
      query: (userId) => `reports/user/${userId}`,
    }),
    createReport: builder.mutation<ReportType, Partial<ReportType>>({
      query: (newReport) => ({
        url: "reports/",
        method: "POST",
        body: newReport,
      }),
    }),
    uploadReportFile: builder.mutation<any, FormData>({
      query: (formData) => ({
        url: "reports/extract/issues",
        method: "POST",
        body: formData,
      }),
    }),


    updateReport: builder.mutation<ReportType, UpdateReportPutPayload>({
      query: ({ id, ...full }) => ({
        url: `reports/${id}`, 
        method: "PUT",
        body: full,
      }),
    }),
  }),
});

export const {
  useGetReportsQuery,
  useGetReportByIdQuery,
  useGetReportsByUserIdQuery,
  useCreateReportMutation,
  useUploadReportFileMutation,
  useUpdateReportMutation,
} = reportsApi;

export const { getReportById } = reportsApi.endpoints;
