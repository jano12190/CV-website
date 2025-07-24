const fs = require('fs').promises;
const path = require('path');

class S3BuildOptimizer {
    constructor() {
        this.distDir = './dist';
        this.sourceDir = './';
    }

    async build() {
        try {
            console.log('🚀 Building AI HiFi for S3 deployment...');
            
            // Clean and create dist directory
            await this.cleanDist();
            await fs.mkdir(this.distDir, { recursive: true });
            
            // Copy static files
            await this.copyStaticFiles();
            
            // Optimize for production
            await this.optimizeForProduction();
            
            console.log('✅ Build completed successfully!');
            console.log(`📁 Files ready for S3 upload in: ${this.distDir}`);
            
        } catch (error) {
            console.error('❌ Build failed:', error);
            process.exit(1);
        }
    }

    async cleanDist() {
        try {
            await fs.rm(this.distDir, { recursive: true, force: true });
        } catch (error) {
            // Directory doesn't exist, which is fine
        }
    }

    async copyStaticFiles() {
        const filesToCopy = [
            'index.html',
            'styles.css', 
            'ai-pairing.js',
            'config.js'
        ];

        for (const file of filesToCopy) {
            const source = path.join(this.sourceDir, file);
            const dest = path.join(this.distDir, file);
            
            try {
                await fs.copyFile(source, dest);
                console.log(`📄 Copied: ${file}`);
            } catch (error) {
                console.warn(`⚠️  Could not copy ${file}:`, error.message);
            }
        }
    }

    async optimizeForProduction() {
        // Minify CSS
        await this.minifyCSS();
        
        // Update config for production
        await this.updateProductionConfig();
        
        // Add cache headers meta
        await this.addCacheHeaders();
        
        // Create deployment files
        await this.createDeploymentFiles();
    }

    async minifyCSS() {
        try {
            const cssPath = path.join(this.distDir, 'styles.css');
            let css = await fs.readFile(cssPath, 'utf8');
            
            // Basic CSS minification
            css = css
                .replace(/\/\*[\s\S]*?\*\//g, '') // Remove comments
                .replace(/\s+/g, ' ') // Collapse whitespace
                .replace(/;\s*}/g, '}') // Remove last semicolon in blocks
                .replace(/\s*{\s*/g, '{') // Remove spaces around braces
                .replace(/}\s*/g, '}') // Remove spaces after braces
                .replace(/,\s*/g, ',') // Remove spaces after commas
                .replace(/:\s*/g, ':') // Remove spaces after colons
                .trim();
            
            await fs.writeFile(cssPath, css);
            console.log('🎨 CSS minified');
        } catch (error) {
            console.warn('⚠️  CSS minification failed:', error.message);
        }
    }

    async updateProductionConfig() {
        try {
            const configPath = path.join(this.distDir, 'config.js');
            let config = await fs.readFile(configPath, 'utf8');
            
            // Update to use production by default
            config = config.replace(
                'return config.production;',
                'return config.production; // Optimized for S3 deployment'
            );
            
            await fs.writeFile(configPath, config);
            console.log('⚙️  Production config updated');
        } catch (error) {
            console.warn('⚠️  Config update failed:', error.message);
        }
    }

    async addCacheHeaders() {
        try {
            const htmlPath = path.join(this.distDir, 'index.html');
            let html = await fs.readFile(htmlPath, 'utf8');
            
            // Add cache control meta tags
            const cacheMetaTags = `
    <meta http-equiv="Cache-Control" content="public, max-age=3600">
    <meta http-equiv="Expires" content="${new Date(Date.now() + 3600000).toUTCString()}">`;
            
            html = html.replace('</head>', `${cacheMetaTags}\n</head>`);
            
            await fs.writeFile(htmlPath, html);
            console.log('🗄️  Cache headers added');
        } catch (error) {
            console.warn('⚠️  Cache headers failed:', error.message);
        }
    }

    async createDeploymentFiles() {
        // Create _redirects file for SPA routing (if needed later)
        const redirects = `# AI HiFi Redirects
/*    /index.html   200`;
        await fs.writeFile(path.join(this.distDir, '_redirects'), redirects);
        
        // Create robots.txt
        const robots = `User-agent: *
Allow: /

Sitemap: https://aihifi.com/sitemap.xml`;
        await fs.writeFile(path.join(this.distDir, 'robots.txt'), robots);
        
        // Create .htaccess for Apache servers (if needed)
        const htaccess = `# AI HiFi Apache Configuration
<IfModule mod_mime.c>
    AddType text/css .css
    AddType application/javascript .js
</IfModule>

<IfModule mod_expires.c>
    ExpiresActive on
    ExpiresByType text/css "access plus 1 month"
    ExpiresByType application/javascript "access plus 1 month"
    ExpiresByType text/html "access plus 1 hour"
</IfModule>

<IfModule mod_deflate.c>
    AddOutputFilterByType DEFLATE text/plain
    AddOutputFilterByType DEFLATE text/html
    AddOutputFilterByType DEFLATE text/xml
    AddOutputFilterByType DEFLATE text/css
    AddOutputFilterByType DEFLATE application/xml
    AddOutputFilterByType DEFLATE application/xhtml+xml
    AddOutputFilterByType DEFLATE application/rss+xml
    AddOutputFilterByType DEFLATE application/javascript
    AddOutputFilterByType DEFLATE application/x-javascript
</IfModule>`;
        await fs.writeFile(path.join(this.distDir, '.htaccess'), htaccess);
        
        console.log('📋 Deployment files created');
    }
}

// Run build if called directly
if (require.main === module) {
    const builder = new S3BuildOptimizer();
    builder.build();
}

module.exports = S3BuildOptimizer;