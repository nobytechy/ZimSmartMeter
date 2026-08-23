import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Route, Routes } from "react-router";
import RequireAuth from "./features/auth/RequireAuth";
import { SessionProvider } from "./features/auth/SessionProvider";
import AppShell from "./layouts/AppShell";
import AddMeter from "./pages/AddMeter";
import Dashboard from "./pages/Dashboard";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import "./styles/index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <SessionProvider>
      <BrowserRouter>
        <Routes>
          <Route index element={<Landing />} />
          <Route element={<AppShell />}>
            <Route path="login" element={<Login />} />
            <Route element={<RequireAuth />}>
              <Route path="app" element={<Dashboard />} />
              <Route path="app/meters/new" element={<AddMeter />} />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </SessionProvider>
  </StrictMode>,
);
