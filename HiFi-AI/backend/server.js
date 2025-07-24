const express = require('express');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const cors = require('cors');
require('dotenv').config();

const PairingEngine = require('./pairingEngine');

const app = express();
const port = process.env.PORT || 3000;

// Security middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
        },
    },
}));

// CORS configuration - restrict to your frontend domain
const corsOptions = {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
    optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: {
        error: 'Too many requests from this IP, please try again later.',
        retryAfter: '15 minutes'
    },
    standardHeaders: true,
    legacyHeaders: false,
});
app.use('/api/', limiter);

// More strict rate limiting for AI endpoints
const aiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20, // limit each IP to 20 AI requests per 15 minutes
    message: {
        error: 'Too many AI analysis requests. Please wait before trying again.',
        retryAfter: '15 minutes'
    }
});

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Security: Validate API key exists
if (!process.env.ANTHROPIC_API_KEY) {
    console.error('❌ ANTHROPIC_API_KEY environment variable is required');
    process.exit(1);
}

const pairingEngine = new PairingEngine();

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'healthy', 
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});

// Input validation middleware
const validatePairingInput = (req, res, next) => {
    const { speaker, amplifier } = req.body;
    
    if (!speaker || !amplifier) {
        return res.status(400).json({ 
            error: 'Both speaker and amplifier are required',
            code: 'MISSING_REQUIRED_FIELDS'
        });
    }
    
    if (typeof speaker !== 'string' || typeof amplifier !== 'string') {
        return res.status(400).json({ 
            error: 'Speaker and amplifier must be strings',
            code: 'INVALID_FIELD_TYPE'
        });
    }
    
    if (speaker.length > 100 || amplifier.length > 100) {
        return res.status(400).json({ 
            error: 'Product names must be less than 100 characters',
            code: 'FIELD_TOO_LONG'
        });
    }
    
    // Sanitize input
    req.body.speaker = speaker.trim();
    req.body.amplifier = amplifier.trim();
    
    next();
};

const validateProductInput = (req, res, next) => {
    const { type, product } = req.params;
    
    if (!['speaker', 'amplifier'].includes(type)) {
        return res.status(400).json({ 
            error: 'Type must be "speaker" or "amplifier"',
            code: 'INVALID_PRODUCT_TYPE'
        });
    }
    
    if (!product || product.length > 100) {
        return res.status(400).json({ 
            error: 'Product name is required and must be less than 100 characters',
            code: 'INVALID_PRODUCT_NAME'
        });
    }
    
    next();
};

// Main pairing analysis endpoint
app.post('/api/pairing', aiLimiter, validatePairingInput, async (req, res) => {
    try {
        const { speaker, amplifier, preferences = {} } = req.body;
        
        console.log(`🔍 Pairing request: ${speaker} + ${amplifier} from IP: ${req.ip}`);
        
        const startTime = Date.now();
        const result = await pairingEngine.generatePairing(
            speaker, 
            amplifier, 
            preferences
        );
        const processingTime = Date.now() - startTime;
        
        // Add metadata
        result.metadata = {
            processingTimeMs: processingTime,
            requestId: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            timestamp: new Date().toISOString()
        };
        
        console.log(`✅ Pairing completed in ${processingTime}ms`);
        res.json(result);
        
    } catch (error) {
        console.error('❌ Pairing API error:', error);
        
        // Don't expose internal errors to client
        if (error.message.includes('API')) {
            return res.status(503).json({ 
                error: 'AI analysis service temporarily unavailable. Please try again later.',
                code: 'AI_SERVICE_UNAVAILABLE'
            });
        }
        
        res.status(500).json({ 
            error: 'Failed to generate pairing analysis. Please try again.',
            code: 'ANALYSIS_FAILED'
        });
    }
});

