import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    try {
        const email = 'mubeenabanu6125@gmail.com';
        const user = await prisma.users.findUnique({
            where: { email }
        });
        
        if (!user) {
            console.log('User not found');
            return;
        }

        const userId = user.id;
        console.log('Deleting user:', userId);

        // Delete blocks
        await prisma.blocks.deleteMany({
            where: { OR: [{ blocker_id: userId }, { blocked_id: userId }] }
        });

        // Delete call_logs
        await prisma.call_logs.deleteMany({
            where: { OR: [{ caller_id: userId }, { receiver_id: userId }] }
        });

        // Delete games (this cascades to game_moves)
        await prisma.games.deleteMany({
            where: { OR: [{ player_a_id: userId }, { player_b_id: userId }, { winner_id: userId }] }
        });

        // Delete interactions
        await prisma.interactions.deleteMany({
            where: { OR: [{ from_user_id: userId }, { to_user_id: userId }] }
        });

        // Find matches involving the user
        const userMatches = await prisma.matches.findMany({
            where: { OR: [{ user_a_id: userId }, { user_b_id: userId }] },
            select: { id: true }
        });
        const matchIds = userMatches.map(m => m.id);

        // Delete messages (by match_id, sender_id, receiver_id)
        await prisma.messages.deleteMany({
            where: { 
                OR: [
                    { match_id: { in: matchIds } },
                    { sender_id: userId },
                    { receiver_id: userId }
                ]
            }
        });

        // Delete the matches
        if (matchIds.length > 0) {
            await prisma.matches.deleteMany({
                where: { id: { in: matchIds } }
            });
        }

        // Delete reports where user is reporter (reported_id cascades)
        await prisma.reports.deleteMany({
            where: { OR: [{ reporter_id: userId }, { reported_id: userId }] }
        });

        // Delete transactions
        await prisma.transactions.deleteMany({
            where: { user_id: userId }
        });

        // Note: device_tokens, game_moves, notifications, profiles, reel_comments, 
        // reel_likes, reels, verification_requests, lounge_messages 
        // have onDelete: Cascade so they should be deleted automatically if they 
        // only reference this user.
        // Wait, for reels, if we delete a reel, its comments/likes cascade.
        // What about reel_likes or reel_comments by this user on OTHER people's reels?
        // reel_comments and reel_likes have Cascade on user_id, so they will be deleted.

        // Finally, delete the user
        await prisma.users.delete({
            where: { id: userId }
        });

        console.log('User and related records deleted successfully');
    } catch (e) {
        console.error('Error deleting user:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
