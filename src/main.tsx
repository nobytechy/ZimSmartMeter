import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Route, Routes } from "react-router";
import AppShell from "./layouts/AppShell";
import RequireAuth from "./features/auth/RequireAuth";
import { SessionProvider } from "./features/auth/SessionProvider";
import Landing from "./pages/Landing";
import Dashboard from "./pages/Dashboard";
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
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </SessionProvider>
  </StrictMode>,
);
