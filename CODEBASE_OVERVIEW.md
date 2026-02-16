# LendingLens - Codebase Overview

## What Changed

Complete rewrite to simplify the architecture and focus on:
1. **Local Phi model only** (removed Azure, Built-in, External modes)
2. **FFIEC Data Browser API** (optimized for aggregations)
3. **Clean, maintainable code** (reduced from 1343 to 650 lines)

## New Architecture

```
┌─────────────────┐
│  User Query     │
│  "VA loans IL"  │
└────────┬────────┘
         │
         v
┌─────────────────┐
│  Local Phi LLM  │  ← Runs in browser via WebLLM
│  (Query Parser) │
└────────┬────────┘
         │ JSON Plan
         v
┌─────────────────┐
│ FFIEC Data      │
│ Browser API     │  ← Public API, no auth needed
└────────┬────────┘
         │ JSON Data
         v
┌─────────────────┐
│ Results Display │
│ Table + Chart   │
└────────┬────────┘
         │
         v
┌─────────────────┐
│  Local Phi LLM  │  ← Summarizes results
│  (Summarizer)   │
└─────────────────┘
```

## Key Files

### sidebar.js (NEW - 650 lines)
**Core functionality:**
- `LocalPhi` class: WebLLM integration
- `parseJSON()`: Extract JSON from Phi response
- `buildFFIECUrl()`: Construct API URLs
- `fetchFFIECData()`: Fetch from FFIEC API
- `renderResults()`: Smart rendering based on data type
- `renderAggregations()`: Summary table
- `renderTable()`: Data table (50 rows)
- `renderChart()`: Bar chart visualization
- `addExportButton()`: CSV download

**Removed:**
- Azure Phi integration
- Built-in Edge LanguageModel API
- External extension messaging
- Multi-mode complexity
- Old HMDA LAR API code
- Complex normalization logic
- Multi-page fetching (simplified)
- Client-side filtering (FFIEC handles it)

### manifest.json
- Same structure (MV3)
- Permissions for FFIEC API
- Side panel configuration

### background.js
- Minimal service worker
- Opens side panel on click
- No proxy logic needed (direct fetch from panel)

### sidebar.html
- Clean UI layout
- Settings modal
- Chat interface

### styles.css
- Dark theme
- Responsive design
- Chart styling

## How to Use

### 1. Setup
```bash
# Install WebLLM in vendor/ folder
# See vendor/README.md for instructions
```

### 2. Load Extension
```
1. Open edge://extensions/
2. Enable Developer mode
3. Load unpacked → select extension/ folder
```

### 3. Query
```
Type: "How many VA loans in Illinois for 2024?"
Results: Table + Chart + AI Summary
```

## Example Queries

```javascript
// Simple count
"How many VA loans in Illinois for 2024?"
→ aggregations endpoint with years=2024, states=IL, loan_types=3

// Multi-filter
"FHA first lien purchases in California"
→ aggregations with loan_types=2, lien_statuses=1, loan_purposes=1, states=CA

// Demographics
"VA loans for age 35-44 in Texas"
→ aggregations with loan_types=3, ages=35-44, states=TX
```

## Benefits of Rewrite

### Simplicity
- **1 LLM mode** instead of 4
- **1 API** instead of multiple HMDA endpoints
- **650 lines** instead of 1343 lines

### Performance
- Direct fetch (no background proxy)
- FFIEC aggregations (faster than LAR)
- Cached model (instant after first load)

### Maintainability
- Clear single responsibility
- No complex mode switching
- Easy to understand flow

### Privacy
- 100% local LLM
- No API keys required
- Direct FFIEC calls

## Testing

### Diagnostics Mode
Enable in settings to see:
```
📋 Step 1: Asking Phi to parse query...
📋 Phi response: {"intent":"Count VA loans...
📊 Query Plan:
• Intent: Count VA loans in Illinois 2024
• Endpoint: aggregations
• Params: {"years":"2024","states":"IL","loan_types":"3"}
🌐 API URL: https://ffiec.cfpb.gov/v2/data-browser-api/view/aggregations?years=2024&states=IL&loan_types=3
📡 Fetching data from FFIEC Data Browser...
✅ Received 5 record(s)
📊 Data structure: ["aggregations"]
🤖 Generating summary with Phi...
```

### Test URL Button
Tests last API call to verify:
- URL construction
- API availability
- Network connectivity

## Migration Notes

### What Users Need to Do
1. Install WebLLM in vendor/ folder
2. Remove old settings (auto-cleared on first run)
3. First query will download Phi model (1-3 min)

### Breaking Changes
- Azure/Built-in/External modes removed
- Output language setting removed (always English for now)
- Multi-page complex fetching simplified
- LAR API not used (FFIEC Data Browser only)

### What Still Works
- Natural language queries
- Data tables and charts
- CSV export
- Diagnostics mode
- Settings persistence

## Future Enhancements

### Potential Additions
- [ ] Multi-language support (add back outputLanguage)
- [ ] More chart types (pie, line, scatter)
- [ ] Query history
- [ ] Saved queries
- [ ] Custom field selection
- [ ] Advanced filtering UI

### Not Planned
- Azure/cloud Phi (defeats local purpose)
- Backend server (keep it client-side)
- Complex multi-API routing (keep it simple)

## Support

### Common Issues

**Phi not loading:**
- Check WebLLM is in vendor/webllm.js
- Try different model ID in settings
- Check browser console for errors

**No results:**
- Enable diagnostics
- Use "Test URL" button
- Verify query makes sense for FFIEC API

**Slow first query:**
- Normal! Model downloads first time
- Subsequent queries are fast
- Model cached in browser

## Credits

- Original complex codebase
- Simplified by focusing on core use case
- Optimized for FFIEC Data Browser API
- Local Phi integration via WebLLM
