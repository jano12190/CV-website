const Anthropic = require('@anthropic-ai/sdk');

class AIAnalyzer {
    constructor(apiKey) {
        this.anthropic = new Anthropic({
            apiKey: apiKey || process.env.ANTHROPIC_API_KEY
        });
    }

    async extractAudioSpecs(productName, scrapedData) {
        const relevantContent = scrapedData
            .filter(item => item.content && item.content.length > 50)
            .slice(0, 10)
            .map(item => `${item.title}\n${item.content}`)
            .join('\n\n');

        const prompt = `Analyze the following audiophile forum discussions about "${productName}" and extract key specifications and characteristics:

${relevantContent}

Please extract and format the following information in JSON format:
{
  "specifications": {
    "impedance": "value in ohms or range",
    "sensitivity": "value in dB",
    "powerHandling": "value in watts",
    "frequencyResponse": "range in Hz",
    "driverType": "driver configuration",
    "dimensions": "size information"
  },
  "soundCharacteristics": {
    "signature": "warm/neutral/bright/v-shaped",
    "bassResponse": "description",
    "midrange": "description",
    "treble": "description",
    "soundstage": "description",
    "imaging": "description"
  },
  "userExperiences": [
    "key positive points from user reviews",
    "common criticisms or limitations",
    "recommended use cases"
  ],
  "compatibilityNotes": [
    "amplifier requirements or recommendations",
    "room size considerations", 
    "genre preferences"
  ]
}

Focus on factual information from the discussions. If information is not available, use "unknown" as the value.`;

        try {
            const response = await this.anthropic.messages.create({
                model: "claude-3-5-haiku-20241022",
                max_tokens: 1500,
                temperature: 0.3,
                system: "You are an expert audiophile with deep knowledge of audio equipment specifications and sound characteristics. Extract accurate technical information from forum discussions.",
                messages: [
                    {
                        role: "user",
                        content: prompt
                    }
                ]
            });

            return JSON.parse(response.content[0].text);
        } catch (error) {
            console.error('AI analysis error:', error);
            return this.getFallbackSpecs(productName);
        }
    }

    async generatePairingRecommendations(speakerSpecs, ampSpecs, userPreferences) {
        const prompt = `As an expert audiophile, analyze this speaker and amplifier pairing:

SPEAKER: ${JSON.stringify(speakerSpecs, null, 2)}

AMPLIFIER: ${JSON.stringify(ampSpecs, null, 2)}

USER PREFERENCES: ${JSON.stringify(userPreferences, null, 2)}

Provide a detailed pairing analysis in the following JSON format:
{
  "compatibilityScore": 85,
  "overallAssessment": "Excellent pairing with great synergy",
  "technicalMatch": {
    "impedanceMatch": "analysis of impedance compatibility",
    "powerMatch": "analysis of power requirements vs output",
    "sensitivityMatch": "sensitivity and efficiency considerations"
  },
  "soundQuality": {
    "expectedSignature": "predicted sound signature of the combination",
    "strengths": ["strength 1", "strength 2"],
    "potentialWeaknesses": ["weakness 1", "weakness 2"],
    "genreRecommendations": ["genres that work well", "genres to avoid"]
  },
  "practicalConsiderations": {
    "roomSize": "recommended room size",
    "placement": "speaker placement recommendations",
    "additionalEquipment": ["suggested accessories or upgrades"]
  },
  "alternativeRecommendations": [
    {
      "product": "alternative amp/speaker name",
      "reason": "why this might be better",
      "tradeoffs": "what you gain/lose"
    }
  ]
}

Base your analysis on the technical specifications and user experiences provided. Be honest about potential issues while highlighting strengths.`;

        try {
            const response = await this.anthropic.messages.create({
                model: "claude-3-5-haiku-20241022",
                max_tokens: 2000,
                temperature: 0.4,
                system: "You are a seasoned audiophile consultant with expertise in matching speakers and amplifiers. Provide balanced, technical, and practical advice.",
                messages: [
                    {
                        role: "user",
                        content: prompt
                    }
                ]
            });

            return JSON.parse(response.content[0].text);
        } catch (error) {
            console.error('Pairing analysis error:', error);
            return this.getFallbackPairing();
        }
    }

    async suggestSimilarProducts(productSpecs, productType) {
        const prompt = `Based on these ${productType} specifications and characteristics:

${JSON.stringify(productSpecs, null, 2)}

Suggest 5 similar products that share comparable sound signatures, specifications, or user appeal. Format as JSON:

{
  "suggestions": [
    {
      "name": "Product Name",
      "similarity": "why it's similar",
      "differences": "key differences",
      "priceCategory": "budget/mid-range/high-end"
    }
  ]
}

Focus on products that audiophiles commonly cross-shop or consider as alternatives.`;

        try {
            const response = await this.anthropic.messages.create({
                model: "claude-3-5-haiku-20241022",
                max_tokens: 800,
                temperature: 0.5,
                system: "You are knowledgeable about audio equipment and market alternatives.",
                messages: [
                    {
                        role: "user",
                        content: prompt
                    }
                ]
            });

            return JSON.parse(response.content[0].text);
        } catch (error) {
            console.error('Suggestion error:', error);
            return { suggestions: [] };
        }
    }

    getFallbackSpecs(productName) {
        return {
            specifications: {
                impedance: "unknown",
                sensitivity: "unknown", 
                powerHandling: "unknown",
                frequencyResponse: "unknown",
                driverType: "unknown",
                dimensions: "unknown"
            },
            soundCharacteristics: {
                signature: "unknown",
                bassResponse: "unknown",
                midrange: "unknown", 
                treble: "unknown",
                soundstage: "unknown",
                imaging: "unknown"
            },
            userExperiences: [`Limited data available for ${productName}`],
            compatibilityNotes: ["Recommend researching specific requirements"]
        };
    }

    getFallbackPairing() {
        return {
            compatibilityScore: 50,
            overallAssessment: "Unable to analyze - insufficient data",
            technicalMatch: {
                impedanceMatch: "unknown",
                powerMatch: "unknown", 
                sensitivityMatch: "unknown"
            },
            soundQuality: {
                expectedSignature: "unknown",
                strengths: ["Unable to determine"],
                potentialWeaknesses: ["Insufficient data for analysis"],
                genreRecommendations: ["Research needed"]
            },
            practicalConsiderations: {
                roomSize: "unknown",
                placement: "standard placement recommendations apply",
                additionalEquipment: []
            },
            alternativeRecommendations: []
        };
    }
}

module.exports = AIAnalyzer;