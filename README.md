# Personal CV Website

My professional resume website hosted on AWS, showcasing my cloud engineering and DevOps skills through practical implementation.

**Live Site:** [https://jakenord.net](https://jakenord.net)

## About This Project

I built this website to serve as both my online resume and a demonstration of modern cloud architecture practices. Rather than using a simple hosting service, I designed it as a fully cloud-native application to showcase real-world AWS skills that employers value.

The site features a clean, responsive design with my professional background, certifications, and experience. It includes a live visitor counter that tracks page views using AWS serverless technology.

## What I Built

**Frontend**
- Single-page responsive website using HTML, CSS, and JavaScript
- Clean, professional design optimized for both desktop and mobile
- Integrated visitor counter displaying real-time page views

**Cloud Infrastructure**
- AWS S3 static website hosting with CloudFront CDN for global performance
- Route53 DNS management with custom domain
- SSL certificate through AWS Certificate Manager
- Serverless visitor tracking using API Gateway, Lambda, and DynamoDB

**DevOps Pipeline**
- Infrastructure as Code using Terraform for reproducible deployments
- GitHub Actions workflows for automated CI/CD
- Separate pipelines for infrastructure changes and website updates
- Automated CloudFront cache invalidation on deployments

## Technical Implementation

The architecture demonstrates several key cloud engineering concepts:

- **Serverless Design**: No servers to manage - everything runs on managed AWS services
- **Infrastructure as Code**: All AWS resources defined in Terraform for version control and repeatability  
- **Automated Deployment**: Push to main branch automatically deploys changes
- **Global Performance**: CloudFront CDN ensures fast loading worldwide
- **Security**: HTTPS-only access with proper IAM role permissions

This project represents the type of cloud-native thinking and implementation I bring to professional environments.