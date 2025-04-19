import { api } from "./apiSlice";
import { ReportType } from "../../types";

export const reportsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getReports: builder.query<ReportType[], void>({
      query: () => "reports/",
    }),
    getReportById: builder.query<ReportType, number>({
      query: (id) => `reports/${id}`,
    }),
    createReport: builder.mutation<ReportType, Partial<ReportType>>({
      query: (newReport) => ({
        url: "reports/",
        method: "POST",
        body: newReport,
      }),
    }),
  }),
});

export const { useGetReportsQuery, useGetReportByIdQuery, useCreateReportMutation } = reportsApi;

export const { getReportById } = reportsApi.endpoints;
