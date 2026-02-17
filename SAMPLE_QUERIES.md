# Sample Queries for LendingLens

## Quick Reference Guide

### 🏦 Credit Union Analysis

**Top Credit Unions Available (2024 data):**
| Credit Union (use this exact name) | Loans | LEI |
|------------------------------------|-------|-----|
| Navy Federal Credit Union | 182,680 | 5493003GQDUH26DNNH17 |
| PENTAGON FEDERAL CREDIT UNION | 28,887 | 549300FX7K8PTEQUU487 |
| AMERICA FIRST Federal Credit Union | 22,439 | 5493007I0X1GRWIU8B34 |
| Mountain America Federal Credit Union | 21,793 | 5493006S869XKIESMV41 |

> **Tip:** Avoid abbreviations like "PenFed" - use "Pentagon Federal Credit Union"

**Lending Analysis Queries (✅ Works):**
- "How does Navy Federal Credit Union differ from national lending average?"
- "Compare Mountain America Federal Credit Union to national lending statistics"
- "Show me lending data for Pentagon Federal Credit Union"
- "Analyze America First Federal Credit Union lending performance"
- "Pentagon Federal Credit Union loan breakdown"

> **Note:** Use official names - "PenFed" won't work, use "Pentagon Federal Credit Union"

**State-by-State Lending:**
- "Where is Navy Federal Credit Union lending the most?"
- "Mountain America Federal Credit Union lending by state"
- "America First Federal Credit Union market presence"

**What You'll Get:**
- Total loan counts and market share
- Loan type breakdown (Conventional, FHA, VA, USDA)
- Approval rates (originated vs denied)
- State-by-state lending volumes

---

### 📊 Institution Comparisons

**vs National Average:**
- "How does Navy Federal Credit Union differ from national lending average?"
- "Analyze Pentagon Federal Credit Union compared to national average"
- "Compare Mountain America Federal Credit Union to national lending statistics"
- "How does America First Federal Credit Union perform versus the national average?"

**Institution Search:**
- "Show me lending data for Pentagon Federal Credit Union"
- "How does Navy Federal Credit Union compare nationally?"

---

### 📊 Basic Loan Queries

**By Loan Type:**
- "How many VA loans in Illinois for 2024?"
- "Show me FHA loans in California"
- "How many conventional loans in Texas?"
- "USDA loans in Iowa for 2024"
- "VA loans nationwide"

**By State:**
- "Total loans in Florida for 2024"
- "Show me all loans in New York"
- "Lending activity in Arizona"
- "Mortgage loans in Colorado"

**Combined:**
- "VA loans in California for 2024"
- "FHA loans in Maryland"
- "Conventional loans in Colorado"
- "Show me USDA loans in rural Nebraska"

**By County (FIPS Code):**
- "Loans in Salt Lake County (49035)"
- "FHA loans in Los Angeles County (06037)"
- "VA loans in Harris County, TX (48201)"
- "Conventional loans in Maricopa County (04013)"
- "Lending activity in Cook County, IL (17031)"

