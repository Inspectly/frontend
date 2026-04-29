const BASE_URL = "https://inspectlyai.up.railway.app/api/v0";

export interface UserLogin {
  id: number;
  user_id: number;
  email_login: boolean;
  email: string;
  phone_login: boolean;
  phone: string;
  gmail_login: boolean;
  gmail: string;
  created_at: string;
  updated_at: string;
}

export const createUserLogin = async (data: {
  user_id: number;
  email_login: boolean;
  email: string;
  phone_login: boolean;
  phone: string;
  gmail_login: boolean;
  gmail: string;
}): Promise<UserLogin> => {
  const res = await fetch(`${BASE_URL}/user_logins/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const body = await res.text();
    if (body.includes("duplicate key") || res.status === 409) {
      return null as unknown as UserLogin;
    }
    throw new Error(`Failed to create login (${res.status}): ${body}`);
  }
  return res.json();
};
