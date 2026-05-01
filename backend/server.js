const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

// ==================== DATABASE (In-memory) ====================
const users = [];
const projects = [];
const tasks = [];
const comments = [];
const notifications = [];

// ==================== AUTH ROUTES ====================

// Signup
app.post('/api/auth/signup', (req, res) => {
    const { name, email, password, role } = req.body;
    
    console.log('Signup attempt:', { name, email, role });
    
    // Check if user exists
    if (users.find(u => u.email === email)) {
        return res.status(400).json({ error: 'Email already exists' });
    }
    
    // Create new user
    const newUser = {
        id: users.length + 1,
        name,
        email,
        password,
        role: role || 'member',
        createdAt: new Date()
    };
    
    users.push(newUser);
    console.log('User created:', newUser);
    
    // Send response
    res.json({
        user: { id: newUser.id, name, email, role: newUser.role },
        token: `token_${newUser.id}`
    });
});

// Login
app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;
    console.log('Login attempt:', { email });
    
    const user = users.find(u => u.email === email && u.password === password);
    
    if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    console.log('Login successful:', user.name);
    res.json({
        user: { id: user.id, name: user.name, email: user.email, role: user.role },
        token: `token_${user.id}`
    });
});

// ==================== USER MANAGEMENT (ADMIN ONLY) ====================

// Get all users (admin only)
app.get('/api/users', (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    const userId = parseInt(token?.split('_')[1]);
    const user = users.find(u => u.id === userId);
    
    if (user?.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
    }
    
    res.json(users.map(u => ({ id: u.id, name: u.name, email: u.email, role: u.role })));
});

// Delete user (admin only)
app.delete('/api/users/:id', (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    const userId = parseInt(token?.split('_')[1]);
    const user = users.find(u => u.id === userId);
    
    if (user?.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
    }
    
    const index = users.findIndex(u => u.id === parseInt(req.params.id));
    if (index !== -1) {
        users.splice(index, 1);
    }
    res.json({ success: true });
});

// ==================== PROJECT MANAGEMENT ====================

// Get all projects for current user
app.get('/api/projects', (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    const userId = parseInt(token?.split('_')[1]);
    
    // Get projects where user is member or creator
    const userProjects = projects.filter(p => 
        p.createdBy === userId || p.members?.includes(userId)
    );
    
    // Add stats to each project
    const projectsWithStats = userProjects.map(p => {
        const projectTasks = tasks.filter(t => t.projectId === p.id);
        const completed = projectTasks.filter(t => t.status === 'done').length;
        return {
            ...p,
            totalTasks: projectTasks.length,
            completedTasks: completed,
            progress: projectTasks.length ? (completed / projectTasks.length) * 100 : 0
        };
    });
    
    res.json(projectsWithStats);
});

// Create project (regular)
app.post('/api/projects', (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    const userId = parseInt(token?.split('_')[1]);
    const { name, description } = req.body;
    
    const newProject = {
        id: projects.length + 1,
        name,
        description: description || '',
        createdBy: userId,
        members: [userId],
        createdAt: new Date()
    };
    
    projects.push(newProject);
    console.log('Project created:', newProject);
    res.status(201).json(newProject);
});

// Update project (admin or creator only)
app.put('/api/projects/:id', (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    const userId = parseInt(token?.split('_')[1]);
    const user = users.find(u => u.id === userId);
    const project = projects.find(p => p.id === parseInt(req.params.id));
    
    if (!project) {
        return res.status(404).json({ error: 'Project not found' });
    }
    
    if (user?.role !== 'admin' && project.createdBy !== userId) {
        return res.status(403).json({ error: 'Permission denied' });
    }
    
    const { name, description } = req.body;
    if (name) project.name = name;
    if (description) project.description = description;
    
    res.json(project);
});