> **Tip:** Use 5-digit FIPS codes for county queries. Find FIPS codes at [census.gov](https://www.census.gov/library/reference/code-lists/ansi.html)

---

### 🔍 Lender Search

**Find Institutions:**
- "Top lenders in Maryland for refinancing"
- "Show me all reporting institutions in California"
- "Who are the major lenders in Texas?"
- "List credit unions reporting in Utah"
- "Show me credit unions in Washington state"

**Specific Lenders:**
- "Find lenders named America First"
- "Show me institutions with Navy in their name"
- "Search for credit unions in Arizona"

---

### 📈 Demographic Analysis

**Gender/Sex Breakdown:**
- "Gender breakdown of loans in California"
- "Show me loan distribution by sex in Texas"
- "Gender analysis for VA loans in Illinois"
- "Male vs female borrowers in Florida"

**Race Analysis:**
- "Race breakdown of VA loans in Illinois"
- "Show me loan distribution by race"
- "Racial demographics of FHA loans in California"
- "Asian borrowers in Washington state"

**Ethnicity:**
- "Ethnicity breakdown of FHA loans in Utah"
- "Show me ethnic distribution of loans in New York"
- "Hispanic borrowers in Texas"
- "Ethnicity analysis for conventional loans"

---

### ⚠️ API Filter Limitations

The FFIEC Data Browser API has important limitations on combining filters:

**Two Filter Maximum (API Limitation):**
The FFIEC API only supports **2 demographic filter criteria** at a time. However, our extension **automatically handles this** by downloading state CSV data and filtering locally.

| Query Type | Method | Speed |
|------------|--------|-------|
| State + Race | Direct API | 2-5 sec |
| State + Gender | Direct API | 2-5 sec |
| State + Race + Age | CSV + Local Filter | 30-60 sec (first), instant (cached) |
| State + Race + Gender | CSV + Local Filter | 30-60 sec (first), instant (cached) |

**All complex queries now work automatically!**

**Age Brackets Available:**
- `<25`, `25-34`, `35-44`, `45-54`, `55-64`, `65-74`, `>74`
- Note: Custom ranges like "40-50" map to closest brackets (35-44 + 45-54)

**Complex Query Examples (All Work ✅):**
- ✅ "Asian borrowers age 35-44 in Utah" → Downloads UT data, filters locally
- ✅ "Female borrowers over 55 in California" → Downloads CA data, filters locally
- ✅ "Black male borrowers in Texas" → Downloads TX data, filters locally
- 💾 Downloaded data is cached in IndexedDB (7-day expiration)
- ⏱️ First query takes 30-60 seconds (download), subsequent queries are instant

---

### 💾 Data Caching

The extension automatically caches data for faster queries:

**API Response Cache (localStorage):**
- Stores aggregation results for 24 hours
- Reduces API calls for repeated queries
- Check cache stats in Settings (⚙️)

**CSV Data Cache (IndexedDB):**
- Stores full state datasets for 7 days
- Used for complex multi-filter queries
- Enables offline analysis of cached states

**Cache Management:**
- Click ⚙️ Settings to view cache stats
- Click "Clear Cache" to free storage
- Toggle "Enable data caching" to disable

---

### 🎯 Recommended Starter Queries

**Try these first to see different features:**

1. **Institution Analysis**:
   ```
   How does Navy Federal Credit Union differ from national lending average?
   ```

2. **Basic Query**:
   ```
   How many VA loans in California for 2024?
   ```

3. **Demographic Analysis**:
   ```
   Gender breakdown of loans in Texas
   ```

4. **Lender Search**:
   ```
   Show me all lenders in Utah
   ```

5. **Complex Multi-Filter**:
   ```
   Asian borrowers age 35-44 in Utah
   ```

---

## Advanced Query Patterns

### Combining Filters

**Loan Type + State:**
- "FHA loans in California for 2024"
- "VA loans in Texas and Florida"
- "Conventional loans in New York and New Jersey"

**Loan Purpose + Type:**
- "Home purchase VA loans in Virginia"
- "Refinance FHA loans in Illinois"

### Comparative Queries

**Institution vs Institution (Side-by-Side):**
- "Compare Mountain America Federal Credit Union vs America First Federal Credit Union"
- "Compare Navy Federal Credit Union and Pentagon Federal Credit Union"
- "Mountain America Federal Credit Union vs Navy Federal Credit Union in VA loans for 2024"
- "Pentagon Federal Credit Union versus America First Federal Credit Union lending comparison"

**Institution vs National Average:**
- "How does Navy Federal Credit Union differ from national lending average?"
- "Compare Mountain America Federal Credit Union to national lending statistics"
- "Analyze Pentagon Federal Credit Union compared to national average"

**Institution vs State Average:**
- "Mountain America Federal Credit Union vs Utah state average"
- "Compare Navy Federal Credit Union to Virginia market average"
- "How does America First Federal Credit Union compare to Utah average?"
- "Pentagon Federal Credit Union vs California state average"

**Time Comparisons:**
- "VA loans in 2024 vs 2023"
- "FHA lending trends in California"

### Complex Analysis

**Full Institution Deep Dive:**
- "Complete analysis of Navy Federal Credit Union lending performance"
- "Full report on Pentagon Federal Credit Union with all metrics"

**Market Analysis:**
- "California mortgage market overview"
- "Texas lending landscape for 2024"

---

## Query Tips

### ✅ DO:
- **Use full institution names**: "Navy Federal Credit Union" not "Navy Fed"
- **Be specific**: "VA loans in California" not "loans somewhere"
- **Include years**: "for 2024" or "in 2024"
- **Use official loan types**: "VA", "FHA", "Conventional", "USDA"
- **State abbreviations are fine**: "CA", "TX", "NY", etc.

### ❌ DON'T:
- Don't use informal abbreviations: "Cali" instead say "California" or "CA"
- Don't be too vague: "loans" should be "VA loans in Texas"
- Don't combine too many filters at once (start simple, then refine)

---

## Expected Response Times

| Query Type | Typical Time | Reason |
|------------|-------------|---------|
| Basic loan query | 2-5 seconds | Single API call |
| Institution search | 3-5 seconds | Search + display |
| Institution analysis | 10-15 seconds | Multiple API calls for metrics |
| Demographic breakdown | 20-40 seconds | Sequential queries for each category |
| Complex multi-filter | 30-60 seconds (first) | CSV download + local filtering |
| Complex multi-filter | Instant (cached) | Uses cached CSV data |

**Notes**:
- Complex queries (3+ filters) download state CSV data and filter locally
- CSV data is cached in IndexedDB for 7 days

---

## Troubleshooting Queries

### If No Results Found:

**Institution Not Found:**
```
❌ Could not find any institutions matching "Mountain America"
```
**Solution**: Try the full name: "Mountain America Credit Union"

**Suggestions Shown:**
```
⚠️ No exact match found for "America First"
```
**Solution**: Click on the correct institution from the list of suggestions

### Enable Diagnostics

To see how queries are processed:
1. Click the ⚙️ Settings icon
2. Check "Show diagnostics"
3. Click "Save Settings"

Now you'll see detailed logs showing:
- How Phi interprets your query
- What API calls are made
- What filters are applied
- Any warnings or errors

---

## Query Examples by Industry Role

### **For Loan Officers:**
- "VA loans in [Your State]" → Market size
- "FHA vs Conventional in [State]" → Product mix
- "Top lenders in [Area]" → Competition

### **For Compliance Officers:**
- "Gender breakdown of loans" → Fair lending analysis
- "Race distribution by loan type" → Demographic patterns
- "Denial rates for [Institution]" → Approval metrics

### **For Executives:**
- "Full analysis of [Your Institution]" → Comprehensive overview
- "[Your Institution] vs national average" → Competitive position
- "[Your Institution] lending by state" → Market presence

### **For Market Researchers:**
- "Lending trends in [State]" → Market dynamics
- "Compare [Institution A] vs [Institution B]" → Side-by-side comparison
- "[Institution] vs national average" → Competitive position
- "Demographic breakdown in [State]" → Population insights

---

## Sample Session Flow

**Session Goal: Analyze lending patterns in a state**

```
1. User: "How many VA loans in Texas for 2024?"
   → Shows loan volume

2. User: "Race breakdown of loans in Texas"
   → Analyzes demographic patterns

3. User: "Gender breakdown of loans in Texas"
   → Further demographic analysis

4. User: "Show me all lenders in Texas"
   → Identifies major lenders in market

5. User: "How does Navy Federal Credit Union differ from national lending average?"
   → Compares specific institution to national stats
```

**Result**: Complete picture of market lending patterns and demographics.

---

## Quick Reference: Query Keywords

### Triggers Institution Analysis:
- differ, compare, versus, vs, analysis, analyze
- Two institutions: "Compare [Institution A] vs [Institution B]"
- One institution: "[Institution] vs national average"

### Triggers Demographic Breakdown:
- breakdown, distribution, gender, sex, race, ethnicity

### Triggers Institution Search:
- lenders, institutions, who, list, show me [in location]

### Loan Types:
- VA (code 3)
- FHA (code 2)
- Conventional (code 1)
- USDA / FSA / RHS (code 4)

### Actions:
- originated (code 1)
- denied (code 3)
- approved but not accepted (code 2)

---

## Copy-Paste Ready Queries

<!-- ============================================== -->
<!-- BASIC LOAN COUNTS - Simple state/type queries -->
<!-- ============================================== -->

### Basic Loan Counts

```
<!-- By loan type only -->
How many VA loans nationwide?
How many FHA loans in 2024?
Show me conventional loan totals
USDA loans total count

<!-- By state only -->
Total loans in California
How many loans in Texas for 2024?
Lending activity in Florida
Mortgage loans in New York

<!-- Loan type + state -->
VA loans in California
FHA loans in Texas for 2024
Conventional loans in Florida
USDA loans in Iowa
VA loans in Virginia for 2024
FHA loans in Maryland
```

<!-- ============================================== -->
<!-- COUNTY-LEVEL QUERIES - Use FIPS codes         -->
<!-- ============================================== -->

### County-Level Analysis

```
<!-- County queries use 5-digit FIPS codes -->
<!-- Find FIPS codes: census.gov/library/reference/code-lists/ansi.html -->

Loans in Salt Lake County (49035)
FHA loans in Los Angeles County (06037)
VA loans in Harris County, TX (48201)
Conventional loans in Maricopa County (04013)
Lending activity in Cook County, IL (17031)
Loans in King County, WA (53033)
FHA loans in Miami-Dade County (12086)
VA loans in San Diego County (06073)

<!-- Common FIPS codes: -->
<!-- 06037 = Los Angeles, CA | 48201 = Harris (Houston), TX -->
<!-- 17031 = Cook (Chicago), IL | 04013 = Maricopa (Phoenix), AZ -->
<!-- 06073 = San Diego, CA | 12086 = Miami-Dade, FL -->
<!-- 49035 = Salt Lake, UT | 53033 = King (Seattle), WA -->
<!-- 36061 = New York (Manhattan), NY | 48113 = Dallas, TX -->
```

<!-- ============================================== -->
<!-- INSTITUTION ANALYSIS - Compare to national    -->
<!-- ============================================== -->

### Institution Analysis

```
<!-- Top credit unions -->
How does Navy Federal Credit Union differ from national lending average?
Compare Mountain America Federal Credit Union to national lending statistics
Analyze America First Federal Credit Union lending performance
Show me lending data for Pentagon Federal Credit Union

<!-- Alternative queries -->
Navy Federal Credit Union vs national average
Pentagon Federal Credit Union loan breakdown
America First Federal Credit Union market analysis
Mountain America Federal Credit Union lending performance
```

<!-- ============================================== -->
<!-- CREDIT UNION LENDING - State-by-state         -->
<!-- ============================================== -->

### Credit Union Lending by State

```
<!-- Where are they lending? -->
Where is Navy Federal Credit Union lending the most?
Mountain America Federal Credit Union lending by state
America First Federal Credit Union market presence
Pentagon Federal Credit Union state breakdown
```

<!-- ============================================== -->
<!-- DEMOGRAPHIC ANALYSIS - Gender/Race/Ethnicity  -->
<!-- ============================================== -->

### Demographic Breakdowns

```
<!-- Gender/Sex analysis -->
Gender breakdown of loans in California
Show me loan distribution by sex in Texas
Male vs female borrowers in Florida
Gender analysis for VA loans in Illinois

<!-- Race analysis -->
Race breakdown of loans in California
Show me loan distribution by race in Texas
Racial demographics of FHA loans in New York
Race analysis for conventional loans in Florida

<!-- Ethnicity analysis -->
Ethnicity breakdown of loans in Texas
Hispanic borrowers in California
Show me ethnic distribution of loans in Arizona
Ethnicity analysis for FHA loans

<!-- Combined demographic + loan type -->
Gender breakdown of VA loans in Virginia
Race breakdown of FHA loans in California
Ethnicity distribution of conventional loans in Texas
```

<!-- ============================================== -->
<!-- AGE ANALYSIS - Uses brackets, not exact ages  -->
<!-- ============================================== -->

### Age Analysis

```
<!-- Simple age queries (single filter) -->
Age breakdown of loans in California
Borrowers over 65 in Texas
Young borrowers under 25 in Florida
Senior borrowers in Arizona

<!-- Note: Age uses brackets: <25, 25-34, 35-44, 45-54, 55-64, 65-74, >74 -->
<!-- Custom ranges like "40-50" map to closest brackets -->
```

<!-- ============================================== -->
<!-- COMPLEX MULTI-FILTER (Downloads CSV locally)  -->
<!-- ============================================== -->

### Complex Multi-Filter Queries

```
<!-- These automatically download state CSV and filter locally -->
<!-- First query may take 30-60 seconds, then cached for 7 days -->

<!-- Race + Age + State -->
Asian borrowers age 35-44 in Utah
White borrowers over 65 in California
Black borrowers age 25-34 in Texas
Hispanic borrowers age 45-54 in Florida

<!-- Gender + Age + State -->
Female borrowers over 55 in California
Male borrowers age 35-44 in Texas
Female borrowers under 25 in New York

<!-- Race + Gender + State -->
Asian female borrowers in California
White male borrowers in Texas
Black female borrowers in Georgia
```

<!-- ============================================== -->
<!-- LENDER SEARCH - Find institutions             -->
<!-- ============================================== -->

### Lender Search

```
<!-- Find by location -->
Top lenders in California
Show me all lenders in Texas
Who are the major lenders in Florida?
List institutions in New York

<!-- Find by name -->
Find lenders named America First
Show me institutions with Navy in their name
Search for credit unions in Utah
Find credit unions named Mountain

<!-- Find by specialty -->
Top lenders for refinancing in Maryland
VA loan lenders in Virginia
FHA lenders in California
```

<!-- ============================================== -->
<!-- COMPARATIVE QUERIES - Side by side            -->
<!-- ============================================== -->

### Comparative Analysis

```
<!-- Institution vs institution (side-by-side comparison) -->
Compare Mountain America Federal Credit Union vs America First Federal Credit Union
Compare Navy Federal Credit Union and Pentagon Federal Credit Union
Mountain America Federal Credit Union vs Navy Federal Credit Union in VA loans for 2024
Pentagon Federal Credit Union versus America First Federal Credit Union lending comparison
America First Federal Credit Union vs Mountain America Federal Credit Union
Navy Federal Credit Union versus Pentagon Federal Credit Union

<!-- Institution vs national average -->
How does Navy Federal Credit Union differ from national lending average?
Compare Mountain America Federal Credit Union to national lending statistics
Analyze Pentagon Federal Credit Union compared to national average
America First Federal Credit Union vs national average

<!-- Year over year -->
VA loans in 2024 vs 2023
FHA lending trends in California
Compare 2024 to 2023 in Texas
```

<!-- ============================================== -->
<!-- MILITARY/VETERAN FOCUSED                      -->
<!-- ============================================== -->

### Military & Veteran Lending

```
<!-- VA loan hotspots -->
VA loans in Virginia
VA loans in California
VA loans in Texas
VA loans in North Carolina
VA loans in Florida

<!-- Military-focused credit unions -->
How does Navy Federal Credit Union differ from national average?
Pentagon Federal Credit Union loan breakdown
Navy Federal Credit Union lending by state

<!-- VA loan demographics -->
Race breakdown of VA loans in Virginia
Gender breakdown of VA loans in California
Age distribution of VA loans in Texas
```

<!-- ============================================== -->
<!-- FIRST-TIME HOMEBUYER FOCUSED (FHA)           -->
<!-- ============================================== -->

### First-Time Homebuyer (FHA) Analysis

```
<!-- FHA hotspots -->
FHA loans in California
FHA loans in Texas
FHA loans in Florida
FHA loans in Georgia
FHA loans in Arizona

<!-- FHA demographics -->
Race breakdown of FHA loans in California
Gender distribution of FHA loans in Texas
Age analysis of FHA loans in Florida
Young borrowers FHA loans in Arizona
```

<!-- ============================================== -->
<!-- RURAL LENDING (USDA)                          -->
<!-- ============================================== -->

### Rural Lending (USDA)

```
<!-- USDA loan queries -->
USDA loans in Iowa
USDA loans in Nebraska
USDA loans in Kansas
USDA loans in rural Texas
USDA loans in Missouri

<!-- USDA demographics -->
Race breakdown of USDA loans in Iowa
Gender distribution of USDA loans
```

<!-- ============================================== -->
<!-- MARKET RESEARCH                               -->
<!-- ============================================== -->

### Market Research

```
<!-- State market overviews -->
California mortgage market overview
Texas lending landscape for 2024
Florida mortgage market analysis
New York lending activity

<!-- Regional analysis -->
Lending in the Southwest
East Coast mortgage activity
Midwest lending trends
```

---

## More Resources

- **[ANALYSIS_FEATURES.md](ANALYSIS_FEATURES.md)** - Institution analysis documentation
- **[README.md](README.md)** - Setup and configuration
- **[QUICKSTART.md](QUICKSTART.md)** - Quick start guide

---

## Need Help?

1. **Enable diagnostics** in settings to see query processing
2. **Start simple** then add complexity
3. **Use suggestions** when institution names don't match exactly
4. **Check documentation** for specific features
5. **Try variations** of your query if first attempt doesn't work

Happy analyzing! 🎉
