import { useSelector } from "react-redux";
import { RootState } from "@inspectly/shared";

export function useAuth() {
  const { authenticated, user, loading } = useSelector(
    (state: RootState) => state.auth
  );
  return { authenticated, user, loading };
}
