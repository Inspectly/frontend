import { Client_Review } from "../../types";
import { api } from "./apiSlice";

export const clientReviewsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getClientReviews: builder.query<Client_Review[], void>({
      query: () => `client_reviews/`,
    }),
    getClientReviewsByClientUserId: builder.query<Client_Review[], number>({
      query: (clientUserId) => `client_reviews/client_user_id/${clientUserId}`,
    }),
    createClientReview: builder.mutation<Client_Review, Partial<Client_Review>>({
      query: (body) => ({
        url: "client_reviews/",
        method: "POST",
        body,
      }),
    }),
  }),
});

export const {
  useGetClientReviewsQuery,
  useGetClientReviewsByClientUserIdQuery,
  useCreateClientReviewMutation,
} = clientReviewsApi;
