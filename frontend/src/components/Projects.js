import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Plus, Trash2, Users, UserPlus, X, Send, FolderOpen } from 'lucide-react';

const API_URL = 'https://team-task-manager-production-1669.up.railway.app/api';

function Projects() {
    const [projects, setProjects] = useState([]);
    const [users, setUsers] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [showMembersModal, setShowMembersModal] = useState(false);
    const [selectedProject, setSelectedProject] = useState(null);
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [newProject, setNewProject] = useState({ name: '', description: '' });
    const [loading, setLoading] = useState(true);
    const [userRole, setUserRole] = useState('');
    const [currentUser, setCurrentUser] = useState(null);

    useEffect(() => {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        setUserRole(user.role);
        setCurrentUser(user);
        fetchProjects();
        if (user.role === 'admin') {
            fetchUsers();
        }
    }, []);

    const fetchProjects = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_URL}/projects`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setProjects(response.data);
        } catch (error) {
            toast.error('Failed to fetch projects');
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

    const createProjectWithMembers = async (e) => {
        e.preventDefault();
        if (!newProject.name.trim()) {
            toast.error('Project name is required');
            return;
        }
        
        try {
            const token = localStorage.getItem('token');
            
            if (userRole === 'admin' && selectedUsers.length > 0) {
                await axios.post(`${API_URL}/admin/projects/create-for-user`, {
                    name: newProject.name,
                    description: newProject.description,
                    assignedUserIds: selectedUsers
                }, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                toast.success(`Project created and assigned to ${selectedUsers.length} team member(s)!`);
            } else {
                await axios.post(`${API_URL}/projects`, newProject, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                toast.success('Project created successfully!');
            }
            
            setShowModal(false);
            setShowAssignModal(false);
            setNewProject({ name: '', description: '' });
            setSelectedUsers([]);
            fetchProjects();
        } catch (error) {
            toast.error(error.response?.data?.error || 'Failed to create project');
        }
    };

    const deleteProject = async (id) => {
        if (!window.confirm('Delete this project? This will also delete all associated tasks.')) return;
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`${API_URL}/projects/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success('Project deleted');
            fetchProjects();
        } catch (error) {
            toast.error('Failed to delete project');
        }
    };

    const addMember = async (projectId, userId) => {
        try {
            const token = localStorage.getItem('token');
            await axios.post(`${API_URL}/projects/${projectId}/members`, { userId }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success('Member added');
            fetchProjects();
        } catch (error) {
            toast.error('Failed to add member');
        }
    };

    const removeMember = async (projectId, userId) => {
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`${API_URL}/projects/${projectId}/members/${userId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success('Member removed');
            fetchProjects();
        } catch (error) {
            toast.error('Failed to remove member');
        }
    };

    const toggleUserSelection = (userId) => {
        if (selectedUsers.includes(userId)) {
            setSelectedUsers(selectedUsers.filter(id => id !== userId));
        } else {
            setSelectedUsers([...selectedUsers, userId]);
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
                        <h1 className="text-3xl font-bold text-gray-900">Projects</h1>
                        <p className="text-gray-600 mt-2">
                            {userRole === 'admin' 
                                ? 'Create projects and assign them to team members' 
                                : 'Manage your projects'}
                        </p>
                    </div>
                    <button
                        onClick={() => {
                            setNewProject({ name: '', description: '' });
                            setSelectedUsers([]);
                            if (userRole === 'admin' && users.length > 0) {
                                setShowAssignModal(true);
                            } else {
                                setShowModal(true);
                            }
                        }}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition"
                    >
                        <Plus className="w-5 h-5" />
                        New Project
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-4 text-white">
                        <p className="text-sm opacity-90">Total Projects</p>
                        <p className="text-2xl font-bold">{projects.length}</p>
                    </div>
                    <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-4 text-white">
                        <p className="text-sm opacity-90">Active Members</p>
                        <p className="text-2xl font-bold">{users.length || 1}</p>
                    </div>
                    <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-4 text-white">
                        <p className="text-sm opacity-90">Completion Rate</p>
                        <p className="text-2xl font-bold">
                            {Math.round(projects.reduce((acc, p) => acc + (p.progress || 0), 0) / (projects.length || 1))}%
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {projects.map(project => (
                        <div key={project.id} className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden">
                            <div className="p-6">
                                <div className="flex justify-between items-start mb-3">
                                    <h3 className="text-xl font-semibold text-gray-900">{project.name}</h3>
                                    {userRole === 'admin' && (
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => {
                                                    setSelectedProject(project);
                                                    setShowMembersModal(true);
                                                }}
                                                className="text-blue-600 hover:text-blue-800 transition"
                                                title="Manage members"
                                            >
                                                <Users className="w-5 h-5" />
                                            </button>
                                            <button
                                                onClick={() => deleteProject(project.id)}
                                                className="text-red-600 hover:text-red-800 transition"
                                                title="Delete project"
                                            >
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        </div>
                                    )}
                                </div>
                                
                                <p className="text-gray-600 mb-4 line-clamp-2">
                                    {project.description || 'No description provided'}
                                </p>
                                
                                <div className="mb-2">
                                    <div className="flex justify-between text-sm text-gray-600 mb-1">
                                        <span>Progress</span>
                                        <span>{Math.round(project.progress || 0)}%</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                        <div
                                            className="bg-blue-600 rounded-full h-2 transition-all duration-500"
                                            style={{ width: `${project.progress || 0}%` }}
                                        ></div>
                                    </div>
                                </div>
                                
                                <div className="flex justify-between text-sm text-gray-500 mt-4">
                                    <span>📋 {project.completedTasks || 0}/{project.totalTasks || 0} tasks</span>
                                    <span>👥 {project.members?.length || 1} members</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {projects.length === 0 && (
                    <div className="text-center py-12">
                        <div className="text-gray-400 mb-4">
                            <FolderOpen className="w-16 h-16 mx-auto" />
                        </div>
                        <h3 className="text-xl font-medium text-gray-600">No projects yet</h3>
                        <p className="text-gray-500 mt-2">
                            {userRole === 'admin' 
                                ? 'Click "New Project" to create your first project and assign it to team members'
                                : 'Click "New Project" to get started'}
                        </p>
                    </div>
                )}
            </div>

            {/* Simple Create Project Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-6 w-full max-w-md">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold">Create Project</h2>
                            <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-gray-700">
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        <form onSubmit={createProjectWithMembers}>
                            <input
                                type="text"
                                placeholder="Project Name"
                                value={newProject.name}
                                onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                                className="w-full px-4 py-2 border rounded-lg mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                required
                            />
                            <textarea
                                placeholder="Description"
                                value={newProject.description}
                                onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                                className="w-full px-4 py-2 border rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                rows="3"
                            />
                            <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700">
                                Create Project
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Admin Create Project with Members Modal */}
            {showAssignModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-6 w-full max-w-lg">
                        <div className="flex justify-between items-center mb-4">
                            <div>
                                <h2 className="text-xl font-bold">Create Project & Assign to Team</h2>
                                <p className="text-sm text-gray-500 mt-1">Select team members to add to this project</p>
                            </div>
                            <button onClick={() => setShowAssignModal(false)} className="text-gray-500 hover:text-gray-700">
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        <form onSubmit={createProjectWithMembers}>
                            <input
                                type="text"
                                placeholder="Project Name"
                                value={newProject.name}
                                onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                                className="w-full px-4 py-2 border rounded-lg mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                required
                            />
                            <textarea
                                placeholder="Description"
                                value={newProject.description}
                                onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                                className="w-full px-4 py-2 border rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                rows="3"
                            />
                            
                            <label className="block text-sm font-medium text-gray-700 mb-2">Assign to Team Members:</label>
                            <div className="border rounded-lg max-h-48 overflow-y-auto mb-4">
                                {users.filter(u => u.id !== currentUser?.id).map(user => (
                                    <label key={user.id} className="flex items-center p-3 hover:bg-gray-50 cursor-pointer border-b">
                                        <input
                                            type="checkbox"
                                            checked={selectedUsers.includes(user.id)}
                                            onChange={() => toggleUserSelection(user.id)}
                                            className="w-4 h-4 text-blue-600 rounded"
                                        />
                                        <div className="ml-3 flex-1">
                                            <p className="font-medium text-gray-800">{user.name}</p>
                                            <p className="text-sm text-gray-500">{user.email}</p>
                                        </div>
                                        <span className={`text-xs px-2 py-1 rounded-full ${user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-600'}`}>
                                            {user.role}
                                        </span>
                                    </label>
                                ))}
                            </div>
                            
                            {selectedUsers.length > 0 && (
                                <div className="bg-blue-50 p-3 rounded-lg mb-4">
                                    <p className="text-sm text-blue-800 flex items-center gap-2">
                                        <Users className="w-4 h-4" />
                                        Will be assigned to {selectedUsers.length} team member(s)
                                    </p>
                                </div>
                            )}
                            
                            <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2">
                                <Send className="w-4 h-4" />
                                {selectedUsers.length > 0 ? `Create & Assign to ${selectedUsers.length} Member(s)` : 'Create Project'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Manage Members Modal */}
            {showMembersModal && selectedProject && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-6 w-full max-w-md">
                        <div className="flex justify-between items-center mb-4">
                            <div>
                                <h2 className="text-xl font-bold">Manage Members</h2>
                                <p className="text-sm text-gray-500">{selectedProject.name}</p>
                            </div>
                            <button onClick={() => setShowMembersModal(false)} className="text-gray-500 hover:text-gray-700">
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        
                        <div className="mb-4">
                            <h3 className="font-medium mb-2">Current Members</h3>
                            <div className="space-y-2 max-h-48 overflow-y-auto">
                                {selectedProject.members?.map(memberId => {
                                    const member = users.find(u => u.id === memberId);
                                    return member ? (
                                        <div key={memberId} className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
                                            <div>
                                                <p className="font-medium">{member.name}</p>
                                                <p className="text-xs text-gray-500">{member.email}</p>
                                            </div>
                                            {userRole === 'admin' && member.id !== selectedProject.createdBy && (
                                                <button
                                                    onClick={() => removeMember(selectedProject.id, member.id)}
                                                    className="text-red-600 hover:text-red-800 text-sm"
                                                >
                                                    Remove
                                                </button>
                                            )}
                                        </div>
                                    ) : null;
                                })}
                            </div>
                        </div>
                        
                        <div>
                            <h3 className="font-medium mb-2">Add New Member</h3>
                            <div className="space-y-2 max-h-48 overflow-y-auto">
                                {users.filter(u => !selectedProject.members?.includes(u.id)).map(user => (
                                    <div key={user.id} className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
                                        <div>
                                            <p className="font-medium">{user.name}</p>
                                            <p className="text-xs text-gray-500">{user.email}</p>
                                        </div>
                                        <button
                                            onClick={() => addMember(selectedProject.id, user.id)}
                                            className="bg-blue-600 text-white px-3 py-1 rounded-lg text-sm hover:bg-blue-700 flex items-center gap-1"
                                        >
                                            <UserPlus className="w-3 h-3" />
                                            Add
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Projects;