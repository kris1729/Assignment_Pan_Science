import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const AdminPanel = () => {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const usersPerPage = 10;

  useEffect(() => {
    // Check if user is admin
    if (!user || user.role !== 'admin') {
      navigate('/tasks');
      return;
    }
    fetchUsers();
  }, [user, navigate]);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('No authentication token found');
        setLoading(false);
        return;
      }

      const response = await axios.get(`${API_URL}/users`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setUsers(response.data);
      setLoading(false);
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to fetch users');
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('No authentication token found');
        return;
      }

      await axios.put(
        `${API_URL}/users/${userId}`,
        { role: newRole },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setUsers(users.map(user => 
        user._id === userId ? { ...user, role: newRole } : user
      ));
      setEditingUser(null);
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to update user role');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('No authentication token found');
        return;
      }

      await axios.delete(`${API_URL}/users/${userId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setUsers(users.filter(user => user._id !== userId));
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to delete user');
    }
  };

  const filteredUsers = users.filter(user =>
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
        <div className="w-64">
          <input
            type="text"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-md">
          {error}
        </div>
      )}

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Role
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {currentUsers.map((user) => (
              <tr key={user._id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {user.email}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {editingUser === user._id ? (
                    <select
                      value={user.role}
                      onChange={(e) => handleRoleChange(user._id, e.target.value)}
                      className="text-sm border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="user">User</option>
                      <option value="admin">Admin</option>
                    </select>
                  ) : (
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-green-100 text-green-800'
                    }`}>
                      {user.role}
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button
                    onClick={() => setEditingUser(editingUser === user._id ? null : user._id)}
                    className="text-indigo-600 hover:text-indigo-900 mr-4"
                  >
                    {editingUser === user._id ? 'Cancel' : 'Edit'}
                  </button>
                  <button
                    onClick={() => handleDeleteUser(user._id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="mt-4 flex justify-center">
          <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
            >
              Previous
            </button>
            {[...Array(totalPages)].map((_, index) => (
              <button
                key={index + 1}
                onClick={() => setCurrentPage(index + 1)}
                className={`relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium ${
                  currentPage === index + 1
                    ? 'text-indigo-600 bg-indigo-50'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                {index + 1}
              </button>
            ))}
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
            >
              Next
            </button>
          </nav>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;