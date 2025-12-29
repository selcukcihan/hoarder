#!/bin/bash

# Script to process URLs from urls.txt file
# Invokes the CLI for each URL with a 5 second delay between invocations

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
URLS_FILE="${SCRIPT_DIR}/urls.txt"
CLI_DIR="${SCRIPT_DIR}/cli"

# Check if urls.txt exists
if [ ! -f "$URLS_FILE" ]; then
    echo "Error: urls.txt not found at $URLS_FILE"
    exit 1
fi

# Check if CLI directory exists
if [ ! -d "$CLI_DIR" ]; then
    echo "Error: CLI directory not found at $CLI_DIR"
    exit 1
fi

# Change to CLI directory
cd "$CLI_DIR" || exit 1

# Counter for tracking progress
total=0
processed=0
failed=0
first=true

# Read URLs from file and process each one
while IFS= read -r url || [ -n "$url" ]; do
    # Skip empty lines and lines starting with #
    [[ -z "$url" || "$url" =~ ^[[:space:]]*# ]] && continue
    
    # Trim whitespace
    url=$(echo "$url" | xargs)
    
    # Skip if empty after trimming
    [[ -z "$url" ]] && continue
    
    # Sleep before processing (except for the first URL)
    if [ "$first" = false ]; then
        echo "Waiting 5 seconds before next URL..."
        sleep 5
    fi
    first=false
    
    total=$((total + 1))
    
    echo ""
    echo "=========================================="
    echo "[$total] Processing: $url"
    echo "=========================================="
    
    # Invoke the CLI
    if npm start ingest "$url"; then
        processed=$((processed + 1))
        echo "✓ Successfully processed: $url"
    else
        failed=$((failed + 1))
        echo "✗ Failed to process: $url"
    fi
    
done < "$URLS_FILE"

# Summary
echo ""
echo "=========================================="
echo "Summary"
echo "=========================================="
echo "Total URLs: $total"
echo "Successfully processed: $processed"
echo "Failed: $failed"
echo ""

if [ $failed -gt 0 ]; then
    exit 1
else
    exit 0
fi

