import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { CheckCircle, Clock, AlertCircle, TrendingUp, FolderOpen, Bell } from 'lucide-react';

const API_URL = 'https://team-task-manager-production-1669.up.railway.app/api';

function Dashboard() {
    const [stats, setStats] = useState(null);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [showNotifications, setShowNotifications] = useState(false);

    useEffect(() => {
        fetchDashboardData();
        fetchNotifications();
    }, []);

    const fetchDashboardData = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_URL}/dashboard/stats`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setStats(response.data);
        } catch (error) {
            console.error('Error fetching stats:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchNotifications = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_URL}/notifications`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setNotifications(response.data.notifications || []);
            setUnreadCount(response.data.unreadCount || 0);
        } catch (error) {
            console.error('Error fetching notifications:', error);
        }
    };

    const markAsRead = async (id) => {
        try {
            const token = localStorage.getItem('token');
            await axios.patch(`${API_URL}/notifications/${id}/read`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchNotifications();
        } catch (error) {
            console.error('Error marking as read:', error);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-96">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    const statCards = [
        { title: 'Total Projects', value: stats?.totalProjects || 0, icon: FolderOpen, color: 'bg-blue-500', bgColor: 'bg-blue-100', textColor: 'text-blue-600' },
        { title: 'Total Tasks', value: stats?.totalTasks || 0, icon: CheckCircle, color: 'bg-purple-500', bgColor: 'bg-purple-100', textColor: 'text-purple-600' },
        { title: 'Pending Tasks', value: stats?.pendingTasks || 0, icon: Clock, color: 'bg-yellow-500', bgColor: 'bg-yellow-100', textColor: 'text-yellow-600' },
        { title: 'In Progress', value: stats?.inProgressTasks || 0, icon: TrendingUp, color: 'bg-orange-500', bgColor: 'bg-orange-100', textColor: 'text-orange-600' },
        { title: 'Completed', value: stats?.completedTasks || 0, icon: CheckCircle, color: 'bg-green-500', bgColor: 'bg-green-100', textColor: 'text-green-600' },
        { title: 'Overdue', value: stats?.overdueTasks || 0, icon: AlertCircle, color: 'bg-red-500', bgColor: 'bg-red-100', textColor: 'text-red-600' }
    ];

    return (
        <div className="bg-gray-50 min-h-screen">
            <div className="bg-white shadow-sm border-b sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
                    <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
                    <div className="relative">
                        <button
                            onClick={() => setShowNotifications(!showNotifications)}
                            className="relative p-2 rounded-full hover:bg-gray-100"
                        >
                            <Bell className="w-6 h-6 text-gray-600" />
                            {unreadCount > 0 && (
                                <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                                    {unreadCount}
                                </span>
                            )}
                        </button>
                        
                        {showNotifications && (
                            <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border z-20">
                                <div className="p-3 border-b">
                                    <h3 className="font-semibold">Notifications</h3>
                                </div>
                                <div className="max-h-96 overflow-y-auto">
                                    {notifications.length === 0 ? (
                                        <p className="p-4 text-gray-500 text-center">No notifications</p>
                                    ) : (
                                        notifications.map(notif => (
                                            <div
                                                key={notif.id}
                                                className={`p-3 border-b hover:bg-gray-50 cursor-pointer ${!notif.read ? 'bg-blue-50' : ''}`}
                                                onClick={() => markAsRead(notif.id)}
                                            >
                                                <p className="text-sm text-gray-800">{notif.message}</p>
                                                <p className="text-xs text-gray-500 mt-1">
                                                    {new Date(notif.createdAt).toLocaleDateString()}
                                                </p>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 py-8">
                <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl p-6 text-white mb-8">
                    <h3 className="text-lg opacity-90">Overall Completion Rate</h3>
                    <div className="text-4xl font-bold mt-2">{Math.round(stats?.completionRate || 0)}%</div>
                    <div className="w-full bg-white/30 rounded-full h-2 mt-4">
                        <div
                            className="bg-white rounded-full h-2 transition-all duration-500"
                            style={{ width: `${stats?.completionRate || 0}%` }}
                        ></div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                    {statCards.map((stat, index) => (
                        <div key={index} className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden">
                            <div className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-gray-500 text-sm">{stat.title}</p>
                                        <p className="text-3xl font-bold mt-2">{stat.value}</p>
                                    </div>
                                    <div className={`${stat.bgColor} p-3 rounded-full`}>
                                        <stat.icon className={`w-6 h-6 ${stat.textColor}`} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                    <div className="bg-white rounded-xl shadow-md p-6">
                        <h3 className="text-lg font-semibold mb-4">Tasks by Priority</h3>
                        <div className="space-y-3">
                            <div>
                                <div className="flex justify-between text-sm mb-1">
                                    <span>High Priority</span>
                                    <span className="font-semibold">{stats?.tasksByPriority?.high || 0}</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div className="bg-red-500 rounded-full h-2" style={{ width: `${((stats?.tasksByPriority?.high || 0) / (stats?.totalTasks || 1)) * 100}%` }}></div>
                                </div>
                            </div>
                            <div>
                                <div className="flex justify-between text-sm mb-1">
                                    <span>Medium Priority</span>
                                    <span className="font-semibold">{stats?.tasksByPriority?.medium || 0}</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div className="bg-yellow-500 rounded-full h-2" style={{ width: `${((stats?.tasksByPriority?.medium || 0) / (stats?.totalTasks || 1)) * 100}%` }}></div>
                                </div>
                            </div>
                            <div>
                                <div className="flex justify-between text-sm mb-1">
                                    <span>Low Priority</span>
                                    <span className="font-semibold">{stats?.tasksByPriority?.low || 0}</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div className="bg-green-500 rounded-full h-2" style={{ width: `${((stats?.tasksByPriority?.low || 0) / (stats?.totalTasks || 1)) * 100}%` }}></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-md p-6">
                        <h3 className="text-lg font-semibold mb-4">Recent Tasks</h3>
                        <div className="space-y-3">
                            {stats?.recentTasks?.map(task => (
                                <div key={task.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                    <div>
                                        <p className="font-medium">{task.title}</p>
                                        <p className="text-xs text-gray-500">
                                            Due: {task.deadline ? new Date(task.deadline).toLocaleDateString() : 'No deadline'}
                                        </p>
                                    </div>
                                    <span className={`px-2 py-1 text-xs rounded-full ${
                                        task.status === 'done' ? 'bg-green-100 text-green-800' :
                                        task.status === 'in-progress' ? 'bg-blue-100 text-blue-800' :
                                        'bg-yellow-100 text-yellow-800'
                                    }`}>
                                        {task.status === 'done' ? 'Completed' : task.status === 'in-progress' ? 'In Progress' : 'Pending'}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Dashboard;