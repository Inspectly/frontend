import { useEffect, useRef, useState } from "react";
import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import { useRegisterDeviceMutation } from "@inspectly/shared";

try {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
} catch {
  // no-op: notifications module unavailable (e.g. web)
}

async function registerForPushNotificationsAsync(): Promise<string | null> {
  // Remote push requires a physical device and a custom dev/production build.
  // Expo Go (SDK 53+) and web don't support remote push, so fail soft.
  if (Platform.OS === "web") return null;
  if (!Constants.isDevice) {
    return null;
  }

  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      return null;
    }

    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "default",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#D4A853",
      });
    }

    const projectId =
      (Constants.expoConfig?.extra as any)?.eas?.projectId ??
      (Constants as any).easConfig?.projectId;
    const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
    return tokenData.data;
  } catch (err) {
    console.warn("Push registration skipped:", err);
    return null;
  }
}

interface UsePushNotificationsOptions {
  userId?: number;
  appType: "homeowner" | "vendor";
  enabled: boolean;
}

export function usePushNotifications({ userId, appType, enabled }: UsePushNotificationsOptions) {
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [notification, setNotification] = useState<Notifications.Notification | null>(null);
  const notificationListener = useRef<Notifications.EventSubscription | null>(null);
  const responseListener = useRef<Notifications.EventSubscription | null>(null);
  const [registerDevice] = useRegisterDeviceMutation();

  useEffect(() => {
    if (Platform.OS === "web" || !enabled || !userId) return;

    registerForPushNotificationsAsync().then((token) => {
      if (token) {
        setExpoPushToken(token);
        registerDevice({
          user_id: userId,
          push_token: token,
          device_type: Platform.OS as "ios" | "android",
          app_type: appType,
        });
      }
    });

    notificationListener.current = Notifications.addNotificationReceivedListener(
      (notification) => {
        setNotification(notification);
      }
    );

    responseListener.current = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const data = response.notification.request.content.data;
        handleNotificationNavigation(data ?? {});
      }
    );

    return () => {
      notificationListener.current?.remove();
      responseListener.current?.remove();
      notificationListener.current = null;
      responseListener.current = null;
    };
  }, [enabled, userId, appType, registerDevice]);

  return { expoPushToken, notification };
}

function handleNotificationNavigation(data: Record<string, unknown>) {
  const { type, issue_id, offer_id } = data as {
    type?: string;
    issue_id?: number;
    offer_id?: number;
  };

  switch (type) {
    case "offer_accepted":
    case "new_marketplace_issue":
    case "assessment_counter_proposal":
    case "payment_received":
      break;
    default:
      break;
  }
}
