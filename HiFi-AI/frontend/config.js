// Environment configuration for AI HiFi
const config = {
    development: {
        API_BASE_URL: 'http://localhost:3000',
        ENVIRONMENT: 'development'
    },
    staging: {
        API_BASE_URL: 'https://api-staging.aihifi.com',
        ENVIRONMENT: 'staging'
    },
    production: {
        API_BASE_URL: 'https://api.aihifi.com',
        ENVIRONMENT: 'production'
    }
};

// Auto-detect environment or use production as default
const getCurrentConfig = () => {
    const hostname = window.location.hostname;
    
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
        return config.development;
    } else if (hostname.includes('staging')) {
        return config.staging;
    } else {
        return config.production;
    }
};

window.AI_HIFI_CONFIG = getCurrentConfig();