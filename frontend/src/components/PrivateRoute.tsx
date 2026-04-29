import { Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { RootState } from "../store/store";

const PrivateRoute = ({ element }: { element: JSX.Element }) => {
  const authenticated = useSelector(
    (state: RootState) => state.auth.authenticated
  );

  return authenticated ? element : <Navigate to="/login" />;
};

export default PrivateRoute;
