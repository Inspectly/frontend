import { api } from "./apiSlice";
import { User_Type } from "../../types";

export const userTypesApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getUserTypes: builder.query<User_Type[], void>({
      query: () => "user_types/",
    }),
  }),
});

export const { useGetUserTypesQuery } = userTypesApi;
