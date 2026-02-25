import { GoogleGenerativeAI } from '@google/generative-ai';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

export async function generateBlogPost(topic: string): Promise<boolean> {
    try {
        console.log(`\n🤖 Starting SEO Blog Generation for: "${topic}"...`);

        const prompt = `
            You are an expert relationship psychologist and a master SEO copywriter.
            Write a highly engaging, long-form SEO blog article about: "${topic}".
            
            The target audience is people looking for serious relationships and marriage on dating apps.
            
            You must return ONLY a raw JSON object string with no markdown formatting and no backticks. The JSON must have these exact keys:
            - "title": A catchy, click-worthy SEO optimized title (max 60 chars)
            - "slug": A URL-friendly slug based on the title (e.g., "finding-love-in-bangalore")
            - "excerpt": A compelling 2-sentence summary for the meta description
            - "meta_title": SEO meta title (max 60 chars)
            - "meta_description": SEO meta description (max 160 chars)
            - "keywords": An array of 5-8 long-tail SEO keywords as strings
            - "content": The full HTML content of the article. It must include <h2> and <h3> tags, <p> tags, and <ul> lists. It should be at least 800 words long. It should mention the platform "LifePartner AI" naturally as the best modern way to find matches based on deep compatibility (Astrology Guna matching and Psychological profiling).
        `;

        const response = await model.generateContent({
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            generationConfig: {
                temperature: 0.7,
                responseMimeType: 'application/json'
            }
        });

        const jsonString = response.response.text();
        if (!jsonString) {
            throw new Error("No response text from Gemini");
        }

        const blogData = JSON.parse(jsonString);

        // @ts-ignore
        await prisma.blog_posts.create({
            data: {
                title: blogData.title,
                slug: blogData.slug,
                excerpt: blogData.excerpt,
                meta_title: blogData.meta_title,
                meta_description: blogData.meta_description,
                keywords: blogData.keywords,
                content: blogData.content
            }
        });

        console.log(`✅ Successfully generated and saved SEO Blog Post: ${blogData.title}`);
        return true;

    } catch (error) {
        console.error(`❌ Failed to generate blog post for "${topic}":`, error);
        return false;
    }
}
