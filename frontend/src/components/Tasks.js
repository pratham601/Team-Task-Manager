import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Plus, Filter, Calendar, MessageCircle } from 'lucide-react';

const API_URL = 'https://team-task-manager-production-1669.up.railway.app/api';

function Tasks() {
    const [tasks, setTasks] = useState([]);
    const [projects, setProjects] = useState([]);
    const [users, setUsers] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [showComments, setShowComments] = useState(null);
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [filters, setFilters] = useState({ status: 'all', priority: 'all', assignedTo: 'all' });
    const [newTask, setNewTask] = useState({
        title: '',
        description: '',
        projectId: '',
        assignedTo: '',
        priority: 'medium',
        deadline: ''
    });
    const [loading, setLoading] = useState(true);

useEffect(() => {
    fetchData();
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
}, [filters]);

    const fetchData = async () => {
        try {
            const token = localStorage.getItem('token');
            const queryParams = new URLSearchParams(filters).toString();
            const [tasksRes, projectsRes] = await Promise.all([
                axios.get(`${API_URL}/tasks?${queryParams}`, { headers: { Authorization: `Bearer ${token}` } }),
                axios.get(`${API_URL}/projects`, { headers: { Authorization: `Bearer ${token}` } })
            ]);
            setTasks(tasksRes.data);
            setProjects(projectsRes.data);
        } catch (error) {
            toast.error('Failed to fetch data');
        } finally {
            setLoading(false);
        }
    };

    const fetchUsers = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_URL}/users`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setUsers(response.data);
        } catch (error) {
            console.error('Failed to fetch users:', error);
        }
    };

    const fetchComments = async (taskId) => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_URL}/tasks/${taskId}/comments`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setComments(response.data);
        } catch (error) {
            console.error('Failed to fetch comments:', error);
        }
    };

    const addComment = async (taskId) => {
        if (!newComment.trim()) return;
        try {
            const token = localStorage.getItem('token');
            await axios.post(`${API_URL}/tasks/${taskId}/comments`, { text: newComment }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success('Comment added');
            setNewComment('');
            fetchComments(taskId);
        } catch (error) {
            toast.error('Failed to add comment');
        }
    };

    const updateTaskStatus = async (taskId, newStatus) => {
        try {
            const token = localStorage.getItem('token');
            await axios.patch(`${API_URL}/tasks/${taskId}/status`, { status: newStatus }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success('Task updated');
            fetchData();
        } catch (error) {
            toast.error('Failed to update task');
        }
    };

    const createTask = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            await axios.post(`${API_URL}/tasks`, newTask, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success('Task created');
            setShowModal(false);
            setNewTask({ title: '', description: '', projectId: '', assignedTo: '', priority: 'medium', deadline: '' });
            fetchData();
        } catch (error) {
            toast.error('Failed to create task');
        }
    };

    const getPriorityColor = (priority) => {
        switch(priority) {
            case 'high': return 'bg-red-100 text-red-800';
            case 'medium': return 'bg-yellow-100 text-yellow-800';
            case 'low': return 'bg-green-100 text-green-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getStatusColor = (status) => {
        switch(status) {
            case 'done': return 'bg-green-100 text-green-800';
            case 'in-progress': return 'bg-blue-100 text-blue-800';
            default: return 'bg-yellow-100 text-yellow-800';
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-96">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <div className="bg-gray-50 min-h-screen">
            <div className="max-w-7xl mx-auto px-4 py-8">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Tasks</h1>
                        <p className="text-gray-600 mt-2">Manage and track your tasks</p>
                    </div>
                    <button
                        onClick={() => setShowModal(true)}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700"
                    >
                        <Plus className="w-5 h-5" />
                        New Task
                    </button>
                </div>

                <div className="bg-white rounded-lg shadow p-4 mb-6">
                    <div className="flex items-center gap-4 flex-wrap">
                        <Filter className="w-5 h-5 text-gray-500" />
                        <select
                            value={filters.status}
                            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                            className="px-3 py-1 border rounded-lg"
                        >
                            <option value="all">All Status</option>
                            <option value="todo">To Do</option>
                            <option value="in-progress">In Progress</option>
                            <option value="done">Done</option>
                        </select>
                        <select
                            value={filters.priority}
                            onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
                            className="px-3 py-1 border rounded-lg"
                        >
                            <option value="all">All Priority</option>
                            <option value="high">High</option>
                            <option value="medium">Medium</option>
                            <option value="low">Low</option>
                        </select>
                        <select
                            value={filters.assignedTo}
                            onChange={(e) => setFilters({ ...filters, assignedTo: e.target.value })}
                            className="px-3 py-1 border rounded-lg"
                        >
                            <option value="all">All Members</option>
                            {users.map(user => (
                                <option key={user.id} value={user.id}>{user.name}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="space-y-4">
                    {tasks.map(task => (
                        <div key={task.id} className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition">
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <h3 className="text-lg font-semibold">{task.title}</h3>
                                        <span className={`px-2 py-1 text-xs rounded-full ${getPriorityColor(task.priority)}`}>
                                            {task.priority}
                                        </span>
                                        {task.isOverdue && (
                                            <span className="bg-red-100 text-red-800 px-2 py-1 text-xs rounded-full">
                                                Overdue!
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-gray-600 mb-2">{task.description}</p>
                                    <div className="flex gap-4 text-sm text-gray-500">
                                        <span>Project: {task.projectName}</span>
                                        {task.deadline && (
                                            <span className="flex items-center gap-1">
                                                <Calendar className="w-4 h-4" />
                                                Due: {new Date(task.deadline).toLocaleDateString()}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div className="flex flex-col items-end gap-2">
                                    <select
                                        value={task.status}
                                        onChange={(e) => updateTaskStatus(task.id, e.target.value)}
                                        className={`px-3 py-1 rounded-lg text-sm font-medium border ${getStatusColor(task.status)}`}
                                    >
                                        <option value="todo">To Do</option>
                                        <option value="in-progress">In Progress</option>
                                        <option value="done">Done</option>
                                    </select>
                                    <button
                                        onClick={() => {
                                            setShowComments(task.id);
                                            fetchComments(task.id);
                                        }}
                                        className="text-blue-600 hover:text-blue-800 flex items-center gap-1 text-sm"
                                    >
                                        <MessageCircle className="w-4 h-4" />
                                        Comments
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {tasks.length === 0 && (
                    <div className="text-center py-12">
                        <p className="text-gray-500">No tasks found</p>
                    </div>
                )}
            </div>

            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-6 w-full max-w-md">
                        <h2 className="text-xl font-bold mb-4">Create Task</h2>
                        <form onSubmit={createTask}>
                            <input
                                type="text"
                                placeholder="Task Title"
                                value={newTask.title}
                                onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                                className="w-full px-4 py-2 border rounded-lg mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                required
                            />
                            <textarea
                                placeholder="Description"
                                value={newTask.description}
                                onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                                className="w-full px-4 py-2 border rounded-lg mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                rows="3"
                            />
                            <select
                                value={newTask.projectId}
                                onChange={(e) => setNewTask({ ...newTask, projectId: e.target.value })}
                                className="w-full px-4 py-2 border rounded-lg mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                required
                            >
                                <option value="">Select Project</option>
                                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                            <select
                                value={newTask.assignedTo}
                                onChange={(e) => setNewTask({ ...newTask, assignedTo: e.target.value })}
                                className="w-full px-4 py-2 border rounded-lg mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                required
                            >
                                <option value="">Assign to</option>
                                {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                            </select>
                            <select
                                value={newTask.priority}
                                onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
                                className="w-full px-4 py-2 border rounded-lg mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="low">Low Priority</option>
                                <option value="medium">Medium Priority</option>
                                <option value="high">High Priority</option>
                            </select>
                            <input
                                type="date"
                                value={newTask.deadline}
                                onChange={(e) => setNewTask({ ...newTask, deadline: e.target.value })}
                                className="w-full px-4 py-2 border rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700">
                                Create Task
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {showComments && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-6 w-full max-w-md">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold">Comments</h2>
                            <button onClick={() => setShowComments(null)} className="text-gray-500 hover:text-gray-700">✕</button>
                        </div>
                        <div className="max-h-96 overflow-y-auto mb-4 space-y-3">
                            {comments.map(comment => (
                                <div key={comment.id} className="bg-gray-50 p-3 rounded-lg">
                                    <p className="text-sm">{comment.text}</p>
                                    <p className="text-xs text-gray-500 mt-1">
                                        {new Date(comment.createdAt).toLocaleString()}
                                    </p>
                                </div>
                            ))}
                        </div>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                                placeholder="Add a comment..."
                                className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <button
                                onClick={() => addComment(showComments)}
                                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                            >
                                Send
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Tasks;