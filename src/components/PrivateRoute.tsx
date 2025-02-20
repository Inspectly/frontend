import { Navigate } from "react-router-dom";
import { auth } from "../../firebase";

const PrivateRoute = ({ element }: { element: JSX.Element }) => {
  return auth.currentUser && localStorage.getItem("authToken") ? (
    element
  ) : (
    <Navigate to="/login" />
  );
};

export default PrivateRoute;
