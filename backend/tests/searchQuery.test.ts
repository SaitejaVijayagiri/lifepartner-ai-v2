import { AIService } from '../src/services/ai';

describe('AIService.parseSearchQuery - Country & Demonym Parsing', () => {
    let aiService: AIService;

    beforeAll(() => {
        aiService = new AIService();
    });

    it('correctly maps "indian girls" to targetGender Female and location India without setting exactName', async () => {
        const filters = await aiService.parseSearchQuery('indian girls');
        expect(filters.targetGender).toBe('Female');
        expect(filters.location).toBe('India');
        expect(filters.exactName).toBeUndefined();
    });

    it('correctly maps "indian brides" to targetGender Female and location India without setting exactName', async () => {
        const filters = await aiService.parseSearchQuery('indian brides');
        expect(filters.targetGender).toBe('Female');
        expect(filters.location).toBe('India');
        expect(filters.exactName).toBeUndefined();
    });

    it('correctly maps "korean girls" to location Korea and targetGender Female', async () => {
        const filters = await aiService.parseSearchQuery('korean girls');
        expect(filters.targetGender).toBe('Female');
        expect(filters.location).toBe('Korea');
        expect(filters.exactName).toBeUndefined();
    });

    it('correctly maps "american women" to location United States and targetGender Female', async () => {
        const filters = await aiService.parseSearchQuery('american women');
        expect(filters.targetGender).toBe('Female');
        expect(filters.location).toBe('United States');
        expect(filters.exactName).toBeUndefined();
    });

    it('preserves real personal names for direct name search (e.g. "Priya Sharma")', async () => {
        const filters = await aiService.parseSearchQuery('Priya Sharma');
        expect(filters.exactName).toBe('Priya Sharma');
    });
});
