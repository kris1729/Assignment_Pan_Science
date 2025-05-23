import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './store';
import Login from './pages/Login';
import Register from './pages/Register';
import TaskList from './pages/TaskList';
import TaskForm from './pages/TaskForm';
import TaskDetails from './pages/TaskDetails';
import AdminPanel from './pages/AdminPanel';
import PrivateRoute from './components/PrivateRoute';
import Navbar from './components/Navbar';

function App() {
  return (
    <Provider store={store}>
      <Router>
        <div className="min-h-screen bg-gray-100">
          <Navbar />
          <div className="container mx-auto px-4 py-8">
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route
                path="/tasks"
                element={
                  <PrivateRoute>
                    <TaskList />
                  </PrivateRoute>
                }
              />
              <Route
                path="/tasks/new"
                element={
                  <PrivateRoute>
                    <TaskForm />
                  </PrivateRoute>
                }
              />
              <Route
                path="/tasks/:id"
                element={
                  <PrivateRoute>
                    <TaskDetails />
                  </PrivateRoute>
                }
              />
              <Route
                path="/tasks/:id/edit"
                element={
                  <PrivateRoute>
                    <TaskForm />
                  </PrivateRoute>
                }
              />
              <Route
                path="/admin"
                element={
                  <PrivateRoute adminOnly>
                    <AdminPanel />
                  </PrivateRoute>
                }
              />
              <Route path="/" element={<Navigate to="/tasks" replace />} />
            </Routes>
          </div>
        </div>
      </Router>
    </Provider>
  );
}

export default App; 