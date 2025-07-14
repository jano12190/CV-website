# GitHub Actions Setup Guide

This guide will help you set up the GitHub Actions workflows for automatic deployment of your CV website.

## Prerequisites

1. **GitHub repository** containing your CV website code
2. **AWS account** with appropriate permissions
3. **Domain purchased** (jakenord.net)

## Setup Steps

### 1. Create AWS IAM Role for GitHub Actions

#### Create IAM Policy
Create a custom policy with the following permissions:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "s3:*"
            ],
            "Resource": [
                "arn:aws:s3:::jakenord.net",
                "arn:aws:s3:::jakenord.net/*",
                "arn:aws:s3:::www.jakenord.net",
                "arn:aws:s3:::www.jakenord.net/*",
                "arn:aws:s3:::jakenord-net-preview-*",
                "arn:aws:s3:::jakenord-net-preview-*/*"
            ]
        },
        {
            "Effect": "Allow",
            "Action": [
                "s3:ListAllMyBuckets",
                "s3:CreateBucket"
            ],
            "Resource": "*"
        },
        {
            "Effect": "Allow",
            "Action": [
                "cloudfront:*"
            ],
            "Resource": "*"
        },
        {
            "Effect": "Allow",
            "Action": [
                "route53:*"
            ],
            "Resource": "*"
        },
        {
            "Effect": "Allow",
            "Action": [
                "acm:*"
            ],
            "Resource": "*"
        },
        {
            "Effect": "Allow",
            "Action": [
                "iam:*"
            ],
            "Resource": "*"
        }
    ]
}
```

#### Create IAM Role
1. **Go to IAM → Roles → Create Role**
2. **Select "Web identity"**
3. **Identity provider:** `token.actions.githubusercontent.com`
4. **Audience:** `sts.amazonaws.com`
5. **GitHub organization:** Your GitHub username
6. **GitHub repository:** Your repository name
7. **Attach the policy** you created above
8. **Name the role:** `GitHubActions-CV-Website`

#### Get Role ARN
Copy the Role ARN (format: `arn:aws:iam::123456789012:role/GitHubActions-CV-Website`)

### 2. Configure GitHub Repository Secrets

In your GitHub repository, go to **Settings → Secrets and variables → Actions**

Add the following **Repository Secret**:
- **Name:** `AWS_ROLE_ARN`
- **Value:** The IAM Role ARN from step 1

### 3. Initialize Terraform Backend (Optional but Recommended)

For production use, set up remote state storage:

```bash
# Create S3 bucket for Terraform state
aws s3 mb s3://jakenord-terraform-state --region us-west-2

# Create DynamoDB table for state locking
aws dynamodb create-table \
    --table-name jakenord-terraform-locks \
    --attribute-definitions AttributeName=LockID,AttributeType=S \
    --key-schema AttributeName=LockID,KeyType=HASH \
    --provisioned-throughput ReadCapacityUnits=1,WriteCapacityUnits=1 \
    --region us-west-2
```

Then update `terraform/main.tf` to include:

```hcl
terraform {
  backend "s3" {
    bucket         = "jakenord-terraform-state"
    key            = "cv-website/terraform.tfstate"
    region         = "us-west-2"
    dynamodb_table = "jakenord-terraform-locks"
    encrypt        = true
  }
}
```

### 4. Create Route53 Hosted Zone

If you haven't already, create a hosted zone for your domain:

```bash
aws route53 create-hosted-zone \
    --name jakenord.net \
    --caller-reference $(date +%s)
```

Update your domain registrar's nameservers to point to the Route53 nameservers.

## Workflow Overview

### 🏗️ Infrastructure Deployment (`deploy-infrastructure.yml`)
- **Triggers:** Changes to `terraform/` directory
- **PR Events:** Shows Terraform plan in comments
- **Main Branch:** Applies Terraform changes
- **Features:** Validation, formatting checks, and secure deployment

### 🌐 Website Deployment (`deploy-website.yml`)
- **Triggers:** Changes to website files (excludes terraform, docs)
- **Actions:** 
  - Syncs files to S3
  - Sets appropriate cache headers
  - Invalidates CloudFront cache
  - Provides deployment summary

### 🔍 PR Previews (`pr-preview.yml`)
- **Triggers:** Pull requests with website changes
- **Creates:** Temporary S3 bucket for preview
- **Features:** 
  - HTTP preview URL in PR comments
  - Automatic cleanup when PR closes
  - Isolated testing environment

## Usage Examples

### Deploy Infrastructure Changes
1. Make changes to files in `terraform/`
2. Create PR → See Terraform plan in comments
3. Merge PR → Infrastructure automatically deployed

### Deploy Website Updates
1. Update website files (HTML, CSS, JS, images)
2. Push to main branch → Website automatically deployed
3. Changes live in 5-15 minutes globally

### Preview Changes
1. Create PR with website changes
2. Preview URL posted in PR comments
3. Test changes before merging
4. Preview automatically cleaned up when PR closes

## Troubleshooting

### Common Issues

**❌ "AssumeRoleWithWebIdentity" failed**
- Check IAM role trust policy includes your GitHub repo
- Verify `AWS_ROLE_ARN` secret is set correctly

**❌ S3 bucket access denied**
- Ensure IAM policy includes S3 permissions for your buckets
- Check bucket names match exactly

**❌ CloudFront invalidation failed**
- Verify IAM policy includes CloudFront permissions
- Distribution might not exist yet (run infrastructure deployment first)

**❌ Route53 validation failed**
- Ensure hosted zone exists for jakenord.net
- Check domain nameservers point to Route53

### Monitoring Deployments

- **GitHub Actions tab:** View workflow runs and logs
- **AWS CloudFormation:** See Terraform-managed resources
- **AWS CloudWatch:** Monitor application metrics

## Security Best Practices

✅ **Implemented in these workflows:**
- OIDC authentication (no long-lived credentials)
- Least privilege IAM permissions
- Encrypted Terraform state
- Preview environment isolation
- Automated cleanup of temporary resources

## Cost Optimization

The workflows are designed to minimize costs:
- Preview buckets automatically deleted
- Efficient S3 sync (only changed files)
- CloudFront cache optimization
- Resource tagging for cost tracking