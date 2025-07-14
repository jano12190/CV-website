# CV Website Terraform Infrastructure

This Terraform configuration creates a complete AWS infrastructure for hosting Jake Nord's CV website at jakenord.net.

## Architecture

- **S3 Buckets**: Primary bucket for website files + redirect bucket for www subdomain
- **CloudFront**: Global CDN with SSL termination and caching
- **Route53**: DNS records pointing to CloudFront distributions
- **ACM Certificate**: SSL/TLS certificate for HTTPS
- **Security**: Origin Access Control (OAC) for secure S3 access

## Prerequisites

1. **AWS CLI configured** with appropriate credentials
2. **Terraform installed** (version >= 1.0)
3. **Domain purchased**: jakenord.net (already done)
4. **Route53 hosted zone** created for jakenord.net

## Setup Instructions

### 1. Configure Variables
```bash
# Copy the example variables file
cp terraform.tfvars.example terraform.tfvars

# Edit terraform.tfvars if needed (domain is already set to jakenord.net)
```

### 2. Initialize Terraform
```bash
cd terraform
terraform init
```

### 3. Plan the Deployment
```bash
terraform plan
```

### 4. Deploy Infrastructure
```bash
terraform apply
```

### 5. Upload Website Files
After successful deployment, upload your website files:

```bash
# Sync website files to S3 (run from CV directory)
aws s3 sync . s3://jakenord.net --exclude 'terraform/*' --exclude '.git/*' --exclude '*.md'

# Invalidate CloudFront cache
aws cloudfront create-invalidation --distribution-id <DISTRIBUTION_ID> --paths '/*'
```

## Resources Created

- `aws_s3_bucket.website` - Main website bucket (jakenord.net)
- `aws_s3_bucket.website_redirect` - WWW redirect bucket
- `aws_cloudfront_distribution.website` - Main CloudFront distribution
- `aws_cloudfront_distribution.website_redirect` - WWW redirect distribution
- `aws_acm_certificate.ssl_certificate` - SSL certificate for both domains
- `aws_route53_record.*` - DNS A and AAAA records for IPv4/IPv6
- Security configurations, policies, and access controls

## Important Notes

### SSL Certificate
- Certificate is created in `us-east-1` (required for CloudFront)
- Validation is done via DNS (automatic)
- Covers both `jakenord.net` and `www.jakenord.net`

### Security Features
- Origin Access Control (OAC) prevents direct S3 access
- HTTPS redirect enforced
- Public S3 access blocked
- Server-side encryption enabled

### Caching Strategy
- Static assets (`/assets/*`): 1 year cache
- HTML files: 1 hour cache
- Compression enabled for better performance

## Deployment Commands

The Terraform outputs provide ready-to-use commands:

```bash
# View deployment commands
terraform output deployment_commands

# Example output:
# sync_files = "aws s3 sync . s3://jakenord.net --exclude 'terraform/*' --exclude '.git/*' --exclude '*.md'"
# invalidate_cache = "aws cloudfront create-invalidation --distribution-id E1234567890ABC --paths '/*'"
```

## Estimated Costs

- **S3**: ~$0.50/month (minimal storage and requests)
- **CloudFront**: Free tier covers most personal use
- **Route53**: $0.50/month per hosted zone
- **ACM Certificate**: Free
- **Total**: ~$1-2/month for typical personal website traffic

## Cleanup

To destroy all resources:
```bash
terraform destroy
```

**Warning**: This will delete all website files and infrastructure. Make sure you have backups!

## Troubleshooting

### Certificate Validation Issues
If certificate validation fails:
1. Check that Route53 hosted zone exists for jakenord.net
2. Verify DNS propagation: `dig jakenord.net`
3. Wait 5-10 minutes for DNS propagation

### CloudFront Access Issues
- Ensure S3 bucket policy allows CloudFront access
- Check Origin Access Control configuration
- Verify SSL certificate is validated

### DNS Issues
- Confirm Route53 is managing DNS for jakenord.net
- Check that nameservers match your domain registrar

## Security Best Practices

This configuration implements:
- ✅ HTTPS enforcement
- ✅ S3 bucket access restricted to CloudFront only
- ✅ No public S3 bucket access
- ✅ Server-side encryption
- ✅ Modern TLS protocols only
- ✅ IPv6 support