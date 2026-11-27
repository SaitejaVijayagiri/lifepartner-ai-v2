import { AstrologyService } from '../src/services/astrology';

describe('AstrologyService Kundli Milan', () => {
    const astrologyService = new AstrologyService();

    it('handles circular Bhakoot 12-rashi distances correctly across Pisces and Aries (2/12)', () => {
        // Ashwini -> Aries (rashi 0), Revati -> Pisces (rashi 11)
        const result = astrologyService.calculateCompatibility(
            { id: 'u1', full_name: 'Aarav', horoscope: { nakshatra: 'Ashwini' } },
            { id: 'u2', full_name: 'Meera', horoscope: { nakshatra: 'Revati' } }
        );

        const bhakoot = result.details.find(d => d.name === 'Bhakoot');
        expect(bhakoot).toBeDefined();
        expect(bhakoot.s).toBe(0);
        expect(bhakoot.v1).toBe('Aries');
        expect(bhakoot.v2).toBe('Pisces');
    });

    it('handles circular 6/8 Shadashtaka across Aries and Scorpio', () => {
        // Ashwini -> Aries (0), Anuradha -> Scorpio (7) -> rawDiff 7 -> circular dist 5 (6/8)
        const result = astrologyService.calculateCompatibility(
            { id: 'u1', horoscope: { nakshatra: 'Ashwini' } },
            { id: 'u2', horoscope: { nakshatra: 'Anuradha' } }
        );

        const bhakoot = result.details.find(d => d.name === 'Bhakoot');
        expect(bhakoot).toBeDefined();
        expect(bhakoot.s).toBe(0);
        expect(bhakoot.desc).toContain('6/8');
    });

    it('scores Samasaptak (1/7 across Aries and Libra) as auspicious 7/7 Bhakoot', () => {
        // Ashwini -> Aries (0), Swati -> Libra (6) -> circular dist 6
        const result = astrologyService.calculateCompatibility(
            { id: 'u1', horoscope: { nakshatra: 'Ashwini' } },
            { id: 'u2', horoscope: { nakshatra: 'Swati' } }
        );

        const bhakoot = result.details.find(d => d.name === 'Bhakoot');
        expect(bhakoot?.s).toBe(7);
        expect(result.score).toBeGreaterThanOrEqual(0);
        expect(result.score).toBeLessThanOrEqual(36);
    });

    it('resolves spelling aliases like Mrigashira, Dhanishtha, and Sanskrit Rashi names', () => {
        const idx1 = astrologyService.getNakshatraIndex('Mrigashira');
        const idx2 = astrologyService.getNakshatraIndex('Mrigashirsha');
        expect(idx1).toBe(4);
        expect(idx1).toBe(idx2);

        const idx3 = astrologyService.getNakshatraIndex('Dhanishtha');
        const idx4 = astrologyService.getNakshatraIndex('Dhanishta');
        expect(idx3).toBe(22);
        expect(idx3).toBe(idx4);

        const profileFromSanskrit = astrologyService.resolveUserAstrology({
            id: 'sanskrit-1',
            full_name: 'Kiran',
            horoscope: { zodiacSign: 'Mesha' }
        });
        expect(profileFromSanskrit.zodiacSign).toBe('Aries');
    });

    it('evaluates Manglik and Gothra compatibility from profile metadata', () => {
        const compat = astrologyService.calculateCompatibility(
            {
                id: 'a1',
                horoscope: { nakshatra: 'Rohini', manglik: 'No' },
                religion: { gothra: 'Kashyap' }
            },
            {
                id: 'b1',
                horoscope: { nakshatra: 'Rohini', manglik: 'Yes' },
                religion: { gothra: 'Bharadwaj' }
            }
        );

        expect(compat.manglikCompatible).toBe(false);
        expect(compat.gothraCompatible).toBe(true);
        expect(compat.astroA?.nakshatra).toBe('Rohini');
        expect(compat.astroB?.nakshatra).toBe('Rohini');
    });
});
