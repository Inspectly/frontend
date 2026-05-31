import { api } from "./apiSlice";

interface DeviceRegistration {
  user_id: number;
  push_token: string;
  device_type: "ios" | "android";
  app_type: "homeowner" | "vendor";
}

export const notificationsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    registerDevice: builder.mutation<{ success: boolean }, DeviceRegistration>({
      query: (data) => ({
        url: "notifications/register-device",
        method: "POST",
        body: data,
      }),
    }),
    unregisterDevice: builder.mutation<{ success: boolean }, { push_token: string }>({
      query: (data) => ({
        url: "notifications/unregister-device",
        method: "POST",
        body: data,
      }),
    }),
  }),
});

export const {
  useRegisterDeviceMutation,
  useUnregisterDeviceMutation,
} = notificationsApi;