// Product specifications endpoint
app.get('/api/specs/:type/:product', validateProductInput, async (req, res) => {
    try {
        const { type, product } = req.params;
        const decodedProduct = decodeURIComponent(product);
        
        console.log(`📋 Specs request: ${type} - ${decodedProduct}`);
        
        const specs = await pairingEngine.getProductSpecs(decodedProduct, type);
        
        res.json({
            ...specs,
            requestId: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('❌ Specs API error:', error);
        res.status(500).json({ 
            error: 'Failed to fetch product specifications',
            code: 'SPECS_FETCH_FAILED'
        });
    }
});

// Similar products endpoint
app.get('/api/similar/:type/:product', validateProductInput, async (req, res) => {
    try {
        const { type, product } = req.params;
        const limit = Math.min(parseInt(req.query.limit) || 5, 10); // Max 10 suggestions
        const decodedProduct = decodeURIComponent(product);
        
        const similar = await pairingEngine.findSimilarProducts(
            decodedProduct,
            type,
            limit
        );
        
        res.json({ 
            suggestions: similar,
            requestId: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('❌ Similar products API error:', error);
        res.status(500).json({ 
            error: 'Failed to find similar products',
            code: 'SIMILAR_FETCH_FAILED'
        });
    }
});

// Search recommendations endpoint
app.post('/api/search', aiLimiter, async (req, res) => {
    try {
        const criteria = req.body;
        
        // Validate and sanitize search criteria
        if (typeof criteria !== 'object') {
            return res.status(400).json({
                error: 'Search criteria must be an object',
                code: 'INVALID_SEARCH_CRITERIA'
            });
        }
        
        const recommendations = await pairingEngine.searchRecommendations(criteria);
        
        res.json({
            ...recommendations,
            requestId: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('❌ Search API error:', error);
        res.status(500).json({ 
            error: 'Failed to search recommendations',
            code: 'SEARCH_FAILED'
        });
    }
});

// Recent pairings endpoint
app.get('/api/recent', (req, res) => {
    try {
        const limit = Math.min(parseInt(req.query.limit) || 10, 20); // Max 20 recent items
        const recent = pairingEngine.getRecentlyAnalyzed(limit);
        
        res.json({ 
            pairings: recent,
            count: recent.length,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('❌ Recent API error:', error);
        res.status(500).json({ 
            error: 'Failed to fetch recent pairings',
            code: 'RECENT_FETCH_FAILED'
        });
    }
});

// System statistics endpoint (optional, for monitoring)
app.get('/api/stats', (req, res) => {
    try {
        const stats = pairingEngine.getCacheStats();
        
        res.json({
            ...stats,
            uptime: process.uptime(),
            memoryUsage: process.memoryUsage(),
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('❌ Stats API error:', error);
        res.status(500).json({ 
            error: 'Failed to fetch statistics',
            code: 'STATS_FETCH_FAILED'
        });
    }
});

// 404 handler
app.use('/api/*', (req, res) => {
    res.status(404).json({
        error: 'API endpoint not found',
        code: 'ENDPOINT_NOT_FOUND'
    });
});

// Global error handler
app.use((error, req, res, next) => {
    console.error('❌ Unhandled error:', error);
    
    res.status(500).json({
        error: 'Internal server error',
        code: 'INTERNAL_SERVER_ERROR'
    });
});

async function startServer() {
    try {
        await pairingEngine.initialize();
        console.log('✅ Pairing engine initialized');
        
        app.listen(port, () => {
            console.log(`🚀 AI HiFi API Server running on port ${port}`);
            console.log(`🔒 Environment: ${process.env.NODE_ENV || 'development'}`);
            console.log(`🌐 CORS enabled for: ${corsOptions.origin}`);
        });
        
    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
}

// Graceful shutdown
const gracefulShutdown = async (signal) => {
    console.log(`\n🛑 Received ${signal}. Shutting down gracefully...`);
    
    try {
        await pairingEngine.shutdown();
        console.log('✅ Pairing engine shut down');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error during shutdown:', error);
        process.exit(1);
    }
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    console.error('❌ Uncaught Exception:', error);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});

if (require.main === module) {
    startServer();
}

module.exports = app;