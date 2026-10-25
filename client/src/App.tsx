import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './app/AuthProvider';
import { ProtectedRoute } from './app/ProtectedRoute';
import DashboardPage from './pages/DashboardPage';
import LeadDetailsPage from './pages/LeadDetailsPage';
import KanbanPage from './pages/KanbanPage';
import ProposalBuilderPage from './pages/ProposalBuilderPage';
import NoWebsitePage from './pages/NoWebsitePage';
import LoginPage from './pages/LoginPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route element={<ProtectedRoute />}>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/lead/:id" element={<LeadDetailsPage />} />
              <Route path="/no-website" element={<NoWebsitePage />} />
              <Route path="/crm" element={<KanbanPage />} />
              <Route path="/proposal/:id" element={<ProposalBuilderPage />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
