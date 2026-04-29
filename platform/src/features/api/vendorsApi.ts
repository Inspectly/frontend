const BASE_URL = "https://inspectlyai.up.railway.app/api/v0";

export interface Vendor {
  id: number;
  vendor_user_id: number;
  vendor_type: string;
  vendor_types: string;
  code: string;
  license: string;
  verified: boolean;
  name: string;
  company_name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  country: string;
  postal_code: string;
  profile_image_url: string;
  rating: string;
  review: string;
  created_at: string;
  updated_at: string;
}

export const createVendor = async (data: {
  vendor_user_id: number;
  vendor_types: string;
  name: string;
  company_name: string;
  email: string;
  phone: string;
  city: string;
  state: string;
  country: string;
}): Promise<Vendor> => {
  const res = await fetch(`${BASE_URL}/vendors/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Failed to create vendor (${res.status}): ${body}`);
  }
  return res.json();
};