// Delete project (admin or creator only)
app.delete('/api/projects/:id', (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    const userId = parseInt(token?.split('_')[1]);
    const user = users.find(u => u.id === userId);
    const projectIndex = projects.findIndex(p => p.id === parseInt(req.params.id));
    
    if (projectIndex === -1) {
        return res.status(404).json({ error: 'Project not found' });
    }
    
    const project = projects[projectIndex];
    if (user?.role !== 'admin' && project.createdBy !== userId) {
        return res.status(403).json({ error: 'Permission denied' });
    }
    
    // Delete project
    projects.splice(projectIndex, 1);
    
    // Delete associated tasks
    const tasksToDelete = tasks.filter(t => t.projectId === parseInt(req.params.id));
    tasksToDelete.forEach(t => {
        const taskIndex = tasks.findIndex(task => task.id === t.id);
        if (taskIndex !== -1) tasks.splice(taskIndex, 1);
    });
    
    res.json({ success: true });
});

// Add member to project
app.post('/api/projects/:id/members', (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    const userId = parseInt(token?.split('_')[1]);
    const user = users.find(u => u.id === userId);
    const project = projects.find(p => p.id === parseInt(req.params.id));
    
    if (!project) {
        return res.status(404).json({ error: 'Project not found' });
    }
    
    if (user?.role !== 'admin' && project.createdBy !== userId) {
        return res.status(403).json({ error: 'Permission denied' });
    }
    
    const { userId: newMemberId } = req.body;
    if (!project.members.includes(newMemberId)) {
        project.members.push(newMemberId);
        
        // Create notification for new member
        notifications.push({
            id: notifications.length + 1,
            userId: newMemberId,
            message: `You were added to project "${project.name}"`,
            type: 'project_added',
            read: false,
            createdAt: new Date()
        });
    }
    
    res.json({ success: true });
});

// Remove member from project
app.delete('/api/projects/:id/members/:userId', (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    const userId = parseInt(token?.split('_')[1]);
    const user = users.find(u => u.id === userId);
    const project = projects.find(p => p.id === parseInt(req.params.id));
    
    if (!project) {
        return res.status(404).json({ error: 'Project not found' });
    }
    
    if (user?.role !== 'admin' && project.createdBy !== userId) {
        return res.status(403).json({ error: 'Permission denied' });
    }
    
    const memberIndex = project.members.indexOf(parseInt(req.params.userId));
    if (memberIndex !== -1) {
        project.members.splice(memberIndex, 1);
    }
    
    res.json({ success: true });
});

// ==================== ADMIN: CREATE PROJECT FOR TEAM MEMBERS ====================

// Get all users for admin
app.get('/api/admin/users', (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    const userId = parseInt(token?.split('_')[1]);
    const user = users.find(u => u.id === userId);
    
    if (user?.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
    }
    
    res.json(users.map(u => ({ id: u.id, name: u.name, email: u.email, role: u.role })));
});

// Admin creates project and assigns to multiple users
app.post('/api/admin/projects/create-for-user', (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    const adminId = parseInt(token?.split('_')[1]);
    const admin = users.find(u => u.id === adminId);
    
    // Check if admin
    if (admin?.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
    }
    
    const { name, description, assignedUserIds } = req.body;
    
    // Create project with admin and selected members
    const newProject = {
        id: projects.length + 1,
        name,
        description: description || '',
        createdBy: adminId,
        members: [adminId, ...(assignedUserIds || [])],
        createdAt: new Date()
    };
    
    projects.push(newProject);
    console.log('Admin created project for team:', { project: name, assignedTo: assignedUserIds });
    
    // Create notifications for assigned users
    if (assignedUserIds && assignedUserIds.length > 0) {
        assignedUserIds.forEach(userId => {
            const user = users.find(u => u.id === userId);
            if (user) {
                notifications.push({
                    id: notifications.length + 1,
                    userId: userId,
                    message: `Admin added you to project "${name}"`,
                    type: 'project_added',
                    read: false,
                    createdAt: new Date()
                });
            }
        });
    }
    
    res.status(201).json(newProject);
});

