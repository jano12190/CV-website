# Deployment Setup

Quick notes on the GitHub Actions configuration for this project.

## Workflows

- `deploy-infrastructure.yml` - Manages AWS resources with Terraform
- `deploy-website.yml` - Uploads site files and invalidates CDN cache
- `pr-preview.yml` - Creates temporary preview environments for PRs

## AWS Authentication

Uses OIDC with a GitHub-Actions IAM role (no stored credentials). The role has permissions for S3, CloudFront, Route53, ACM, and DynamoDB.

## Key Features

- Automatic deployments on push to main
- Terraform plan previews in PR comments
- Separate infrastructure and website pipelines
- Cost-optimized with automatic resource cleanup