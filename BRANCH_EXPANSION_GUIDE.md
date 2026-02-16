# Branch Expansion Analysis Guide

## Overview
LendingLens includes powerful branch expansion analysis that helps financial institutions identify optimal locations for opening new branches by analyzing the relationship between lending activity and physical branch presence.

## Key Features

### 🏢 Branch Location Data
- **Data Source**: FDIC BankFind API (banks.data.fdic.gov)
- **Coverage**: FDIC-insured banks (credit unions may have limited data)
- **Information Retrieved**:
  - Branch addresses and coordinates (lat/long)
  - City, state, county, ZIP code
  - Branch type/classification
- **Caching**: Branch data is cached in browser localStorage for 7 days

### 📊 Geographic Lending Analysis
- Analyzes lending volumes across top 10 states (CA, TX, FL, NY, PA, IL, OH, GA, NC, MI)
- Compares originated loan counts to branch presence
- Calculates loans-per-branch ratio for each state

### 💡 AI-Powered Recommendations
The system identifies three types of opportunities:

#### 🔴 High Priority
- **Criteria**: Strong lending activity (>100 loans) but NO physical branches
- **Implication**: Significant untapped market with proven demand
- **Recommendation**: Open first branch to capture market share and improve customer service

#### 🟢 Growth Opportunity
- **Criteria**: High loans-per-branch ratio (>200 loans per branch)
- **Implication**: Existing branches are overextended or digital-heavy market
- **Recommendation**: Add more branches to improve accessibility and customer experience

#### 🟡 Review Needed
- **Criteria**: Low lending volume (<50 loans) despite branch presence
- **Implication**: Underperforming market or operational inefficiency
- **Recommendation**: Review market strategy, increase marketing, or consider consolidation

## Usage Examples

### Example 1: Full Branch Expansion Analysis
```
Where should Wells Fargo open new branches?
```

**What happens:**
1. Searches for "Wells Fargo" in FFIEC database
2. Fetches branch locations from FDIC API (cached for 7 days)
3. Analyzes lending volumes across top 10 states
4. Compares lending activity to branch density
5. Generates prioritized recommendations
6. AI summary of strategic insights

**Output includes:**
- Branch network overview (total count, states served)
- Table showing Loans vs Branches by state
- Prioritized expansion recommendations
- AI-generated strategic insights

### Example 2: Specific Institution Analysis
```
Analyze Chase Bank branch network and expansion opportunities
```

### Example 3: Combined Analysis
```
Full analysis of Bank of America including branches
```

This triggers both lending performance AND branch expansion analysis.

## Understanding the Recommendations

### Reading the Analysis Table

| State | Loans | Branches | Loans/Branch |
|-------|-------|----------|--------------|
| CA    | 12,450| 85       | 146          |
| TX    | 8,320 | 0        | N/A          |
| FL    | 6,100 | 15       | 407          |

**Interpretation:**
- **CA**: Balanced - 146 loans per branch is reasonable
- **TX**: **HIGH PRIORITY** - 8,320 loans with no branches = major opportunity
- **FL**: **GROWTH OPPORTUNITY** - 407 loans per branch indicates branches are overextended

### Benchmark Metrics

- **Healthy Ratio**: 100-200 loans per branch
- **High Opportunity**: >200 loans per branch or >100 loans with 0 branches
- **Underperforming**: <50 loans with branches present

## Data Sources & Limitations

### FDIC BankFind API
- **URL**: https://banks.data.fdic.gov/api/locations
- **Coverage**: FDIC-insured commercial banks and savings institutions
- **Limitations**:
  - Does not include credit unions (they use NCUA, not FDIC)
  - May not reflect very recent branch openings/closures
  - Data typically updated quarterly

### HMDA Lending Data
- **Source**: FFIEC Data Browser API
- **Coverage**: All HMDA-reporting institutions (including credit unions)
- **Limitations**:
  - Only includes reportable mortgage lending
  - Does not include other banking services
  - Annual data with year lag

### Credit Unions
If analyzing a credit union, you may see:
```
⚠️ No branch data found in FDIC database. This may be a credit union or non-FDIC institution.
```

Credit unions report to NCUA, not FDIC. The system will still analyze lending data but won't have branch location information.

## Technical Implementation

### Browser Storage (localStorage)
Branch data is cached locally to improve performance and reduce API calls:

```javascript
// Cache structure
{
  "branch_[LEI]": {
    "data": [...branch locations...],
    "timestamp": 1736640000000,
    "expires": 1737244800000  // 7 days later
  }
}
```

**Cache Management:**
- Automatic expiration after 7 days
- Automatic cleanup of expired entries
- Falls back to API if cache full

### Recommendation Algorithm

```javascript
// High Priority
if (loans > 100 && branches === 0) {
  priority = "HIGH_PRIORITY"
}

// Expansion Opportunity
if (loans > 500 && branches > 0 && (loans/branches) > 200) {
  priority = "EXPANSION"
}

// Underperforming
if (branches > 0 && loans < 50) {
  priority = "UNDERPERFORMING"
}
```

## Strategic Use Cases

### 1. Geographic Expansion Planning
**Question**: "Where should we open our next branches?"

Use the analysis to identify states with:
- High lending volume
- Low/no branch presence
- Proven customer demand

