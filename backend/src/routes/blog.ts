import express from 'express';
import { prisma } from '../prisma';

const router = express.Router();

const normalizeBlogTitle = (title: string) =>
    String(title || '')
        .replace(/\s*\|\s*LifePartner AI$/i, '')
        .replace(/[^a-z0-9\u00C0-\uFFFF]+/gi, ' ')
        .trim()
        .toLowerCase();

// Get list of blog posts (Paginated & deduplicated by slug/title)
router.get('/', async (req, res) => {
    try {
        const page = Math.max(1, parseInt(req.query.page as string) || 1);
        const limit = Math.min(Math.max(parseInt(req.query.limit as string) || 10, 1), 500);
        const skip = (page - 1) * limit;

        const allPosts = await prisma.blog_posts.findMany({
            select: {
                id: true,
                slug: true,
                title: true,
                excerpt: true,
                keywords: true,
                created_at: true,
            },
            orderBy: {
                created_at: 'desc'
            },
            take: Math.min(1000, Math.max(limit * 3, 250))
        });

        const seenSlugs = new Set<string>();
        const seenTitles = new Set<string>();
        const deduped = allPosts.filter((p) => {
            const slugKey = String(p.slug || '').trim().toLowerCase();
            const titleKey = normalizeBlogTitle(p.title);
            if (!slugKey || seenSlugs.has(slugKey) || (titleKey && seenTitles.has(titleKey))) {
                return false;
            }
            seenSlugs.add(slugKey);
            if (titleKey) seenTitles.add(titleKey);
            return true;
        });

        const posts = deduped.slice(skip, skip + limit);
        const total = deduped.length;

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
