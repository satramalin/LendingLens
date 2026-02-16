# LendingLens Extension

A browser extension that uses a local Phi LLM to parse natural language queries and fetch data from the FFIEC Data Browser API.

## Architecture

**Simplified Design:**
- **Local Phi Model**: Runs entirely in the browser using WebLLM
- **FFIEC Data Browser API**: Queries aggregated HMDA data
- **No backend required**: Everything runs client-side

## Features

### 🤖 Natural Language Queries
Ask questions in plain English:
- "How many VA loans in Illinois for 2024?"
- "Show me FHA loans in California"
- "Top lenders in Maryland for refinancing"

### 🏦 Institution Analysis
Compare financial institutions to national lending averages:
- "How does Mountain America Credit Union differ from national lending average?"
- "Analyze Wells Fargo compared to national average"
- Automatic LEI (Legal Entity Identifier) lookup
- Fuzzy matching with suggestions for institution names
- Comprehensive metrics:
  - Total loan volume and market share
  - Loan type breakdown (Conventional, FHA, VA, USDA)
  - Approval rates (originated vs denied)
  - Visual charts comparing to national data

### 🏢 Branch Expansion Analysis (NEW!)
Get AI-powered recommendations for branch expansion opportunities:
- "Where should Chase Bank open new branches?"
- "Analyze Wells Fargo branch network and expansion opportunities"
- Fetches branch locations from FDIC database
- Compares lending volumes to branch presence by state
- Identifies high-opportunity markets:
  - **High Priority**: Strong lending but no branches
  - **Growth Opportunity**: High loans-per-branch ratio
  - **Review Needed**: Low lending despite branch presence
- Uses browser localStorage to cache branch data (7-day expiration)
- Works for FDIC-insured banks (credit unions may have limited data)

See [ANALYSIS_FEATURES.md](ANALYSIS_FEATURES.md) for detailed documentation.

### 📊 Data Visualization
- **Tables**: Clean, paginated data tables
- **Charts**: Automatic bar charts for distribution analysis
- **CSV Export**: Download results as CSV

### ⚙️ Settings
- **Local Model Selection**: Configure Phi model ID
- **Pagination**: Control max pages to fetch
- **Diagnostics**: Toggle detailed execution logs
- **URL Testing**: Test last API call

## Setup

### 1. Install WebLLM
Download WebLLM and place in `extension/vendor/`:
```
extension/vendor/webllm.js
```

Get it from: https://github.com/mlc-ai/web-llm

### 2. Load Extension
1. Open Edge and navigate to `edge://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select the `extension/` folder

### 3. Configure
1. Click the extension icon to open side panel
2. Click Settings (⚙️)
3. Set your preferred Phi model (default: Phi-2-Q4)
4. Save settings

## Usage

**Simple Queries:**
- "How many VA loans in California for 2024?"
- "Show me FHA loans in Texas"

**Institution Analysis:**
- "How does Wells Fargo differ from national lending average?"
- "Analyze Navy Federal Credit Union"

**Branch Expansion (NEW!):**
- "Where should Chase Bank open new branches?"
- "Analyze Wells Fargo branch network and expansion opportunities"

See **[SAMPLE_QUERIES.md](SAMPLE_QUERIES.md)** for comprehensive query examples.

## Documentation

- **[SAMPLE_QUERIES.md](SAMPLE_QUERIES.md)** - Comprehensive guide with 50+ example queries
- **[BRANCH_EXPANSION_GUIDE.md](BRANCH_EXPANSION_GUIDE.md)** - Complete branch analysis documentation
- **[ANALYSIS_FEATURES.md](ANALYSIS_FEATURES.md)** - Institution analysis features and metrics
- **[QUICKSTART.md](QUICKSTART.md)** - Quick start guide
- **[CODEBASE_OVERVIEW.md](CODEBASE_OVERVIEW.md)** - Technical architecture

### Basic Query
1. Open the extension side panel
2. Type your question: `"How many VA loans in Illinois for 2024?"`
3. Press Enter or click Submit
4. View results: table, chart, and AI summary

### Query Examples
```
"How many VA loans in Illinois for 2024?"
→ Fetches VA loan counts for Illinois in 2024

