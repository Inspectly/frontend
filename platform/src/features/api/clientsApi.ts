const BASE_URL = "https://inspectlyai.up.railway.app/api/v0";

export interface Client {
  id: number;
  user_id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  country: string;
  postal_code: string;
  created_at: string;
  updated_at: string;
}

export const createClient = async (data: {
  user_id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  country: string;
  postal_code: string;
}): Promise<Client> => {
  const res = await fetch(`${BASE_URL}/clients/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Failed to create client (${res.status}): ${body}`);
  }
  return res.json();
};
