import React, { useState } from "react";
import {
  useGetVendorByIdQuery,
  useGetVendorByVendorUserIdQuery,
} from "../features/api/vendorsApi";
import VendorModal from "./VendorModal";

const VendorName: React.FC<{
  vendorId: number;
  isVendorId?: boolean;
  showRating?: boolean;
}> = ({ vendorId, isVendorId = true, showRating = false }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

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

  const currentVendor = isVendorId ? vendor : vendorByUser;
  const name = currentVendor?.name;
  const rating = currentVendor?.rating;

  const displayName = showRating && rating ? `${name} (★ ${rating})` : name;

  return (
    <>
      <span
        onClick={() => setIsModalOpen(true)}
        className="cursor-pointer text-blue-600 hover:underline"
      >
        {displayName || "Unknown Vendor"}
      </span>
      {isModalOpen && currentVendor && (
        <VendorModal
          vendor={currentVendor}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </>
  );
};

export default VendorName;
