const express = require('express');
const Joi = require('joi');
const pool = require('../config/db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate);

const projectSchema = Joi.object({
    name: Joi.string().min(3).max(200).required(),
    description: Joi.string().allow('').optional()
});

router.get('/', async (req, res) => {
    try {
        const projects = await pool.query(
            `SELECT p.*, 
                (SELECT COUNT(*) FROM tasks WHERE project_id = p.id) as total_tasks,
                (SELECT COUNT(*) FROM tasks WHERE project_id = p.id AND status = 'completed') as completed_tasks
             FROM projects p
             JOIN project_members pm ON p.id = pm.project_id
             WHERE pm.user_id = $1 OR p.created_by = $1
             ORDER BY p.created_at DESC`,
            [req.user.id]
        );
        res.json(projects.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});

router.post('/', async (req, res) => {
    try {
        const { error, value } = projectSchema.validate(req.body);
        if (error) {
            return res.status(400).json({ error: error.details[0].message });
        }

        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            
            const result = await client.query(
                'INSERT INTO projects (name, description, created_by) VALUES ($1, $2, $3) RETURNING *',
                [value.name, value.description, req.user.id]
            );
            
            const project = result.rows[0];
            
            await client.query(
                'INSERT INTO project_members (project_id, user_id) VALUES ($1, $2)',
                [project.id, req.user.id]
            );
            
            await client.query('COMMIT');
            res.status(201).json(project);
        } catch (err) {
            await client.query('ROLLBACK');
            throw err;
        } finally {
            client.release();
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});

router.post('/:projectId/members', async (req, res) => {
    try {
        const { projectId } = req.params;
        const { userId } = req.body;

        const project = await pool.query(
            'SELECT created_by FROM projects WHERE id = $1',
            [projectId]
        );
        
        if (project.rows.length === 0) {
            return res.status(404).json({ error: 'Project not found' });
        }
        
        if (req.user.role !== 'admin' && project.rows[0].created_by !== req.user.id) {
            return res.status(403).json({ error: 'Only admin or project creator can add members' });
        }

        await pool.query(
            'INSERT INTO project_members (project_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
            [projectId, userId]
        );
        
        res.json({ message: 'Member added successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;