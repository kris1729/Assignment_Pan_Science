import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { fetchTasks, deleteTask, updateTask } from '../store/slices/taskSlice';

const TaskList = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { tasks, loading, error } = useSelector((state) => state.tasks);
  const { user } = useSelector((state) => state.auth);
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    dispatch(fetchTasks());
  }, [dispatch]);

  const filteredTasks = tasks.filter((task) => {
    // Regular users can see tasks they created or are assigned to
    const hasPermission = user?.role === 'admin' || 
                         task.createdBy?._id === user?._id || 
                         task.assignedTo?._id === user?._id;
    
    if (!hasPermission) return false;

    const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;
    const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         task.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesStatus && matchesPriority && matchesSearch;
  });

  const handleDelete = async (taskId, e) => {
    e.preventDefault(); // Prevent navigation
    if (window.confirm('Are you sure you want to delete this task?')) {
      try {
        await dispatch(deleteTask(taskId)).unwrap();
      } catch (error) {
        console.error('Failed to delete task:', error);
      }
    }
  };

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      const formData = new FormData();
      formData.append('status', newStatus);
      await dispatch(updateTask({ id: taskId, taskData: formData })).unwrap();
    } catch (error) {
      console.error('Failed to update task status:', error);
    }
  };

  const canEditTask = (task) => {
    return user?.role === 'admin' || task.createdBy?._id === user?._id;
  };

  const canDeleteTask = (task) => {
    return user?.role === 'admin' || task.createdBy?._id === user?._id;
  };

  const canUpdateStatus = (task) => {
    return user?.role === 'admin' || 
           task.createdBy?._id === user?._id || 
           task.assignedTo?._id === user?._id;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'in-progress':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-orange-100 text-orange-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-500 text-center">
        Error: {error}
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Tasks</h1>
        <Link
          to="/tasks/new"
          className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
        >
          Create Task
        </Link>
      </div>

      <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Status</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          >
            <option value="all">All</option>
            <option value="pending">Pending</option>
            <option value="in-progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Priority</label>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          >
            <option value="all">All</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Search</label>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search tasks..."
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTasks.map((task) => (
          <div key={task._id} className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-xl font-semibold text-gray-900">{task.title}</h2>
                {canUpdateStatus(task) ? (
                  <select
                    value={task.status}
                    onChange={(e) => handleStatusChange(task._id, e.target.value)}
                    className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}
                  >
                    <option value="pending">Pending</option>
                    <option value="in-progress">In Progress</option>
                    <option value="completed">Completed</option>
                  </select>
                ) : (
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
                    {task.status}
                  </span>
                )}
              </div>
              <p className="text-gray-600 mb-4 line-clamp-2">{task.description}</p>
              <div className="flex justify-between items-center mb-4">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                  {task.priority}
                </span>
                <span className="text-sm text-gray-500">
                  Due: {new Date(task.dueDate).toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-500">
                  <p>Assigned to: {task.assignedTo?.email}</p>
                  <p>Created by: {task.createdBy?.email}</p>
                </div>
                <div className="flex space-x-2">
                  <Link
                    to={`/tasks/${task._id}`}
                    className="text-indigo-600 hover:text-indigo-800"
                  >
                    View
                  </Link>
                  {canEditTask(task) && (
                    <Link
                      to={`/tasks/${task._id}/edit`}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      Edit
                    </Link>
                  )}
                  {canDeleteTask(task) && (
                    <button
                      onClick={(e) => handleDelete(task._id, e)}
                      className="text-red-600 hover:text-red-800"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredTasks.length === 0 && (
        <div className="text-center text-gray-500 mt-8">
          No tasks found matching your filters.
        </div>
      )}
    </div>
  );
};

export default TaskList;