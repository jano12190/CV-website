# AI HiFi - Intelligent Audio Pairing

AI-powered speaker and amplifier pairing recommendations based on real audiophile experiences from forums and reviews.

## Features

🤖 **AI-Powered Analysis**: Uses Claude AI to analyze scraped audiophile forum discussions  
🕷️ **Real-Time Web Scraping**: Scrapes Reddit r/audiophile, Head-Fi, and AudioScienceReview  
📊 **Intelligent Pairing**: Detailed compatibility analysis with scores and recommendations  
💾 **Smart Caching**: 7-day persistent cache to minimize costs and improve performance  
⚡ **Cost Optimized**: Uses Claude Haiku model with batch processing (~95% cost reduction)

## Quick Start

### Development Setup

1. **Install dependencies**:
```bash
npm install
```

2. **Configure environment**:
```bash
cp .env.example .env
# Add your Anthropic API key to .env
```

3. **Start development server**:
```bash
npm run dev
```

Visit `http://localhost:3000`

### Production Build for S3

1. **Build for S3 deployment**:
```bash
npm run build:s3
```

2. **Upload `./dist/` contents to your S3 bucket**

3. **Configure your API backend** with the backend files

## Architecture

### Frontend (S3 Static Site)
- `index.html` - Main application page
- `styles.css` - Optimized styling with AI HiFi branding
- `ai-pairing.js` - Frontend JavaScript for AI pairing functionality
- `config.js` - Environment configuration

### Backend (Server/Lambda)
- `server.js` - Express server with pairing API
- `pairingEngine.js` - Core pairing logic with caching
- `aiAnalyzer.js` - Claude AI integration for analysis
- `scraper.js` - Web scraping for Reddit, Head-Fi, ASR
- `dataCache.js` - Persistent caching system
- `textOptimizer.js` - Token optimization for cost efficiency
- `batchProcessor.js` - Request batching for API efficiency

## API Endpoints

### `POST /api/pairing`
Analyze speaker and amplifier pairing
```json
{
  "speaker": "KEF LS50",
  "amplifier": "Marantz PM6007",
  "preferences": {
    "soundSignature": "warm",
    "roomSize": "medium"
  }
}
```

### `GET /api/specs/:type/:product`
Get detailed product specifications
- `:type` - "speaker" or "amplifier"
- `:product` - URL-encoded product name

### `GET /api/recent?limit=5`
Get recently analyzed pairings

## Environment Variables

```bash
# Required
ANTHROPIC_API_KEY=your_anthropic_api_key_here

# Optional
PORT=3000
NODE_ENV=production
SCRAPING_DELAY_MS=2000
CACHE_TTL_SECONDS=3600
```

## Deployment Options

### Option 1: S3 + Lambda (Recommended)
- Frontend: S3 static website
- Backend: AWS Lambda functions
- Caching: ElastiCache or DynamoDB

### Option 2: S3 + EC2
- Frontend: S3 static website  
- Backend: EC2 instance running Node.js server
- Caching: Local filesystem + Redis

### Option 3: Full Stack on Single Server
- Combined frontend + backend on VPS/EC2
- Use for development or small scale

## Cost Optimization

The system is designed for extremely low costs:

- **Claude Haiku**: ~$0.25 per 1M input tokens
- **Smart Caching**: 7-day cache reduces repeat API calls by 90%+
- **Batch Processing**: Groups multiple requests to reduce API calls
- **Content Filtering**: Reduces token usage by 60-80%

**Estimated monthly cost**: $5-8 for 100 analyses/day

## Browser Support

- Chrome 80+
- Firefox 75+
- Safari 13+  
- Edge 80+

## License

ISC License - See package.json for details

---

**AI HiFi** - Intelligent audio pairing recommendations powered by community knowledge and AI analysis.