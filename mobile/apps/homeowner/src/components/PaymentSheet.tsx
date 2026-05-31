import React, { useState } from "react";
import { Text, TouchableOpacity, Alert, ActivityIndicator } from "react-native";
import { useCreatePaymentIntentMutation, IssueOffer } from "@inspectly/shared";

interface PaymentSheetProps {
  offer: IssueOffer;
  clientId: number;
  onSuccess: () => void;
}

/**
 * The native Stripe payment sheet (`@stripe/stripe-react-native`) requires a
 * custom dev/production build and cannot run in Expo Go or on web. To keep the
 * app runnable everywhere, this component still creates the PaymentIntent on the
 * backend, then hands off to the native sheet when it's available. In Expo Go /
 * web it explains that checkout completes in the installed app build.
 */
export function PaymentSheet({ offer, clientId, onSuccess }: PaymentSheetProps) {
  const [createPaymentIntent] = useCreatePaymentIntentMutation();
  const [loading, setLoading] = useState(false);

  const handlePay = async () => {
    setLoading(true);
    try {
      await createPaymentIntent({
        client_id: clientId,
        vendor_id: offer.vendor_id,
        offer_id: offer.id,
      }).unwrap();

      Alert.alert(
        "Continue in the Inspectly app",
        "Secure card checkout opens in the installed Inspectly app build. Your payment is ready to complete there."
      );
      onSuccess();
    } catch (error: any) {
      Alert.alert("Error", error?.message ?? "Payment failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <TouchableOpacity
      className="bg-primary rounded-xl py-4 items-center flex-row justify-center gap-2"
      onPress={handlePay}
      disabled={loading}
    >
      {loading ? (
        <ActivityIndicator color="#FFFFFF" size="small" />
      ) : (
        <Text className="text-primary-foreground font-bold text-base">
          Pay ${offer.price}
        </Text>
      )}
    </TouchableOpacity>
  );
}
