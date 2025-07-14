# Output values for the CV website infrastructure

output "website_url" {
  description = "URL of the website"
  value       = "https://${var.domain_name}"
}

output "s3_bucket_name" {
  description = "Name of the S3 bucket hosting the website"
  value       = aws_s3_bucket.website.id
}

output "s3_bucket_domain" {
  description = "Domain name of the S3 bucket"
  value       = aws_s3_bucket.website.bucket_domain_name
}

output "cloudfront_distribution_id" {
  description = "ID of the CloudFront distribution"
  value       = aws_cloudfront_distribution.website.id
}

output "cloudfront_domain_name" {
  description = "Domain name of the CloudFront distribution"
  value       = aws_cloudfront_distribution.website.domain_name
}

output "certificate_arn" {
  description = "ARN of the SSL certificate"
  value       = aws_acm_certificate.ssl_certificate.arn
}

output "hosted_zone_id" {
  description = "Route53 hosted zone ID"
  value       = data.aws_route53_zone.main.zone_id
}

output "deployment_commands" {
  description = "Commands to deploy website files"
  value = {
    sync_files = "aws s3 sync . s3://${aws_s3_bucket.website.id} --exclude 'terraform/*' --exclude '.git/*' --exclude '*.md'"
    invalidate_cache = "aws cloudfront create-invalidation --distribution-id ${aws_cloudfront_distribution.website.id} --paths '/*'"
  }
}