// Get all projects with member details (admin only)
app.get('/api/admin/projects/all', (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    const userId = parseInt(token?.split('_')[1]);
    const user = users.find(u => u.id === userId);
    
    if (user?.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
    }
    
    const projectsWithDetails = projects.map(p => ({
        ...p,
        membersList: p.members.map(memberId => {
            const member = users.find(u => u.id === memberId);
            return member ? { id: member.id, name: member.name, email: member.email } : null;
        }).filter(Boolean),
        tasks: tasks.filter(t => t.projectId === p.id)
    }));
    
    res.json(projectsWithDetails);
});

// ==================== TASK MANAGEMENT ====================

// Get all tasks for current user
app.get('/api/tasks', (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    const userId = parseInt(token?.split('_')[1]);
    const { status, priority, assignedTo } = req.query;
    
    let userTasks = tasks.filter(t => t.assignedTo === userId || t.createdBy === userId);
    
    // Apply filters
    if (status && status !== 'all') {
        userTasks = userTasks.filter(t => t.status === status);
    }
    if (priority && priority !== 'all') {
        userTasks = userTasks.filter(t => t.priority === priority);
    }
    if (assignedTo && assignedTo !== 'all') {
        userTasks = userTasks.filter(t => t.assignedTo === parseInt(assignedTo));
    }
    
    // Mark overdue tasks
    const now = new Date();
    userTasks = userTasks.map(t => ({
        ...t,
        isOverdue: t.deadline && new Date(t.deadline) < now && t.status !== 'done'
    }));
    
    // Get project names
    const tasksWithProjectNames = userTasks.map(t => {
        const project = projects.find(p => p.id === t.projectId);
        return {
            ...t,
            projectName: project?.name || 'Unknown Project'
        };
    });
    
    res.json(tasksWithProjectNames);
});

// Create task
app.post('/api/tasks', (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    const userId = parseInt(token?.split('_')[1]);
    const { title, description, projectId, assignedTo, priority, deadline } = req.body;
    
    const newTask = {
        id: tasks.length + 1,
        title,
        description: description || '',
        projectId: parseInt(projectId),
        assignedTo: parseInt(assignedTo),
        createdBy: userId,
        priority: priority || 'medium',
        status: 'todo',
        deadline: deadline || null,
        createdAt: new Date(),
        updatedAt: new Date()
    };
    
    tasks.push(newTask);
    console.log('Task created:', newTask);
    
    // Create notification for assigned user
    if (assignedTo !== userId) {
        const project = projects.find(p => p.id === parseInt(projectId));
        notifications.push({
            id: notifications.length + 1,
            userId: parseInt(assignedTo),
            message: `New task "${title}" assigned to you in project "${project?.name}"`,
            type: 'task_assigned',
            read: false,
            createdAt: new Date()
        });
    }
    
    res.status(201).json(newTask);
});

// Update task
app.put('/api/tasks/:id', (req, res) => {
    const task = tasks.find(t => t.id === parseInt(req.params.id));
    if (task) {
        Object.assign(task, req.body);
        task.updatedAt = new Date();
    }
    res.json(task);
});

// Update task status
app.patch('/api/tasks/:id/status', (req, res) => {
    const task = tasks.find(t => t.id === parseInt(req.params.id));
    const { status } = req.body;
    
    if (task) {
        task.status = status;
        task.updatedAt = new Date();
        
        // Create notification for task assignee
        notifications.push({
            id: notifications.length + 1,
            userId: task.assignedTo,
            message: `Task "${task.title}" status changed to ${status}`,
            type: 'status_changed',
            read: false,
            createdAt: new Date()
        });
    }
    
    res.json({ success: true });
});

// ==================== COMMENTS ====================

// Get comments for a task
app.get('/api/tasks/:taskId/comments', (req, res) => {
    const taskComments = comments.filter(c => c.taskId === parseInt(req.params.taskId));
    res.json(taskComments);
});