"Show FHA loans in Maryland"
→ Fetches FHA loan data for Maryland

"Refinance loans in California"
→ Fetches refinance data for CA

"First lien conventional loans in Texas"
→ Fetches conventional first lien data for TX
```

## How It Works

### 1. Query Parsing (Phi LLM)
Phi parses natural language into structured JSON:
```json
{
  "intent": "Count VA loans in Illinois 2024",
  "endpoint": "aggregations",
  "params": {
    "years": "2024",
    "states": "IL",
    "loan_types": "3"
  }
}
```

### 2. API Call (FFIEC Data Browser)
Extension builds URL and fetches data:
```
https://ffiec.cfpb.gov/v2/data-browser-api/view/aggregations?years=2024&states=IL&loan_types=3
```

### 3. Results Display
- **Table**: First 50 records
- **Chart**: Distribution visualization
- **Summary**: AI-generated insights

### 4. AI Summary (Phi LLM)
Phi summarizes the data with key insights and numbers.

## FFIEC Data Browser Parameters

### Core Filters
- **years**: 2018-2024
- **states**: 2-letter code (IL, CA, MD, etc.)
- **counties**: 5-digit FIPS code

### Loan Filters
- **loan_types**: 1=Conventional, 2=FHA, 3=VA, 4=USDA
- **loan_purposes**: 1=Purchase, 2=Improvement, 31=Refinance
- **lien_statuses**: 1=First lien, 2=Subordinate
- **property_types**: 1=Single family, 2=Manufactured, 3=Multifamily

### Applicant Filters
- **ages**: <25, 25-34, 35-44, 45-54, 55-64, 65-74, >74
- **races**: White, Black or African American, Asian, etc.
- **ethnicities**: Hispanic or Latino, Not Hispanic or Latino
- **sexes**: Male, Female, Joint

### Endpoints
- **aggregations**: Summary counts (default)
- **csv**: Download CSV format
- **filers**: List of reporting institutions

## Technical Details

### Files
```
extension/
├── manifest.json          # Extension config (MV3)
├── background.js          # Service worker (minimal)
├── sidebar.html           # Side panel UI
├── sidebar.js             # Main app logic (Phi + API)
├── styles.css             # Dark theme styling
└── vendor/
    └── webllm.js         # Local Phi runtime
```

### Key Components

**LocalPhi Class**
- Loads Phi model using WebLLM
- `generatePlan(query)`: Parses user query into JSON plan
- `summarize(data, query)`: Generates AI summary of results

**API Functions**
- `buildFFIECUrl(endpoint, params)`: Constructs FFIEC URL
- `fetchFFIECData(url)`: Fetches data from API
- `parseJSON(content)`: Extracts JSON from Phi response

**Rendering Functions**
- `renderAggregations()`: Summary table
- `renderTable()`: Data table (50 rows)
- `renderChart()`: Bar chart visualization
- `addExportButton()`: CSV download

## Diagnostics

Enable diagnostics in settings to see:
- Step-by-step execution
- Phi's raw response
- API URL built
- Record counts at each stage
- Data structure details

## Troubleshooting

### Phi not loading
- Ensure WebLLM is in `vendor/webllm.js`
- Check browser console for errors
- Try a different model ID

### No results
- Enable diagnostics to see what's happening
- Use "Test Last URL" to verify API call
- Check that your query parameters are valid

### API errors
- Verify internet connection
- Check FFIEC API status: https://ffiec.cfpb.gov/
- Try simpler queries with fewer filters

## Performance

- **First load**: 1-3 minutes (model download)
- **Subsequent queries**: 2-5 seconds
- **Data fetching**: <1 second
- **Summary generation**: 1-2 seconds

## Privacy

- **100% local**: Phi runs entirely in your browser
- **No tracking**: No analytics or telemetry
- **Direct API calls**: Queries go directly to FFIEC
- **No data storage**: Nothing saved beyond session

## License

MIT License - Free to use and modify

## Credits

- **FFIEC**: HMDA data provider
- **WebLLM**: Local LLM runtime
- **Phi**: Microsoft's language model
