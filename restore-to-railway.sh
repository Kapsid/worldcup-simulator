#!/bin/bash

# Script to restore MongoDB backup to Railway MongoDB instance

# Railway MongoDB connection URL with auth database
MONGODB_URL="mongodb://mongo:bUfljmdFJJtwWnSESxTJMlPRuzaFyCWF@mainline.proxy.rlwy.net:52556/test?authSource=admin"

# Check if backup directory exists
BACKUP_DIR="frontend/mongodb-backup/worldcup"
if [ ! -d "$BACKUP_DIR" ]; then
    echo "Error: Backup directory not found at $BACKUP_DIR"
    exit 1
fi

echo "Starting MongoDB restore to Railway..."
echo "Target MongoDB: $MONGODB_URL (credentials hidden)"
echo "Source backup: $BACKUP_DIR"

# Run mongorestore with the backup
# Using "test" as the database name as specified
mongorestore --uri="$MONGODB_URL" --drop --db test "$BACKUP_DIR"

if [ $? -eq 0 ]; then
    echo "MongoDB restore completed successfully!"
else
    echo "Error: MongoDB restore failed"
    exit 1
fi