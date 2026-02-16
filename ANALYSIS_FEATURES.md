# Institution Analysis Features

## Overview
LendingLens includes powerful institution analysis capabilities that allow you to compare any financial institution's lending performance against national averages and analyze various lending factors.

## New Features

### 1. Institution Search with LEI Lookup
- **Fuzzy Matching**: Search for institutions by name even if you don't know the exact spelling
- **LEI Discovery**: Automatically finds the Legal Entity Identifier (LEI) for institutions
- **Smart Suggestions**: If no exact match is found, suggests the closest matching institutions

### 2. National Average Comparison
- Compares institution lending volumes to national totals
- Calculates market share percentage
- Shows originated vs denied loan metrics

### 3. Comprehensive Lending Metrics
The analysis includes:
- **Total Loan Volume**: Number of originated loans
- **Loan Type Breakdown**: Distribution across Conventional, FHA, VA, and USDA loans
- **Approval Metrics**: 
  - Number of originated loans
  - Number of denied applications
  - Approval rate percentage
- **Market Share**: Percentage of national lending volume
- **Visual Charts**: Bar charts showing loan type distribution

### 4. Interactive Suggestions
When exact matches aren't found:
- Shows top 5 closest matching institutions
- Displays LEI and location information
- Click any suggestion to run analysis on that institution

## Usage Examples

### Example 1: Analyze a Specific Institution
```
How does Mountain America Credit Union differ from national lending average?
```

The chatbot will:
1. Search for "Mountain America Credit Union"
2. Find the LEI code
3. Fetch lending data for that institution
4. Compare to national averages
5. Display comprehensive analysis with charts

### Example 2: Compare Multiple Institutions
```
Analyze Wells Fargo compared to national average
```

### Example 3: If Institution Name is Unclear
```
How does America First compare to national lending?
```

If multiple matches exist, you'll see suggestions like:
- America First Federal Credit Union
- America First Credit Union
- First American Bank
- etc.

Click on any suggestion to analyze that specific institution.

## Technical Implementation

### Key Functions

1. **`findInstitutionByName(institutionName, year)`**
   - Searches FFIEC filers database
   - Implements scoring algorithm for fuzzy matching
   - Returns primary match and suggestions

2. **`fetchNationalAverages(year, loanType)`**
   - Fetches aggregated national lending statistics
   - Used as baseline for comparisons

3. **`analyzeInstitution(lei, institutionName, year)`**
   - Comprehensive analysis of institution's lending
   - Fetches loan type breakdown
   - Calculates approval rates

4. **`renderInstitutionAnalysis(instAnalysis, nationalData)`**
   - Visual display of analysis results
   - Charts and formatted metrics
   - Comparison highlights

### Enhanced Phi Prompt
The Phi mini model now detects analysis queries by looking for keywords like:
- "differ"
- "compare"
- "versus" / "vs"
- "analysis" / "analyze"

When detected, it extracts the institution name and sets the query type to `compare_to_national`.

## Data Sources

All data comes from the FFIEC (Federal Financial Institutions Examination Council) Data Browser API:
- **Filers Endpoint**: Institution information and LEI codes
- **Aggregations Endpoint**: Loan-level aggregated statistics
- **Years**: Currently supports 2024 data (configurable)

## Metrics Explained

### Approval Rate
```
Approval Rate = (Originated Loans / (Originated + Denied Loans)) × 100%
```

### Market Share
```
Market Share = (Institution Loans / National Total Loans) × 100%
```

### Loan Type Codes
- `1` - Conventional
- `2` - FHA (Federal Housing Administration)
- `3` - VA (Veterans Affairs)
- `4` - USDA/FSA/RHS (Rural Housing)

### Action Taken Codes
- `1` - Loan originated
- `3` - Application denied
- (Other codes available but not used in analysis)

## Future Enhancements

Potential additions:
- Geographic analysis (state/county comparisons)
- Demographic lending patterns
- Time-series trend analysis
- Peer group comparisons
- Denial reason breakdowns
- Loan amount distributions
- Interest rate comparisons
- **Branch expansion analysis** ✅ (See [BRANCH_EXPANSION_GUIDE.md](BRANCH_EXPANSION_GUIDE.md))

## Related Documentation

- **[BRANCH_EXPANSION_GUIDE.md](BRANCH_EXPANSION_GUIDE.md)** - Complete guide to branch location and expansion opportunity analysis
- **[README.md](README.md)** - Main project documentation and setup
- **[QUICKSTART.md](QUICKSTART.md)** - Quick start guide

## Example Output

When you ask: *"How does Mountain America Credit Union differ from national lending average?"*

You'll see:
```
🏦 Mountain America Credit Union - Lending Analysis

LEI: [LEI CODE]
Total Loans (2024): [X,XXX]

Approval Metrics:
- Originated: [X,XXX]
- Denied: [XXX]
- Approval Rate: [XX.X%]

📊 Loan Type Distribution
[Bar chart showing distribution across loan types]

📈 Comparison to National Average
National Total: [XXX,XXX] originated loans
Market Share: [X.XXX%] of national lending volume

💡 Insights:
[AI-generated summary from Phi mini]
```

## Tips for Best Results

1. **Use Full Names**: "Mountain America Credit Union" works better than "Mountain America"
2. **Be Specific**: Include "Credit Union", "Bank", or other identifiers
3. **Check Suggestions**: If unsure, look at the suggestions and click the right one
4. **Year Specific**: Data is typically for the most recent year (2024)
5. **Enable Diagnostics**: In settings, enable diagnostics to see the search process

## Troubleshooting

### "Could not find any institutions matching..."
- Try using the full official name
- Check spelling
- Try variations (e.g., "Bank of America" vs "BofA")

### "No exact match found"
- Review the suggestions provided
- Click on the closest match
- Institution names must match FFIEC records

### Low or No Data
- Some institutions may have limited data for certain years
- Smaller institutions may not report to HMDA
- Check if the institution is HMDA-reporting
