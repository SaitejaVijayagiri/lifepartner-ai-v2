import { prisma } from '../prisma';

/**
 * Checks whether a profile has completed genuine identity/selfie verification
 * (distinct from basic email/OTP account activation in `users.is_verified`).
 */
export function hasMetadataIdVerification(meta: any): boolean {
    if (!meta || typeof meta !== 'object') return false;
    return meta.id_verified === true;
}

/**
 * Batch-fetches user IDs that have an APPROVED identity verification request.
 * Safe against partial Prisma mocks in unit tests.
 */
export async function getApprovedVerificationUserIds(userIds: string[]): Promise<Set<string>> {
    const approved = new Set<string>();
    const cleanIds = Array.from(new Set(userIds.filter(Boolean)));
    if (cleanIds.length === 0) return approved;

    try {
        const vr = (prisma as any)?.verification_requests;
        if (vr && typeof vr.findMany === 'function') {
            const rows = await vr.findMany({
                where: {
                    user_id: { in: cleanIds },
                    status: 'APPROVED'
                },
                select: { user_id: true }
            });
            for (const row of rows || []) {
                if (row?.user_id) approved.add(row.user_id);
            }
        }
    } catch {
        // Non-fatal: callers still check metadata.id_verified
    }
    return approved;
}

/**
 * Resolves true ID verification status for a single user.
 */
export async function isUserIdVerified(userId: string, meta?: any): Promise<boolean> {
    if (hasMetadataIdVerification(meta)) return true;
    try {
        const vr = (prisma as any)?.verification_requests;
        if (vr && typeof vr.findFirst === 'function') {
            const approved = await vr.findFirst({
                where: { user_id: userId, status: 'APPROVED' },
                select: { id: true, status: true }
            });
            if (!approved) return false;
            return approved.status ? approved.status === 'APPROVED' : true;
        }
    } catch {
        return false;
    }
    return false;
}
