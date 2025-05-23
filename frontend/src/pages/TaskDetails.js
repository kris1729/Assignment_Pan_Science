import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { fetchTasks } from '../store/slices/taskSlice';

const TaskDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { tasks, loading, error } = useSelector((state) => state.tasks);
  const { user } = useSelector((state) => state.auth);

  useEffect(() => {
    dispatch(fetchTasks());
  }, [dispatch]);

  const task = tasks.find((t) => t._id === id);

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

  if (!task) {
    return (
      <div className="text-center text-gray-500">
        Task not found
      </div>
    );
  }

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

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-start mb-6">
          <h1 className="text-3xl font-bold text-gray-900">{task.title}</h1>
          <div className="flex space-x-2">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(task.status)}`}>
              {task.status}
            </span>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getPriorityColor(task.priority)}`}>
              {task.priority}
            </span>
          </div>
        </div>

        <div className="prose max-w-none mb-6">
          <p className="text-gray-600">{task.description}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Details</h2>
            <dl className="space-y-2">
              <div>
                <dt className="text-sm font-medium text-gray-500">Due Date</dt>
                <dd className="text-sm text-gray-900">
                  {new Date(task.dueDate).toLocaleDateString()}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Assigned To</dt>
                <dd className="text-sm text-gray-900">{task.assignedTo?.email}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Created By</dt>
                <dd className="text-sm text-gray-900">{task.createdBy?.email}</dd>
              </div>
            </dl>
          </div>

          {task.documents && task.documents.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Documents</h2>
              <ul className="space-y-2">
                {task.documents.map((doc, index) => (
                  <li key={index} className="flex items-center space-x-2">
                    <svg
                      className="h-5 w-5 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                      />
                    </svg>
                    <a
                      href={`${process.env.REACT_APP_API_URL}/uploads/${doc.filename}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-600 hover:text-indigo-800"
                    >
                      {doc.filename}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="flex justify-end space-x-4">
          <button
            onClick={() => navigate('/tasks')}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Back to Tasks
          </button>
          {(user?.role === 'admin' || task.createdBy?._id === user?._id) && (
            <button
              onClick={() => navigate(`/tasks/${task._id}/edit`)}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              Edit Task
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default TaskDetails;