import React from "react";
import { useGetVendorByIdQuery } from "../features/api/vendorsApi";

const VendorName: React.FC<{ vendorId: number }> = ({ vendorId }) => {
  const validVendorId = vendorId ? String(vendorId) : "";

  const {
    data: vendor,
    isLoading,
    error,
  } = useGetVendorByIdQuery(validVendorId, {
    skip: !vendorId, // Skip fetching if vendorId is missing
  });

  if (isLoading) return <span>Loading...</span>;
  if (error) return <span>Error</span>;

  return <span>{vendor?.name || "Unknown Vendor"}</span>;
};

export default VendorName;
