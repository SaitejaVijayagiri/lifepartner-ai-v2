/**
 * One-off backfill script: geocode city → lat/lng for all users who have a
 * city in their profile metadata but no GPS coordinates.
 *
 * Usage: npx ts-node --transpile-only scripts/backfill_geocode.ts
 */

import dotenv from 'dotenv';
dotenv.config();

import { Pool } from 'pg';
import axios from 'axios';

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

const cache = new Map<string, { lat: number; lng: number }>();

async function geocodeCity(cityQuery: string): Promise<{ lat: number; lng: number } | null> {
    const key = cityQuery.trim().toLowerCase();
    if (cache.has(key)) return cache.get(key)!;

    try {
        const res = await axios.get(
            `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(key)}&format=json&limit=1`,
            {
                headers: { 'User-Agent': 'LifePartnerAI-BackfillScript/1.0' },
                timeout: 5000
            }
        );
        if (res.data && res.data.length > 0) {
            const coords = { lat: parseFloat(res.data[0].lat), lng: parseFloat(res.data[0].lon) };
            cache.set(key, coords);
            return coords;
        }
    } catch (e) {
        // Silently skip
    }
    return null;
}

async function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
    const client = await pool.connect();
    try {
        // Fetch all profiles that have a location city but no lat/lng
        const { rows } = await client.query(`
            SELECT u.id, u.city, u.state, p.metadata
            FROM users u
            LEFT JOIN profiles p ON u.id = p.user_id
            WHERE (
                (p.metadata->'location'->>'city' IS NOT NULL AND p.metadata->'location'->>'city' != '')
                OR (u.city IS NOT NULL AND u.city != '')
            )
            AND (
                p.metadata->'location'->>'lat' IS NULL OR p.metadata->'location'->>'lat' = ''
            )
        `);

        console.log(`\n📍 Found ${rows.length} users without coordinates. Starting backfill...\n`);

        let success = 0;
        let failed = 0;

        for (const row of rows) {
            const meta = row.metadata || {};
            const loc = meta.location || {};

            const city = loc.city || row.city || '';
            const state = loc.state || row.state || '';

            if (!city) { failed++; continue; }

            const query = [city, state].filter(Boolean).join(', ');
            const coords = await geocodeCity(query);

            if (coords) {
                // Merge coords into existing location metadata
                const updatedLoc = { ...loc, lat: coords.lat, lng: coords.lng, city };
                const updatedMeta = { ...meta, location: updatedLoc };

                await client.query(
                    `UPDATE profiles SET metadata = $1::jsonb WHERE user_id = $2`,
                    [JSON.stringify(updatedMeta), row.id]
                );
                console.log(`  ✅ ${city}, ${state} → ${coords.lat}, ${coords.lng}`);
                success++;
            } else {
                console.log(`  ⚠️  Could not geocode: "${query}"`);
                failed++;
            }

            // Nominatim rate limit: 1 request/second
            await sleep(1100);
        }

        console.log(`\n✅ Done! ${success} geocoded, ${failed} skipped/failed.`);
    } finally {
        client.release();
        await pool.end();
    }
}

main();
