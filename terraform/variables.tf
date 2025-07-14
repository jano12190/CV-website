# Variables for the CV website infrastructure

variable "aws_region" {
  description = "AWS region for resources"
  type        = string
  default     = "us-east-1"
}

variable "domain_name" {
  description = "Domain name for the website"
  type        = string
  default     = "jakenord.net"
}

variable "project_name" {
  description = "Name of the project"
  type        = string
  default     = "jake-nord-cv"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "production"
}

variable "tags" {
  description = "Additional tags to apply to resources"
  type        = map(string)
  default = {
    Owner       = "Jake Nord"
    Project     = "CV Website"
    Environment = "Production"
    ManagedBy   = "Terraform"
  }
}