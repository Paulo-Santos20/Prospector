import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import DashboardPage from './pages/DashboardPage';
import LeadDetailsPage from './pages/LeadDetailsPage'; 
import KanbanPage from './pages/KanbanPage';
import ProposalBuilderPage from './pages/ProposalBuilderPage';
import NoWebsitePage from './pages/NoWebsitePage';

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
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/lead/:id" element={<LeadDetailsPage />} />
          <Route path="/no-website" element={<NoWebsitePage />} />
          <Route path="/crm" element={<KanbanPage />} />
          <Route path="/proposal/:id" element={<ProposalBuilderPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;