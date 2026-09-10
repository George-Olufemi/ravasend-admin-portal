import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import AdminLayout from "./components/admin/AdminLayout";
import Dashboard from "./pages/admin/Dashboard";
import Users from "./pages/admin/Users";
import PromoCodes from "./pages/admin/PromoCodes";
import NotFound from "./pages/NotFound";
import Fee from "./pages/admin/Fee";
import Transactions from "./pages/admin/Transactions";
import ReferralProgram from "./pages/admin/ReferralProgram";
import Ledger from "./pages/admin/Ledger";
import Audits from "./pages/admin/Audits";
import Events from "./pages/admin/Events";
import WithdrawalControls from "./pages/admin/WithdrawalControls";
import AdminRoles from "./pages/admin/AdminRoles";
import Campaigns from "./pages/admin/Campaigns";
import Segments from "./pages/admin/Segments";
import Competitions from "./pages/admin/Competitions";
import Analytics from "./pages/admin/Analytics";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="users" element={<Users />} />
            <Route path="transaction" element={<Transactions />} />
            <Route path="promocodes" element={<PromoCodes />} />
            <Route path="fee" element={<Fee />} />
            <Route path="referral" element={<ReferralProgram />} />
            <Route path="ledger" element={<Ledger />} />
            <Route path="audits" element={<Audits />} />
            <Route path="withdrawal-control" element={<WithdrawalControls />} />
            <Route path="roles" element={<AdminRoles />} />
            <Route path="campaign" element={<Campaigns />} />
            <Route path="segments" element={<Segments />} />
            <Route path="competitions" element={<Competitions />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
