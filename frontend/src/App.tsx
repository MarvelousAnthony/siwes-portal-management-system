import { AuthProvider, useAuth } from "./context/AuthContext";
import { Login } from "./components/Login";
import { StudentDashboard } from "./dashboards/StudentDashboard";
import { IndustryDashboard } from "./dashboards/IndustryDashboard";
import { InstitutionalDashboard } from "./dashboards/InstitutionalDashboard";
import { LogOut } from "lucide-react";

const LogoutConfirmModal = () => {
  const { showLogoutConfirm, setShowLogoutConfirm, confirmLogout } = useAuth();

  if (!showLogoutConfirm) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-800 max-w-sm w-full rounded-2xl p-6 shadow-2xl flex flex-col items-center text-center gap-4">
        <div className="w-12 h-12 rounded-full bg-rose-950/60 border border-rose-900/60 text-rose-500 flex items-center justify-center">
          <LogOut className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-base font-bold text-slate-200">Confirm Log Out</h3>
          <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
            Are you sure you want to end your SIWES session? You will need to enter your credentials to log in again.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3 w-full mt-2">
          <button
            onClick={() => setShowLogoutConfirm(false)}
            className="px-4 py-2.5 bg-slate-950 border border-slate-800 hover:bg-slate-900 text-slate-350 hover:text-slate-100 font-bold text-xs rounded-xl transition-all duration-150 active:scale-98 cursor-pointer"
          >
            No
          </button>
          <button
            onClick={confirmLogout}
            className="px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl transition-all duration-150 shadow-md shadow-rose-500/10 active:scale-98 cursor-pointer"
          >
            Yes
          </button>
        </div>
      </div>
    </div>
  );
};

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
      <LogoutConfirmModal />
    </AuthProvider>
  );
}

export default App;
