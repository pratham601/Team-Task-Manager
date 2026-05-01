const express = require('express');
const Joi = require('joi');
const pool = require('../config/db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate);

const taskSchema = Joi.object({
    title: Joi.string().min(3).max(200).required(),
    description: Joi.string().allow('').optional(),
    status: Joi.string().valid('pending', 'in-progress', 'completed').default('pending'),
    priority: Joi.string().valid('low', 'medium', 'high').default('medium'),
    due_date: Joi.date().iso().allow(null).optional(),
    project_id: Joi.number().required(),
    assigned_to: Joi.number().required()
});

router.get('/', async (req, res) => {
    try {
        const { status, project_id } = req.query;
        let query = `
            SELECT t.*, p.name as project_name, u.name as assigned_to_name
            FROM tasks t
            JOIN projects p ON t.project_id = p.id
            JOIN project_members pm ON p.id = pm.project_id
            LEFT JOIN users u ON t.assigned_to = u.id
            WHERE pm.user_id = $1
        `;
        let params = [req.user.id];
        let paramIndex = 2;

        if (status) {
            query += ` AND t.status = $${paramIndex++}`;
            params.push(status);
        }
        
        if (project_id) {
            query += ` AND t.project_id = $${paramIndex++}`;
            params.push(project_id);
        }

        query += ' ORDER BY t.due_date ASC NULLS LAST, t.created_at DESC';

        const tasks = await pool.query(query, params);
        
        const now = new Date();
        for (const task of tasks.rows) {
            if (task.due_date && task.status !== 'completed' && new Date(task.due_date) < now) {
                task.status = 'overdue';
                await pool.query('UPDATE tasks SET status = $1 WHERE id = $2', ['overdue', task.id]);
            }
        }
        
        res.json(tasks.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});

router.post('/', async (req, res) => {
    try {
        const { error, value } = taskSchema.validate(req.body);
        if (error) {
            return res.status(400).json({ error: error.details[0].message });
        }

        const isMember = await pool.query(
            'SELECT 1 FROM project_members WHERE project_id = $1 AND user_id = $2',
            [value.project_id, req.user.id]
        );
        
        if (isMember.rows.length === 0) {
            return res.status(403).json({ error: 'You are not a member of this project' });
        }

        const result = await pool.query(
            `INSERT INTO tasks (title, description, status, priority, due_date, project_id, assigned_to, created_by) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
            [value.title, value.description, value.status, value.priority, 
             value.due_date, value.project_id, value.assigned_to, req.user.id]
        );
        
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});

router.patch('/:id/status', async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        
        if (!['pending', 'in-progress', 'completed'].includes(status)) {
            return res.status(400).json({ error: 'Invalid status' });
        }

        const task = await pool.query(
            `SELECT t.* FROM tasks t
             JOIN project_members pm ON t.project_id = pm.project_id
             WHERE t.id = $1 AND pm.user_id = $2`,
            [id, req.user.id]
        );
        
        if (task.rows.length === 0) {
            return res.status(403).json({ error: 'Access denied' });
        }

        await pool.query(
            'UPDATE tasks SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
            [status, id]
        );
        
        res.json({ message: 'Task updated successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});

router.get('/dashboard/stats', async (req, res) => {
    try {
        const stats = await pool.query(
            `SELECT 
                COUNT(*) FILTER (WHERE t.status = 'pending') as pending,
                COUNT(*) FILTER (WHERE t.status = 'in-progress') as in_progress,
                COUNT(*) FILTER (WHERE t.status = 'completed') as completed,
                COUNT(*) FILTER (WHERE t.status = 'overdue' OR (t.due_date < CURRENT_DATE AND t.status != 'completed')) as overdue,
                COUNT(DISTINCT t.project_id) as total_projects
             FROM tasks t
             JOIN project_members pm ON t.project_id = pm.project_id
             WHERE pm.user_id = $1`,
            [req.user.id]
        );
        
        res.json(stats.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;