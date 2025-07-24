# 🚀 AI HiFi Secure Deployment Guide

This guide shows how to deploy AI HiFi with proper security architecture.

## 🏗️ Architecture Overview

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend      │    │     Backend      │    │   AI Service    │
│   (S3 Static)   │───▶│  (Lambda/EC2)    │───▶│   (Anthropic)   │
│                 │    │                  │    │                 │
│ • HTML/CSS/JS   │    │ • API Endpoints  │    │ • Claude API    │
│ • No secrets    │    │ • Rate limiting  │    │ • Secure        │
│ • Public        │    │ • Input validation│   │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## 🔐 Security Features

✅ **API Key Protection**: Never exposed to client  
✅ **Rate Limiting**: 20 AI requests per 15 minutes per IP  
✅ **Input Validation**: Sanitized and validated requests  
✅ **CORS Protection**: Only your frontend can access API  
✅ **Error Handling**: No internal details leaked to client  
✅ **Helmet Security**: Security headers for all responses  

## 📦 Deployment Options

### Option 1: AWS S3 + Lambda (Recommended)

#### Frontend (S3)
```bash
cd frontend
npm run build:s3
# Upload ./dist/ contents to S3 bucket
```

#### Backend (Lambda)
```bash
cd backend
npm install --production
# Deploy to AWS Lambda with environment variables
```

**Environment Variables for Lambda:**
```
ANTHROPIC_API_KEY=sk-ant-your-actual-key
FRONTEND_URL=https://your-bucket.s3-website-region.amazonaws.com
NODE_ENV=production
```

### Option 2: S3 + EC2/VPS

#### Frontend (S3)
```bash
cd frontend  
npm run build:s3
# Upload ./dist/ to S3
```

#### Backend (EC2/VPS)
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your values
npm start
```

### Option 3: Vercel/Netlify Functions

#### Frontend
Deploy `frontend/` folder to Vercel/Netlify

#### Backend  
Deploy `backend/` as serverless functions with environment variables

## ⚙️ Configuration

### Frontend Configuration (`frontend/config.js`)
```javascript
const config = {
    development: {
        API_BASE_URL: 'http://localhost:3000'
    },
    production: {
        API_BASE_URL: 'https://your-api-domain.com'  // ← Update this
    }
};
```

### Backend Environment Variables
```bash
# Required
ANTHROPIC_API_KEY=sk-ant-your-key-here
FRONTEND_URL=https://your-frontend-domain.com

# Optional
PORT=3000
NODE_ENV=production
```

## 🔧 Setup Steps

### 1. Get Claude API Key
1. Visit https://console.anthropic.com
2. Create account and add payment method
3. Generate API key
4. **Keep it secret!** Never put in client code

### 2. Deploy Backend First
```bash
cd backend
cp .env.example .env
# Add your ANTHROPIC_API_KEY to .env
npm install
npm start
```

### 3. Update Frontend Config
```bash
cd frontend
# Edit config.js with your backend URL
npm run build:s3
```

### 4. Deploy Frontend
Upload `frontend/dist/` contents to S3 or hosting platform

### 5. Test Security
- ✅ API key not visible in browser dev tools
- ✅ Frontend can reach backend API
- ✅ Rate limiting works (make 25+ requests quickly)
- ✅ CORS blocks requests from other domains

## 📊 Monitoring

### Health Check
```bash
curl https://your-api-domain.com/api/health
```

### Statistics
```bash
curl https://your-api-domain.com/api/stats
```

## 🚨 Security Checklist

- [ ] API key is only in backend environment variables
- [ ] CORS is configured for your frontend domain only
- [ ] Rate limiting is enabled (20 requests/15min)
- [ ] Input validation rejects long/invalid inputs
- [ ] Error messages don't leak internal information
- [ ] HTTPS is enabled for both frontend and backend
- [ ] Environment variables are secure (not in code)

## 💰 Cost Optimization

**Monthly Costs (estimated for 1000 users):**
- S3 hosting: $1-3
- Lambda/EC2: $5-20  
- Claude API: $5-15 (with optimizations)
- **Total: $11-38/month**

## 🐛 Troubleshooting

### Frontend can't reach backend
- Check `config.js` has correct API URL
- Verify CORS allows your frontend domain
- Check browser console for errors

### API key errors
- Ensure `ANTHROPIC_API_KEY` is set in backend environment
- Verify key format starts with `sk-ant-`
- Check you have credits in Anthropic account

### Rate limiting issues  
- Wait 15 minutes for rate limit reset
- Check if you're making too many requests
- Consider implementing client-side request throttling

---

**🎯 Result**: Secure, scalable AI HiFi deployment with proper separation of concerns and cost optimization!