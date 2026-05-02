import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

function Navbar() {
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        toast.success('Logged out successfully');
        navigate('/login');
    };

    return (
        <nav className="bg-white shadow-lg">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    <div className="flex space-x-8">
                        <Link to="/" className="flex items-center text-gray-700 hover:text-blue-600">
                            Dashboard
                        </Link>
                        <Link to="/projects" className="flex items-center text-gray-700 hover:text-blue-600">
                            Projects
                        </Link>
                        <Link to="/tasks" className="flex items-center text-gray-700 hover:text-blue-600">
                            Tasks
                        </Link>
                    </div>
                    <div className="flex items-center space-x-4">
                        <span className="text-sm text-gray-600">Welcome, {user.name || 'User'}</span>
                        {user.role === 'admin' && (
                            <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full">
                                Admin
                            </span>
                        )}
                        <button
                            onClick={handleLogout}
                            className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600"
                        >
                            Logout
                        </button>
                    </div>
                </div>
            </div>
        </nav>
    );
}

export default Navbar;