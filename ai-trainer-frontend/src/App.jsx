
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import HomePage from "./pages/Homepage/Homepage";
import AuthPage from "./pages/AuthPage/AuthPage";
import DashboardPage from "./pages/dashboard/Dashboard"; 
import InterviewDashboard from "./pages/InterviewDashboard/InterviewDashboard";
import PresentationDashboard from "./pages/PresentationDashboard/Presentationdashboard";
import Pricing from "./pages/Pricing/Pricing";
import ChatMessage from "./components/ChatMessage";
import Feedback from "./pages/feedback/Feedback";
import Checkout from "./pages/Pricing/Checkout";
import SettingsPage from "./pages/Settings/SettingsPage";
import NotificationsPage from "./pages/Notifications/Notificationspage";

export default function App() {
  return (
    <Router>
      <Routes>
        {/* Main Pages */}
        <Route path="/" element={<HomePage />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/interview" element={<InterviewDashboard />} />
        <Route path="/presentation" element={<PresentationDashboard />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/notifications" element={<NotificationsPage/>} />
        <Route path="/feedback" element={<Feedback />} />
        
        <Route path="/chat" element={<ChatMessage />} />
      </Routes>
    </Router>
  );
}
