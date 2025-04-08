import React from "react";
import {
  useGetVendorByIdQuery,
  useGetVendorByVendorUserIdQuery,
} from "../features/api/vendorsApi";

const VendorName: React.FC<{ vendorId: number; isVendorId?: boolean }> = ({
  vendorId,
  isVendorId = true,
}) => {
  const validVendorId = vendorId ? String(vendorId) : "";

  const {
    data: vendor,
    isLoading: isVendorLoading,
    error: vendorError,
  } = useGetVendorByIdQuery(validVendorId, {
    skip: !vendorId || !isVendorId,
  });

  const {
    data: vendorByUser,
    isLoading: isVendorUserLoading,
    error: vendorUserError,
  } = useGetVendorByVendorUserIdQuery(validVendorId, {
    skip: !vendorId || isVendorId,
  });

  if (isVendorLoading || isVendorUserLoading) return <span>Loading...</span>;
  if (vendorError || vendorUserError) return <span>Error</span>;

  const name = isVendorId ? vendor?.name : vendorByUser?.name;

  return <span>{name || "Unknown Vendor"}</span>;
};

export default VendorName;
