import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import { createTask, updateTask } from '../store/slices/taskSlice';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const TaskForm = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { tasks, loading, error } = useSelector((state) => state.tasks);
  const { user: currentUser } = useSelector((state) => state.auth);
  const [users, setUsers] = useState([]);
  const [fetchError, setFetchError] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'pending',
    priority: 'medium',
    dueDate: '',
    assignedTo: '',
  });

  const [files, setFiles] = useState([]);
  const [fileError, setFileError] = useState('');

  useEffect(() => {
    // Redirect if not authenticated
    if (!currentUser) {
      navigate('/login');
      return;
    }

    // Fetch users for the assignedTo dropdown
    const fetchUsers = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setFetchError('No authentication token found');
          return;
        }

        // If user is not admin, only show themselves in the dropdown
        if (currentUser.role !== 'admin') {
          setUsers([currentUser]);
          // Set assignedTo to current user's ID
          setFormData(prev => ({ ...prev, assignedTo: currentUser._id }));
        } else {
          const response = await axios.get(`${API_URL}/users`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          setUsers(response.data);
        }
      } catch (error) {
        console.error('Error fetching users:', error);
        setFetchError(error.response?.data?.error || 'Failed to fetch users');
      }
    };

    fetchUsers();

    if (id) {
      const task = tasks.find((t) => t._id === id);
      if (task) {
        // Check if user has permission to edit this task
        if (currentUser.role !== 'admin' && task.createdBy?._id !== currentUser._id) {
          navigate('/tasks');
          return;
        }

        setFormData({
          title: task.title,
          description: task.description,
          status: task.status,
          priority: task.priority,
          dueDate: new Date(task.dueDate).toISOString().split('T')[0],
          assignedTo: task.assignedTo?._id || '',
        });
      }
    }
  }, [id, tasks, currentUser, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    setFileError('');

    // Check number of files
    if (selectedFiles.length > 3) {
      setFileError('You can only upload up to 3 files');
      e.target.value = ''; // Clear the input
      return;
    }

    // Check file types
    const invalidFiles = selectedFiles.filter(
      (file) => file.type !== 'application/pdf'
    );
    if (invalidFiles.length > 0) {
      setFileError('Only PDF files are allowed');
      e.target.value = ''; // Clear the input
      return;
    }

    // Check file sizes
    const oversizedFiles = selectedFiles.filter(
      (file) => file.size > 5 * 1024 * 1024 // 5MB
    );
    if (oversizedFiles.length > 0) {
      setFileError('Each file must be less than 5MB');
      e.target.value = ''; // Clear the input
      return;
    }

    setFiles(selectedFiles);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFetchError('');

    // Check if user is authenticated
    if (!currentUser) {
      setFetchError('You must be logged in to create or edit tasks');
      return;
    }
    
    // For regular users, ensure assignedTo is set to their own ID
    if (currentUser.role !== 'admin') {
      formData.assignedTo = currentUser._id;
    }

    if (!formData.assignedTo) {
      setFetchError('Please select a user to assign the task to');
      return;
    }

    const formDataToSend = new FormData();

    // Append all form fields
    Object.keys(formData).forEach((key) => {
      if (formData[key]) {
        formDataToSend.append(key, formData[key]);
      }
    });

    // Append files
    files.forEach((file) => {
      formDataToSend.append('documents', file);
    });

    try {
      if (id) {
        await dispatch(updateTask({ id, taskData: formDataToSend })).unwrap();
      } else {
        await dispatch(createTask(formDataToSend)).unwrap();
      }
      navigate('/tasks');
    } catch (error) {
      console.error('Error submitting task:', error);
      setFetchError(error.message || 'Failed to create task');
    }
  };

  // If not authenticated, don't render the form
  if (!currentUser) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">
          {id ? 'Edit Task' : 'Create Task'}
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label
              htmlFor="title"
              className="block text-sm font-medium text-gray-700"
            >
              Title
            </label>
            <input
              type="text"
              id="title"
              name="title"
              required
              value={formData.title}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label
              htmlFor="description"
              className="block text-sm font-medium text-gray-700"
            >
              Description
            </label>
            <textarea
              id="description"
              name="description"
              required
              rows="4"
              value={formData.description}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label
                htmlFor="status"
                className="block text-sm font-medium text-gray-700"
              >
                Status
              </label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              >
                <option value="pending">Pending</option>
                <option value="in-progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="priority"
                className="block text-sm font-medium text-gray-700"
              >
                Priority
              </label>
              <select
                id="priority"
                name="priority"
                value={formData.priority}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>

          <div>
            <label
              htmlFor="dueDate"
              className="block text-sm font-medium text-gray-700"
            >
              Due Date
            </label>
            <input
              type="date"
              id="dueDate"
              name="dueDate"
              required
              value={formData.dueDate}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label
              htmlFor="assignedTo"
              className="block text-sm font-medium text-gray-700"
            >
              Assign To
            </label>
            <select
              id="assignedTo"
              name="assignedTo"
              required
              value={formData.assignedTo}
              onChange={handleChange}
              disabled={currentUser.role !== 'admin'}
              className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 ${
                currentUser.role !== 'admin' ? 'bg-gray-100' : ''
              }`}
            >
              <option value="">Select a user</option>
              {users.map((user) => (
                <option key={user._id} value={user._id}>
                  {user.email}
                </option>
              ))}
            </select>
            {currentUser.role !== 'admin' && (
              <p className="mt-1 text-sm text-gray-500">
                Regular users can only assign tasks to themselves
              </p>
            )}
            {fetchError && (
              <p className="mt-1 text-sm text-red-600">{fetchError}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="documents"
              className="block text-sm font-medium text-gray-700"
            >
              Documents (PDF only, max 3 files)
            </label>
            <input
              type="file"
              id="documents"
              name="documents"
              multiple
              accept=".pdf"
              onChange={handleFileChange}
              className="mt-1 block w-full"
            />
            {fileError && (
              <p className="mt-1 text-sm text-red-600">{fileError}</p>
            )}
          </div>

          {error && (
            <div className="text-red-500 text-sm text-center">{error}</div>
          )}

          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => navigate('/tasks')}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {loading
                ? id
                  ? 'Updating...'
                  : 'Creating...'
                : id
                ? 'Update Task'
                : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TaskForm; 