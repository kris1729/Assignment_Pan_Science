const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { auth } = require('../middleware/authMiddleware');
const Task = require('../models/Task');

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error('Only PDF files are allowed'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 3 // Maximum 3 files
  }
});

// Get all tasks (filtered by role)
router.get('/', auth, async (req, res) => {
  try {
    let query = {};
    // Regular users can only see their own tasks
    if (req.user.role !== 'admin') {
      query = {
        $or: [
          { createdBy: req.user._id },
          { assignedTo: req.user._id }
        ]
      };
    }

    const tasks = await Task.find(query)
      .populate('assignedTo', 'email')
      .populate('createdBy', 'email');
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new task
router.post('/', auth, upload.array('documents', 3), async (req, res) => {
  try {
    const { title, description, status, priority, dueDate, assignedTo } = req.body;

    // Validate required fields
    if (!title || !description || !dueDate || !assignedTo) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Regular users can only assign tasks to themselves
    if (req.user.role !== 'admin' && assignedTo !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Regular users can only assign tasks to themselves' });
    }

    const taskData = {
      title,
      description,
      status: status || 'pending',
      priority: priority || 'medium',
      dueDate,
      assignedTo,
      createdBy: req.user._id,
      documents: req.files?.map(file => ({
        filename: file.filename,
        path: file.path,
      })) || [],
    };

    const task = new Task(taskData);
    await task.save();
    
    const populatedTask = await Task.findById(task._id)
      .populate('assignedTo', 'email')
      .populate('createdBy', 'email');
    
    res.status(201).json(populatedTask);
  } catch (error) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File size too large. Maximum size is 5MB' });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({ error: 'Too many files. Maximum is 3 files' });
    }
    res.status(400).json({ error: error.message });
  }
});

// Get task by ID (with role-based access)
router.get('/:id', auth, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('assignedTo', 'email')
      .populate('createdBy', 'email');
    
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Regular users can only view their own tasks
    if (req.user.role !== 'admin' && 
        task.createdBy._id.toString() !== req.user._id.toString() && 
        task.assignedTo._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized to view this task' });
    }
    
    res.json(task);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update task (with role-based access)
router.put('/:id', auth, upload.array('documents', 3), async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Check authorization
    if (req.user.role !== 'admin' && task.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized to update this task' });
    }

    // Regular users can't change the assignedTo field
    if (req.user.role !== 'admin' && req.body.assignedTo && req.body.assignedTo !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Regular users can only assign tasks to themselves' });
    }

    const updateData = {
      ...req.body,
      documents: [
        ...(task.documents || []),
        ...(req.files?.map(file => ({
          filename: file.filename,
          path: file.path,
        })) || []),
      ],
    };

    const updatedTask = await Task.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    ).populate('assignedTo', 'email')
     .populate('createdBy', 'email');

    res.json(updatedTask);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete task (with role-based access)
router.delete('/:id', auth, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Only admin or task creator can delete
    if (req.user.role !== 'admin' && task.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized to delete this task' });
    }

    // Use findByIdAndDelete instead of remove
    await Task.findByIdAndDelete(req.params.id);
    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router; 