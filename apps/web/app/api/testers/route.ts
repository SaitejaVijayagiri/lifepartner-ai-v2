import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

interface TesterRecord {
    id: string;
    email: string;
    name?: string;
    status: 'pending' | 'added_to_console' | 'opted_in';
    source: string;
    createdAt: string;
    updatedAt: string;
}

function getDataFilePath(): string {
    const candidates = [
        path.join(process.cwd(), 'apps', 'web', 'data', 'beta_testers.json'),
        path.join(process.cwd(), 'data', 'beta_testers.json'),
        path.join(process.cwd(), 'beta_testers.json')
    ];
    for (const p of candidates) {
        if (fs.existsSync(p)) return p;
    }
    return candidates[0];
}

function readTesters(): TesterRecord[] {
    try {
        const filePath = getDataFilePath();
        if (!fs.existsSync(filePath)) {
            const dir = path.dirname(filePath);
            if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
            fs.writeFileSync(filePath, JSON.stringify([], null, 2), 'utf-8');
            return [];
        }
        const raw = fs.readFileSync(filePath, 'utf-8');
        return JSON.parse(raw || '[]');
    } catch (err) {
        console.error('[API Testers] Error reading testers file:', err);
        return [];
    }
}

function writeTesters(testers: TesterRecord[]): void {
    try {
        const filePath = getDataFilePath();
        const dir = path.dirname(filePath);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(filePath, JSON.stringify(testers, null, 2), 'utf-8');
    } catch (err) {
        console.error('[API Testers] Error writing testers file:', err);
    }
}

// Background sync to Supabase if credentials exist
async function syncToSupabase(record: TesterRecord) {
    try {
        const supabaseUrl = process.env.SUPABASE_URL || 'https://mxzflpidclfcdqrgimqn.supabase.co';
        const supabaseKey = process.env.SUPABASE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
        if (!supabaseKey) return;

        await fetch(`${supabaseUrl}/rest/v1/contact_inquiries`, {
            method: 'POST',
            headers: {
                'apikey': supabaseKey,
                'Authorization': `Bearer ${supabaseKey}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=minimal'
            },
            body: JSON.stringify({
                name: record.name || 'Play Store Tester',
                email: record.email,
                message: `[Google Play Closed Beta Tester] - Opted in from landing page (Status: ${record.status})`,
                status: record.status
            })
        });
    } catch (err) {
        // Non-blocking sync error
        console.warn('[API Testers] Supabase sync skipped/failed:', err);
    }
}

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const format = searchParams.get('format');
        const testers = readTesters();

        const emails = testers.map(t => t.email.trim().toLowerCase());
        const commaSeparated = emails.join(', ');

        if (format === 'text') {
            return new NextResponse(commaSeparated, {
                status: 200,
                headers: { 'Content-Type': 'text/plain; charset=utf-8' }
            });
        }

        if (format === 'csv') {
            const csvRows = [
                'Email,Name,Status,DateRegistered',
                ...testers.map(t => `"${t.email}","${t.name || ''}","${t.status}","${t.createdAt}"`)
            ];
            return new NextResponse(csvRows.join('\n'), {
                status: 200,
                headers: {
                    'Content-Type': 'text/csv; charset=utf-8',
                    'Content-Disposition': 'attachment; filename="google_play_testers.csv"'
                }
            });
        }

        return NextResponse.json({
            success: true,
            count: testers.length,
            testers,
            commaSeparated,
            instructions: {
                playConsoleUrl: "https://play.google.com/console",
                webTestingUrl: "https://play.google.com/apps/testing/com.lifepartner.ai",
                playStoreUrl: "https://play.google.com/store/apps/details?id=com.lifepartner.ai"
            }
        });
    } catch (err: any) {
        console.error('[API Testers GET Error]:', err);
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const rawEmail = body.email;
        const name = body.name ? String(body.name).trim() : 'Play Store Tester';

        if (!rawEmail || typeof rawEmail !== 'string' || !rawEmail.includes('@')) {
            return NextResponse.json(
                { success: false, error: 'Please enter a valid Google Play email address (Gmail).' },
                { status: 400 }
            );
        }

        const normalizedEmail = rawEmail.trim().toLowerCase();
        const testers = readTesters();

        const existingIndex = testers.findIndex(t => t.email.toLowerCase() === normalizedEmail);

        let record: TesterRecord;

        if (existingIndex >= 0) {
            record = testers[existingIndex];
            record.updatedAt = new Date().toISOString();
        } else {
            record = {
                id: 'tester_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
                email: normalizedEmail,
                name,
                status: 'pending',
                source: 'landing_page',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            testers.unshift(record);
        }

        writeTesters(testers);

        // Fire-and-forget sync to Supabase / Backend
        syncToSupabase(record);

        return NextResponse.json({
            success: true,
            alreadyRegistered: existingIndex >= 0,
            message: existingIndex >= 0
                ? "You're already in our tester database! We will ensure your email is added to Google Play Console."
                : "Thank you for joining as a tester! We will add your email to Google Play Console.",
            record,
            playStoreUrl: "https://play.google.com/store/apps/details?id=com.lifepartner.ai",
            webTestingUrl: "https://play.google.com/apps/testing/com.lifepartner.ai",
            directApkUrl: "/LifePartner.apk"
        });
    } catch (err: any) {
        console.error('[API Testers POST Error]:', err);
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}

export async function PATCH(req: NextRequest) {
    try {
        const body = await req.json();
        const { id, email, status } = body;

        if (!status) {
            return NextResponse.json({ success: false, error: 'Status is required' }, { status: 400 });
        }

        const testers = readTesters();
        const index = testers.findIndex(t => (id && t.id === id) || (email && t.email.toLowerCase() === email.toLowerCase()));

        if (index === -1) {
            return NextResponse.json({ success: false, error: 'Tester not found' }, { status: 404 });
        }

        testers[index].status = status;
        testers[index].updatedAt = new Date().toISOString();
        writeTesters(testers);

        return NextResponse.json({ success: true, tester: testers[index] });
    } catch (err: any) {
        console.error('[API Testers PATCH Error]:', err);
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');
        const email = searchParams.get('email');

        if (!id && !email) {
            return NextResponse.json({ success: false, error: 'ID or email required' }, { status: 400 });
        }

        let testers = readTesters();
        testers = testers.filter(t => {
            if (id && t.id === id) return false;
            if (email && t.email.toLowerCase() === email.toLowerCase()) return false;
            return true;
        });

        writeTesters(testers);
        return NextResponse.json({ success: true, count: testers.length });
    } catch (err: any) {
        console.error('[API Testers DELETE Error]:', err);
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}
