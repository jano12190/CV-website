class BatchProcessor {
    constructor(aiAnalyzer) {
        this.aiAnalyzer = aiAnalyzer;
        this.requestQueue = [];
        this.processingQueue = false;
        this.batchSize = 5;
        this.batchDelay = 2000; // 2 second delay between batches
    }

    async queueRequest(type, data) {
        return new Promise((resolve, reject) => {
            this.requestQueue.push({
                type,
                data,
                resolve,
                reject,
                timestamp: Date.now()
            });
            
            this.processQueue();
        });
    }

    async processQueue() {
        if (this.processingQueue || this.requestQueue.length === 0) return;
        
        this.processingQueue = true;
        
        while (this.requestQueue.length > 0) {
            const batch = this.requestQueue.splice(0, this.batchSize);
            
            // Group similar requests
            const grouped = this.groupSimilarRequests(batch);
            
            for (const [type, requests] of grouped.entries()) {
                try {
                    if (type === 'specs' && requests.length > 1) {
                        await this.processBatchSpecs(requests);
                    } else {
                        // Process individually for mixed types
                        for (const request of requests) {
                            await this.processIndividualRequest(request);
                        }
                    }
                } catch (error) {
                    console.error('Batch processing error:', error);
                    requests.forEach(req => req.reject(error));
                }
            }
            
            // Rate limiting between batches
            if (this.requestQueue.length > 0) {
                await new Promise(resolve => setTimeout(resolve, this.batchDelay));
            }
        }
        
        this.processingQueue = false;
    }

    groupSimilarRequests(batch) {
        const grouped = new Map();
        
        batch.forEach(request => {
            if (!grouped.has(request.type)) {
                grouped.set(request.type, []);
            }
            grouped.get(request.type).push(request);
        });
        
        return grouped;
    }

    async processBatchSpecs(requests) {
        // Combine multiple product spec requests into one AI call
        const products = requests.map(req => req.data.productName);
        const combinedData = requests.flatMap(req => req.data.scrapedData);
        
        const batchPrompt = `Analyze these audio products from forum data:
Products: ${products.join(', ')}

Data: ${combinedData.slice(0, 20).map(item => `${item.title}: ${item.content.slice(0, 200)}`).join('\n\n')}

Return JSON array with specs for each product:
[
  {"product": "${products[0]}", "specs": {...}, "sound": {...}},
  {"product": "${products[1]}", "specs": {...}, "sound": {...}}
]`;

        try {
            const response = await this.aiAnalyzer.anthropic.messages.create({
                model: "claude-3-5-haiku-20241022",
                max_tokens: 2000,
                temperature: 0.3,
                system: "Extract audio specs efficiently. Keep responses concise.",
                messages: [{ role: "user", content: batchPrompt }]
            });

            const results = JSON.parse(response.content[0].text);
            
            // Distribute results back to requests
            requests.forEach((request, index) => {
                const result = results.find(r => r.product === request.data.productName) || results[index];
                if (result) {
                    request.resolve({
                        ...result,
                        productName: request.data.productName,
                        lastUpdated: new Date(),
                        sourceCount: request.data.scrapedData.length
                    });
                } else {
                    request.reject(new Error('No result found for product'));
                }
            });
            
        } catch (error) {
            requests.forEach(req => req.reject(error));
        }
    }

    async processIndividualRequest(request) {
        try {
            let result;
            switch (request.type) {
                case 'specs':
                    result = await this.aiAnalyzer.extractAudioSpecs(
                        request.data.productName, 
                        request.data.scrapedData
                    );
                    break;
                case 'pairing':
                    result = await this.aiAnalyzer.generatePairingRecommendations(
                        request.data.speakerSpecs,
                        request.data.ampSpecs,
                        request.data.preferences
                    );
                    break;
                default:
                    throw new Error(`Unknown request type: ${request.type}`);
            }
            request.resolve(result);
        } catch (error) {
            request.reject(error);
        }
    }
}

module.exports = BatchProcessor;