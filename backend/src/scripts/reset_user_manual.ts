import { pool } from '../db';

async function resetUser(email: string) {
    const client = await pool.connect();
    try {
        console.log(`Searching for user: ${email}...`);
        const res = await client.query("SELECT id FROM public.users WHERE email = $1", [email]);

        if (res.rows.length === 0) {
            console.log(`User ${email} not found.`);
            return;
        }

        const userId = res.rows[0].id;
        console.log(`Found User ID: ${userId}. Starting cascade deletion...`);

        await client.query('BEGIN');

        // 1. Delete dependent data first
        // Messages (Sender)
        await client.query("DELETE FROM public.messages WHERE sender_id = $1", [userId]);
        // Messages (Match context - harder to filter, but matches deletion will cascade usually or leave orphans. 
        // Ideally we select matches first, but let's stick to direct user links for now)

        // Matches
        await client.query("DELETE FROM public.matches WHERE user_a_id = $1 OR user_b_id = $1", [userId]);

        // Interactions
        await client.query("DELETE FROM public.interactions WHERE from_user_id = $1 OR to_user_id = $1", [userId]);

        // Economy
        await client.query("DELETE FROM public.transactions WHERE user_id = $1", [userId]);

        // Content (Reels, Comments, Likes)
        await client.query("DELETE FROM public.reel_comments WHERE user_id = $1", [userId]);
        await client.query("DELETE FROM public.reel_likes WHERE user_id = $1", [userId]);
        await client.query("DELETE FROM public.reels WHERE user_id = $1", [userId]);

        // Games
        // Wrap in try-catch with SAVEPOINT to avoid aborting the main transaction
        try {
            await client.query("SAVEPOINT game_deletion");
            await client.query("DELETE FROM public.games WHERE p1_id = $1 OR p2_id = $1", [userId]);
            await client.query("RELEASE SAVEPOINT game_deletion");
        } catch (err: any) {
            await client.query("ROLLBACK TO SAVEPOINT game_deletion");
            console.warn("⚠️ Could not delete games (Schema mismatch?):", err.message);
        }

        // Device Tokens & Notifications (wrap in SAVEPOINT for resilience)
        try {
            await client.query("SAVEPOINT tokens_deletion");
            await client.query("DELETE FROM public.device_tokens WHERE user_id = $1", [userId]);
            await client.query("DELETE FROM public.notifications WHERE user_id = $1", [userId]);
            await client.query("RELEASE SAVEPOINT tokens_deletion");
        } catch (err: any) {
            await client.query("ROLLBACK TO SAVEPOINT tokens_deletion");
            console.warn("⚠️ Could not delete tokens/notifications:", err.message);
        }

        // Reports & Calls (wrap in SAVEPOINT for resilience)
        try {
            await client.query("SAVEPOINT reports_deletion");
            await client.query("DELETE FROM public.reports WHERE reporter_id = $1 OR target_id = $1", [userId]);
            await client.query("DELETE FROM public.call_logs WHERE caller_id = $1 OR receiver_id = $1", [userId]);
            await client.query("RELEASE SAVEPOINT reports_deletion");
        } catch (err: any) {
            await client.query("ROLLBACK TO SAVEPOINT reports_deletion");
            console.warn("⚠️ Could not delete reports/calls:", err.message);
        }

        // 2. Delete Profile
        await client.query("DELETE FROM public.profiles WHERE user_id = $1", [userId]);

        // 3. Delete User
        await client.query("DELETE FROM public.users WHERE id = $1", [userId]);

        await client.query('COMMIT');
        console.log(`✅ Successfully deleted user: ${email}`);

    } catch (e) {
        await client.query('ROLLBACK');
        console.error("❌ Error deleting user:", e);
    } finally {
        client.release();
        process.exit(0);
    }
}

// Run with email provided in code
const emailToDelete = 'saitejavijayagiri@gmail.com';
resetUser(emailToDelete);
