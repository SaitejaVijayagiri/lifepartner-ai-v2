import { generateCuriosityPush } from '../src/services/curiosityPush';
import { resolveUserTimezone } from '../src/services/timezoneHelper';

describe('Global Timezone & Non-Repeating Curiosity Push Engine', () => {
    it('resolves international timezones accurately beyond India', () => {
        expect(resolveUserTimezone({ country: 'United States', city: 'Los Angeles' })).toBe('America/Los_Angeles');
        expect(resolveUserTimezone({ country: 'United Kingdom', city: 'London' })).toBe('Europe/London');
        expect(resolveUserTimezone({ country: 'Germany', city: 'Berlin' })).toBe('Europe/Berlin');
        expect(resolveUserTimezone({ country: 'Japan', city: 'Tokyo' })).toBe('Asia/Tokyo');
        expect(resolveUserTimezone({ country: 'South Korea', city: 'Seoul' })).toBe('Asia/Seoul');
        expect(resolveUserTimezone({ country: 'Brazil', city: 'Sao Paulo' })).toBe('America/Sao_Paulo');
        expect(resolveUserTimezone({ country: 'Nigeria', city: 'Lagos' })).toBe('Africa/Lagos');
    });

    it('avoids repeating previously sent templates via recentTemplateIds', () => {
        const sentIds: string[] = [];
        const baseDate = new Date('2026-11-12T12:30:00Z'); // ~18:00 IST (evening slot)

        for (let i = 0; i < 4; i++) {
            const push = generateCuriosityPush(
                'Aarav',
                'Hyderabad',
                0,
                25,
                'verified women',
                'Male',
                'Asia/Kolkata',
                baseDate,
                {
                    userId: 'user-123',
                    country: 'India',
                    recentTemplateIds: [...sentIds]
                }
            );
            expect(sentIds).not.toContain(push.templateId);
            sentIds.push(push.templateId);
        }
    });

    it('never sends Guna or Chai templates to international Christian/Western users', () => {
        const recent: string[] = [];
        const eveningBerlin = new Date('2026-11-12T17:30:00Z'); // 18:30 CET

        for (let i = 0; i < 8; i++) {
            const push = generateCuriosityPush(
                'Hannah',
                'Berlin',
                0,
                20,
                'verified men',
                'Female',
                'Europe/Berlin',
                eveningBerlin,
                {
                    userId: 'german-user-1',
                    country: 'Germany',
                    religion: 'Christian',
                    recentTemplateIds: [...recent]
                }
            );
            recent.push(push.templateId);
            expect(push.title.toLowerCase()).not.toContain('guna');
            expect(push.body.toLowerCase()).not.toContain('guna');
            expect(push.title.toLowerCase()).not.toContain('chai');
            expect(push.body.toLowerCase()).not.toContain('chai');
        }
    });
});
