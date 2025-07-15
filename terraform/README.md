# Terraform Infrastructure

This directory contains the Terraform configuration that creates the AWS infrastructure for my CV website.

## What It Creates

The Terraform code sets up a complete serverless hosting solution:

- **S3 buckets** for website hosting and www redirect
- **CloudFront distributions** for global CDN and caching
- **SSL certificate** through AWS Certificate Manager
- **Route53 DNS records** for the custom domain
- **Security policies** to restrict S3 access to CloudFront only

## Architecture Decisions

I chose this architecture because:
- **S3 + CloudFront** provides reliable, scalable static hosting
- **Origin Access Control** ensures security by preventing direct S3 access
- **Separate distributions** for main site and www redirect improves performance
- **Infrastructure as Code** makes the setup reproducible and version-controlled

## Usage

The infrastructure is managed through GitHub Actions, but can also be run locally:

```bash
terraform init
terraform plan
terraform apply
```

The state is stored remotely in S3 with DynamoDB locking for team collaboration.

## Key Features

- HTTPS enforcement with automatic certificate management
- Global CDN with optimized caching for static assets
- IPv6 support for modern internet standards
- Cost-optimized configuration (runs for ~$1-2/month)

This setup demonstrates production-ready infrastructure practices while keeping costs minimal for a personal website.