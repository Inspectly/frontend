const BASE_URL = "https://inspectlyai.up.railway.app/api/v0";

export interface UserSession {
  id: number;
  user_id: number;
  login: string;
  login_time: string;
  authentication_code: string;
  logout_time: string;
}

export const createUserSession = async (data: {
  user_id: number;
  login: string;
  login_time: string;
  authentication_code: string;
}): Promise<UserSession> => {
  const res = await fetch(`${BASE_URL}/user_sessions/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const body = await res.text();
    if (body.includes("duplicate key") || res.status === 409) {
      return null as unknown as UserSession;
    }
    throw new Error(`Failed to create session (${res.status}): ${body}`);
  }
  return res.json();
};

export const getUserSessionByUserId = async (
  userId: number
): Promise<UserSession> => {
  const res = await fetch(`${BASE_URL}/user_sessions/user/${userId}`);
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Failed to get session (${res.status}): ${body}`);
  }
  return res.json();
};
