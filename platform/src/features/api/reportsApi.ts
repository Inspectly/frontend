import { apiSlice } from "./apiSlice";

export interface Report {
  id: number;
  user_id: number;
  listing_id: number;
  aws_link: string;
  name: string;
  created_at: string;
  updated_at: string;
  review_status: string;
}

export const reportsApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getReports: builder.query<Report[], void>({
      query: () => "reports/",
      providesTags: ["Reports"],
    }),
    getReportById: builder.query<Report, number>({
      query: (id) => `reports/${id}`,
      providesTags: ["Reports"],
    }),
    getReportsByUserId: builder.query<Report[], number>({
      query: (userId) => `reports/user/${userId}`,
      providesTags: ["Reports"],
    }),
  }),
});

export const {
  useGetReportsQuery,
  useGetReportByIdQuery,
  useGetReportsByUserIdQuery,
} = reportsApi;
