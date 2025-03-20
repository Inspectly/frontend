import { api } from "./apiSlice";
import { ReportType } from "../../types";

export const reportsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getReports: builder.query<ReportType[], void>({
      query: () => "reports/",
    }),
    getReportById: builder.query<ReportType, string>({
      query: (id) => `reports/${id}`,
    }),
  }),
});

export const { useGetReportsQuery, useGetReportByIdQuery } = reportsApi;

export const { getReportById } = reportsApi.endpoints;
