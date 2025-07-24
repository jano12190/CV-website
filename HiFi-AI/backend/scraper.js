const puppeteer = require('puppeteer');
const cheerio = require('cheerio');
const axios = require('axios');

class AudioScraper {
    constructor() {
        this.browser = null;
        this.rateLimiter = new Map();
    }

    async init() {
        this.browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
    }

    async close() {
        if (this.browser) {
            await this.browser.close();
        }
    }

    async rateLimit(domain, delayMs = 2000) {
        const now = Date.now();
        const lastRequest = this.rateLimiter.get(domain) || 0;
        const timeSinceLastRequest = now - lastRequest;
        
        if (timeSinceLastRequest < delayMs) {
            await new Promise(resolve => setTimeout(resolve, delayMs - timeSinceLastRequest));
        }
        
        this.rateLimiter.set(domain, Date.now());
    }

    async scrapeRedditAudiophile(searchTerms) {
        try {
            await this.rateLimit('reddit.com');
            const results = [];
            
            for (const term of searchTerms) {
                const url = `https://www.reddit.com/r/audiophile/search.json?q=${encodeURIComponent(term)}&restrict_sr=1&limit=25`;
                
                const response = await axios.get(url, {
                    headers: {
                        'User-Agent': 'AudioPairingBot/1.0'
                    }
                });

                if (response.data && response.data.data && response.data.data.children) {
                    for (const post of response.data.data.children) {
                        const postData = post.data;
                        results.push({
                            title: postData.title,
                            content: postData.selftext,
                            score: postData.score,
                            comments: postData.num_comments,
                            url: `https://reddit.com${postData.permalink}`,
                            source: 'r/audiophile',
                            searchTerm: term,
                            timestamp: new Date(postData.created_utc * 1000)
                        });
                    }
                }
                
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
            
            return results;
        } catch (error) {
            console.error('Reddit scraping error:', error.message);
            return [];
        }
    }

    async scrapeHeadFi(searchTerms) {
        try {
            if (!this.browser) await this.init();
            await this.rateLimit('head-fi.org');
            
            const page = await this.browser.newPage();
            const results = [];
            
            for (const term of searchTerms) {
                try {
                    const searchUrl = `https://www.head-fi.org/search/?q=${encodeURIComponent(term)}&c[node]=3`;
                    await page.goto(searchUrl, { waitUntil: 'networkidle2' });
                    
                    const content = await page.content();
                    const $ = cheerio.load(content);
                    
                    $('.contentRow-title').each((i, element) => {
                        const title = $(element).text().trim();
                        const link = $(element).find('a').attr('href');
                        const snippet = $(element).closest('.contentRow').find('.contentRow-snippet').text().trim();
                        
                        if (title && link) {
                            results.push({
                                title,
                                content: snippet,
                                url: link.startsWith('http') ? link : `https://www.head-fi.org${link}`,
                                source: 'Head-Fi',
                                searchTerm: term,
                                timestamp: new Date()
                            });
                        }
                    });
                    
                    await new Promise(resolve => setTimeout(resolve, 2000));
                } catch (pageError) {
                    console.error(`Head-Fi page error for ${term}:`, pageError.message);
                }
            }
            
            await page.close();
            return results;
        } catch (error) {
            console.error('Head-Fi scraping error:', error.message);
            return [];
        }
    }

    async scrapeASR(searchTerms) {
        try {
            if (!this.browser) await this.init();
            await this.rateLimit('audiosciencereview.com');
            
            const page = await this.browser.newPage();
            const results = [];
            
            for (const term of searchTerms) {
                try {
                    const searchUrl = `https://www.audiosciencereview.com/forum/search/?q=${encodeURIComponent(term)}&c[node]=6`;
                    await page.goto(searchUrl, { waitUntil: 'networkidle2' });
                    
                    const content = await page.content();
                    const $ = cheerio.load(content);
                    
                    $('.contentRow-title').each((i, element) => {
                        const title = $(element).text().trim();
                        const link = $(element).find('a').attr('href');
                        const snippet = $(element).closest('.contentRow').find('.contentRow-snippet').text().trim();
                        
                        if (title && link) {
                            results.push({
                                title,
                                content: snippet,
                                url: link.startsWith('http') ? link : `https://www.audiosciencereview.com${link}`,
                                source: 'AudioScienceReview',
                                searchTerm: term,
                                timestamp: new Date()
                            });
                        }
                    });
                    
                    await new Promise(resolve => setTimeout(resolve, 2000));
                } catch (pageError) {
                    console.error(`ASR page error for ${term}:`, pageError.message);
                }
            }
            
            await page.close();
            return results;
        } catch (error) {
            console.error('ASR scraping error:', error.message);
            return [];
        }
    }

    async scrapeAllSources(speakerModel, ampModel) {
        const searchTerms = [
            `${speakerModel} ${ampModel}`,
            `${speakerModel} pairing`,
            `${ampModel} speakers`,
            speakerModel,
            ampModel
        ].filter(Boolean);

        const [redditResults, headFiResults, asrResults] = await Promise.all([
            this.scrapeRedditAudiophile(searchTerms),
            this.scrapeHeadFi(searchTerms),
            this.scrapeASR(searchTerms)
        ]);

        return [...redditResults, ...headFiResults, ...asrResults]
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    }
}

module.exports = AudioScraper;