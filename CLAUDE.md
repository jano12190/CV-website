# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a static resume website built as part of the AWS Cloud Resume Challenge. The site is a single-page application that showcases Jake Nord's professional information including education, certifications, skills, and work experience.

## Architecture

### Frontend Structure
- **index.html**: Main HTML file containing the complete resume content
- **assets/css/**: Stylesheets including FontAwesome icons and main styling
- **assets/js/**: JavaScript files for UI interactions and functionality
- **assets/sass/**: SCSS source files for styling (pre-compiled)
- **images/**: Profile photo and banner image assets

### Key Features
- **View Counter**: JavaScript fetch call to AWS API Gateway endpoint (`https://t4qm3gti4j.execute-api.us-west-2.amazonaws.com/crc-lambda`) that tracks page views
- **Responsive Design**: Mobile-friendly layout with breakpoint handling
- **Single Page Navigation**: Smooth scrolling between sections

## Development Notes

### No Build System
This project uses vanilla HTML, CSS, and JavaScript without a build system or package manager. There are no npm scripts, build commands, or testing frameworks configured.

### SCSS Compilation
The project includes SCSS source files in `assets/sass/` but these appear to be pre-compiled to `assets/css/main.css`. Any CSS changes should be made to the SCSS files if maintaining the preprocessing workflow.

### External Dependencies
- jQuery and related plugins (already included as minified files)
- FontAwesome icons (included locally)
- AWS API Gateway for view counter functionality

### Deployment Context
This website is designed for deployment on AWS S3 with CloudFront distribution, Route 53 DNS, and Certificate Manager for SSL. The view counter integrates with AWS Lambda and DynamoDB.