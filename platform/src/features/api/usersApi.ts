const BASE_URL = "https://inspectlyai.up.railway.app/api/v0";

export interface BackendUser {
  id: number;
  user_type: string;
  firebase_id: string;
  created_at: string;
  updated_at: string;
}

export const createUser = async (data: {
  firebase_id: string;
  user_type: { user_type: string };
  email: string;
  first_name: string;
  last_name: string;
}): Promise<BackendUser> => {
  const res = await fetch(`${BASE_URL}/users/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Failed to create user (${res.status}): ${body}`);
  }
  return res.json();
};

export const getUserByFirebaseId = async (
  firebaseId: string
): Promise<BackendUser> => {
  const res = await fetch(`${BASE_URL}/users/firebase/${firebaseId}`);
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Failed to get user (${res.status}): ${body}`);
  }
  return res.json();
};
