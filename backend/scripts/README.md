# Database Cleanup Scripts

This directory contains utility scripts for maintaining and cleaning up the MongoDB database.

## Lebanon Duplicates Cleanup

### Problem
When there were duplicate Lebanon entries in the `countries.js` file (one with code "LBN" and one with code "LIB"), the `WorldRankingService.initializeWorldRankings()` method would create duplicate Lebanon entries in the `countryRankings` array of World documents.

### Scripts

#### `inspectLebanonEntries.js`
**Purpose**: Inspect all World documents to identify duplicate Lebanon entries without making any changes.

**Usage**:
```bash
node scripts/inspectLebanonEntries.js
```

**Output**: 
- Lists all worlds with Lebanon entries
- Shows details of each Lebanon entry (name, code, confederation, rank, points)
- Identifies worlds with duplicates
- Provides summary statistics

#### `cleanLebanonDuplicates.js`
**Purpose**: Remove duplicate Lebanon entries from existing World documents, keeping only the correct one.

**Correct Lebanon Entry**:
- name: "Lebanon"
- code: "LBN"
- confederation: "afc"

**Usage**:
```bash
node scripts/cleanLebanonDuplicates.js
```

**What it does**:
1. Finds all World documents with country rankings
2. Identifies worlds with multiple Lebanon entries
3. Keeps the correct Lebanon entry (LBN/afc)
4. Removes any duplicates with incorrect codes (e.g., LIB)
5. Recalculates ranks after removal
6. Saves the updated World documents
7. Runs verification to ensure cleanup was successful

**Safety Features**:
- Only removes duplicates, never removes the correct entry
- Preserves points and other data for the correct entry
- Recalculates rankings after removal
- Includes verification step
- Provides detailed logging of all changes

## Other Cleanup Scripts

#### `cleanCountries.js`
**Purpose**: Remove duplicate entries from the countries.js file and merge data from multiple entries.

#### `removeBannedCountries.js`
**Purpose**: Remove specific banned countries from the countries.js file.

## Usage Notes

1. Always run inspection scripts before cleanup scripts to understand the current state
2. These scripts connect to the MongoDB database specified in your environment
3. Make sure to have a backup of your database before running cleanup scripts
4. All scripts include proper error handling and logging
5. Scripts will automatically disconnect from MongoDB when finished

## Environment Requirements

- Node.js with ES modules support
- MongoDB connection configured in `config/database.js`
- All dependencies installed (`npm install`)