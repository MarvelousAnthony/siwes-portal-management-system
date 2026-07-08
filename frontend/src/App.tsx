import { AuthProvider, useAuth } from "./context/AuthContext";
import { Login } from "./components/Login";
import { StudentDashboard } from "./dashboards/StudentDashboard";
import { IndustryDashboard } from "./dashboards/IndustryDashboard";
import { InstitutionalDashboard } from "./dashboards/InstitutionalDashboard";

const DashboardRouter = () => {
  const { user } = useAuth();

  if (!user) {
    return <Login />;
  }

  switch (user.role) {
    case "STUDENT":
      return <StudentDashboard />;
    case "INDUSTRY_SUPERVISOR":
      return <IndustryDashboard />;
    case "INSTITUTIONAL_SUPERVISOR":
      return <InstitutionalDashboard />;
    default:
      return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center gap-4">
          <h2 className="text-2xl font-black text-slate-100">Access Restricted</h2>
          <p className="text-sm text-slate-400">Your role "{user.role}" does not have a dedicated dashboard.</p>
        </div>
      );
  }
};

function App() {
  return (
    <AuthProvider>
      <DashboardRouter />
    </AuthProvider>
  );
}

export default App;
