import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import App from "./AdminPage";
import "../index.css";

const ProtectedRoute = () => {
  const queryClient = new QueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  );
};

export default ProtectedRoute;
