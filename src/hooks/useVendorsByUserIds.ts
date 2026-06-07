import { useEffect, useMemo } from "react";
import { useDispatch, useSelector, shallowEqual } from "react-redux";
import { AppDispatch, RootState } from "../store/store";
import { vendorsApi } from "../features/api/vendorsApi";
import { Vendor } from "../types";

/**
 * Fetches a specific set of vendors by their vendor_user_id values.
 * Avoids useGetVendorsQuery (all vendors) by dispatching targeted
 * per-vendor queries whose results RTK Query deduplicates and caches.
 */
export function useVendorsByUserIds(vendorUserIds: (number | string)[] | undefined) {
  const dispatch = useDispatch<AppDispatch>();

  const idsKey = (vendorUserIds ?? []).join(",");
  const ids = useMemo(() => (vendorUserIds ?? []).map(String), [idsKey]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (ids.length === 0) return;
    ids.forEach((id) => {
      dispatch(vendorsApi.endpoints.getVendorByVendorUserId.initiate(id));
    });
  }, [idsKey, dispatch]); // eslint-disable-line react-hooks/exhaustive-deps

  const vendorsSelector = useMemo(
    () =>
      (state: RootState): Vendor[] => {
        if (ids.length === 0) return [];
        const result: Vendor[] = [];
        ids.forEach((id) => {
          const entry = vendorsApi.endpoints.getVendorByVendorUserId.select(id)(state);
          if (entry.data) result.push(entry.data);
        });
        return result;
      },
    [idsKey] // eslint-disable-line react-hooks/exhaustive-deps
  );

  return useSelector(vendorsSelector, shallowEqual);
}
