import Article from '../models/articleModel.js';

export const addArticle = async (req, res) => {
    try {
        const { title, image, category, author, date, content, readTime } = req.body;

        const article = new Article({
            title,
            image,
            category,
            author,
            date,
            content,
            readTime,
        });

        await article.save();

        res.status(201).json({
            success: true,
            message: 'Article added successfully',
            article,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to add article',
        });
    }
};

export const listArticles = async (req, res) => {
    try {
        const articles = await Article.find({}).sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            articles,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch articles',
        });
    }
};

export const getArticleById = async (req, res) => {
    try {
        const article = await Article.findById(req.params.id);

        if (!article) {
            return res.status(404).json({
                success: false,
                message: 'Article not found',
            });
        }

        res.status(200).json({
            success: true,
            article,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch article',
        });
    }
};