### 2. Branch Network Optimization
**Question**: "Are our branches efficiently distributed?"

Review loans-per-branch ratios to find:
- Overextended branches (need support)
- Underutilized branches (consolidation candidates)

### 3. Competitive Analysis
**Question**: "Where are competitors succeeding without physical presence?"

Identify digital-heavy markets where competitors thrive without many branches.

### 4. Market Entry Strategy
**Question**: "Which new markets should we enter?"

Focus on high-priority recommendations (lending without branches) as proven markets.

### 5. Resource Allocation
**Question**: "Where should we invest our branch expansion budget?"

Prioritize based on:
1. High Priority opportunities (biggest gaps)
2. Growth Opportunities (scale existing success)
3. Review underperforming locations before new investment

## Advanced Queries

### Query Variations That Work:

- "Where should [Institution] open new branches?"
- "Analyze [Institution] branch network"
- "[Institution] expansion opportunities"
- "Branch expansion analysis for [Institution]"
- "Where can [Institution] grow?"
- "Full analysis of [Institution] including branches"

### Keywords Detected:
The AI detects these keywords to trigger branch analysis:
- branch
- expansion
- opportunity
- recommend
- "where" + "open"
- "where" + "location"

## Troubleshooting

### "No branch data found in FDIC database"
**Cause**: Institution is not FDIC-insured (likely a credit union) or name doesn't match FDIC records exactly

**Solutions**:
- Check if it's a credit union (they don't report to FDIC)
- Try the full legal name (e.g., "Wells Fargo Bank, National Association")
- The analysis will still show lending data and identify markets even without branch data

### "Could not fetch branch data"
**Cause**: FDIC API error or network issue

**Solutions**:
- Check internet connection
- Try again (may be temporary API issue)
- Clear browser cache if repeated failures

### Cached Data is Outdated
**Solution**: Clear localStorage manually:
```javascript
// In browser console
localStorage.clear();
```
Or wait 7 days for automatic expiration.

### Slow Performance
**Cause**: Fetching data for multiple states sequentially

**Note**: This is expected - the system queries 10 states individually to build the geographic analysis. First run is slower; subsequent runs use cached branch data.

## Best Practices

1. **Use Full Institution Names**: "Wells Fargo Bank" not "WF"
2. **Enable Diagnostics**: See the detailed search and matching process
3. **Review Suggestions**: If no exact match, click the right institution from suggestions
4. **Consider Market Context**: Recommendations are data-driven but should be combined with local market knowledge
5. **Regular Updates**: Re-run analysis periodically as lending patterns change
6. **Cross-Reference**: Combine with demographic and loan type analyses for complete picture

## Future Enhancements

Potential additions to consider:
- County-level granularity (more specific than state-level)
- MSA (Metropolitan Statistical Area) analysis for urban markets
- Competitive density analysis (other institutions' branches nearby)
- Population demographics overlay
- Median home value correlation
- Branch profitability modeling
- Drive-time accessibility analysis
- Integration with NCUA data for credit unions
- Historical trend analysis (year-over-year changes)
- Export recommendations to CSV/PDF

## Privacy & Security

- All analysis runs client-side (in your browser)
- No data sent to third-party servers
- Branch data cached locally on your device
- Cache automatically expires after 7 days
- No personal customer information accessed
- Only aggregated public data from FDIC and FFIEC

## API Rate Limits

Both FDIC and FFIEC APIs are public and generally allow reasonable usage:
- **FDIC**: No published rate limit (use reasonably)
- **FFIEC**: No hard limit but recommend not exceeding 100 requests/minute
- Branch data caching reduces API calls significantly

## Example Output

```
🏢 Branch & Market Analysis - Wells Fargo Bank

Branch Network Overview
Total Branches: 4,800
States Served: 39
Top States: CA: 850, TX: 520, FL: 380, NY: 310, IL: 245

📊 Lending Activity by State
╔═══════╦═══════════╦══════════╦═══════════════╗
║ State ║   Loans   ║ Branches ║ Loans/Branch  ║
╠═══════╬═══════════╬══════════╬═══════════════╣
║  CA   ║  125,430  ║   850    ║     147       ║
║  TX   ║   89,210  ║   520    ║     172       ║
║  FL   ║   67,840  ║   380    ║     179       ║
║  UT   ║    4,520  ║     0    ║     N/A       ║
╚═══════╩═══════════╩══════════╩═══════════════╝

💡 Expansion Recommendations

1. UT - 🔴 High Priority
   Strong lending activity (4,520 loans) but NO physical branches
   Consider opening first branch to capture market share

2. FL - 🟢 Growth Opportunity
   High loans-per-branch ratio (179 loans per branch)
   Consider adding more branches to improve accessibility

💡 Strategic Insights:
Utah represents a significant opportunity with proven customer 
demand but no physical presence. This market shows strong mortgage
activity suggesting both affordability and population growth...
```

## Support & Feedback

For issues or suggestions regarding branch expansion analysis:
- Check [ANALYSIS_FEATURES.md](ANALYSIS_FEATURES.md) for general analysis documentation
- Review [README.md](README.md) for setup and basic usage
- Enable diagnostics in settings to troubleshoot query parsing
