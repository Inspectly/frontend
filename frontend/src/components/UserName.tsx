import React from "react";
import { useGetUserByIdQuery } from "../features/api/usersApi";
import { useGetVendorByVendorUserIdQuery } from "../features/api/vendorsApi";
import { useGetClientByUserIdQuery } from "../features/api/clientsApi";
import { useGetRealtorByIdQuery } from "../features/api/realtorsApi";

const UserName: React.FC<{ userId: number }> = ({ userId }) => {
  const {
    data: user,
    isLoading: isUserLoading,
    error: userError,
  } = useGetUserByIdQuery(String(userId), {
    skip: !userId,
  });

  // Queries for detailed name based on user_type
  const { data: vendor, isLoading: isVendorLoading } =
    useGetVendorByVendorUserIdQuery(String(userId), {
      skip: !userId || user?.user_type !== "vendor",
    });

  const { data: client, isLoading: isClientLoading } =
    useGetClientByUserIdQuery(String(userId), {
      skip: !userId || user?.user_type !== "client",
    });

  const { data: realtor, isLoading: isRealtorLoading } = useGetRealtorByIdQuery(
    String(userId),
    {
      skip: !userId || user?.user_type !== "realtor",
    }
  );

  if (isUserLoading || isVendorLoading || isClientLoading || isRealtorLoading)
    return <span>Loading...</span>;

  if (userError) return <span>Error</span>;

  let name = "Unknown User";

  if (user?.user_type === "vendor" && vendor) {
    name = `${vendor.name}`;
  } else if (user?.user_type === "client" && client) {
    name = `${client.first_name} ${client.last_name}`;
  } else if (user?.user_type === "realtor" && realtor) {
    name = `${realtor.first_name} ${realtor.last_name}`;
  } else if (user?.user_type === "admin") {
    name = "Admin";
  }

  return <span>{name}</span>;
};

export default UserName;
