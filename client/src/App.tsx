import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'; // Adicione imports do Router
import DashboardPage from './pages/DashboardPage';
import LeadDetailsPage from './pages/LeadDetailsPage'; 
import KanbanPage from './pages/KanbanPage';

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
          <Route path="*" element={<Navigate to="/" replace />} />
          <Route path="/crm" element={<KanbanPage />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;