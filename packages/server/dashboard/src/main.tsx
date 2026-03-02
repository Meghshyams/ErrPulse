import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Layout } from "./components/Layout";
import { ProjectProvider } from "./context/ProjectContext";
import { OverviewPage } from "./pages/OverviewPage";
import { ErrorsPage } from "./pages/ErrorsPage";
import { ErrorDetailPage } from "./pages/ErrorDetailPage";
import { RequestsPage } from "./pages/RequestsPage";
import "./app.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <ProjectProvider>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<OverviewPage />} />
            <Route path="/errors" element={<ErrorsPage />} />
            <Route path="/errors/:id" element={<ErrorDetailPage />} />
            <Route path="/requests" element={<RequestsPage />} />
          </Route>
        </Routes>
      </ProjectProvider>
    </BrowserRouter>
  </StrictMode>
);