// Add comment to task
app.post('/api/tasks/:taskId/comments', (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    const userId = parseInt(token?.split('_')[1]);
    const { text } = req.body;
    
    const newComment = {
        id: comments.length + 1,
        taskId: parseInt(req.params.taskId),
        userId,
        text,
        createdAt: new Date()
    };
    
    comments.push(newComment);
    
    // Get task to notify assignee
    const task = tasks.find(t => t.id === parseInt(req.params.taskId));
    if (task && task.assignedTo !== userId) {
        notifications.push({
            id: notifications.length + 1,
            userId: task.assignedTo,
            message: `New comment on task "${task.title}"`,
            type: 'comment',
            read: false,
            createdAt: new Date()
        });
    }
    
    res.status(201).json(newComment);
});

// ==================== NOTIFICATIONS ====================

// Get user notifications
app.get('/api/notifications', (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    const userId = parseInt(token?.split('_')[1]);
    
    const userNotifications = notifications.filter(n => n.userId === userId);
    const unreadCount = userNotifications.filter(n => !n.read).length;
    
    res.json({ notifications: userNotifications, unreadCount });
});

// Mark notification as read
app.patch('/api/notifications/:id/read', (req, res) => {
    const notification = notifications.find(n => n.id === parseInt(req.params.id));
    if (notification) {
        notification.read = true;
    }
    res.json({ success: true });
});

// ==================== DASHBOARD STATS ====================

// Get dashboard statistics
app.get('/api/dashboard/stats', (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    const userId = parseInt(token?.split('_')[1]);
    
    const userTasks = tasks.filter(t => t.assignedTo === userId);
    const userProjects = projects.filter(p => p.members?.includes(userId));
    
    const now = new Date();
    const stats = {
        totalProjects: userProjects.length,
        totalTasks: userTasks.length,
        pendingTasks: userTasks.filter(t => t.status === 'todo').length,
        inProgressTasks: userTasks.filter(t => t.status === 'in-progress').length,
        completedTasks: userTasks.filter(t => t.status === 'done').length,
        overdueTasks: userTasks.filter(t => t.deadline && new Date(t.deadline) < now && t.status !== 'done').length,
        completionRate: userTasks.length ? (userTasks.filter(t => t.status === 'done').length / userTasks.length) * 100 : 0
    };
    
    // Tasks by priority
    stats.tasksByPriority = {
        high: userTasks.filter(t => t.priority === 'high').length,
        medium: userTasks.filter(t => t.priority === 'medium').length,
        low: userTasks.filter(t => t.priority === 'low').length
    };
    
    // Recent tasks
    stats.recentTasks = userTasks
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5)
        .map(t => {
            const project = projects.find(p => p.id === t.projectId);
            return {
                ...t,
                projectName: project?.name || 'Unknown'
            };
        });
    
    res.json(stats);
});

// ==================== CALENDAR VIEW ====================

// Get tasks for calendar
app.get('/api/tasks/calendar', (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    const userId = parseInt(token?.split('_')[1]);
    
    const userTasks = tasks.filter(t => t.assignedTo === userId && t.deadline);
    const calendarEvents = userTasks.map(t => ({
        id: t.id,
        title: t.title,
        date: t.deadline,
        status: t.status,
        priority: t.priority
    }));
    
    res.json(calendarEvents);
});

// ==================== HEALTH CHECK ====================

app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        message: 'Server is running',
        users: users.length,
        projects: projects.length,
        tasks: tasks.length
    });
});

// ==================== START SERVER ====================

const PORT = 5000;
app.listen(PORT, () => {
    console.log('\n=========================================');
    console.log('✅ TEAM TASK MANAGER SERVER RUNNING');
    console.log(`📍 http://localhost:${PORT}`);
    console.log(`🩺 Health: http://localhost:${PORT}/health`);
    console.log('=========================================');
    console.log(`📊 Users: ${users.length}`);
    console.log(`📁 Projects: ${projects.length}`);
    console.log(`✅ Tasks: ${tasks.length}`);
    console.log('=========================================\n');
});