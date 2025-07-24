const AudioScraper = require('./scraper');
const AIAnalyzer = require('./aiAnalyzer');
const PersistentCache = require('./dataCache');
const TextOptimizer = require('./textOptimizer');
const BatchProcessor = require('./batchProcessor');

class PairingEngine {
    constructor() {
        this.scraper = new AudioScraper();
        this.analyzer = new AIAnalyzer();
        this.cache = new PersistentCache('./cache');
        this.batchProcessor = new BatchProcessor(this.analyzer);
        this.productDatabase = new Map();
    }

    async initialize() {
        await this.scraper.init();
    }

    async shutdown() {
        await this.scraper.close();
    }

    async getProductSpecs(productName, productType) {
        const cacheKey = `specs_${productType}_${productName.replace(/[^a-zA-Z0-9]/g, '_')}`;
        let specs = await this.cache.get(cacheKey);
        
        if (!specs) {
            console.log(`Fetching fresh data for ${productName}...`);
            
            const scrapedData = await this.scraper.scrapeAllSources(productName);
            const optimizedContent = TextOptimizer.extractRelevantContent(scrapedData, 1500);
            
            // Use batch processor for efficiency
            specs = await this.batchProcessor.queueRequest('specs', {
                productName,
                scrapedData: optimizedContent
            });
            
            specs.productName = productName;
            specs.productType = productType;
            specs.lastUpdated = new Date();
            specs.sourceCount = scrapedData.length;
            
            await this.cache.set(cacheKey, specs);
            this.productDatabase.set(productName, specs);
        }
        
        return specs;
    }

    async generatePairing(speakerModel, ampModel, userPreferences = {}) {
        try {
            const cacheKey = `pairing_${speakerModel}_${ampModel}_${JSON.stringify(userPreferences)}`;
            let pairingResult = this.cache.get(cacheKey);
            
            if (!pairingResult) {
                console.log(`Analyzing pairing: ${speakerModel} + ${ampModel}...`);
                
                const [speakerSpecs, ampSpecs] = await Promise.all([
                    this.getProductSpecs(speakerModel, 'speaker'),
                    this.getProductSpecs(ampModel, 'amplifier')
                ]);

                const pairingAnalysis = await this.analyzer.generatePairingRecommendations(
                    speakerSpecs, 
                    ampSpecs, 
                    userPreferences
                );

                pairingResult = {
                    speaker: speakerSpecs,
                    amplifier: ampSpecs,
                    analysis: pairingAnalysis,
                    userPreferences,
                    generatedAt: new Date()
                };
                
                this.cache.set(cacheKey, pairingResult);
            }
            
            return pairingResult;
        } catch (error) {
            console.error('Pairing generation error:', error);
            throw new Error('Unable to generate pairing analysis');
        }
    }

    async findSimilarProducts(productName, productType, limit = 5) {
        try {
            const specs = await this.getProductSpecs(productName, productType);
            const suggestions = await this.analyzer.suggestSimilarProducts(specs, productType);
            
            return suggestions.suggestions.slice(0, limit);
        } catch (error) {
            console.error('Similar products error:', error);
            return [];
        }
    }

    async searchRecommendations(criteria) {
        const {
            budget,
            soundSignature,
            roomSize,
            primaryGenres,
            powerRequirement,
            impedancePreference
        } = criteria;

        const searchTerms = [
            soundSignature && `${soundSignature} sound signature`,
            budget && `${budget} budget`,
            roomSize && `${roomSize} room`,
            primaryGenres && primaryGenres.join(' '),
        ].filter(Boolean);

        try {
            const scrapedData = await this.scraper.scrapeAllSources(searchTerms.join(' '));
            
            const recommendations = await this.analyzer.generateSearchRecommendations(
                scrapedData,
                criteria
            );

            return recommendations;
        } catch (error) {
            console.error('Search recommendations error:', error);
            return { speakers: [], amplifiers: [] };
        }
    }

    calculateCompatibilityScore(speakerSpecs, ampSpecs) {
        let score = 0;
        let factors = 0;

        if (speakerSpecs.specifications.impedance !== 'unknown' && 
            ampSpecs.specifications.impedance !== 'unknown') {
            const speakerImp = this.parseImpedance(speakerSpecs.specifications.impedance);
            const ampImp = this.parseImpedance(ampSpecs.specifications.impedance);
            
            if (speakerImp >= 4 && ampImp >= speakerImp * 0.5) {
                score += 25;
            } else if (speakerImp >= 4) {
                score += 15;
            }
            factors++;
        }

        if (speakerSpecs.specifications.powerHandling !== 'unknown' && 
            ampSpecs.specifications.powerOutput !== 'unknown') {
            const speakerPower = this.parsePower(speakerSpecs.specifications.powerHandling);
            const ampPower = this.parsePower(ampSpecs.specifications.powerOutput);
            
            if (ampPower >= speakerPower * 0.5 && ampPower <= speakerPower * 2) {
                score += 25;
            } else if (ampPower >= speakerPower * 0.3) {
                score += 15;
            }
            factors++;
        }

        if (speakerSpecs.soundCharacteristics.signature !== 'unknown' && 
            ampSpecs.soundCharacteristics.signature !== 'unknown') {
            const speakerSig = speakerSpecs.soundCharacteristics.signature.toLowerCase();
            const ampSig = ampSpecs.soundCharacteristics.signature.toLowerCase();
            
            if (this.isComplementarySignature(speakerSig, ampSig)) {
                score += 25;
            } else if (speakerSig === ampSig) {
                score += 20;
            } else {
                score += 10;
            }
            factors++;
        }

        if (factors > 0) {
            return Math.round(score / Math.max(factors, 3) * 3);
        }
        
        return 50; // Default neutral score
    }

    parseImpedance(impedanceStr) {
        const match = impedanceStr.match(/(\d+)/);
        return match ? parseInt(match[1]) : 8;
    }

    parsePower(powerStr) {
        const match = powerStr.match(/(\d+)/);
        return match ? parseInt(match[1]) : 50;
    }

    isComplementarySignature(speaker, amp) {
        const complementaryPairs = [
            ['bright', 'warm'],
            ['warm', 'bright'],
            ['analytical', 'musical'],
            ['musical', 'analytical']
        ];
        
        return complementaryPairs.some(([a, b]) => 
            speaker.includes(a) && amp.includes(b)
        );
    }

    getRecentlyAnalyzed(limit = 10) {
        const recent = [];
        for (const [key, value] of this.cache.keys()) {
            if (key.startsWith('pairing_')) {
                const data = this.cache.get(key);
                if (data) {
                    recent.push({
                        speaker: data.speaker.productName,
                        amplifier: data.amplifier.productName,
                        score: data.analysis.compatibilityScore,
                        analyzedAt: data.generatedAt
                    });
                }
            }
        }
        
        return recent
            .sort((a, b) => new Date(b.analyzedAt) - new Date(a.analyzedAt))
            .slice(0, limit);
    }

    getCacheStats() {
        return {
            cacheSize: this.cache.keys().length,
            productsCached: this.productDatabase.size,
            hitRatio: this.cache.getStats()
        };
    }
}

module.exports = PairingEngine;