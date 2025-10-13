import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Agenda from "./pages/Agenda";
import FollowUp from "./pages/FollowUp";
import Assistant from "./pages/Assistant";
import Patients from "./pages/Patients";
import PrePatients from "./pages/PrePatients";
import Convenios from "./pages/Convenios";
import WhatsApp from "./pages/WhatsApp";
import Teleconsulta from "./pages/Teleconsulta";
import Connections from "./pages/Connections";
import Integration from "./pages/Integration";
import Users from "./pages/Users";
import DoctorSchedule from "./pages/DoctorSchedule";
import NotFound from "./pages/NotFound";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";

const App = () => (
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/agenda" element={<Agenda />} />
      <Route path="/follow-up" element={<FollowUp />} />
      <Route path="/assistant" element={<Assistant />} />
      <Route path="/patients" element={<Patients />} />
      <Route path="/pre-patients" element={<PrePatients />} />
      <Route path="/convenios" element={<Convenios />} />
      <Route path="/whatsapp" element={<WhatsApp />} />
      <Route path="/teleconsulta" element={<Teleconsulta />} />
      <Route path="/connections" element={<Connections />} />
      <Route path="/integration" element={<Integration />} />
      <Route path="/users" element={<Users />} />
      <Route path="/users/:doctorId/schedule" element={<DoctorSchedule />} />
      {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  </BrowserRouter>
);

export default App;
