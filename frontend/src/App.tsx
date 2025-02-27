import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import './App.css';

// Layout components
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';

// Pages
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Register from './pages/Register';
import WorkoutsList from './pages/WorkoutsList';
import WorkoutDetail from './pages/WorkoutDetail';
import CreateWorkout from './pages/CreateWorkout';
import WorkoutProgramsList from './pages/WorkoutProgramsList';
import WorkoutProgramDetail from './pages/WorkoutProgramDetail';
import WorkoutProgramCreate from './pages/WorkoutProgramCreate';
import WorkoutTemplatesList from './pages/WorkoutTemplatesList';
import WorkoutTemplateDetail from './pages/WorkoutTemplateDetail';
import WorkoutTemplateCreate from './pages/WorkoutTemplateCreate';
import Profile from './pages/Profile';
import NotFound from './pages/NotFound';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <div className="flex flex-col min-h-screen bg-gray-50">
          <Navbar />
          <main className="flex-grow container mx-auto px-4 py-8">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/workouts/create" element={<CreateWorkout />} />
              <Route path="/workouts/:id" element={<WorkoutDetail />} />
              <Route path="/workouts" element={<WorkoutsList />} />
              <Route path="/programs" element={<WorkoutProgramsList />} />
              <Route path="/programs/create" element={<WorkoutProgramCreate />} />
              <Route path="/programs/:id" element={<WorkoutProgramDetail />} />
              <Route path="/programs/:id/edit" element={<WorkoutProgramCreate />} />
              <Route path="/templates/create" element={<WorkoutTemplateCreate />} />
              <Route path="/templates/:id/edit" element={<WorkoutTemplateCreate />} />
              <Route path="/templates/:id" element={<WorkoutTemplateDetail />} />
              <Route path="/templates" element={<WorkoutTemplatesList />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
