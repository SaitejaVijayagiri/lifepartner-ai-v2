import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// Get list of blog posts (Paginated)
router.get('/', async (req, res) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const skip = (page - 1) * limit;

        const posts = await prisma.blog_posts.findMany({
            select: {
                id: true,
                slug: true,
                title: true,
                excerpt: true,
                created_at: true,
            },
            orderBy: {
                created_at: 'desc'
            },
            skip,
            take: limit
        });

        const total = await prisma.blog_posts.count();

        res.json({
            posts,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Error fetching blog posts:', error);
        res.status(500).json({ error: 'Failed to fetch blog posts' });
    }
});

// Get a single blog post by slug
router.get('/:slug', async (req, res) => {
    try {
        const { slug } = req.params;

        const post = await prisma.blog_posts.findUnique({
            where: { slug }
        });

        if (!post) {
            return res.status(404).json({ error: 'Blog post not found' });
        }

        res.json(post);
    } catch (error) {
        console.error(`Error fetching blog post ${req.params.slug}:`, error);
        res.status(500).json({ error: 'Failed to fetch blog post' });
    }
});

export default router;
