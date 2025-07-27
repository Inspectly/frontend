import { api } from "./apiSlice";

type CheckoutPayload = {
  client_id: number;
  vendor_id: number;
  offer_id: number;
};

type CheckoutResponse = {
  sessionUrl: string;
};

export const stripePaymentsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    createCheckoutSession: builder.mutation<CheckoutResponse, CheckoutPayload>({
      query: (data) => ({
        url: "stripe/checkout/create-session",
        method: "POST",
        body: data,
      }),
    }),
  }),
});

export const {
  useCreateCheckoutSessionMutation,
} = stripePaymentsApi;
