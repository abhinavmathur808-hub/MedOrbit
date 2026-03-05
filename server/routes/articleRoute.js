import express from 'express';
import { addArticle, listArticles, getArticleById } from '../controllers/articleController.js';
import authMiddleware from '../middlewares/authMiddleware.js';

const router = express.Router();

const adminMiddleware = (req, res, next) => {
    if (req.userRole !== 'admin') {
        return res.status(403).json({
            success: false,
            message: 'Access denied. Admin only.',
        });
    }
    next();
};

router.get('/list', listArticles);
router.get('/:id', getArticleById);

router.post('/add', authMiddleware, adminMiddleware, addArticle);

export default router;
