import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function generateBlogPost(topic: string): Promise<boolean> {
    try {
        console.log(`\n🤖 Generating Local Heuristic Blog Post for: "${topic}"...`);

        // Static fallback since we removed external AI APIs
        const slug = topic.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
        const blogData = {
            title: `Guide to ${topic} | Matchmaking Advice`,
            slug: slug,
            excerpt: `Discover the best tips and advice regarding ${topic} in our latest relationship guide.`,
            meta_title: `Ultimate Guide to ${topic}`,
            meta_description: `Read our comprehensive guide on ${topic} to find your perfect match using modern matchmaking principles.`,
            keywords: [topic, "relationships", "matchmaking", "dating advice", "love"],
            content: `<h2>Understanding ${topic}</h2><p>When it comes to building a lasting relationship, understanding ${topic} is absolutely crucial. LifePartner AI takes this into account using advanced psychological profiling and compatibility scoring.</p><h3>Why it Matters</h3><p>Many couples find that aligning on core values and interests leads to a stronger bond.</p><ul><li>Communication is key</li><li>Shared values create a strong foundation</li><li>Mutual respect ensures longevity</li></ul>`
        };

        await prisma.blog_posts.create({
            data: blogData
        });

        console.log(`✅ Successfully generated and saved Local Blog Post: ${blogData.title}`);
        return true;

    } catch (error) {
        console.error(`❌ Failed to generate blog post for "${topic}":`, error);
        return false;
    }
}
