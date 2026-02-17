// LendingLens - AI-Powered Mortgage Data Explorer
// Uses Edge's Prompt API for Phi mini + FFIEC Data Browser API

const chat = document.getElementById('chat');
const form = document.getElementById('promptForm');
const input = document.getElementById('promptInput');
const settingsBtn = document.getElementById('settingsBtn');
const infoBtn = document.getElementById('infoBtn');

// Info panel UI
const infoPanel = document.createElement('div');
infoPanel.className = 'info-panel';
infoPanel.innerHTML = `
  <div>
    <div style="display:flex;justify-content:space-between;align-items:center;">
      <h3>LendingLens - Sample Queries</h3>
      <button class="info-close" id="infoPanelClose">&times;</button>
    </div>
    <p class="small" style="margin-bottom:10px;">Covers 4,900+ lenders including banks, credit unions, and mortgage companies.</p>
    <div class="info-section">
      <div class="info-item" data-query="How many VA loans in Utah for 2024?">
        <span class="info-icon">💡</span>
        <div>
          <div class="info-label">Loans by state</div>
          <div class="info-query">How many VA loans in Utah for 2024?</div>
        </div>
      </div>
      <div class="info-item" data-query="How does Navy Federal Credit Union differ from national lending average?">
        <span class="info-icon">📊</span>
        <div>
          <div class="info-label">Institution analysis</div>
          <div class="info-query">How does Navy Federal Credit Union differ from national lending average?</div>
        </div>
      </div>
      <div class="info-item" data-query="Where is Mountain America Federal Credit Union lending the most?">
        <span class="info-icon">🏦</span>
        <div>
          <div class="info-label">Credit union lending</div>
          <div class="info-query">Where is Mountain America Federal Credit Union lending the most?</div>
        </div>
      </div>
      <div class="info-item" data-query="Compare Mountain America Federal Credit Union to national lending statistics">
        <span class="info-icon">📈</span>
        <div>
          <div class="info-label">Compare to national</div>
          <div class="info-query">Compare Mountain America Federal Credit Union to national lending statistics</div>
        </div>
      </div>
      <div class="info-item" data-query="Race breakdown of loans in California">
        <span class="info-icon">👥</span>
        <div>
          <div class="info-label">Demographic analysis</div>
          <div class="info-query">Race breakdown of loans in California</div>
        </div>
      </div>
      <div class="info-item" data-query="FHA loans in Los Angeles County (06037)">
        <span class="info-icon">📍</span>
        <div>
          <div class="info-label">County-level</div>
          <div class="info-query">FHA loans in Los Angeles County (06037)</div>
        </div>
      </div>
      <div class="info-item" data-query="Asian borrowers age 35-44 in Utah">
        <span class="info-icon">🔍</span>
        <div>
          <div class="info-label">Complex multi-filter</div>
          <div class="info-query">Asian borrowers age 35-44 in Utah</div>
        </div>
      </div>
    </div>
    <p class="small" style="margin-top:10px;opacity:0.6;">Click any query to auto-fill it.</p>
  </div>
`;
document.body.appendChild(infoPanel);

// Info panel close button
document.getElementById('infoPanelClose').addEventListener('click', () => {
  infoPanel.classList.remove('show');
});

// Info panel toggle
infoBtn.addEventListener('click', () => {
  settings.classList.remove('show');
  infoPanel.classList.toggle('show');
});

// Click a sample query to auto-fill input
infoPanel.querySelectorAll('.info-item').forEach(item => {
  item.addEventListener('click', () => {
    input.value = item.dataset.query;
    infoPanel.classList.remove('show');
    input.focus();
  });
});

// Settings UI
const settings = document.createElement('div');
settings.className = 'settings';
settings.innerHTML = `
  <div>
    <h3>Settings</h3>
    <p class="small">Uses Edge's Prompt API for Phi mini</p>
    <div style="margin-top:12px;">
      <label>Max pages to fetch</label>
      <input id="maxPages" placeholder="3" value="3" type="number" min="1" max="20" />
    </div>
    <div style="margin-top:8px;">
      <label><input type="checkbox" id="diagnosticsToggle" /> Show diagnostics</label>
    </div>
    <div style="margin-top:8px;">
      <label><input type="checkbox" id="enableCacheToggle" checked /> Enable data caching</label>
    </div>
    <div style="margin-top:12px;">
      <button id="testUrl">Test Last URL</button>
    </div>
    <div id="cacheStats" class="small" style="margin-top:12px;padding:8px;background:rgba(0,0,0,0.2);border-radius:4px;">
      📦 Cache: Loading...
    </div>
    <button id="clearCache" style="margin-top:8px;">Clear Cache</button>
    <div id="phiStatus" class="small" style="margin-top:12px;">Status: Not initialized</div>
    <button id="checkStatus" style="margin-top:8px;">Check Phi Status</button>
    <button id="resetModel" style="margin-top:8px;">Reset Model</button>
    <button id="saveSettings" style="margin-top:8px;">Save Settings</button>
  </div>
`;
document.body.appendChild(settings);

// Settings handlers
settingsBtn.addEventListener('click', async () => {
  infoPanel.classList.remove('show');
  const cfg = await chrome.storage.sync.get(['maxPages', 'diagnostics', 'enableCache']);
  document.getElementById('maxPages').value = String(cfg.maxPages ?? 3);
  document.getElementById('diagnosticsToggle').checked = !!cfg.diagnostics;
  document.getElementById('enableCacheToggle').checked = cfg.enableCache !== false; // default true
  settings.classList.toggle('show');
  if (settings.classList.contains('show')) {
    checkPhiStatus();
    updateCacheStats();
  }
});

document.getElementById('saveSettings').addEventListener('click', async () => {
  const maxPages = Math.max(1, Math.min(20, Number(document.getElementById('maxPages').value) || 3));
  const diagnostics = document.getElementById('diagnosticsToggle').checked;
  const enableCache = document.getElementById('enableCacheToggle').checked;
  await chrome.storage.sync.set({ maxPages, diagnostics, enableCache });
  settings.classList.remove('show');
  addMessage('system', 'Settings saved ✓');
});

// Cache management
async function updateCacheStats() {
  const statsEl = document.getElementById('cacheStats');
  try {
    const aggStats = AggregationCache.getStats();
    let idbStats = { count: 0 };
    try {
      idbStats = await HMDADataStore.getStats();
    } catch (e) {}

    statsEl.innerHTML = `
      📦 <b>Cache Stats:</b><br>
      • API responses: ${aggStats.count} (${aggStats.sizeKB} KB)<br>
      • CSV datasets: ${idbStats.count}
    `;
  } catch (e) {
    statsEl.textContent = '📦 Cache: Error loading stats';
  }
}

document.getElementById('clearCache').addEventListener('click', async () => {
  const aggCleared = AggregationCache.clearAll();
  let idbCleared = 0;
  try {
    await HMDADataStore.init();
    // Clear all from IndexedDB
    const tx = HMDADataStore.db.transaction(HMDADataStore.STORE_NAME, 'readwrite');
    tx.objectStore(HMDADataStore.STORE_NAME).clear();
    idbCleared = 1;
  } catch (e) {}

  addMessage('system', `🗑️ Cache cleared: ${aggCleared} API responses, ${idbCleared ? 'CSV data' : 'no CSV data'}`);
  updateCacheStats();
});

document.getElementById('testUrl').addEventListener('click', async () => {
  const url = window.__lastUrl;
  if (!url) {
    addMessage('system', 'No URL to test yet. Run a query first.');
    return;
  }
  try {
    const res = await fetch(url, { headers: { Accept: 'application/json' } });
    addMessage('system', `Test result: ${res.status} ${res.ok ? 'OK ✓' : 'Error ✗'}`);
  } catch (e) {
    addMessage('system', `Test error: ${e.message}`);
  }
});

document.getElementById('checkStatus').addEventListener('click', () => checkPhiStatus());

document.getElementById('resetModel').addEventListener('click', async () => {
  const statusEl = document.getElementById('phiStatus');
  statusEl.textContent = 'Resetting...';
  try {
    const success = await localPhi.reset();
    statusEl.textContent = success ? 'Status: Reset successful ✓' : 'Status: Reset failed';
  } catch (e) {
    statusEl.textContent = `Reset error: ${e.message}`;
  }
});

async function checkPhiStatus() {
  const statusEl = document.getElementById('phiStatus');
  statusEl.textContent = 'Checking...';
  try {
    if (!localPhi.initialized) {
      await localPhi.init();
    }
    statusEl.textContent = localPhi.initialized 
      ? 'Status: Ready ✓' 
      : `Status: ${localPhi.error || 'Not ready'}`;
  } catch (e) {
    statusEl.textContent = `Status: Error - ${e.message}`;
  }
}

// UI helper functions
function addMessage(role, text) {
  const div = document.createElement('div');
  div.className = `message ${role}`;
  div.textContent = text;
  chat.appendChild(div);
  chat.scrollTop = chat.scrollHeight;
}

// System prompt for Phi - kept simple to avoid refusals
const SYSTEM_PROMPT = `You are a helpful assistant that converts mortgage data questions into JSON format for API calls. Always respond with valid JSON only, no other text.`;

// Local Phi using Edge's built-in Prompt API
class LocalPhi {
  constructor() {
    this.initialized = false;
    this.error = null;
    this.session = null;
    this.retryCount = 0;
    this.maxRetries = 2;
  }

  // Reset the session (for error recovery)
  async reset() {
    this.initialized = false;
    this.error = null;
    this.retryCount = 0;

    // Destroy existing session if any
    if (this.session) {
      try {
        if (typeof this.session.destroy === 'function') {
          await this.session.destroy();
        }
      } catch (e) {
        console.warn('Error destroying Phi session:', e);
      }
      this.session = null;
    }

    addMessage('system', '🔄 Resetting Phi model session...');
    return await this.init();
  }

  async init() {
    if (this.initialized) {
      return true;
    }

    try {
      const statusEl = document.getElementById('phiStatus');
      const headerStatus = document.getElementById('modelStatus');

      // Check for Edge Prompt API availability
      if (!window.LanguageModel) {
        this.error = 'Prompt API not available. Use Edge with "Prompt API for Phi mini" enabled.';
        if (statusEl) statusEl.textContent = 'Error: Prompt API unavailable';
        if (headerStatus) {
          headerStatus.textContent = '❌ Prompt API Unavailable';
          headerStatus.style.color = '#ff6b6b';
        }
        addMessage('system', '❌ ' + this.error);
        addMessage('system', '💡 Enable at: edge://flags/#edge-prompt-api-for-phi-mini');
        return false;
      }

      addMessage('system', '🔄 Initializing Phi mini model...');
      if (statusEl) statusEl.textContent = 'Checking availability...';
      if (headerStatus) {
        headerStatus.textContent = '⏳ Loading Phi mini...';
        headerStatus.style.color = '#d1e4f3';
      }

      // Check model availability
      const availability = await window.LanguageModel.availability();

      if (availability === 'no') {
        this.error = 'Phi model not available on this system';
        if (statusEl) statusEl.textContent = 'Error: Model unavailable';
        if (headerStatus) {
          headerStatus.textContent = '❌ Model Unavailable';
          headerStatus.style.color = '#ff6b6b';
        }
        addMessage('system', '❌ ' + this.error);
        return false;
      }

      if (availability === 'after-download') {
        addMessage('system', '📥 Downloading Phi model... This may take a few minutes.');
        if (statusEl) statusEl.textContent = 'Downloading model...';
      }

      // Create session
      this.session = await window.LanguageModel.create({
        systemPrompt: SYSTEM_PROMPT
      });

      this.initialized = true;
      this.retryCount = 0;
      if (statusEl) statusEl.textContent = 'Status: Ready ✓';
      if (headerStatus) {
        headerStatus.textContent = '🤖 Phi mini (Edge) - Ready';
        headerStatus.style.color = '#4ea1d3';
        headerStatus.style.fontWeight = 'bold';
      }
      addMessage('system', '✅ Phi mini model ready');
      return true;

    } catch (e) {
      this.error = String(e);
      const statusEl = document.getElementById('phiStatus');
      const headerStatusError = document.getElementById('modelStatus');

      if (statusEl) statusEl.textContent = `Error: ${this.error}`;
      if (headerStatusError) {
        headerStatusError.textContent = '❌ Phi Init Error';
        headerStatusError.style.color = '#ff6b6b';
      }
      addMessage('system', '❌ Phi init error: ' + this.error);
      console.error('LocalPhi init error:', e);
      return false;
    }
  }

  // Internal method to execute prompt with retry logic
  async _executePrompt(prompt, retryOnFailure = true) {
    if (!this.initialized || !this.session) {
      throw new Error(this.error || 'Phi not initialized');
    }

    try {
      const response = await this.session.prompt(prompt);
      this.retryCount = 0; // Reset retry count on success
      return response;
    } catch (error) {
      console.error('Phi prompt error:', error);

      // Check if error is recoverable (session expired, context issues, etc.)
      const isRecoverable = error.message?.includes('session') ||
                            error.message?.includes('context') ||
                            error.message?.includes('aborted') ||
                            error.message?.includes('timeout') ||
                            error.name === 'AbortError';

      if (retryOnFailure && isRecoverable && this.retryCount < this.maxRetries) {
        this.retryCount++;
        addMessage('system', `⚠️ Phi session error, attempting recovery (${this.retryCount}/${this.maxRetries})...`);

        // Reset and retry
        const resetSuccess = await this.reset();
        if (resetSuccess) {
          return await this._executePrompt(prompt, false); // Don't retry again to avoid infinite loop
        }
      }

      throw new Error(`Phi prompt failed: ${error.message || String(error)}`);
    }
  }

  async generatePlan(userQuery) {
    // Detect if this is an analysis/comparison query
    const queryLower = userQuery.toLowerCase();
    const isAnalysis = queryLower.includes('differ') || queryLower.includes('compare') ||
                       queryLower.includes('versus') || queryLower.includes('vs') ||
                       queryLower.includes('analysis') || queryLower.includes('analyze');
    const isBranchAnalysis = queryLower.includes('branch') || queryLower.includes('expansion') ||
                             queryLower.includes('opportunity') || queryLower.includes('recommend') ||
                             (queryLower.includes('open') && (queryLower.includes('where') || queryLower.includes('location')));

    let fullPrompt;

    if (isAnalysis || isBranchAnalysis) {
      // Enhanced prompt for analysis queries
      fullPrompt = `Query: "${userQuery}"

This is an analysis query. Extract institution name(s) and determine analysis type.

If comparing TWO institutions to each other:
{"intent":"analysis","analysis_type":"compare_institutions","institution_name":"First Institution","institution_name_2":"Second Institution","endpoint":"filers","params":{"years":"2024"}}

If comparing ONE institution to national average:
{"intent":"analysis","analysis_type":"compare_to_national","institution_name":"Name of Institution","endpoint":"filers","params":{"years":"2024"}}

Rules:
- If query mentions two institutions (e.g. "A vs B", "compare A to B", "A lending vs B"), use "compare_institutions" and put each name in institution_name and institution_name_2
- If query compares to "national", "average", or "statistics", use "compare_to_national"
- Extract full institution names (e.g. "Mountain America Federal Credit Union" not "Mountain America")
- endpoint should be "filers"
- Include years parameter (default 2024)

Output JSON only:`;
    } else {
      // Standard query prompt
      fullPrompt = `Query: "${userQuery}"

Convert to JSON with this exact structure:
{"intent":"brief intent","endpoint":"aggregations","params":{"years":"2024","states":"UT","loan_types":"3"}}

Rules:
- endpoint: "aggregations" for loans, "filers" for institutions
- params must have: years (2024 default), states (UT, CA, TX, etc)
- loan_types (product type): Conventional=1, FHA=2, VA=3, USDA=4. ONLY values 1-4 are valid.
- loan_purposes (why borrowing): Purchase=1, Improvement=2, Refinance=31, Cash-out Refinance=32, Other=4
- IMPORTANT: loan_types and loan_purposes are DIFFERENT fields. "refinancing" is loan_purposes=31, NOT loan_types. "FHA/VA/Conventional" is loan_types.
- loan_amounts: use ranges like "1", "2", "3" for small/medium/large
- counties: 5-digit FIPS code if user mentions a specific county
- msa_mds: metro area code if user mentions a metro/MSA
- Use states not state names
- Only include states if the user specifies a state
- Only include counties if the user specifies a county
- For "top lenders" or "lenders in [state]" use endpoint "filers"
- If the query mentions a specific institution/lender/bank/credit union name, include "institution_name" in the JSON (e.g. "institution_name":"Mountain America Federal Credit Union")

Output JSON only:`;
    }

    return await this._executePrompt(fullPrompt);
  }

  async summarize(data, userQuery) {
    const dataStr = typeof data === 'string'
      ? data.slice(0, 3000)
      : JSON.stringify(data).slice(0, 3000);

    const prompt = `User asked: "${userQuery}"\n\nData received:\n${dataStr}\n\nProvide a brief summary with key numbers and insights.`;
    return await this._executePrompt(prompt);
  }
}

const localPhi = new LocalPhi();

// Parse JSON from Phi response (handles code fences, extra text, malformed JSON)
function parseJSON(content) {
  if (!content || typeof content !== 'string') {
    return null;
  }

  // Strip leading/trailing whitespace
  content = content.trim();

  // Direct parse attempt
  try {
    return JSON.parse(content);
  } catch {}

  // Try extracting from markdown code fence (both object and array)
  const fenceMatch = content.match(/```(?:json)?\s*([\[{][\s\S]*?[\]}])\s*```/);
  if (fenceMatch) {
    try { return JSON.parse(fenceMatch[1]); } catch {}
    // Try fixing common issues in code fence content
    try { return JSON.parse(fixMalformedJSON(fenceMatch[1])); } catch {}
  }

  // Find first balanced JSON object or array
  let depth = 0, start = -1, end = -1;
  const startChar = content.indexOf('{') < content.indexOf('[') && content.indexOf('{') !== -1
    ? '{' : (content.indexOf('[') !== -1 ? '[' : '{');
  const endChar = startChar === '{' ? '}' : ']';

  for (let i = 0; i < content.length; i++) {
    if (content[i] === startChar) {
      if (start === -1) start = i;
      depth++;
    } else if (content[i] === endChar) {
      depth--;
      if (depth === 0 && start !== -1) {
        end = i;
        break;
      }
    }
  }

  if (start !== -1 && end !== -1) {
    const jsonStr = content.slice(start, end + 1);
    try {
      return JSON.parse(jsonStr);
    } catch {}
    // Try fixing common issues
    try {
      return JSON.parse(fixMalformedJSON(jsonStr));
    } catch {}
  }

  return null;
}

// Fix common JSON issues from LLM output
function fixMalformedJSON(jsonStr) {
  let fixed = jsonStr;
  // Remove trailing commas before } or ]
  fixed = fixed.replace(/,\s*([\]}])/g, '$1');
  // Fix unquoted keys (simple cases)
  fixed = fixed.replace(/([{,]\s*)(\w+)(\s*:)/g, '$1"$2"$3');
  // Remove control characters
  fixed = fixed.replace(/[\x00-\x1F\x7F]/g, ' ');
  return fixed;
}

// State name/abbreviation lookup
const STATE_MAP = {alabama:'AL',alaska:'AK',arizona:'AZ',arkansas:'AR',california:'CA',colorado:'CO',connecticut:'CT',delaware:'DE','district of columbia':'DC',florida:'FL',georgia:'GA',hawaii:'HI',idaho:'ID',illinois:'IL',indiana:'IN',iowa:'IA',kansas:'KS',kentucky:'KY',louisiana:'LA',maine:'ME',maryland:'MD',massachusetts:'MA',michigan:'MI',minnesota:'MN',mississippi:'MS',missouri:'MO',montana:'MT',nebraska:'NE',nevada:'NV','new hampshire':'NH','new jersey':'NJ','new mexico':'NM','new york':'NY','north carolina':'NC','north dakota':'ND',ohio:'OH',oklahoma:'OK',oregon:'OR',pennsylvania:'PA','rhode island':'RI','south carolina':'SC','south dakota':'SD',tennessee:'TN',texas:'TX',utah:'UT',vermont:'VT',virginia:'VA',washington:'WA','west virginia':'WV',wisconsin:'WI',wyoming:'WY'};
const STATE_ABBR_MAP = {al:'AL',ak:'AK',az:'AZ',ar:'AR',ca:'CA',co:'CO',ct:'CT',dc:'DC',de:'DE',fl:'FL',ga:'GA',hi:'HI',id:'ID',il:'IL','in':'IN',ia:'IA',ks:'KS',ky:'KY',la:'LA',me:'ME',md:'MD',ma:'MA',mi:'MI',mn:'MN',ms:'MS',mo:'MO',mt:'MT',ne:'NE',nv:'NV',nh:'NH',nj:'NJ',nm:'NM',ny:'NY',nc:'NC',nd:'ND',oh:'OH',ok:'OK',or:'OR',pa:'PA',ri:'RI',sc:'SC',sd:'SD',tn:'TN',tx:'TX',ut:'UT',vt:'VT',va:'VA',wa:'WA',wv:'WV',wi:'WI',wy:'WY'};
const STATE_NAMES = Object.fromEntries(Object.entries(STATE_MAP).map(([name, code]) => [code, name.replace(/\b\w/g, c => c.toUpperCase())]));

// Detect state code from query text
function detectState(text) {
  const lower = text.toLowerCase();
  for (const [name, code] of Object.entries(STATE_MAP)) {
    if (lower.includes(name)) return code;
  }
  const words = lower.split(/\s+/);
  for (const w of words) {
    if (STATE_ABBR_MAP[w]) return STATE_ABBR_MAP[w];
  }
  return null;
}

// Build FFIEC Data Browser URL
// Extract institution names from query text (bypasses Phi for comparison queries)
function extractInstitutionNames(query) {
  const names = [];
  // Match names ending with known institution suffixes
  const pattern = /([A-Z][A-Za-z\s]*?(?:Credit Union|Bank(?:ing)?|Mortgage|Savings|Financial|Association|Corp(?:oration)?))/g;
  let match;
  // Common words that aren't part of institution names
  const stopWords = ['compare','how','does','what','is','the','show','me','analyze','get','find','list','between','do','are','in','for','of','to','vs','versus','and','or','a','an'];
  while ((match = pattern.exec(query)) !== null) {
    let name = match[1].trim();
    // Strip leading stop words (e.g. "Compare Mountain..." -> "Mountain...")
    const words = name.split(/\s+/);
    while (words.length > 1 && stopWords.includes(words[0].toLowerCase())) {
      words.shift();
    }
    name = words.join(' ');
    if (name.length > 3) names.push(name);
  }
  // Deduplicate: if one name is substring of another, keep the longer one
  return names.filter((n, i) => !names.some((other, j) => j !== i && other.includes(n) && other.length > n.length));
}

function buildFFIECUrl(endpoint, params) {
  const base = 'https://ffiec.cfpb.gov/v2/data-browser-api/view/';
  const url = new URL(base + (endpoint || 'aggregations'));
  
  // Add query parameters
  Object.entries(params || {}).forEach(([key, value]) => {
    if (value != null && value !== '') {
      // Clean comma-separated values - remove spaces after commas
      let cleanValue = String(value);
      if (cleanValue.includes(',')) {
        cleanValue = cleanValue.split(',').map(v => v.trim()).join(',');
      }
      url.searchParams.set(key, cleanValue);
    }
  });
  
  return url.toString();
}

// Search for an institution by name and return LEI + suggestions
async function findInstitutionByName(institutionName, year = '2024') {
  try {
    // Search filers endpoint for institutions matching the name
    const url = buildFFIECUrl('filers', { years: year });
    addMessage('system', `🔍 Searching for institutions matching "${institutionName}"...`);
    
    const data = await fetchFFIECData(url, 1);
    
    if (!data.institutions || data.institutions.length === 0) {
      return { found: false, suggestions: [] };
    }
    
    const searchTerm = institutionName.toLowerCase();
    const searchWords = searchTerm.split(/\s+/).filter(w => w.length > 2);
    
    // Score each institution based on name similarity
    const scored = data.institutions.map(inst => {
      const instName = (inst.name || '').toLowerCase();
      let score = 0;
      
      // Exact match
      if (instName === searchTerm) {
        score = 1000;
      }
      // Contains full search term
      else if (instName.includes(searchTerm)) {
        score = 500;
      }
      // Match individual significant words
      else {
        const instWords = instName.split(/\s+/);
        searchWords.forEach(searchWord => {
          instWords.forEach(instWord => {
            if (instWord.includes(searchWord)) {
              score += 50;
            } else if (searchWord.includes(instWord) && instWord.length > 2) {
              score += 25;
            }
          });
        });
      }
      
      return { institution: inst, score };
    });
    
    // Sort by score and filter out zero scores
    const matches = scored
      .filter(s => s.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);
    
    if (matches.length === 0) {
      return { found: false, suggestions: [] };
    }
    
    // If top match has very high score, consider it a definite match
    const topMatch = matches[0];
    const isDefiniteMatch = topMatch.score >= 500;
    
    return {
      found: isDefiniteMatch,
      primary: topMatch.institution,
      suggestions: matches.slice(0, 5).map(m => m.institution),
      scores: matches.slice(0, 5).map(m => m.score)
    };
    
  } catch (error) {
    addMessage('system', `⚠️ Error searching institutions: ${error.message}`);
    return { found: false, suggestions: [] };
  }
}

// Fetch national lending statistics for comparison
async function fetchNationalAverages(year = '2024', loanType = null) {
  try {
    addMessage('system', `📊 Fetching national lending averages for ${year}...`);
    
    // FFIEC API requires at least one filter (states, msamds, counties, or leis)
    // To get national data, we need to query all states and aggregate
    const allStates = ['AL','AK','AZ','AR','CA','CO','CT','DE','DC','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY'];
    
    const params = {
      years: year,
      states: allStates.join(','), // Query all states at once
      actions_taken: '1' // Originated loans
    };
    
    if (loanType) {
      params.loan_types = loanType;
    }
    
    const url = buildFFIECUrl('aggregations', params);
    const data = await fetchFFIECData(url, 1);
    
    if (!data.aggregations || data.aggregations.length === 0) {
      return null;
    }
    
    // Calculate national totals by aggregating all states
    const totalLoans = data.aggregations.reduce((sum, agg) => sum + (agg.count || 0), 0);
    
    addMessage('system', `✅ National data: ${totalLoans.toLocaleString()} originated loans across all 50 states + DC`);
    
    return {
      totalLoans,
      aggregations: data.aggregations,
      year
    };
    
  } catch (error) {
    addMessage('system', `⚠️ Error fetching national data: ${error.message}`);
    return null;
  }
}

// Fetch state-level lending statistics for comparison
async function fetchStateAverages(state, year = '2024', loanType = null) {
  try {
    const stateNames = {AL:'Alabama',AK:'Alaska',AZ:'Arizona',AR:'Arkansas',CA:'California',CO:'Colorado',CT:'Connecticut',DE:'Delaware',DC:'District of Columbia',FL:'Florida',GA:'Georgia',HI:'Hawaii',ID:'Idaho',IL:'Illinois',IN:'Indiana',IA:'Iowa',KS:'Kansas',KY:'Kentucky',LA:'Louisiana',ME:'Maine',MD:'Maryland',MA:'Massachusetts',MI:'Michigan',MN:'Minnesota',MS:'Mississippi',MO:'Missouri',MT:'Montana',NE:'Nebraska',NV:'Nevada',NH:'New Hampshire',NJ:'New Jersey',NM:'New Mexico',NY:'New York',NC:'North Carolina',ND:'North Dakota',OH:'Ohio',OK:'Oklahoma',OR:'Oregon',PA:'Pennsylvania',RI:'Rhode Island',SC:'South Carolina',SD:'South Dakota',TN:'Tennessee',TX:'Texas',UT:'Utah',VT:'Vermont',VA:'Virginia',WA:'Washington',WV:'West Virginia',WI:'Wisconsin',WY:'Wyoming'};
    const stateName = stateNames[state.toUpperCase()] || state;
    addMessage('system', `📊 Fetching ${stateName} state lending averages for ${year}...`);

    const params = { years: year, states: state.toUpperCase(), actions_taken: '1' };
    if (loanType) params.loan_types = loanType;

    const url = buildFFIECUrl('aggregations', params);
    const data = await fetchFFIECData(url, 1);

    if (!data.aggregations || data.aggregations.length === 0) return null;

    const totalLoans = data.aggregations.reduce((sum, agg) => sum + (agg.count || 0), 0);
    addMessage('system', `✅ ${stateName} data: ${totalLoans.toLocaleString()} originated loans`);

    return { totalLoans, aggregations: data.aggregations, year, state: state.toUpperCase(), stateName };
  } catch (error) {
    addMessage('system', `⚠️ Error fetching state data: ${error.message}`);
    return null;
  }
}

// Fetch detailed statistics for an institution and compare to national average
async function analyzeInstitution(lei, institutionName, year = '2024') {
  try {
    addMessage('system', `📊 Analyzing ${institutionName}...`);
    
    // Fetch institution's lending data
    const instParams = {
      years: year,
      leis: lei,
      actions_taken: '1' // Originated loans
    };
    const instUrl = buildFFIECUrl('aggregations', instParams);
    const instData = await fetchFFIECData(instUrl, 1);
    
    // Calculate institution stats
    const instTotalLoans = instData?.aggregations?.reduce((sum, agg) => sum + (agg.count || 0), 0) || 0;
    
    addMessage('system', `✅ ${institutionName}: ${instTotalLoans.toLocaleString()} originated loans`);
    
    // Fetch breakdown by loan type
    const loanTypeBreakdown = await fetchLoanTypeBreakdown(lei, year);
    
    // Fetch approval rate (originated vs denied)
    const approvalData = await fetchApprovalRate(lei, year);
    
    return {
      lei,
      name: institutionName,
      year,
      totalLoans: instTotalLoans,
      loanTypeBreakdown,
      approvalData,
      rawData: instData
    };
    
  } catch (error) {
    addMessage('system', `⚠️ Error analyzing institution: ${error.message}`);
    return null;
  }
}

// Fetch loan type breakdown for an institution
async function fetchLoanTypeBreakdown(lei, year) {
  const loanTypes = {
    '1': 'Conventional',
    '2': 'FHA',
    '3': 'VA',
    '4': 'USDA/FSA/RHS'
  };
  
  const breakdown = [];
  
  for (const [typeCode, typeName] of Object.entries(loanTypes)) {
    try {
      const params = {
        years: year,
        leis: lei,
        loan_types: typeCode,
        actions_taken: '1'
      };
      const url = buildFFIECUrl('aggregations', params);
      const data = await fetchFFIECData(url, 1);
      const count = data?.aggregations?.reduce((sum, agg) => sum + (agg.count || 0), 0) || 0;
      
      if (count > 0) {
        breakdown.push({ type: typeName, code: typeCode, count });
      }
    } catch (e) {
      // Skip errors for individual loan types
    }
  }
  
  return breakdown;
}

// Fetch approval rate (originated vs denied)
async function fetchApprovalRate(lei, year) {
  try {
    // Fetch originated
    const originatedParams = {
      years: year,
      leis: lei,
      actions_taken: '1'
    };
    const originatedUrl = buildFFIECUrl('aggregations', originatedParams);
    const originatedData = await fetchFFIECData(originatedUrl, 1);
    const originated = originatedData?.aggregations?.reduce((sum, agg) => sum + (agg.count || 0), 0) || 0;
    
    // Fetch denied
    const deniedParams = {
      years: year,
      leis: lei,
      actions_taken: '3'
    };
    const deniedUrl = buildFFIECUrl('aggregations', deniedParams);
    const deniedData = await fetchFFIECData(deniedUrl, 1);
    const denied = deniedData?.aggregations?.reduce((sum, agg) => sum + (agg.count || 0), 0) || 0;
    
    const total = originated + denied;
    const approvalRate = total > 0 ? (originated / total) * 100 : 0;
    
    return {
      originated,
      denied,
      total,
      approvalRate: approvalRate.toFixed(1)
    };
    
  } catch (error) {
    return null;
  }
}

// Fetch data from FFIEC API with caching
// Note: maxPages parameter kept for API consistency but FFIEC returns all data in single response
async function fetchFFIECData(url, _maxPages = 3, useCache = true) {
  // Check cache first (for aggregations endpoint)
  if (useCache && url.includes('/aggregations')) {
    const cached = AggregationCache.get(url);
    if (cached) {
      // Mark as cached for UI display
      cached.data._fromCache = true;
      cached.data._cacheTime = cached.timestamp;
      return cached.data;
    }
  }

  try {
    const response = await fetch(url, {
      headers: { 'Accept': 'application/json' },
      cache: 'no-store'
    });

    if (!response.ok) {
      // Try to get error details from response body
      let errorDetail = response.statusText;
      try {
        const errorBody = await response.text();
        if (errorBody) errorDetail += ` - ${errorBody.slice(0, 200)}`;
      } catch {}
      throw new Error(`HTTP ${response.status}: ${errorDetail}`);
    }

    const data = await response.json();

    // Cache aggregation results
    if (useCache && url.includes('/aggregations')) {
      AggregationCache.set(url, data);
    }

    return data;

  } catch (error) {
    throw new Error(`Fetch failed: ${error.message}`);
  }
}

// Browser storage helper for branch data caching
const BranchCache = {
  // Store branch data in localStorage with expiration
  set(lei, branchData) {
    const cacheEntry = {
      data: branchData,
      timestamp: Date.now(),
      expires: Date.now() + (7 * 24 * 60 * 60 * 1000) // 7 days
    };
    try {
      localStorage.setItem(`branch_${lei}`, JSON.stringify(cacheEntry));
    } catch (e) {
      console.warn('LocalStorage full, clearing old cache');
      this.clearExpired();
      try {
        localStorage.setItem(`branch_${lei}`, JSON.stringify(cacheEntry));
      } catch (e2) {
        console.error('Failed to cache branch data:', e2);
      }
    }
  },
  
  get(lei) {
    try {
      const cached = localStorage.getItem(`branch_${lei}`);
      if (!cached) return null;
      
      const cacheEntry = JSON.parse(cached);
      if (Date.now() > cacheEntry.expires) {
        localStorage.removeItem(`branch_${lei}`);
        return null;
      }
      
      return cacheEntry.data;
    } catch (e) {
      return null;
    }
  },
  
  clearExpired() {
    const now = Date.now();
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('branch_')) {
        try {
          const entry = JSON.parse(localStorage.getItem(key));
          if (entry.expires && now > entry.expires) {
            localStorage.removeItem(key);
          }
        } catch (e) {
          localStorage.removeItem(key);
        }
      }
    }
  }
};

// Aggregation cache for API responses (24hr expiration)
const AggregationCache = {
  PREFIX: 'agg_',
  EXPIRY_MS: 24 * 60 * 60 * 1000, // 24 hours

  // Generate cache key from URL
  getKey(url) {
    // Hash the full URL params to avoid truncation collisions
    const params = url.split('?')[1] || url;
    let hash = 0;
    for (let i = 0; i < params.length; i++) {
      const char = params.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return this.PREFIX + Math.abs(hash).toString(36) + '_' + params.length;
  },

  set(url, data) {
    const key = this.getKey(url);
    const entry = {
      data,
      timestamp: Date.now(),
      expires: Date.now() + this.EXPIRY_MS,
      url: url
    };
    try {
      localStorage.setItem(key, JSON.stringify(entry));
      return true;
    } catch (e) {
      console.warn('Cache full, clearing expired entries');
      this.clearExpired();
      try {
        localStorage.setItem(key, JSON.stringify(entry));
        return true;
      } catch (e2) {
        console.warn('Failed to cache aggregation:', e2);
        return false;
      }
    }
  },

  get(url) {
    const key = this.getKey(url);
    try {
      const cached = localStorage.getItem(key);
      if (!cached) return null;

      const entry = JSON.parse(cached);
      if (Date.now() > entry.expires) {
        localStorage.removeItem(key);
        return null;
      }

      return { data: entry.data, fromCache: true, timestamp: entry.timestamp };
    } catch (e) {
      return null;
    }
  },

  clearExpired() {
    const now = Date.now();
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(this.PREFIX)) {
        try {
          const entry = JSON.parse(localStorage.getItem(key));
          if (entry.expires && now > entry.expires) {
            keysToRemove.push(key);
          }
        } catch (e) {
          keysToRemove.push(key);
        }
      }
    }
    keysToRemove.forEach(k => localStorage.removeItem(k));
    return keysToRemove.length;
  },

  clearAll() {
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(this.PREFIX)) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(k => localStorage.removeItem(k));
    return keysToRemove.length;
  },

  getStats() {
    let count = 0;
    let size = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(this.PREFIX)) {
        count++;
        size += localStorage.getItem(key).length;
      }
    }
    return { count, sizeKB: Math.round(size / 1024) };
  }
};

// IndexedDB for larger CSV datasets
const HMDADataStore = {
  DB_NAME: 'LendingLens',
  DB_VERSION: 1,
  STORE_NAME: 'csvData',
  db: null,

  async init() {
    if (this.db) return this.db;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);

      request.onerror = () => reject(request.error);

      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(this.STORE_NAME)) {
          const store = db.createObjectStore(this.STORE_NAME, { keyPath: 'id' });
          store.createIndex('state', 'state', { unique: false });
          store.createIndex('year', 'year', { unique: false });
          store.createIndex('expires', 'expires', { unique: false });
        }
      };
    });
  },

  async set(id, data, metadata = {}) {
    await this.init();
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(this.STORE_NAME, 'readwrite');
      const store = tx.objectStore(this.STORE_NAME);

      const entry = {
        id,
        data,
        ...metadata,
        timestamp: Date.now(),
        expires: Date.now() + (7 * 24 * 60 * 60 * 1000) // 7 days
      };

      const request = store.put(entry);
      request.onsuccess = () => resolve(true);
      request.onerror = () => reject(request.error);
    });
  },

  async get(id) {
    await this.init();
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(this.STORE_NAME, 'readonly');
      const store = tx.objectStore(this.STORE_NAME);
      const request = store.get(id);

      request.onsuccess = () => {
        const entry = request.result;
        if (!entry) return resolve(null);
        if (Date.now() > entry.expires) {
          this.delete(id);
          return resolve(null);
        }
        resolve(entry);
      };
      request.onerror = () => reject(request.error);
    });
  },

  async delete(id) {
    await this.init();
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(this.STORE_NAME, 'readwrite');
      const store = tx.objectStore(this.STORE_NAME);
      const request = store.delete(id);
      request.onsuccess = () => resolve(true);
      request.onerror = () => reject(request.error);
    });
  },

  async clearExpired() {
    await this.init();
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(this.STORE_NAME, 'readwrite');
      const store = tx.objectStore(this.STORE_NAME);
      const index = store.index('expires');
      const now = Date.now();
      let deleted = 0;

      const request = index.openCursor(IDBKeyRange.upperBound(now));
      request.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor) {
          store.delete(cursor.primaryKey);
          deleted++;
          cursor.continue();
        } else {
          resolve(deleted);
        }
      };
      request.onerror = () => reject(request.error);
    });
  },

  async getStats() {
    await this.init();
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(this.STORE_NAME, 'readonly');
      const store = tx.objectStore(this.STORE_NAME);
      const countReq = store.count();

      countReq.onsuccess = () => resolve({ count: countReq.result });
      countReq.onerror = () => reject(countReq.error);
    });
  }
};

// Fetch and parse CSV data for complex multi-filter queries
// Uses API filters to minimize download size, then filters remaining criteria locally
async function fetchAndParseCSV(state, year = '2024', apiFilters = {}) {
  // Build cache key from state + filters
  const filterKey = Object.entries(apiFilters).sort().map(([k, v]) => `${k}=${v}`).join('_');
  const cacheId = `csv_${state}_${year}${filterKey ? '_' + filterKey : ''}`;

  // Check IndexedDB cache first
  try {
    const cached = await HMDADataStore.get(cacheId);
    if (cached) {
      addMessage('system', `📦 Loaded cached data (${cached.data.length.toLocaleString()} records)`);
      return { data: cached.data, fromCache: true, filters: apiFilters };
    }
  } catch (e) {
    console.warn('IndexedDB cache check failed:', e);
  }

  // Build CSV URL with API filters (max 2 demographic filters supported)
  let csvUrl = `https://ffiec.cfpb.gov/v2/data-browser-api/view/csv?years=${year}&states=${state}`;

  // Add API filters to reduce download size
  const filterParams = [];
  if (apiFilters.races) filterParams.push(`races=${encodeURIComponent(apiFilters.races)}`);
  if (apiFilters.sexes) filterParams.push(`sexes=${encodeURIComponent(apiFilters.sexes)}`);
  if (apiFilters.ethnicities) filterParams.push(`ethnicities=${encodeURIComponent(apiFilters.ethnicities)}`);
  if (apiFilters.loan_types) filterParams.push(`loan_types=${apiFilters.loan_types}`);
  if (apiFilters.actions_taken) filterParams.push(`actions_taken=${apiFilters.actions_taken}`);

  if (filterParams.length > 0) {
    csvUrl += '&' + filterParams.join('&');
  }

  // Show what filters are being applied
  const appliedFilters = Object.entries(apiFilters).filter(([, v]) => v).map(([k, v]) => `${k}=${v}`);
  if (appliedFilters.length > 0) {
    addMessage('system', `🔍 Applying API filters: ${appliedFilters.join(', ')}`);
  }

  addMessage('system', `📥 Downloading filtered ${state} ${year} data...`);

  try {
    const startTime = Date.now();
    const response = await fetch(csvUrl);
    if (!response.ok) throw new Error(`CSV download failed: ${response.status}`);

    const csvText = await response.text();
    const downloadTime = ((Date.now() - startTime) / 1000).toFixed(1);
    const sizeKB = Math.round(csvText.length / 1024);

    addMessage('system', `📊 Downloaded ${sizeKB.toLocaleString()} KB in ${downloadTime}s - Parsing...`);

    // Parse CSV to array of objects
    const lines = csvText.split('\n');
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));

    const data = [];
    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue;

      // Handle quoted CSV fields properly
      const values = parseCSVLine(lines[i]);
      if (values.length !== headers.length) continue;

      const record = {};
      headers.forEach((h, idx) => {
        record[h] = values[idx];
      });
      data.push(record);
    }

    addMessage('system', `✅ Parsed ${data.length.toLocaleString()} loan records`);

    // Cache in IndexedDB
    try {
      await HMDADataStore.set(cacheId, data, { state, year, filters: apiFilters });
      addMessage('system', `💾 Cached for future queries`);
    } catch (e) {
      console.warn('Failed to cache CSV data:', e);
    }

    return { data, fromCache: false, filters: apiFilters };

  } catch (error) {
    addMessage('system', `⚠️ CSV download failed: ${error.message}`);
    return null;
  }
}

// Parse CSV line handling quoted fields
function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());

  return result;
}

// Filter local CSV data with multiple criteria
function filterLocalData(data, filters) {
  return data.filter(record => {
    for (const [field, value] of Object.entries(filters)) {
      if (!value) continue;

      // Handle different field types
      const recordValue = record[field];
      if (!recordValue) return false;

      // Support array of values (OR condition)
      if (Array.isArray(value)) {
        if (!value.includes(recordValue)) return false;
      } else {
        if (recordValue !== value) return false;
      }
    }
    return true;
  });
}

// HMDA field mappings for filtering
const HMDAFields = {
  // Demographics
  race: 'derived_race',
  sex: 'derived_sex',
  ethnicity: 'derived_ethnicity',
  age: 'applicant_age',

  // Loan info
  loanType: 'loan_type',
  loanPurpose: 'loan_purpose',
  actionTaken: 'action_taken',

  // Values
  loanTypes: { '1': 'Conventional', '2': 'FHA', '3': 'VA', '4': 'USDA' },
  actions: { '1': 'Originated', '2': 'Approved not accepted', '3': 'Denied' },
  ageRanges: ['<25', '25-34', '35-44', '45-54', '55-64', '65-74', '>74'],

  // Race values in CSV
  raceValues: {
    'Asian': 'Asian',
    'White': 'White',
    'Black or African American': 'Black or African American',
    'American Indian or Alaska Native': 'American Indian or Alaska Native',
    'Native Hawaiian or Other Pacific Islander': 'Native Hawaiian or Other Pacific Islander'
  },

  // Sex values in CSV
  sexValues: {
    'Male': 'Male',
    'Female': 'Female',
    'Joint': 'Joint'
  }
};

// Handle complex multi-filter queries using local CSV data
// Strategy: Apply up to 2 filters via API (to reduce download), filter rest locally
async function handleComplexQuery(state, filters, year = '2024') {
  addMessage('system', `🔍 Complex query detected - optimizing download with smart filtering...`);

  // Split filters: API filters (applied to CSV download) vs Local filters (applied after)
  // Strategy: Apply up to 2 filters via API to minimize download size
  const apiFilters = {};
  const localFilters = {};
  let apiFilterCount = 0;

  // Map filter names
  const filterMapping = {
    race: 'races',
    sex: 'sexes',
    ethnicity: 'ethnicities',
    loanType: 'loan_types',
    actionTaken: 'actions_taken'
  };

  // Assign filters to API (max 2) or local
  for (const [key, value] of Object.entries(filters)) {
    if (!value) continue;

    const apiKey = filterMapping[key];

    // Age and custom filters always go to local (not supported well by API)
    if (key === 'age' || key === 'ages') {
      localFilters[HMDAFields.age] = value;
      continue;
    }

    // If we can still add API filters and this is a supported filter
    if (apiKey && apiFilterCount < 2) {
      apiFilters[apiKey] = value;
      apiFilterCount++;
    } else if (apiKey) {
      // Exceeded API limit, filter locally
      const localKey = key === 'race' ? HMDAFields.race :
                       key === 'sex' ? HMDAFields.sex :
                       key === 'ethnicity' ? HMDAFields.ethnicity :
                       key === 'loanType' ? HMDAFields.loanType :
                       key === 'actionTaken' ? HMDAFields.actionTaken : key;
      localFilters[localKey] = value;
    }
  }

  // Show filter strategy
  const apiFilterList = Object.entries(apiFilters).map(([k, v]) => `${k}=${v}`).join(', ');
  const localFilterList = Object.entries(localFilters).map(([k, v]) => `${k}=${v}`).join(', ');

  if (apiFilterList) {
    addMessage('system', `📡 API filters (reduce download): ${apiFilterList}`);
  }
  if (localFilterList) {
    addMessage('system', `🔧 Local filters (apply after): ${localFilterList}`);
  }

  // Download with API filters applied
  const csvResult = await fetchAndParseCSV(state, year, apiFilters);
  if (!csvResult || !csvResult.data) {
    addMessage('system', `❌ Could not load data for ${state}`);
    return null;
  }

  const data = csvResult.data;

  // Apply local filters if any
  let filtered = data;
  if (Object.keys(localFilters).length > 0) {
    addMessage('system', `📊 Applying local filters to ${data.length.toLocaleString()} records...`);
    filtered = filterLocalData(data, localFilters);
  }

  addMessage('system', `✅ Found ${filtered.length.toLocaleString()} matching records`);

  // Calculate totals and breakdown
  const result = {
    total: filtered.length,
    filters: filters,
    apiFilters: apiFilters,
    localFilters: localFilters,
    state: state,
    year: year,
    fromLocalData: true
  };

  // Calculate loan amount sum if available
  let totalAmount = 0;
  filtered.forEach(record => {
    const amount = parseFloat(record.loan_amount) || 0;
    totalAmount += amount * 1000; // HMDA amounts are in thousands
  });
  result.totalAmount = totalAmount;
  result.avgLoanAmount = filtered.length > 0 ? Math.round(totalAmount / filtered.length) : 0;

  // If age filter was applied, break down by age brackets
  if (filters.age || filters.ages) {
    result.ageBreakdown = {};
    const ageFilter = filters.age || filters.ages;
    const ageBrackets = Array.isArray(ageFilter) ? ageFilter : [ageFilter];

    ageBrackets.forEach(bracket => {
      const count = filtered.filter(r => r[HMDAFields.age] === bracket).length;
      result.ageBreakdown[bracket] = count;
    });
  }

  return result;
}

// Check if a query requires more than 2 demographic filters
function isComplexQuery(params) {
  const demographicFilters = ['races', 'sexes', 'ethnicities', 'ages'];
  let filterCount = 0;

  for (const filter of demographicFilters) {
    if (params[filter]) filterCount++;
  }

  // If we have states + more than 1 demographic filter, it's complex
  if (params.states && filterCount > 1) return true;

  // If we have more than 2 demographic filters, it's complex
  return filterCount > 2;
}

// Fetch credit union branch data
// Note: NCUA does NOT have a public REST API for branch locations
// Credit union branch data must be looked up manually at mapping.ncua.gov
async function fetchCreditUnionBranches(institutionName, _lei) {
  // NCUA (National Credit Union Administration) does not provide a public API
  // for credit union branch locations. The mapping.ncua.gov website is a
  // single-page application without a REST API.

  addMessage('system', `🏦 Note: ${institutionName} is a credit union`);
  addMessage('system', `📍 Credit union branch locations are not available via public API`);
  addMessage('system', `💡 For branch locations, visit: https://mapping.ncua.gov`);
  addMessage('system', `📊 Analyzing lending patterns by state instead...`);

  // Return null - lending geography analysis will still work
  return null;
}

// Fetch branch location data from FDIC API (banks) or NCUA API (credit unions)
async function fetchBranchLocations(institutionName, lei) {
  try {
    // Check cache first
    const cached = BranchCache.get(lei);
    if (cached) {
      addMessage('system', `✅ Loaded ${cached.length} branch locations from cache`);
      return cached;
    }
    
    addMessage('system', `🏢 Fetching branch locations for ${institutionName}...`);
    
    // Detect if this is likely a credit union based on name
    const nameLower = institutionName.toLowerCase();
    const isCreditUnion = nameLower.includes('credit union') || nameLower.includes('federal credit union') || 
                          nameLower.includes('fcu') || nameLower.includes(' cu ');
    
    let branchData = null;
    
    // Try NCUA first for credit unions
    if (isCreditUnion) {
      addMessage('system', `🏦 Detected credit union - checking for branch data...`);
      branchData = await fetchCreditUnionBranches(institutionName, lei);
      
      // Even if NCUA fails, we can still do geographic lending analysis
      if (!branchData) {
        addMessage('system', `📍 Branch locations unavailable, but we can still analyze lending patterns by state`);
        addMessage('system', `💡 Analysis will identify high-lending states where the credit union may lack presence`);
      }
    }
    
    // If no NCUA data or not a credit union, try FDIC
    if (!branchData) {
      addMessage('system', `🏦 Checking FDIC database...`);

      // Extract key words from institution name for better matching
      // Remove common suffixes and clean the name
      const cleanName = institutionName
        .replace(/\s*(national\s+association|n\.?a\.?|bank|trust|company|co\.?|inc\.?|corp\.?|llc|,)$/gi, '')
        .replace(/\s+/g, ' ')
        .trim();

      // Try multiple search strategies for better matching
      const searchStrategies = [
        // Strategy 1: Exact name match
        `filters=NAME:"${encodeURIComponent(institutionName)}"`,
        // Strategy 2: Contains search with cleaned name (FDIC supports wildcard with *)
        `filters=NAME:*${encodeURIComponent(cleanName)}*`,
        // Strategy 3: First significant word match (for common banks like "Chase", "Wells Fargo")
        `filters=NAME:*${encodeURIComponent(cleanName.split(' ')[0])}*`
      ];

      let branches = [];

      for (const filterStrategy of searchStrategies) {
        if (branches.length > 0) break; // Stop if we found results

        try {
          const fdicUrl = `https://banks.data.fdic.gov/api/locations?${filterStrategy}&limit=1000&format=json`;

          const response = await fetch(fdicUrl, {
            headers: { 'Accept': 'application/json' }
          });

          if (!response.ok) {
            continue; // Try next strategy
          }

          const data = await response.json();
          const results = data?.data || [];

          if (results.length > 0) {
            // Filter results to only include branches that match the institution
            // Use fuzzy matching on the name
            const searchTerms = cleanName.toLowerCase().split(' ').filter(w => w.length > 2);

            branches = results.filter(b => {
              const branchName = (b.NAME || '').toLowerCase();
              // Count how many search terms appear in branch name
              const matchCount = searchTerms.filter(term => branchName.includes(term)).length;
              // Require at least 50% of significant terms to match, or the first key term
              return matchCount >= Math.max(1, Math.floor(searchTerms.length * 0.5)) ||
                     branchName.includes(searchTerms[0]);
            });

            if (branches.length > 0) {
              addMessage('system', `✅ Found ${branches.length} matching branch locations from FDIC`);
              break;
            }
          }
        } catch (e) {
          console.warn('FDIC search strategy failed:', filterStrategy, e.message);
          continue;
        }
      }

      if (branches.length === 0) {
        // If it was a credit union and NCUA also failed
        if (isCreditUnion) {
          addMessage('system', `⚠️ No branch data found in either NCUA or FDIC databases.`);
          addMessage('system', `💡 Try using the exact legal name from NCUA records.`);
        } else {
          addMessage('system', `⚠️ No branch data found in FDIC database.`);
          addMessage('system', `💡 Try using the institution's official legal name (e.g., "Navy Federal Credit Union" instead of "Navy Fed").`);
        }
        return null;
      }

      // Extract relevant branch information from FDIC
      branchData = branches.map(b => ({
        name: b.NAME,
        address: b.ADDRESS,
        city: b.CITY,
        state: b.STNAME,
        county: b.COUNTY,
        zip: b.ZIP,
        latitude: parseFloat(b.LATITUDE),
        longitude: parseFloat(b.LONGITUDE),
        type: b.BKCLASS // Bank class/type
      })).filter(b => b.latitude && b.longitude);

      addMessage('system', `✅ Loaded ${branchData.length} branch locations with coordinates`);
    }
    
    // Cache the results
    if (branchData && branchData.length > 0) {
      BranchCache.set(lei, branchData);
    }
    
    return branchData;
    
  } catch (error) {
    addMessage('system', `⚠️ Could not fetch branch data: ${error.message}`);
    return null;
  }
}

// Analyze lending activity by geographic area (county/state level)
async function analyzeLendingByGeography(lei, institutionName, year = '2024') {
  try {
    addMessage('system', `📍 Analyzing lending activity by location for ${institutionName}...`);
    
    // Check all 50 states + DC for complete picture
    const allStates = ['AL','AK','AZ','AR','CA','CO','CT','DE','DC','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY'];
    const stateData = [];
    
    addMessage('system', `📊 Scanning all 50 states + DC for lending activity...`);
    
    // Query in batches for better performance
    const batchSize = 10;
    for (let i = 0; i < allStates.length; i += batchSize) {
      const batch = allStates.slice(i, i + batchSize);
      
      await Promise.all(batch.map(async (state) => {
        try {
          const stateParams = {
            years: year,
            leis: lei,
            states: state,
            actions_taken: '1'
          };
          const stateUrl = buildFFIECUrl('aggregations', stateParams);
          const stateResult = await fetchFFIECData(stateUrl, 1);
          const count = stateResult?.aggregations?.reduce((sum, agg) => sum + (agg.count || 0), 0) || 0;
          
          if (count > 0) {
            stateData.push({ state, count });
          }
        } catch (e) {
          // Skip states with errors
        }
      }));
      
      // Show progress
      const checked = Math.min(i + batchSize, allStates.length);
      addMessage('system', `   Checked ${checked}/${allStates.length} states...`);
    }
    
    stateData.sort((a, b) => b.count - a.count);
    
    addMessage('system', `✅ Found lending activity in ${stateData.length} states`);
    
    return stateData;
    
  } catch (error) {
    addMessage('system', `⚠️ Error analyzing geography: ${error.message}`);
    return null;
  }
}

// Generate branch expansion recommendations
function generateExpansionRecommendations(branchData, lendingData, _institutionName) {
  const recommendations = [];
  
  // If we don't have branch data, we can't make reliable recommendations
  const hasBranchData = branchData && branchData.length > 0;
  
  // Build state map of branch presence (only if we have data)
  const branchStates = {};
  if (hasBranchData) {
    branchData.forEach(branch => {
      const state = branch.state;
      if (!branchStates[state]) {
        branchStates[state] = 0;
      }
      branchStates[state]++;
    });
  }
  
  // Analyze lending vs branch presence
  if (lendingData && lendingData.length > 0) {
    lendingData.forEach(stateData => {
      const state = stateData.state;
      const loanCount = stateData.count;
      const branchCount = branchStates[state] || 0;
      
      if (!hasBranchData) {
        // WITHOUT branch data: Only show high-lending states without making branch claims
        if (loanCount >= 500) {
          recommendations.push({
            type: 'HIGH_VOLUME',
            state: state,
            reason: `${loanCount.toLocaleString()} originated loans in this state`,
            loanCount: loanCount,
            branchCount: '?',
            opportunity: '🔵 HIGH LENDING VOLUME: Strong market presence. Verify current branch locations to assess expansion needs.'
          });
        } else if (loanCount >= 100) {
          recommendations.push({
            type: 'MODERATE_VOLUME',
            state: state,
            reason: `${loanCount.toLocaleString()} originated loans in this state`,
            loanCount: loanCount,
            branchCount: '?',
            opportunity: '🟣 MODERATE LENDING: Active market. Check existing branch coverage to identify gaps.'
          });
        }
      } else {
        // WITH branch data: Full analysis possible
        const loansPerBranch = branchCount > 0 ? loanCount / branchCount : loanCount;
        
        // PRIORITY 1: Online lending success with NO physical presence
        if (loanCount >= 50 && branchCount === 0) {
          const priority = loanCount >= 500 ? 'CRITICAL' : loanCount >= 200 ? 'HIGH_PRIORITY' : 'PRIORITY';
          recommendations.push({
            type: priority,
            state: state,
            reason: `${loanCount.toLocaleString()} loans but NO physical branches found`,
            loanCount: loanCount,
            branchCount: 0,
            opportunity: loanCount >= 500 
              ? '🔴 CRITICAL: Major proven market - customers already banking remotely. Opening branch could significantly increase market share.'
              : loanCount >= 200
              ? '🟠 HIGH PRIORITY: Strong online presence shows market demand. Physical branch would improve customer access.'
              : '🟡 OPPORTUNITY: Moderate digital lending success. Consider branch to convert online customers to full-service relationships.'
          });
        }
        // PRIORITY 2: High lending with minimal branches (underserved)
        else if (loanCount >= 200 && branchCount > 0 && loansPerBranch >= 300) {
          recommendations.push({
            type: 'EXPANSION',
            state: state,
            reason: `Very high loans-per-branch ratio (${Math.round(loansPerBranch)} loans per ${branchCount} branch${branchCount > 1 ? 'es' : ''})`,
            loanCount: loanCount,
            branchCount: branchCount,
            opportunity: '🟢 GROWTH: Existing branches heavily utilized. Additional locations would reduce customer distance and capture more market share.'
          });
        }
        // PRIORITY 3: Good lending with some presence (add more branches)
        else if (loanCount >= 100 && branchCount > 0 && loansPerBranch >= 150) {
          recommendations.push({
            type: 'EXPANSION',
            state: state,
            reason: `High loans-per-branch ratio (${Math.round(loansPerBranch)} loans per ${branchCount} branch${branchCount > 1 ? 'es' : ''})`,
            loanCount: loanCount,
            branchCount: branchCount,
            opportunity: '🟢 EXPANSION: Strong lending activity. Additional branches would improve convenience.'
          });
        }
        // PRIORITY 4: Underperforming markets
        else if (branchCount > 0 && loanCount < 30 && loansPerBranch < 20) {
          recommendations.push({
            type: 'UNDERPERFORMING',
            state: state,
            reason: `Very low lending volume (${loanCount} loans) despite ${branchCount} branch${branchCount > 1 ? 'es' : ''}`,
            loanCount: loanCount,
            branchCount: branchCount,
            opportunity: '🟡 REVIEW: Low activity suggests market challenges. Consider enhanced marketing or strategic consolidation.'
          });
        }
      }
    });
  }
  
  // Sort by priority and loan count
  recommendations.sort((a, b) => {
    const priority = { CRITICAL: 5, HIGH_PRIORITY: 4, PRIORITY: 3, EXPANSION: 2, HIGH_VOLUME: 2, MODERATE_VOLUME: 1, UNDERPERFORMING: 1 };
    const aPriority = priority[a.type] || 0;
    const bPriority = priority[b.type] || 0;
    
    if (aPriority !== bPriority) {
      return bPriority - aPriority;
    }
    return b.loanCount - a.loanCount;
  });
  
  return recommendations;
}

// Render branch analysis and recommendations
function renderBranchAnalysis(institutionName, branchData, lendingData, recommendations) {
  const container = document.createElement('div');
  container.className = 'message assistant';
  
  const title = document.createElement('h3');
  title.textContent = `🏢 Branch & Market Analysis - ${institutionName}`;
  title.style.marginBottom = '16px';
  title.style.color = '#4ea1d3';
  title.style.fontSize = '18px';
  container.appendChild(title);
  
  // Branch summary
  if (branchData && branchData.length > 0) {
    const branchSummary = document.createElement('div');
    branchSummary.style.marginBottom = '20px';
    branchSummary.style.padding = '15px';
    branchSummary.style.backgroundColor = 'rgba(46, 110, 162, 0.1)';
    branchSummary.style.borderRadius = '8px';
    
    // Count branches by state
    const stateCount = {};
    branchData.forEach(b => {
      stateCount[b.state] = (stateCount[b.state] || 0) + 1;
    });
    
    const topStates = Object.entries(stateCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([state, count]) => `${state}: ${count}`)
      .join(', ');
    
    branchSummary.innerHTML = `
      <div style="font-weight: bold; margin-bottom: 8px;">Branch Network Overview</div>
      <div>Total Branches: <strong>${branchData.length}</strong></div>
      <div>States Served: <strong>${Object.keys(stateCount).length}</strong></div>
      <div style="margin-top: 8px; font-size: 12px; opacity: 0.9;">Top States: ${topStates}</div>
    `;
    
    container.appendChild(branchSummary);
  }
  
  // Lending geography
  if (lendingData && lendingData.length > 0) {
    const lendingTitle = document.createElement('h4');
    lendingTitle.textContent = '📊 Lending Activity by State';
    lendingTitle.style.marginTop = '20px';
    lendingTitle.style.marginBottom = '10px';
    lendingTitle.style.color = '#4ea1d3';
    container.appendChild(lendingTitle);
    
    const table = document.createElement('table');
    table.style.width = '100%';
    table.style.borderCollapse = 'collapse';
    table.style.fontSize = '12px';
    table.style.marginBottom = '20px';
    
    // Header
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    headerRow.style.backgroundColor = '#153955';
    ['State', 'Loans', 'Branches', 'Loans/Branch'].forEach(col => {
      const th = document.createElement('th');
      th.textContent = col;
      th.style.padding = '8px';
      th.style.textAlign = 'left';
      th.style.color = '#d1e4f3';
      th.style.borderBottom = '2px solid #4ea1d3';
      headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
    table.appendChild(thead);
    
    // Body
    const tbody = document.createElement('tbody');
    lendingData.slice(0, 10).forEach((item, idx) => {
      const branchCount = branchData ? branchData.filter(b => b.state === item.state).length : 0;
      const loansPerBranch = branchCount > 0 ? Math.round(item.count / branchCount) : 'N/A';
      
      const tr = document.createElement('tr');
      if (idx % 2 === 0) tr.style.backgroundColor = 'rgba(46, 110, 162, 0.1)';
      
      [item.state, item.count.toLocaleString(), branchCount, loansPerBranch].forEach(val => {
        const td = document.createElement('td');
        td.textContent = val;
        td.style.padding = '8px';
        td.style.borderBottom = '1px solid #2e6ea2';
        tr.appendChild(td);
      });
      
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    
    container.appendChild(table);
  }
  
  // Recommendations
  if (recommendations && recommendations.length > 0) {
    const recTitle = document.createElement('h4');
    recTitle.textContent = branchData && branchData.length > 0 
      ? '💡 Expansion Recommendations' 
      : '📊 Lending Volume Analysis';
    recTitle.style.marginTop = '20px';
    recTitle.style.marginBottom = '12px';
    recTitle.style.color = '#50c878';
    container.appendChild(recTitle);
    
    // Add disclaimer if no branch data
    if (!branchData || branchData.length === 0) {
      const disclaimer = document.createElement('div');
      disclaimer.style.padding = '12px';
      disclaimer.style.marginBottom = '12px';
      disclaimer.style.backgroundColor = 'rgba(78, 161, 211, 0.1)';
      disclaimer.style.borderRadius = '6px';
      disclaimer.style.borderLeft = '4px solid #4ea1d3';
      disclaimer.innerHTML = `
        <div style="font-weight: bold; margin-bottom: 4px;">⚠️ Note: Branch Location Data Unavailable</div>
        <div style="font-size: 12px;">
          The recommendations below are based on lending volumes only. Branch location data could not be retrieved from public APIs.
          Please verify current branch presence manually before making expansion decisions.
        </div>
      `;
      container.appendChild(disclaimer);
    }
    
    recommendations.slice(0, 5).forEach((rec, idx) => {
      const recDiv = document.createElement('div');
      recDiv.style.marginBottom = '12px';
      recDiv.style.padding = '12px';
      recDiv.style.borderRadius = '6px';
      recDiv.style.borderLeft = '4px solid ' + 
        (rec.type === 'CRITICAL' ? '#dc143c' :
         rec.type === 'HIGH_PRIORITY' ? '#ff6b6b' : 
         rec.type === 'PRIORITY' ? '#ffa500' :
         rec.type === 'HIGH_VOLUME' ? '#4ea1d3' :
         rec.type === 'MODERATE_VOLUME' ? '#9370db' :
         rec.type === 'EXPANSION' ? '#50c878' : '#808080');
      recDiv.style.backgroundColor = 'rgba(46, 110, 162, 0.05)';
      
      const typeLabel = rec.type === 'CRITICAL' ? '🔴 CRITICAL - Major Opportunity' :
                        rec.type === 'HIGH_PRIORITY' ? '🟠 High Priority' :
                        rec.type === 'PRIORITY' ? '🟡 Priority Market' :
                        rec.type === 'HIGH_VOLUME' ? '🔵 High Lending Volume' :
                        rec.type === 'MODERATE_VOLUME' ? '🟣 Moderate Lending' :
                        rec.type === 'EXPANSION' ? '🟢 Growth Opportunity' : '⚪ Review Needed';
      
      recDiv.innerHTML = `
        <div style="font-weight: bold; margin-bottom: 6px;">${idx + 1}. ${rec.state} - ${typeLabel}</div>
        <div style="font-size: 12px; margin-bottom: 4px;">${rec.reason}</div>
        <div style="font-size: 11px; opacity: 0.8; font-style: italic;">${rec.opportunity}</div>
      `;
      
      container.appendChild(recDiv);
    });
  } else if (lendingData && lendingData.length > 0) {
    const noRecDiv = document.createElement('div');
    noRecDiv.style.padding = '12px';
    noRecDiv.style.marginTop = '12px';
    noRecDiv.style.backgroundColor = 'rgba(46, 110, 162, 0.05)';
    noRecDiv.style.borderRadius = '6px';
    noRecDiv.textContent = '✅ Branch distribution appears well-balanced with lending activity.';
    container.appendChild(noRecDiv);
  }
  
  chat.appendChild(container);
  chat.scrollTop = chat.scrollHeight;
}

// Main form submission handler
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const text = input.value.trim();
  if (!text) return;

  input.value = '';
  if (typeaheadDropdown) typeaheadDropdown.classList.remove('show');
  historyIndex = -1;
  savedInput = '';
  QueryHistory.add(text);
  addMessage('user', text);
  showSkeleton();

  // Load settings
  const cfg = await chrome.storage.sync.get(['maxPages', 'diagnostics']);
  const maxPages = Math.max(1, Math.min(20, Number(cfg.maxPages) || 3));
  const showDiag = !!cfg.diagnostics;

  try {
    // Step 1: Initialize Phi if needed
    if (!localPhi.initialized) {
      await localPhi.init();
      if (!localPhi.initialized) {
        hideSkeleton();
        addMessage('system', `❌ Failed to initialize Phi: ${localPhi.error}`);
        return;
      }
    }

    // For comparison queries: extract institution names first, then use Phi for filters only
    const lowerText = text.toLowerCase();
    const isCompareQuery = (lowerText.includes('compar') || lowerText.includes(' vs ') ||
      lowerText.includes('versus') || lowerText.includes('between') || lowerText.includes('differ'));
    const extractedNames = extractInstitutionNames(text);

    let planText = null;
    let plan = null;

    if (isCompareQuery && extractedNames.length >= 1) {
      addMessage('system', `🔍 Found institutions: ${extractedNames.map(n => `"${n}"`).join(', ')}`);

      // Strip institution names from query, send remaining text to Phi for filter extraction
      let filterQuery = text;
      extractedNames.forEach(name => { filterQuery = filterQuery.replace(name, ''); });
      // Clean up separators
      filterQuery = filterQuery.replace(/\b(compare|vs\.?|versus|between|and|to|with|comparison|lending)\b/gi, ' ').replace(/\s+/g, ' ').trim();

      // Build base plan from extracted names
      if (extractedNames.length >= 2) {
        plan = { intent: 'analysis', analysis_type: 'compare_institutions', institution_name: extractedNames[0], institution_name_2: extractedNames[1], endpoint: 'filers', params: { years: '2024' } };
      } else {
        // Detect state average vs national average
        const hasStateContext = lowerText.includes('average') || lowerText.includes('market') || lowerText.includes('state');
        const detectedState = hasStateContext ? detectState(text) : null;

        if (detectedState) {
          plan = { intent: 'analysis', analysis_type: 'compare_to_state', institution_name: extractedNames[0], compare_state: detectedState, endpoint: 'filers', params: { years: '2024' } };
        } else {
          plan = { intent: 'analysis', analysis_type: 'compare_to_national', institution_name: extractedNames[0], endpoint: 'filers', params: { years: '2024' } };
        }
      }

      // If there are remaining filter words (e.g. "VA loans", "2024", "in Utah"), ask Phi to parse them
      if (filterQuery.length > 2) {
        addMessage('system', `🤖 Phi mini extracting filters from: "${filterQuery}"...`);
        try {
          const filterPlanText = await localPhi.generatePlan(filterQuery);
          const filterPlan = parseJSON(filterPlanText);
          if (filterPlan?.params) {
            // Merge Phi's filters into our plan
            plan.params = { ...plan.params, ...filterPlan.params };
            if (showDiag) addMessage('system', `📋 Phi filters: ${JSON.stringify(filterPlan.params)}`);
          }
        } catch (phiErr) {
          addMessage('system', '⚠️ Could not extract additional filters — using defaults (2024)');
          console.error('Phi filter extraction failed:', phiErr);
        }
      }

      addMessage('system', `📊 Comparing with params: ${JSON.stringify(plan.params)}`);
    }

    // Detect market overview queries (e.g. "California mortgage market overview")
    if (!plan) {
      const isOverview = lowerText.includes('overview') || lowerText.includes('market summary') ||
        lowerText.includes('market report') || lowerText.includes('lending summary') ||
        (lowerText.includes('market') && !lowerText.includes('average'));
      const overviewState = isOverview ? detectState(text) : null;

      if (isOverview && overviewState) {
        plan = { intent: 'market_overview', analysis_type: 'market_overview', state: overviewState, endpoint: 'aggregations', params: { years: '2024', states: overviewState } };
        addMessage('system', `📊 Market overview for ${STATE_NAMES[overviewState] || overviewState}`);
      }
    }

    if (!plan) {
      // Standard Phi flow for non-comparison queries
      addMessage('system', '🤖 Phi mini analyzing your message...');
      try {
        planText = await localPhi.generatePlan(text);
        if (showDiag) addMessage('system', `📋 Phi response: ${planText.slice(0, 250)}...`);
        plan = parseJSON(planText);
      } catch (phiErr) {
        console.error('Phi generatePlan failed:', phiErr);
      }
    }

    hideSkeleton();

    if (!plan) {
      addMessage('system', '❌ Could not parse response from Phi mini');
      if (planText) addMessage('assistant', planText);
      return;
    }

    // FEATURE: Query refinement - merge with previous context
    if (lastQueryContext && lastQueryContext.plan?.params) {
      const refineWords = ['now filter', 'now show', 'also show', 'break that down', 'filter that', 'add filter', 'narrow', 'refine'];
      const isRefinement = refineWords.some(w => text.toLowerCase().includes(w));
      if (isRefinement && plan.params) {
        // Merge: keep previous params, overlay new ones
        const merged = { ...lastQueryContext.plan.params, ...plan.params };
        plan.params = merged;
        plan.endpoint = plan.endpoint || lastQueryContext.plan.endpoint;
        addMessage('system', `🔗 Refining previous query with new filters`);
      }
    }

    // Save context for next refinement
    lastQueryContext = { text, plan };

    // Check if this is a conversational message (not HMDA query)
    if (plan.not_hmda) {
      addMessage('assistant', plan.response || planText);
      return;
    }

    // FEATURE: Detect trend queries
    const textLower = text.toLowerCase();
    if (textLower.includes('trend') || textLower.includes('year over year') || textLower.includes('year-over-year') || textLower.includes('historical')) {
      const trendParams = { ...plan.params };
      delete trendParams.years; // we'll iterate over years
      await handleTrendQuery(trendParams, text);
      addReportButtons();
      return;
    }

    // Check if this is a market overview query
    if (plan.analysis_type === 'market_overview' && plan.state) {
      const year = plan.params?.years || '2024';
      const stName = STATE_NAMES[plan.state] || plan.state;
      addMessage('assistant', `📊 **${stName} Mortgage Market Overview (${year})**`);

      // Fetch multiple data points in parallel
      const [originated, denied, loanType1, loanType2, loanType3, loanType4, purp1, purp31] = await Promise.all([
        fetchFFIECData(buildFFIECUrl('aggregations', { years: year, states: plan.state, actions_taken: '1' }), 1).catch(() => null),
        fetchFFIECData(buildFFIECUrl('aggregations', { years: year, states: plan.state, actions_taken: '3' }), 1).catch(() => null),
        fetchFFIECData(buildFFIECUrl('aggregations', { years: year, states: plan.state, actions_taken: '1', loan_types: '1' }), 1).catch(() => null),
        fetchFFIECData(buildFFIECUrl('aggregations', { years: year, states: plan.state, actions_taken: '1', loan_types: '2' }), 1).catch(() => null),
        fetchFFIECData(buildFFIECUrl('aggregations', { years: year, states: plan.state, actions_taken: '1', loan_types: '3' }), 1).catch(() => null),
        fetchFFIECData(buildFFIECUrl('aggregations', { years: year, states: plan.state, actions_taken: '1', loan_types: '4' }), 1).catch(() => null),
        fetchFFIECData(buildFFIECUrl('aggregations', { years: year, states: plan.state, actions_taken: '1', loan_purposes: '1' }), 1).catch(() => null),
        fetchFFIECData(buildFFIECUrl('aggregations', { years: year, states: plan.state, actions_taken: '1', loan_purposes: '31' }), 1).catch(() => null),
      ]);

      const sumAgg = (d) => d?.aggregations?.reduce((s, a) => s + (a.count || 0), 0) || 0;
      const totalOrig = sumAgg(originated);
      const totalDenied = sumAgg(denied);
      const totalApps = totalOrig + totalDenied;
      const approvalRate = totalApps > 0 ? ((totalOrig / totalApps) * 100).toFixed(1) : 'N/A';

      const convLoans = sumAgg(loanType1);
      const fhaLoans = sumAgg(loanType2);
      const vaLoans = sumAgg(loanType3);
      const usdaLoans = sumAgg(loanType4);
      const purchaseLoans = sumAgg(purp1);
      const refiLoans = sumAgg(purp31);

      // Render overview card
      const container = document.createElement('div');
      container.style.cssText = 'background: #1a3550; border-radius: 12px; padding: 16px; margin: 8px 0;';

      const title = document.createElement('h3');
      title.textContent = `${stName} Lending Market — ${year}`;
      title.style.cssText = 'color: #4ea1d3; margin: 0 0 12px; font-size: 14px;';
      container.appendChild(title);

      // Summary stats
      let tableHtml = `<table style="width:100%;border-collapse:collapse;font-size:12px;">
        <tr style="border-bottom:2px solid #2e6ea2;">
          <th style="text-align:left;padding:8px;color:#7fb3de;" colspan="2">Key Metrics</th>
        </tr>
        <tr style="border-bottom:1px solid rgba(255,255,255,0.05);">
          <td style="padding:6px;color:#c8ddf0;">Total Originated Loans</td>
          <td style="text-align:right;padding:6px;color:#50c878;font-weight:bold;">${totalOrig.toLocaleString()}</td>
        </tr>
        <tr style="border-bottom:1px solid rgba(255,255,255,0.05);">
          <td style="padding:6px;color:#c8ddf0;">Total Denied</td>
          <td style="text-align:right;padding:6px;color:#ff6b6b;font-weight:bold;">${totalDenied.toLocaleString()}</td>
        </tr>
        <tr style="border-bottom:1px solid rgba(255,255,255,0.05);">
          <td style="padding:6px;color:#c8ddf0;">Approval Rate</td>
          <td style="text-align:right;padding:6px;color:#50c878;font-weight:bold;">${approvalRate}%</td>
        </tr>
        <tr style="border-bottom:2px solid #2e6ea2;">
          <th style="text-align:left;padding:8px;color:#7fb3de;" colspan="2">By Loan Type</th>
        </tr>
        <tr style="border-bottom:1px solid rgba(255,255,255,0.05);">
          <td style="padding:6px;color:#c8ddf0;">Conventional</td>
          <td style="text-align:right;padding:6px;font-weight:bold;">${convLoans.toLocaleString()}</td>
        </tr>
        <tr style="border-bottom:1px solid rgba(255,255,255,0.05);">
          <td style="padding:6px;color:#c8ddf0;">FHA</td>
          <td style="text-align:right;padding:6px;font-weight:bold;">${fhaLoans.toLocaleString()}</td>
        </tr>
        <tr style="border-bottom:1px solid rgba(255,255,255,0.05);">
          <td style="padding:6px;color:#c8ddf0;">VA</td>
          <td style="text-align:right;padding:6px;font-weight:bold;">${vaLoans.toLocaleString()}</td>
        </tr>
        <tr style="border-bottom:1px solid rgba(255,255,255,0.05);">
          <td style="padding:6px;color:#c8ddf0;">USDA</td>
          <td style="text-align:right;padding:6px;font-weight:bold;">${usdaLoans.toLocaleString()}</td>
        </tr>
        <tr style="border-bottom:2px solid #2e6ea2;">
          <th style="text-align:left;padding:8px;color:#7fb3de;" colspan="2">By Purpose</th>
        </tr>
        <tr style="border-bottom:1px solid rgba(255,255,255,0.05);">
          <td style="padding:6px;color:#c8ddf0;">Home Purchase</td>
          <td style="text-align:right;padding:6px;font-weight:bold;">${purchaseLoans.toLocaleString()}</td>
        </tr>
        <tr style="border-bottom:1px solid rgba(255,255,255,0.05);">
          <td style="padding:6px;color:#c8ddf0;">Refinance</td>
          <td style="text-align:right;padding:6px;font-weight:bold;">${refiLoans.toLocaleString()}</td>
        </tr>
      </table>`;

      const tableDiv = document.createElement('div');
      tableDiv.innerHTML = tableHtml;
      container.appendChild(tableDiv);

      // Donut chart for loan type breakdown
      const chartData = [
        { type: 'Conventional', count: convLoans },
        { type: 'FHA', count: fhaLoans },
        { type: 'VA', count: vaLoans },
        { type: 'USDA', count: usdaLoans },
      ].filter(d => d.count > 0);

      if (chartData.length > 0 && typeof renderDonutChart === 'function') {
        const chartContainer = document.createElement('div');
        chartContainer.style.marginTop = '12px';
        container.appendChild(chartContainer);
        renderDonutChart(chartData, chartContainer);
      }

      chat.appendChild(container);
      chat.scrollTop = chat.scrollHeight;

      // AI summary
      if (localPhi.initialized) {
        addMessage('system', '🤖 Phi mini generating market insights...');
        const overviewPrompt = `${stName} mortgage market ${year} (loan COUNTS not dollars):
Total originated: ${totalOrig.toLocaleString()}, Denied: ${totalDenied.toLocaleString()}, Approval rate: ${approvalRate}%
Conventional: ${convLoans.toLocaleString()}, FHA: ${fhaLoans.toLocaleString()}, VA: ${vaLoans.toLocaleString()}, USDA: ${usdaLoans.toLocaleString()}
Purchase: ${purchaseLoans.toLocaleString()}, Refinance: ${refiLoans.toLocaleString()}

Provide 3-4 brief insights about this state's lending market.`;
        try {
          const summary = await localPhi.session.prompt(overviewPrompt);
          addMessage('assistant', `💡 **Market Insights:**\n${summary}`);
        } catch (_e) { /* Phi summary is optional */ }
      }

      addReportButtons();
      return;
    }

    // Check if this is a two-institution comparison
    if (plan.analysis_type === 'compare_institutions' && plan.institution_name && plan.institution_name_2) {
      const year = plan.params?.years || '2024';

      // Search for both institutions
      addMessage('assistant', `🔍 Comparing "${plan.institution_name}" vs "${plan.institution_name_2}"...`);

      const search1 = await findInstitutionByName(plan.institution_name, year);
      if (!search1.found) {
        addMessage('system', `⚠️ Could not find "${plan.institution_name}"`);
        if (search1.suggestions.length > 0) renderInstitutionSuggestions(search1.suggestions, plan.institution_name);
        return;
      }

      const search2 = await findInstitutionByName(plan.institution_name_2, year);
      if (!search2.found) {
        addMessage('system', `⚠️ Could not find "${plan.institution_name_2}"`);
        if (search2.suggestions.length > 0) renderInstitutionSuggestions(search2.suggestions, plan.institution_name_2);
        return;
      }

      const inst1 = search1.primary;
      const inst2 = search2.primary;
      addMessage('system', `✅ Found: ${inst1.name} vs ${inst2.name}`);

      // Analyze both institutions
      const analysis1 = await analyzeInstitution(inst1.lei, inst1.name, year);
      const analysis2 = await analyzeInstitution(inst2.lei, inst2.name, year);

      if (!analysis1 || !analysis2) {
        addMessage('system', '❌ Failed to analyze one or both institutions');
        return;
      }

      // Render side-by-side comparison
      const container = document.createElement('div');
      container.style.cssText = 'background: #1a3550; border-radius: 12px; padding: 16px; margin: 8px 0;';

      const title = document.createElement('h3');
      title.textContent = `📊 ${inst1.name} vs ${inst2.name}`;
      title.style.cssText = 'color: #4ea1d3; margin: 0 0 12px; font-size: 14px;';
      container.appendChild(title);

      // Build comparison table
      const rows = [
        ['Total Originated Loans', analysis1.totalLoans.toLocaleString(), analysis2.totalLoans.toLocaleString()],
        ['Originated', analysis1.approvalData?.originated?.toLocaleString() || 'N/A', analysis2.approvalData?.originated?.toLocaleString() || 'N/A'],
        ['Denied', analysis1.approvalData?.denied?.toLocaleString() || 'N/A', analysis2.approvalData?.denied?.toLocaleString() || 'N/A'],
        ['Approval Rate', (analysis1.approvalData?.approvalRate || 'N/A') + '%', (analysis2.approvalData?.approvalRate || 'N/A') + '%'],
      ];

      // Add loan type rows
      const allTypes = new Set();
      (analysis1.loanTypeBreakdown || []).forEach(b => allTypes.add(b.type));
      (analysis2.loanTypeBreakdown || []).forEach(b => allTypes.add(b.type));
      for (const type of allTypes) {
        const c1 = analysis1.loanTypeBreakdown?.find(b => b.type === type)?.count || 0;
        const c2 = analysis2.loanTypeBreakdown?.find(b => b.type === type)?.count || 0;
        rows.push([type, c1.toLocaleString(), c2.toLocaleString()]);
      }

      let tableHtml = `<table style="width:100%;border-collapse:collapse;font-size:12px;">
        <tr style="border-bottom:1px solid #2e6ea2;">
          <th style="text-align:left;padding:6px;color:#7fb3de;">Metric</th>
          <th style="text-align:right;padding:6px;color:#50c878;">${inst1.name}</th>
          <th style="text-align:right;padding:6px;color:#f0a050;">${inst2.name}</th>
        </tr>`;
      for (const [metric, v1, v2] of rows) {
        tableHtml += `<tr style="border-bottom:1px solid rgba(255,255,255,0.05);">
          <td style="padding:6px;color:#c8ddf0;">${metric}</td>
          <td style="text-align:right;padding:6px;color:#50c878;font-weight:bold;">${v1}</td>
          <td style="text-align:right;padding:6px;color:#f0a050;font-weight:bold;">${v2}</td>
        </tr>`;
      }
      tableHtml += '</table>';

      const tableDiv = document.createElement('div');
      tableDiv.innerHTML = tableHtml;
      container.appendChild(tableDiv);
      chat.appendChild(container);
      chat.scrollTop = chat.scrollHeight;

      // AI summary
      if (localPhi.initialized) {
        addMessage('system', '🤖 Phi mini generating insights...');
        const comparePrompt = `Compare these two institutions (loan COUNTS, not dollar amounts):
${inst1.name}: ${analysis1.totalLoans.toLocaleString()} originated loans, ${analysis1.approvalData?.approvalRate}% approval rate
${inst2.name}: ${analysis2.totalLoans.toLocaleString()} originated loans, ${analysis2.approvalData?.approvalRate}% approval rate

Provide 2-3 brief insights comparing their lending performance.`;
        const summary = await localPhi.session.prompt(comparePrompt);
        addMessage('assistant', `💡 **Comparison Insights:**\n${summary}`);
      }

      addReportButtons();
      if (showDiag) addMessage('system', '✅ Comparison complete!');
      return;
    }

    // Check if this is an institution vs state average query
    if (plan.analysis_type === 'compare_to_state' && plan.institution_name && plan.compare_state) {
      const year = plan.params?.years || '2024';
      addMessage('assistant', `🔍 Comparing "${plan.institution_name}" to ${plan.compare_state} state average...`);

      const searchResult = await findInstitutionByName(plan.institution_name, year);
      if (!searchResult.found) {
        addMessage('system', `⚠️ Could not find "${plan.institution_name}"`);
        if (searchResult.suggestions?.length > 0) renderInstitutionSuggestions(searchResult.suggestions, plan.institution_name);
        return;
      }

      const institution = searchResult.primary;
      addMessage('system', `✅ Found: ${institution.name} (LEI: ${institution.lei})`);

      // Fetch institution data and state data in parallel
      const [instAnalysis, stateData] = await Promise.all([
        analyzeInstitution(institution.lei, institution.name, year),
        fetchStateAverages(plan.compare_state, year)
      ]);

      if (!instAnalysis || !stateData) {
        addMessage('system', '❌ Failed to fetch comparison data');
        return;
      }

      // Calculate state-level metrics from aggregations
      const stateDeniedParams = { years: year, states: plan.compare_state, actions_taken: '3' };
      const stateDeniedUrl = buildFFIECUrl('aggregations', stateDeniedParams);
      let stateDenied = 0;
      try {
        const deniedData = await fetchFFIECData(stateDeniedUrl, 1);
        stateDenied = deniedData?.aggregations?.reduce((s, a) => s + (a.count || 0), 0) || 0;
      } catch (_e) { /* ignore */ }
      const stateTotal = stateData.totalLoans + stateDenied;
      const stateApprovalRate = stateTotal > 0 ? ((stateData.totalLoans / stateTotal) * 100).toFixed(1) : 'N/A';

      // Render comparison
      const container = document.createElement('div');
      container.style.cssText = 'background: #1a3550; border-radius: 12px; padding: 16px; margin: 8px 0;';

      const title = document.createElement('h3');
      title.textContent = `📊 ${institution.name} vs ${stateData.stateName} State Average`;
      title.style.cssText = 'color: #4ea1d3; margin: 0 0 12px; font-size: 14px;';
      container.appendChild(title);

      const rows = [
        ['Total Originated Loans', instAnalysis.totalLoans.toLocaleString(), stateData.totalLoans.toLocaleString()],
        ['Denied', instAnalysis.approvalData?.denied?.toLocaleString() || 'N/A', stateDenied.toLocaleString()],
        ['Approval Rate', (instAnalysis.approvalData?.approvalRate || 'N/A') + '%', stateApprovalRate + '%'],
      ];

      // Add loan type breakdown
      if (instAnalysis.loanTypeBreakdown) {
        instAnalysis.loanTypeBreakdown.forEach(b => {
          rows.push([b.type, b.count.toLocaleString(), '—']);
        });
      }

      let tableHtml = `<table style="width:100%;border-collapse:collapse;font-size:12px;">
        <tr style="border-bottom:1px solid #2e6ea2;">
          <th style="text-align:left;padding:6px;color:#7fb3de;">Metric</th>
          <th style="text-align:right;padding:6px;color:#50c878;">${institution.name}</th>
          <th style="text-align:right;padding:6px;color:#f0a050;">${stateData.stateName} Avg</th>
        </tr>`;
      for (const [metric, v1, v2] of rows) {
        tableHtml += `<tr style="border-bottom:1px solid rgba(255,255,255,0.05);">
          <td style="padding:6px;color:#c8ddf0;">${metric}</td>
          <td style="text-align:right;padding:6px;color:#50c878;font-weight:bold;">${v1}</td>
          <td style="text-align:right;padding:6px;color:#f0a050;font-weight:bold;">${v2}</td>
        </tr>`;
      }
      tableHtml += '</table>';

      const tableDiv = document.createElement('div');
      tableDiv.innerHTML = tableHtml;
      container.appendChild(tableDiv);
      chat.appendChild(container);
      chat.scrollTop = chat.scrollHeight;

      // AI summary
      if (localPhi.initialized) {
        addMessage('system', '🤖 Phi mini generating insights...');
        const statePrompt = `Compare this institution to the ${stateData.stateName} state average (loan COUNTS, not dollars):
${institution.name}: ${instAnalysis.totalLoans.toLocaleString()} originated loans, ${instAnalysis.approvalData?.approvalRate}% approval rate
${stateData.stateName} state: ${stateData.totalLoans.toLocaleString()} originated loans, ${stateApprovalRate}% approval rate

Provide 2-3 brief insights about how this institution compares to the state average.`;
        const summary = await localPhi.session.prompt(statePrompt);
        addMessage('assistant', `💡 **State Comparison Insights:**\n${summary}`);
      }

      addReportButtons();
      return;
    }

    // Check if this is an institution analysis query
    if ((plan.analysis_type === 'compare_to_national' || plan.analysis_type === 'branch_expansion' || plan.analysis_type === 'full_analysis') && plan.institution_name) {
      addMessage('assistant', `🔍 Analyzing "${plan.institution_name}"...`);
      
      // Search for the institution
      const year = plan.params?.years || '2024';
      const searchResult = await findInstitutionByName(plan.institution_name, year);
      
      if (!searchResult.found && searchResult.suggestions.length === 0) {
        addMessage('system', `❌ Could not find any institutions matching "${plan.institution_name}"`);
        addMessage('system', '💡 Try using the full official name of the financial institution.');
        return;
      }
      
      if (!searchResult.found && searchResult.suggestions.length > 0) {
        // Show suggestions
        addMessage('system', `⚠️ No exact match found for "${plan.institution_name}"`);
        renderInstitutionSuggestions(searchResult.suggestions, plan.institution_name);
        return;
      }
      
      // Found institution - proceed with analysis
      const institution = searchResult.primary;
      addMessage('system', `✅ Found: ${institution.name}`);
      addMessage('system', `   LEI: ${institution.lei}`);
      
      // Perform branch analysis if requested
      if (plan.analysis_type === 'branch_expansion' || plan.analysis_type === 'full_analysis') {
        // Fetch branch locations
        const branchData = await fetchBranchLocations(institution.name, institution.lei);
        
        // Analyze lending by geography
        const lendingData = await analyzeLendingByGeography(institution.lei, institution.name, year);
        
        // Generate recommendations
        const recommendations = generateExpansionRecommendations(branchData, lendingData, institution.name);
        
        // Render branch analysis
        renderBranchAnalysis(institution.name, branchData, lendingData, recommendations);
        
        // If full_analysis, also show lending comparison
        if (plan.analysis_type === 'full_analysis') {
          const instAnalysis = await analyzeInstitution(institution.lei, institution.name, year);
          const nationalData = await fetchNationalAverages(year);
          if (instAnalysis) {
            renderInstitutionAnalysis(instAnalysis, nationalData);
          }
        }
        
        // Generate AI insights
        if (localPhi.initialized && recommendations && recommendations.length > 0) {
          addMessage('system', '🤖 Phi mini generating insights...');
          const summaryPrompt = `Institution: ${institution.name}\nBranch Analysis:\n${JSON.stringify(recommendations.slice(0, 3), null, 2)}\n\nProvide brief strategic insights about expansion opportunities.`;
          const summary = await localPhi.session.prompt(summaryPrompt);
          addMessage('assistant', `💡 **Strategic Insights:**\n${summary}`);
        }
      } else {
        // Standard lending analysis
        const instAnalysis = await analyzeInstitution(institution.lei, institution.name, year);
        if (!instAnalysis) {
          addMessage('system', '❌ Failed to analyze institution');
          return;
        }

        // Fetch national averages for comparison
        const nationalData = await fetchNationalAverages(year);

        // Render the analysis
        renderInstitutionAnalysis(instAnalysis, nationalData);

        // FEATURE: Fair lending check (runs in parallel with summary)
        addMessage('system', '🔍 Checking fair lending metrics...');
        const fairPromise = checkFairLending(institution.lei, year);

        // Generate AI summary
        if (localPhi.initialized) {
          addMessage('system', '🤖 Phi mini generating insights...');
          const summaryData = {
            institution: institution.name,
            totalLoans: instAnalysis.totalLoans,
            approvalRate: instAnalysis.approvalData?.approvalRate,
            nationalTotal: nationalData?.totalLoans,
            marketShare: ((instAnalysis.totalLoans / (nationalData?.totalLoans || 1)) * 100).toFixed(3)
          };
          const summary = await localPhi.summarize(summaryData, text);
          addMessage('assistant', `💡 **Insights:**\n${summary}`);
        }

        // Render fair lending alerts (awaited from parallel fetch)
        try {
          const fairData = await fairPromise;
          if (fairData && fairData.length > 0) {
            const fairContainer = document.createElement('div');
            fairContainer.className = 'message assistant';
            renderFairLendingAlerts(fairData, fairContainer);
            if (fairContainer.children.length > 0) chat.appendChild(fairContainer);
          }
        } catch {}

        addReportButtons();
      }

      if (showDiag) addMessage('system', '✅ Analysis complete!');
      return;
    }

    // Validate HMDA query structure
    if (!plan.endpoint || !plan.params) {
      addMessage('system', '❌ Could not parse data query from Phi mini');
      addMessage('assistant', planText);
      return;
    }

    // Sanitize Phi output: fix common parameter mistakes
    const validLoanTypes = ['1','2','3','4'];
    const validLoanPurposes = ['1','2','31','32','4','5'];
    if (plan.params.loan_types && !validLoanTypes.includes(String(plan.params.loan_types))) {
      // Phi likely confused loan_types with loan_purposes (e.g. "31" for refinancing)
      const val = String(plan.params.loan_types);
      if (validLoanPurposes.includes(val) && !plan.params.loan_purposes) {
        plan.params.loan_purposes = val;
        addMessage('system', `⚠️ Auto-corrected: moved "${val}" from loan_types to loan_purposes`);
      }
      delete plan.params.loan_types;
    }
    if (plan.params.loan_purposes && !validLoanPurposes.includes(String(plan.params.loan_purposes))) {
      delete plan.params.loan_purposes;
    }

    addMessage('assistant', `📊 Phi mini understood:\n• Intent: ${plan.intent}\n• Endpoint: ${plan.endpoint}\n• Params: ${JSON.stringify(plan.params, null, 2)}`);

    // Step 3: Build FFIEC API URI from Phi's understanding
    // FFIEC API requires at least one HMDA data filter for aggregations
    let addedDefaultFilter = false;
    if (plan.endpoint === 'aggregations' && !plan.params.actions_taken && !plan.params.loan_types && 
        !plan.params.races && !plan.params.ethnicities && !plan.params.ages && !plan.params.sexes &&
        !plan.params.loan_purposes && !plan.params.dwelling_categories) {
      plan.params.actions_taken = '1'; // Default to originated loans
      addedDefaultFilter = true;
    }
    const url = buildFFIECUrl(plan.endpoint, plan.params);
    addMessage('system', `🔗 Step 2: Built FFIEC URI from Phi's understanding: ${url}`);
    if (addedDefaultFilter) {
      addMessage('system', '⚠️ Note: No specific loan filters provided. Showing originated loans (actions_taken=1) by default.');
    }
    window.__lastUrl = url;

    // Step 3: Call FFIEC API with the URI
    addMessage('system', '📡 Step 3: Calling FFIEC Data Browser API...');
    
    // If an institution name was extracted, resolve its LEI and add to params
    if (plan.institution_name && plan.endpoint === 'aggregations') {
      addMessage('system', `🔍 Resolving institution: "${plan.institution_name}"...`);
      const searchResult = await findInstitutionByName(plan.institution_name, plan.params?.years || '2024');
      if (searchResult.found) {
        plan.params.leis = searchResult.lei;
        addMessage('system', `✅ Found: ${searchResult.name} (LEI: ${searchResult.lei})`);
      } else {
        addMessage('system', `⚠️ Could not find "${plan.institution_name}" — showing data for all lenders`);
        if (searchResult.suggestions?.length > 0) {
          renderInstitutionSuggestions(searchResult.suggestions, plan.institution_name);
        }
      }
    }

    // Check if this is a demographic breakdown query
    const queryLower = text.toLowerCase();
    const isBreakdown = queryLower.includes('breakdown') || queryLower.includes('distribution');
    let breakdownData = null;
    let breakdownType = null;

    if (plan.endpoint === 'aggregations' && isBreakdown) {
      // Detect which demographic breakdown is requested
      if (queryLower.includes('gender') || queryLower.includes('sex')) {
        breakdownType = 'sexes';
        const genderValues = ['Male', 'Female', 'Joint', 'Sex Not Available'];
        addMessage('system', '🔍 Gender breakdown detected. Fetching data for each gender...');
        
        breakdownData = [];
        for (const gender of genderValues) {
          const genderParams = { ...plan.params, sexes: gender };
          const genderUrl = buildFFIECUrl(plan.endpoint, genderParams);
          addMessage('system', `📊 Fetching data for: ${gender}`);
          
          try {
            const genderData = await fetchFFIECData(genderUrl, 1);
            const total = genderData?.aggregations?.reduce((sum, agg) => sum + (agg.count || 0), 0) || 0;
            breakdownData.push({
              category: gender,
              count: total,
              data: genderData
            });
            addMessage('system', `✅ ${gender}: ${total.toLocaleString()} loans`);
          } catch (err) {
            addMessage('system', `⚠️ Error fetching ${gender}: ${err.message}`);
          }
        }
      } else if (queryLower.includes('race')) {
        breakdownType = 'races';
        const raceValues = ['Asian', 'White', 'Black or African American', 'American Indian or Alaska Native', 'Native Hawaiian or Other Pacific Islander'];
        addMessage('system', '🔍 Race breakdown detected. Fetching data for each race...');
        
        breakdownData = [];
        for (const race of raceValues) {
          const raceParams = { ...plan.params, races: race };
          const raceUrl = buildFFIECUrl(plan.endpoint, raceParams);
          addMessage('system', `📊 Fetching data for: ${race}`);
          
          try {
            const raceData = await fetchFFIECData(raceUrl, 1);
            const total = raceData?.aggregations?.reduce((sum, agg) => sum + (agg.count || 0), 0) || 0;
            breakdownData.push({
              category: race,
              count: total,
              data: raceData
            });
            addMessage('system', `✅ ${race}: ${total.toLocaleString()} loans`);
          } catch (err) {
            addMessage('system', `⚠️ Error fetching ${race}: ${err.message}`);
          }
        }
      } else if (queryLower.includes('ethnicity') || queryLower.includes('ethnic')) {
        breakdownType = 'ethnicities';
        const ethnicityValues = ['Hispanic or Latino', 'Not Hispanic or Latino', 'Joint', 'Ethnicity Not Available'];
        addMessage('system', '🔍 Ethnicity breakdown detected. Fetching data for each ethnicity...');
        
        breakdownData = [];
        for (const ethnicity of ethnicityValues) {
          const ethParams = { ...plan.params, ethnicities: ethnicity };
          const ethUrl = buildFFIECUrl(plan.endpoint, ethParams);
          addMessage('system', `📊 Fetching data for: ${ethnicity}`);
          
          try {
            const ethData = await fetchFFIECData(ethUrl, 1);
            const total = ethData?.aggregations?.reduce((sum, agg) => sum + (agg.count || 0), 0) || 0;
            breakdownData.push({
              category: ethnicity,
              count: total,
              data: ethData
            });
            addMessage('system', `✅ ${ethnicity}: ${total.toLocaleString()} loans`);
          } catch (err) {
            addMessage('system', `⚠️ Error fetching ${ethnicity}: ${err.message}`);
          }
        }
      }
    }
    
    // If not a breakdown query, fetch normally
    let data = null; // Declare data outside the if block for summarization later
    if (!breakdownData) {
      data = await fetchFFIECData(url, maxPages);
      
      // Count results
      const count = Array.isArray(data) ? data.length : 
                    (data?.aggregations?.length || data?.data?.length || data?.results?.length || 0);
      
      addMessage('system', `✅ Step 4: Received ${count} record(s) from FFIEC`);
      if (showDiag && data) {
        addMessage('system', `📊 Data structure: ${JSON.stringify(Object.keys(data), null, 2)}`);
      }
    }

    // Step 4a: If filers and query mentions comparing/specific institutions, fetch loan data for those LEIs
    let comparisonData = null;
    if (plan.endpoint === 'filers' && data.institutions && 
        (text.toLowerCase().includes('compare') || text.toLowerCase().includes('versus') || text.toLowerCase().includes('vs'))) {
      
      // Extract institution names from original query - improved matching
      const queryLower = text.toLowerCase();
      addMessage('system', `🔍 Searching for institutions mentioned in your query...`);
      
      // Try to find institutions by checking if significant parts of their name appear in query
      const matchedInstitutions = data.institutions.filter(inst => {
        const nameLower = inst.name.toLowerCase();
        const nameWords = nameLower.split(/\s+/).filter(w => w.length > 3); // Words longer than 3 chars
        
        // Check if at least 2 significant words from institution name appear in query
        const matchCount = nameWords.filter(word => queryLower.includes(word)).length;
        return matchCount >= 2;
      });

      if (showDiag) {
        addMessage('system', `📋 Found ${matchedInstitutions.length} potential matches: ${matchedInstitutions.map(i => i.name).join(', ')}`);
      }

      if (matchedInstitutions.length >= 2) {
        addMessage('system', `✅ Found ${matchedInstitutions.length} institutions to compare. Fetching loan data...`);
        
        // Fetch aggregations for each institution sequentially
        comparisonData = [];
        for (let i = 0; i < Math.min(matchedInstitutions.length, 5); i++) {
          const inst = matchedInstitutions[i];
          addMessage('system', `📊 ${i + 1}. Institution: "${inst.name}"`);
          addMessage('system', `   LEI: ${inst.lei}`);
          
          const leiUrl = buildFFIECUrl('aggregations', {
            years: plan.params.years,
            leis: inst.lei,
            actions_taken: '1' // Get originated loans for comparison
          });
          
          addMessage('system', `📡 Fetching loan data for ${inst.name}...`);
          try {
            const leiData = await fetchFFIECData(leiUrl, 1);
            const totalLoans = leiData?.aggregations?.reduce((sum, agg) => sum + (agg.count || 0), 0) || 0;
            comparisonData.push({
              name: inst.name,
              lei: inst.lei,
              count: totalLoans,
              data: leiData
            });
            addMessage('system', `✅ ${inst.name}: ${totalLoans.toLocaleString()} originated loans`);
          } catch (err) {
            addMessage('system', `⚠️ Could not fetch data for ${inst.name}: ${err.message}`);
          }
        }
      } else if (matchedInstitutions.length === 1) {
        addMessage('system', `⚠️ Only found 1 matching institution: ${matchedInstitutions[0].name}`);
        addMessage('system', `💡 Try being more specific with institution names for comparison.`);
      } else {
        addMessage('system', `⚠️ Could not identify specific institutions to compare.`);
        addMessage('system', `💡 Try using more complete institution names (e.g., "America First Credit Union").`);
      }
    }

    // Step 4: Render results
    if (!breakdownData) {
      renderResults(data);
    }
    
    // If we have breakdown data, render breakdown chart
    if (breakdownData && breakdownData.length > 0) {
      addMessage('assistant', `\n📊 **${breakdownType.charAt(0).toUpperCase() + breakdownType.slice(0, -1)} Breakdown:**`);
      
      // Create breakdown chart
      const chartDiv = document.createElement('div');
      chartDiv.style.marginTop = '20px';
      
      const canvas = document.createElement('canvas');
      canvas.width = 700;
      canvas.height = 450;
      chartDiv.appendChild(canvas);
      chat.appendChild(chartDiv);
      
      const ctx = canvas.getContext('2d');
      const maxCount = Math.max(...breakdownData.map(d => d.count));
      const barWidth = Math.floor((canvas.width - 100) / (breakdownData.length * 1.5));
      const chartHeight = canvas.height - 120;
      const colors = ['#4ea1d3', '#ff6b6b', '#50c878', '#ffa500', '#9370db'];
      
      // Draw bars
      breakdownData.forEach((item, idx) => {
        const barHeight = maxCount > 0 ? (item.count / maxCount) * chartHeight : 0;
        const x = 60 + (idx * (barWidth + 30));
        const y = canvas.height - 80 - barHeight;
        
        // Bar
        ctx.fillStyle = colors[idx % colors.length];
        ctx.fillRect(x, y, barWidth, barHeight);
        
        // Value on top
        ctx.fillStyle = '#333';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(item.count.toLocaleString(), x + barWidth/2, y - 5);
        
        // Category name at bottom
        ctx.save();
        ctx.translate(x + barWidth/2, canvas.height - 60);
        ctx.rotate(-Math.PI / 6);
        ctx.textAlign = 'right';
        ctx.font = '12px Arial';
        ctx.fillText(item.category.substring(0, 25), 0, 0);
        ctx.restore();
      });
      
      // Title
      ctx.fillStyle = '#333';
      ctx.font = 'bold 16px Arial';
      ctx.textAlign = 'center';
      const titleText = `${breakdownType.charAt(0).toUpperCase() + breakdownType.slice(0, -1)} Breakdown`;
      ctx.fillText(titleText, canvas.width/2, 25);
      
      // Summary text
      const summaryText = breakdownData.map(d => `${d.category}: ${d.count.toLocaleString()} loans`).join('\n');
      addMessage('assistant', summaryText);
      
      // Add export button for breakdown data
      addExportButton(breakdownData, 'breakdown');
    }
    
    // If we have institution comparison data, render comparison chart
    if (comparisonData && comparisonData.length >= 2) {
      addMessage('assistant', `\n📊 **Loan Comparison:**`);
      
      // Create comparison chart
      const chartDiv = document.createElement('div');
      chartDiv.style.marginTop = '20px';
      
      const canvas = document.createElement('canvas');
      canvas.width = 600;
      canvas.height = 400;
      chartDiv.appendChild(canvas);
      chat.appendChild(chartDiv);
      
      const ctx = canvas.getContext('2d');
      const maxCount = Math.max(...comparisonData.map(d => d.count));
      const barWidth = Math.floor(canvas.width / (comparisonData.length * 2));
      const chartHeight = canvas.height - 80;
      
      // Draw bars
      comparisonData.forEach((item, idx) => {
        const barHeight = (item.count / maxCount) * chartHeight;
        const x = 50 + (idx * (barWidth + 40));
        const y = canvas.height - 60 - barHeight;
        
        // Bar
        ctx.fillStyle = idx === 0 ? '#4ea1d3' : '#ff6b6b';
        ctx.fillRect(x, y, barWidth, barHeight);
        
        // Value on top
        ctx.fillStyle = '#333';
        ctx.font = '14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(item.count.toLocaleString(), x + barWidth/2, y - 5);
        
        // Institution name at bottom
        ctx.save();
        ctx.translate(x + barWidth/2, canvas.height - 30);
        ctx.rotate(-Math.PI / 6);
        ctx.textAlign = 'right';
        ctx.fillText(item.name.substring(0, 30), 0, 0);
        ctx.restore();
      });
      
      // Title
      ctx.fillStyle = '#333';
      ctx.font = 'bold 16px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('Originated Loans Comparison (2024)', canvas.width/2, 25);
      
      // Summary text
      const summaryText = comparisonData.map(d => `${d.name}: ${d.count.toLocaleString()} loans`).join('\n');
      addMessage('assistant', summaryText);
    }

    // Step 5: Use Phi mini to summarize the results (skip if breakdown already shown)
    if (breakdownData && breakdownData.length > 0) {
      // Breakdown chart already shows the summary, no need for Phi
      if (showDiag) addMessage('system', '✅ Complete! Breakdown chart displayed.');
    } else {
      addMessage('system', '🤖 Step 5: Phi mini summarizing results...');
      const summaryData = comparisonData || data;
      const summary = await localPhi.summarize(summaryData, text);
      addMessage('assistant', `💡 **Summary by Phi mini:**\n${summary}`);
      if (showDiag) addMessage('system', '✅ Complete! All steps executed successfully.');
    }

    addReportButtons();

  } catch (error) {
    hideSkeleton();
    addMessage('system', `❌ Error: ${error.message}`);
    console.error('Full error:', error);
  }
});

// Render institution analysis with national comparison
function renderInstitutionAnalysis(instAnalysis, nationalData) {
  const container = document.createElement('div');
  container.className = 'message assistant';
  
  const title = document.createElement('h3');
  title.textContent = `🏦 ${instAnalysis.name} - Lending Analysis`;
  title.style.marginBottom = '16px';
  title.style.color = '#4ea1d3';
  title.style.fontSize = '18px';
  container.appendChild(title);
  
  // Summary stats
  const statsDiv = document.createElement('div');
  statsDiv.style.marginBottom = '20px';
  statsDiv.style.padding = '15px';
  statsDiv.style.backgroundColor = 'rgba(46, 110, 162, 0.1)';
  statsDiv.style.borderRadius = '8px';
  statsDiv.style.borderLeft = '4px solid #4ea1d3';
  
  statsDiv.innerHTML = `
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
      <div>
        <div style="font-size: 12px; color: #d1e4f3; opacity: 0.8;">LEI</div>
        <div style="font-size: 14px; font-family: monospace; margin-top: 4px;">${instAnalysis.lei}</div>
      </div>
      <div>
        <div style="font-size: 12px; color: #d1e4f3; opacity: 0.8;">Total Loans (${instAnalysis.year})</div>
        <div style="font-size: 20px; font-weight: bold; color: #4ea1d3; margin-top: 4px;">${instAnalysis.totalLoans.toLocaleString()}</div>
      </div>
    </div>
  `;
  
  if (instAnalysis.approvalData) {
    const approvalHtml = `
      <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #2e6ea2;">
        <div style="font-size: 12px; color: #d1e4f3; opacity: 0.8; margin-bottom: 8px;">Approval Metrics</div>
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px;">
          <div>
            <div style="font-size: 11px; opacity: 0.7;">Originated</div>
            <div style="font-size: 16px; font-weight: bold; color: #50c878;">${instAnalysis.approvalData.originated.toLocaleString()}</div>
          </div>
          <div>
            <div style="font-size: 11px; opacity: 0.7;">Denied</div>
            <div style="font-size: 16px; font-weight: bold; color: #ff6b6b;">${instAnalysis.approvalData.denied.toLocaleString()}</div>
          </div>
          <div>
            <div style="font-size: 11px; opacity: 0.7;">Approval Rate</div>
            <div style="font-size: 16px; font-weight: bold; color: #4ea1d3;">${instAnalysis.approvalData.approvalRate}%</div>
          </div>
        </div>
      </div>
    `;
    statsDiv.innerHTML += approvalHtml;
  }
  
  container.appendChild(statsDiv);
  
  // Loan type breakdown - donut chart
  if (instAnalysis.loanTypeBreakdown && instAnalysis.loanTypeBreakdown.length > 0) {
    renderDonutChart(instAnalysis.loanTypeBreakdown, instAnalysis.totalLoans, container);
  }
  
  // National comparison if available
  if (nationalData) {
    const compTitle = document.createElement('h4');
    compTitle.textContent = '📈 Comparison to National Average';
    compTitle.style.marginTop = '25px';
    compTitle.style.marginBottom = '10px';
    compTitle.style.color = '#4ea1d3';
    container.appendChild(compTitle);
    
    const compText = document.createElement('div');
    compText.style.padding = '12px';
    compText.style.backgroundColor = 'rgba(46, 110, 162, 0.05)';
    compText.style.borderRadius = '6px';
    
    const marketShare = ((instAnalysis.totalLoans / nationalData.totalLoans) * 100).toFixed(3);
    compText.innerHTML = `
      <div style="margin-bottom: 8px;">
        <strong>National Total:</strong> ${nationalData.totalLoans.toLocaleString()} originated loans
      </div>
      <div>
        <strong>Market Share:</strong> ${marketShare}% of national lending volume
      </div>
    `;
    
    container.appendChild(compText);
  }
  
  chat.appendChild(container);
  chat.scrollTop = chat.scrollHeight;
}

// Render institution suggestions when exact match not found
function renderInstitutionSuggestions(suggestions, _originalQuery) {
  const container = document.createElement('div');
  container.className = 'message assistant';

  // "Did you mean?" header
  const header = document.createElement('div');
  header.style.marginBottom = '12px';
  header.innerHTML = `
    <span style="color: #ffa500; font-size: 14px;">⚠️ Institution not found</span>
    <div style="margin-top: 8px; font-size: 13px;">Did you mean one of these?</div>
  `;
  container.appendChild(header);

  // Pill container with flex wrap
  const pillContainer = document.createElement('div');
  pillContainer.style.display = 'flex';
  pillContainer.style.flexWrap = 'wrap';
  pillContainer.style.gap = '8px';
  pillContainer.style.marginBottom = '8px';

  suggestions.slice(0, 5).forEach((inst) => {
    const pill = document.createElement('button');
    pill.type = 'button';
    pill.className = 'suggestion-pill';
    pill.textContent = inst.name;
    pill.title = `${inst.city || ''} ${inst.state || ''} • LEI: ${inst.lei}`;

    // Pill styling
    pill.style.cssText = `
      background: linear-gradient(135deg, #2e6ea2 0%, #1a4d6e 100%);
      color: #fff;
      border: none;
      border-radius: 20px;
      padding: 8px 16px;
      font-size: 12px;
      cursor: pointer;
      transition: all 0.2s ease;
      box-shadow: 0 2px 4px rgba(0,0,0,0.2);
      white-space: nowrap;
      max-width: 100%;
      overflow: hidden;
      text-overflow: ellipsis;
    `;

    pill.addEventListener('mouseover', () => {
      pill.style.background = 'linear-gradient(135deg, #4ea1d3 0%, #2e6ea2 100%)';
      pill.style.transform = 'translateY(-2px)';
      pill.style.boxShadow = '0 4px 8px rgba(0,0,0,0.3)';
    });
    pill.addEventListener('mouseout', () => {
      pill.style.background = 'linear-gradient(135deg, #2e6ea2 0%, #1a4d6e 100%)';
      pill.style.transform = 'translateY(0)';
      pill.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
    });

    // Click to populate input with institution name
    pill.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const promptInput = document.getElementById('promptInput');
      if (promptInput) {
        promptInput.value = inst.name;
        promptInput.dispatchEvent(new Event('input', { bubbles: true }));
        promptInput.focus();
        // Scroll input into view in case chat pushed it off screen
        promptInput.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    });

    pillContainer.appendChild(pill);
  });

  container.appendChild(pillContainer);

  // Hint text
  const hint = document.createElement('div');
  hint.style.cssText = 'font-size: 11px; opacity: 0.6; font-style: italic;';
  hint.textContent = 'Click a name to analyze that institution';
  container.appendChild(hint);

  chat.appendChild(container);
  chat.scrollTop = chat.scrollHeight;
}

// Helper function to analyze institution by LEI (called from suggestion clicks)
async function analyzeInstitutionByLEI(lei, name) {
  try {
    addMessage('system', `🔄 Running analysis for ${name}...`);

    const cfg = await chrome.storage.sync.get(['diagnostics']);
    const showDiag = !!cfg.diagnostics;

    if (showDiag) addMessage('system', `📋 LEI: ${lei}`);

    // Analyze institution
    const instAnalysis = await analyzeInstitution(lei, name);
    if (!instAnalysis) {
      addMessage('system', '❌ Failed to analyze institution');
      return;
    }

    // Fetch national averages
    const nationalData = await fetchNationalAverages();

    // Render analysis
    renderInstitutionAnalysis(instAnalysis, nationalData);

    // Summary with Phi
    if (localPhi.initialized) {
      addMessage('system', '🤖 Phi mini generating insights...');
      const summaryPrompt = `Institution: ${name}\nTotal Originated Loans (count, not dollars): ${instAnalysis.totalLoans.toLocaleString()} loans\nApproval Rate: ${instAnalysis.approvalData?.approvalRate}%\nNational Total Originated Loans: ${nationalData?.totalLoans?.toLocaleString()} loans\nMarket Share: ${((instAnalysis.totalLoans / nationalData?.totalLoans) * 100).toFixed(3)}%\n\nProvide 2-3 brief insights about this institution's lending performance. These are loan COUNTS not dollar amounts.`;
      const summary = await localPhi.session.prompt(summaryPrompt);
      addMessage('assistant', `💡 **Insights:**\n${summary}`);
    }

    if (showDiag) addMessage('system', '✅ Analysis complete!');

  } catch (error) {
    addMessage('system', `❌ Error: ${error.message}`);
  }
}

// Render results based on data type
function renderResults(data) {
  if (!data) {
    addMessage('system', '⚠️ No data to render');
    return;
  }

  // Check if it's filers (institutions) format
  if (data.institutions && Array.isArray(data.institutions)) {
    renderFilers(data.institutions);
    addExportButton(data.institutions, 'filers');
    return;
  }

  // Check if it's aggregations format
  if (data.aggregations && Array.isArray(data.aggregations)) {
    renderAggregations(data.aggregations);
    addExportButton(data.aggregations, 'aggregations');
    return;
  }

  // Check if it's tabular data
  const records = Array.isArray(data) ? data : (data.data || data.results || []);
  if (Array.isArray(records) && records.length > 0 && typeof records[0] === 'object') {
    renderTable(records);
    addExportButton(records, 'records');
    renderChart(records);
    return;
  }

  // Fallback: show as formatted JSON
  const jsonStr = JSON.stringify(data, null, 2);
  addMessage('assistant', `Data (JSON):\n${jsonStr.slice(0, 2000)}${jsonStr.length > 2000 ? '\n...(truncated)' : ''}`);
}

// Render filers (institutions/lenders) list
function renderFilers(institutions) {
  const container = document.createElement('div');
  container.className = 'message assistant';
  
  const title = document.createElement('h4');
  title.textContent = `🏦 Reporting Institutions (${institutions.length})`;
  title.style.marginBottom = '12px';
  title.style.color = '#4ea1d3';
  container.appendChild(title);

  const table = document.createElement('table');
  table.style.width = '100%';
  table.style.borderCollapse = 'collapse';
  table.style.fontSize = '13px';

  // Header
  const thead = document.createElement('thead');
  const headerRow = document.createElement('tr');
  headerRow.style.backgroundColor = '#153955';
  ['Institution Name', 'LEI', 'Location'].forEach(col => {
    const th = document.createElement('th');
    th.textContent = col;
    th.style.textAlign = 'left';
    th.style.padding = '10px 8px';
    th.style.color = '#d1e4f3';
    th.style.fontWeight = 'bold';
    th.style.borderBottom = '2px solid #4ea1d3';
    headerRow.appendChild(th);
  });
  thead.appendChild(headerRow);
  table.appendChild(thead);

  // Body
  const tbody = document.createElement('tbody');
  institutions.slice(0, 100).forEach((inst, idx) => {
    const tr = document.createElement('tr');
    if (idx % 2 === 0) tr.style.backgroundColor = 'rgba(46, 110, 162, 0.1)';
    
    const tdName = document.createElement('td');
    tdName.textContent = inst.name || inst.institution_name || inst.respondent_name || 'Unknown';
    tdName.style.padding = '8px';
    tdName.style.borderBottom = '1px solid #2e6ea2';
    
    const tdLei = document.createElement('td');
    tdLei.textContent = inst.lei || 'N/A';
    tdLei.style.padding = '8px';
    tdLei.style.borderBottom = '1px solid #2e6ea2';
    tdLei.style.fontFamily = 'monospace';
    tdLei.style.fontSize = '11px';
    
    const tdLocation = document.createElement('td');
    const city = inst.city || inst.hq_city || '';
    const state = inst.state || inst.hq_state || '';
    tdLocation.textContent = [city, state].filter(Boolean).join(', ') || 'N/A';
    tdLocation.style.padding = '8px';
    tdLocation.style.borderBottom = '1px solid #2e6ea2';
    
    tr.appendChild(tdName);
    tr.appendChild(tdLei);
    tr.appendChild(tdLocation);
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);

  container.appendChild(table);

  if (institutions.length > 100) {
    const note = document.createElement('p');
    note.textContent = `Showing first 100 of ${institutions.length} institutions`;
    note.style.fontSize = '11px';
    note.style.marginTop = '10px';
    note.style.fontStyle = 'italic';
    note.style.opacity = '0.7';
    container.appendChild(note);
  }

  chat.appendChild(container);
  chat.scrollTop = chat.scrollHeight;
}

// Render aggregations summary
function renderAggregations(aggregations) {
  const container = document.createElement('div');
  container.className = 'message assistant';
  
  const title = document.createElement('h4');
  title.textContent = '📊 Aggregated Results';
  title.style.marginBottom = '12px';
  title.style.color = '#4ea1d3';
  container.appendChild(title);

  const table = document.createElement('table');
  table.style.width = '100%';
  table.style.borderCollapse = 'collapse';
  table.style.fontSize = '13px';

  aggregations.forEach((agg, idx) => {
    const tr = document.createElement('tr');
    if (idx % 2 === 0) tr.style.backgroundColor = 'rgba(46, 110, 162, 0.1)';
    
    const tdLabel = document.createElement('td');
    tdLabel.textContent = agg.label || agg.name || `Item ${idx + 1}`;
    tdLabel.style.padding = '8px';
    tdLabel.style.borderBottom = '1px solid #2e6ea2';
    
    const tdValue = document.createElement('td');
    tdValue.textContent = (agg.count || agg.value || 0).toLocaleString();
    tdValue.style.padding = '8px';
    tdValue.style.textAlign = 'right';
    tdValue.style.borderBottom = '1px solid #2e6ea2';
    tdValue.style.fontWeight = 'bold';
    tdValue.style.color = '#4ea1d3';
    
    tr.appendChild(tdLabel);
    tr.appendChild(tdValue);
    table.appendChild(tr);
  });

  container.appendChild(table);
  chat.appendChild(container);
  chat.scrollTop = chat.scrollHeight;
}

// Render data table
function renderTable(records) {
  if (!records || records.length === 0) return;

  const container = document.createElement('div');
  container.className = 'message assistant';

  const title = document.createElement('h4');
  title.textContent = '📋 Data Table';
  title.style.marginBottom = '12px';
  title.style.color = '#4ea1d3';
  container.appendChild(title);

  const cols = Object.keys(records[0]).slice(0, 8);
  const table = document.createElement('table');
  table.style.width = '100%';
  table.style.borderCollapse = 'collapse';
  table.style.fontSize = '12px';

  // Header
  const thead = document.createElement('thead');
  const headerRow = document.createElement('tr');
  headerRow.style.backgroundColor = '#153955';
  cols.forEach(col => {
    const th = document.createElement('th');
    th.textContent = col;
    th.style.textAlign = 'left';
    th.style.padding = '10px 8px';
    th.style.color = '#d1e4f3';
    th.style.fontWeight = 'bold';
    th.style.borderBottom = '2px solid #4ea1d3';
    headerRow.appendChild(th);
  });
  thead.appendChild(headerRow);

  // Body
  const tbody = document.createElement('tbody');
  records.slice(0, 50).forEach((row, idx) => {
    const tr = document.createElement('tr');
    if (idx % 2 === 0) tr.style.backgroundColor = 'rgba(46, 110, 162, 0.1)';
    
    cols.forEach(col => {
      const td = document.createElement('td');
      const val = row[col];
      td.textContent = val != null ? String(val) : '';
      td.style.padding = '8px';
      td.style.borderBottom = '1px solid #2e6ea2';
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });

  table.appendChild(thead);
  table.appendChild(tbody);
  container.appendChild(table);

  if (records.length > 50) {
    const note = document.createElement('p');
    note.textContent = `Showing first 50 of ${records.length} records`;
    note.style.fontSize = '11px';
    note.style.marginTop = '10px';
    note.style.fontStyle = 'italic';
    note.style.opacity = '0.7';
    container.appendChild(note);
  }

  chat.appendChild(container);
  chat.scrollTop = chat.scrollHeight;
}

// Add CSV export button
function addExportButton(data, dataType = 'data') {
  if (!Array.isArray(data) || data.length === 0) return;

  const container = document.createElement('div');
  container.className = 'message assistant';

  const btn = document.createElement('button');
  btn.textContent = '💾 Export to CSV';
  btn.style.padding = '10px 20px';
  btn.style.cursor = 'pointer';
  btn.style.backgroundColor = '#4ea1d3';
  btn.style.color = '#0a1c2e';
  btn.style.border = 'none';
  btn.style.borderRadius = '4px';
  btn.style.fontWeight = 'bold';
  btn.style.fontSize = '13px';

  btn.addEventListener('mouseover', () => {
    btn.style.backgroundColor = '#5fb1e3';
  });
  btn.addEventListener('mouseout', () => {
    btn.style.backgroundColor = '#4ea1d3';
  });

  btn.addEventListener('click', () => {
    const cols = Object.keys(data[0]);
    const csvRows = [cols.join(',')];
    
    data.forEach(row => {
      const values = cols.map(col => {
        const val = row[col];
        if (val == null) return '';
        const str = String(val).replace(/"/g, '""');
        return /[",\n]/.test(str) ? `"${str}"` : str;
      });
      csvRows.push(values.join(','));
    });

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hmda_${dataType}_${Date.now()}.csv`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
    
    addMessage('system', '✅ CSV exported successfully');
  });

  container.appendChild(btn);
  chat.appendChild(container);
  chat.scrollTop = chat.scrollHeight;
}

// Render simple bar chart
function renderChart(records) {
  if (!Array.isArray(records) || records.length === 0) return;
  if (typeof records[0] !== 'object') return;

  // Find a suitable field for charting
  const candidates = ['loan_types', 'actions_taken', 'property_types', 'lien_statuses', 'loan_purposes', 'states'];
  const field = candidates.find(c => c in records[0]);
  if (!field) return;

  const container = document.createElement('div');
  container.className = 'message assistant';

  const title = document.createElement('h4');
  title.textContent = `📈 Distribution by ${field}`;
  title.style.marginBottom = '12px';
  title.style.color = '#4ea1d3';
  container.appendChild(title);

  const canvas = document.createElement('canvas');
  canvas.width = 500;
  canvas.height = 320;
  container.appendChild(canvas);

  chat.appendChild(container);
  chat.scrollTop = chat.scrollHeight;

  const ctx = canvas.getContext('2d');
  
  // Count values
  const counts = new Map();
  records.forEach(r => {
    const key = r[field] != null ? String(r[field]) : 'Unknown';
    counts.set(key, (counts.get(key) || 0) + 1);
  });

  const entries = Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 7);

  if (entries.length === 0) return;

  const labels = entries.map(e => e[0]);
  const values = entries.map(e => e[1]);

  // Chart dimensions
  const pad = { left: 50, right: 20, top: 40, bottom: 90 };
  const chartW = canvas.width - pad.left - pad.right;
  const chartH = canvas.height - pad.top - pad.bottom;
  const maxV = Math.max(...values);

  // Clear canvas
  ctx.fillStyle = '#0a1c2e';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Title
  ctx.fillStyle = '#d1e4f3';
  ctx.font = 'bold 14px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`Distribution by ${field}`, canvas.width / 2, 20);

  // Axes
  ctx.strokeStyle = '#4ea1d3';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(pad.left, pad.top);
  ctx.lineTo(pad.left, pad.top + chartH);
  ctx.lineTo(pad.left + chartW, pad.top + chartH);
  ctx.stroke();

  // Bars
  const barW = Math.floor(chartW / (values.length * 1.6));
  const gap = Math.floor(barW * 0.4);

  values.forEach((val, i) => {
    const x = pad.left + gap + i * (barW + gap);
    const h = maxV > 0 ? Math.round((val / maxV) * chartH) : 0;
    const y = pad.top + chartH - h;

    // Draw bar
    const gradient = ctx.createLinearGradient(x, y, x, y + h);
    gradient.addColorStop(0, '#5fb1e3');
    gradient.addColorStop(1, '#4ea1d3');
    ctx.fillStyle = gradient;
    ctx.fillRect(x, y, barW, h);

    // Value label on top of bar
    ctx.fillStyle = '#d1e4f3';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(val.toLocaleString(), x + barW / 2, y - 5);

    // X-axis label
    ctx.save();
    ctx.translate(x + barW / 2, pad.top + chartH + 20);
    ctx.rotate(-Math.PI / 4);
    ctx.textAlign = 'right';
    ctx.font = '11px sans-serif';
    ctx.fillText(labels[i].slice(0, 25), 0, 0);
    ctx.restore();
  });
}

// Initialize on load
const headerStatus = document.getElementById('modelStatus');
if (headerStatus) {
  headerStatus.textContent = '🤖 Prompt API for Phi mini';
  headerStatus.style.color = '#d1e4f3';
  headerStatus.style.fontSize = '12px';
}

addMessage('system', '👋 Welcome to LendingLens! Explore mortgage lending data for banks, credit unions, and mortgage companies.');
addMessage('system', 'ℹ️ Click the info icon above for sample queries you can try.');

// ========================================
// FEATURE: Query History & Favorites
// ========================================
const QueryHistory = {
  KEY: 'll_history',
  MAX: 20,
  get() {
    try { return JSON.parse(localStorage.getItem(this.KEY)) || []; } catch { return []; }
  },
  add(query) {
    const h = this.get().filter(q => q.text !== query);
    h.unshift({ text: query, time: Date.now() });
    if (h.length > this.MAX) h.length = this.MAX;
    try { localStorage.setItem(this.KEY, JSON.stringify(h)); } catch {}
  },
  clear() { localStorage.removeItem(this.KEY); }
};

const Favorites = {
  KEY: 'll_favorites',
  get() {
    try { return JSON.parse(localStorage.getItem(this.KEY)) || []; } catch { return []; }
  },
  toggle(query) {
    let favs = this.get();
    const idx = favs.indexOf(query);
    if (idx >= 0) { favs.splice(idx, 1); } else { favs.unshift(query); }
    try { localStorage.setItem(this.KEY, JSON.stringify(favs)); } catch {}
    return idx < 0; // returns true if added
  },
  isFavorite(query) { return this.get().includes(query); }
};

// History navigation state
let historyIndex = -1;
let savedInput = '';

// ========================================
// FEATURE: Dark/Light Theme Toggle
// ========================================
const themeBtn = document.getElementById('themeBtn');
function applyTheme(light) {
  document.body.classList.toggle('light-theme', light);
  themeBtn.textContent = light ? '☀️' : '🌙';
  themeBtn.title = light ? 'Switch to Dark' : 'Switch to Light';
  try { localStorage.setItem('ll_theme', light ? 'light' : 'dark'); } catch {}
}
// Restore saved theme
applyTheme(localStorage.getItem('ll_theme') === 'light');
themeBtn.addEventListener('click', () => {
  applyTheme(!document.body.classList.contains('light-theme'));
});

// ========================================
// FEATURE: Keyboard Shortcuts
// ========================================
document.addEventListener('keydown', (e) => {
  // Ctrl+/ or Ctrl+K: Focus input
  if ((e.key === '/' || e.key === 'k') && (e.ctrlKey || e.metaKey)) {
    e.preventDefault();
    input.focus();
    return;
  }
  // Esc: Close panels
  if (e.key === 'Escape') {
    settings.classList.remove('show');
    infoPanel.classList.remove('show');
    const ta = document.getElementById('typeaheadDropdown');
    if (ta) ta.classList.remove('show');
    return;
  }
  // Arrow Up/Down in input: cycle history
  if (document.activeElement === input) {
    const history = QueryHistory.get();
    if (e.key === 'ArrowUp' && history.length > 0) {
      e.preventDefault();
      if (historyIndex === -1) savedInput = input.value;
      historyIndex = Math.min(historyIndex + 1, history.length - 1);
      input.value = history[historyIndex].text;
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      historyIndex = Math.max(historyIndex - 1, -1);
      input.value = historyIndex === -1 ? savedInput : history[historyIndex].text;
    }
  }
});

// Hide shortcut hint when input is focused
const shortcutHint = document.getElementById('shortcutHint');
if (shortcutHint) {
  input.addEventListener('focus', () => { shortcutHint.style.display = 'none'; });
  input.addEventListener('blur', () => { if (!input.value) shortcutHint.style.display = ''; });
}

// ========================================
// FEATURE: Loading Skeleton
// ========================================
function showSkeleton() { /* disabled */ }
function hideSkeleton() { /* disabled */ }

// ========================================
// FEATURE: Offline Mode Indicator
// ========================================
function updateOnlineStatus() {
  const notice = document.getElementById('offlineNotice');
  if (notice) notice.style.display = navigator.onLine ? 'none' : 'block';
}
window.addEventListener('online', updateOnlineStatus);
window.addEventListener('offline', updateOnlineStatus);
updateOnlineStatus();

// ========================================
// FEATURE: Institution Typeahead
// ========================================
let cachedFilers = null;
let typeaheadTimeout = null;
const typeaheadDropdown = document.getElementById('typeaheadDropdown');

async function loadFilersForTypeahead() {
  if (cachedFilers) return cachedFilers;
  try {
    const cached = localStorage.getItem('ll_filers_cache');
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Date.now() < parsed.expires) {
        cachedFilers = parsed.data;
        return cachedFilers;
      }
    }
  } catch {}
  // Lazy load from API (no startup latency)
  try {
    const url = buildFFIECUrl('filers', { years: '2024' });
    const data = await fetchFFIECData(url, 1, false);
    if (data?.institutions) {
      cachedFilers = data.institutions.map(i => ({ name: i.name, lei: i.lei, city: i.city || '', state: i.state || '' }));
      try {
        localStorage.setItem('ll_filers_cache', JSON.stringify({ data: cachedFilers, expires: Date.now() + 7 * 24 * 60 * 60 * 1000 }));
      } catch {}
    }
    return cachedFilers;
  } catch { return null; }
}

function showTypeahead(matches) {
  if (!typeaheadDropdown || !matches || matches.length === 0) {
    if (typeaheadDropdown) typeaheadDropdown.classList.remove('show');
    return;
  }
  typeaheadDropdown.innerHTML = '';
  matches.slice(0, 6).forEach((m, idx) => {
    const div = document.createElement('div');
    div.className = 'typeahead-item' + (idx === 0 ? ' active' : '');
    div.innerHTML = `<div class="inst-name">${m.name}</div><div class="inst-detail">${[m.city, m.state].filter(Boolean).join(', ')}</div>`;
    div.addEventListener('mousedown', (e) => {
      e.preventDefault();
      // Replace only the partial institution name, keep the prefix (e.g. "compare")
      const val = input.value;
      const nameWords = m.name.toLowerCase().split(/\s+/);
      // Find where the institution name starts in the input by matching the first word
      const firstWord = nameWords[0];
      const lowerVal = val.toLowerCase();
      const startIdx = lowerVal.indexOf(firstWord);
      if (startIdx >= 0) {
        input.value = val.substring(0, startIdx) + m.name;
      } else {
        // Fallback: replace last few words that overlap with the name
        const inputWords = val.split(/\s+/);
        let overlapStart = inputWords.length;
        for (let i = inputWords.length - 1; i >= 0; i--) {
          if (nameWords.some(nw => nw.startsWith(inputWords[i].toLowerCase()) || inputWords[i].toLowerCase().startsWith(nw))) {
            overlapStart = i;
          } else {
            break;
          }
        }
        input.value = inputWords.slice(0, overlapStart).join(' ') + (overlapStart > 0 ? ' ' : '') + m.name;
      }
      typeaheadDropdown.classList.remove('show');
      input.focus();
    });
    typeaheadDropdown.appendChild(div);
  });
  typeaheadDropdown.classList.add('show');
}

input.addEventListener('input', () => {
  clearTimeout(typeaheadTimeout);
  const val = input.value.trim();
  if (val.length < 3) {
    if (typeaheadDropdown) typeaheadDropdown.classList.remove('show');
    return;
  }
  // Only show typeahead for likely institution queries
  const lower = val.toLowerCase();
  const isLikelyInstitution = lower.includes('compare') || lower.includes('analyze') ||
    lower.includes('differ') || lower.includes('vs') || lower.includes('credit union') ||
    lower.includes('bank') || lower.includes('federal') || lower.includes('national');
  if (!isLikelyInstitution && val.split(' ').length < 3) {
    if (typeaheadDropdown) typeaheadDropdown.classList.remove('show');
    return;
  }
  typeaheadTimeout = setTimeout(async () => {
    const filers = await loadFilersForTypeahead();
    if (!filers) return;
    // Get last meaningful words for search
    const words = val.toLowerCase().split(/\s+/).filter(w => w.length > 2);
    const lastWords = words.slice(-3);
    const matches = filers.filter(f => {
      const name = f.name.toLowerCase();
      return lastWords.filter(w => name.includes(w)).length >= Math.min(2, lastWords.length);
    }).slice(0, 6);
    showTypeahead(matches);
  }, 300);
});

// Hide typeahead on blur (with delay for click)
input.addEventListener('blur', () => {
  setTimeout(() => {
    if (typeaheadDropdown) typeaheadDropdown.classList.remove('show');
  }, 200);
});

// ========================================
// FEATURE: Query Refinement (Context)
// ========================================
let lastQueryContext = null;

// ========================================
// FEATURE: Trend Analysis (Year-over-Year)
// ========================================
async function handleTrendQuery(baseParams, _userQuery) {
  const years = ['2018', '2019', '2020', '2021', '2022', '2023', '2024'];
  addMessage('system', '📈 Fetching year-over-year trend data...');

  const yearData = [];
  for (const year of years) {
    try {
      const params = { ...baseParams, years: year };
      const url = buildFFIECUrl('aggregations', params);
      const data = await fetchFFIECData(url, 1);
      const total = data?.aggregations?.reduce((sum, a) => sum + (a.count || 0), 0) || 0;
      yearData.push({ year, count: total });
      addMessage('system', `   ${year}: ${total.toLocaleString()} loans`);
    } catch { yearData.push({ year, count: 0 }); }
  }

  // Render trend line chart
  const container = document.createElement('div');
  container.className = 'message assistant';
  const title = document.createElement('h4');
  title.textContent = '📈 Year-over-Year Trend';
  title.style.cssText = 'margin-bottom:12px;color:#4ea1d3;';
  container.appendChild(title);

  const canvas = document.createElement('canvas');
  canvas.width = 500;
  canvas.height = 300;
  container.appendChild(canvas);

  const ctx = canvas.getContext('2d');
  const pad = { left: 60, right: 20, top: 30, bottom: 40 };
  const cw = canvas.width - pad.left - pad.right;
  const ch = canvas.height - pad.top - pad.bottom;
  const maxV = Math.max(...yearData.map(d => d.count), 1);

  // Background
  ctx.fillStyle = document.body.classList.contains('light-theme') ? '#f7f9fc' : '#0a1c2e';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Grid lines
  ctx.strokeStyle = 'rgba(78,161,211,0.15)';
  ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i++) {
    const y = pad.top + (ch / 4) * i;
    ctx.beginPath(); ctx.moveTo(pad.left, y); ctx.lineTo(pad.left + cw, y); ctx.stroke();
    ctx.fillStyle = '#7fb3de'; ctx.font = '10px sans-serif'; ctx.textAlign = 'right';
    ctx.fillText(Math.round(maxV - (maxV / 4) * i).toLocaleString(), pad.left - 8, y + 4);
  }

  // Plot line
  ctx.beginPath();
  ctx.strokeStyle = '#4ea1d3';
  ctx.lineWidth = 3;
  ctx.lineJoin = 'round';
  yearData.forEach((d, i) => {
    const x = pad.left + (i / (yearData.length - 1)) * cw;
    const y = pad.top + ch - (d.count / maxV) * ch;
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  });
  ctx.stroke();

  // Dots and labels
  yearData.forEach((d, i) => {
    const x = pad.left + (i / (yearData.length - 1)) * cw;
    const y = pad.top + ch - (d.count / maxV) * ch;
    ctx.beginPath(); ctx.arc(x, y, 4, 0, Math.PI * 2);
    ctx.fillStyle = '#4ea1d3'; ctx.fill();
    ctx.fillStyle = '#d1e4f3'; ctx.font = 'bold 10px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText(d.count.toLocaleString(), x, y - 10);
    ctx.font = '11px sans-serif';
    ctx.fillText(d.year, x, pad.top + ch + 20);
  });

  // Calculate growth
  const first = yearData[0].count;
  const last = yearData[yearData.length - 1].count;
  const growth = first > 0 ? (((last - first) / first) * 100).toFixed(1) : 'N/A';

  const summary = document.createElement('div');
  summary.style.cssText = 'margin-top:12px;padding:10px;background:rgba(46,110,162,0.1);border-radius:6px;font-size:12px;';
  summary.innerHTML = `<strong>Trend:</strong> ${first.toLocaleString()} (${yearData[0].year}) → ${last.toLocaleString()} (${yearData[yearData.length - 1].year}) | <strong>Change:</strong> ${growth}%`;
  container.appendChild(summary);

  chat.appendChild(container);
  chat.scrollTop = chat.scrollHeight;
  addExportButton(yearData, 'trend');
  return yearData;
}

// ========================================
// FEATURE: Fair Lending Alerts
// ========================================
async function checkFairLending(lei, year = '2024') {
  const races = ['White', 'Black or African American', 'Asian', 'American Indian or Alaska Native', 'Native Hawaiian or Other Pacific Islander'];
  const results = [];

  for (const race of races) {
    try {
      const origUrl = buildFFIECUrl('aggregations', { years: year, leis: lei, actions_taken: '1', races: race });
      const denUrl = buildFFIECUrl('aggregations', { years: year, leis: lei, actions_taken: '3', races: race });
      const [origData, denData] = await Promise.all([
        fetchFFIECData(origUrl, 1).catch(() => null),
        fetchFFIECData(denUrl, 1).catch(() => null)
      ]);
      const orig = origData?.aggregations?.reduce((s, a) => s + (a.count || 0), 0) || 0;
      const den = denData?.aggregations?.reduce((s, a) => s + (a.count || 0), 0) || 0;
      const total = orig + den;
      if (total > 10) {
        results.push({ race, originated: orig, denied: den, total, denialRate: ((den / total) * 100).toFixed(1) });
      }
    } catch {}
  }

  return results;
}

function renderFairLendingAlerts(fairData, container) {
  if (!fairData || fairData.length < 2) return;

  // Find overall average denial rate
  const totalOrig = fairData.reduce((s, d) => s + d.originated, 0);
  const totalDen = fairData.reduce((s, d) => s + d.denied, 0);
  const avgRate = totalDen / (totalOrig + totalDen) * 100;

  // Check for significant disparities
  const alerts = fairData.filter(d => parseFloat(d.denialRate) > avgRate * 1.5 && d.total > 20);

  if (alerts.length === 0) return;

  const section = document.createElement('div');
  section.style.marginTop = '16px';
  const title = document.createElement('h4');
  title.textContent = '⚠️ Fair Lending Flags';
  title.style.cssText = 'color:#ffa500;margin-bottom:8px;';
  section.appendChild(title);

  alerts.forEach(a => {
    const div = document.createElement('div');
    const isCritical = parseFloat(a.denialRate) > avgRate * 2;
    div.className = 'fair-lending-alert' + (isCritical ? ' critical' : '');
    div.innerHTML = `
      <div class="alert-title">${isCritical ? '🔴' : '🟡'} ${a.race}: ${a.denialRate}% denial rate</div>
      <div class="alert-detail">
        ${a.originated} originated, ${a.denied} denied (${a.total} total applications)
        <br>Average denial rate: ${avgRate.toFixed(1)}% — this group is ${(parseFloat(a.denialRate) / avgRate).toFixed(1)}x higher
      </div>
    `;
    section.appendChild(div);
  });

  const note = document.createElement('div');
  note.style.cssText = 'font-size:10px;opacity:0.5;margin-top:8px;font-style:italic;';
  note.textContent = 'Note: Flags indicate statistical disparities only. Further analysis needed for context.';
  section.appendChild(note);

  container.appendChild(section);
}

// ========================================
// FEATURE: Donut Chart for Loan Types
// ========================================
function renderDonutChart(breakdown, totalLoans, container) {
  const title = document.createElement('h4');
  title.textContent = '📊 Loan Type Distribution';
  title.style.cssText = 'margin-top:20px;margin-bottom:10px;color:#4ea1d3;';
  container.appendChild(title);

  const canvas = document.createElement('canvas');
  canvas.width = 400;
  canvas.height = 280;
  container.appendChild(canvas);

  const ctx = canvas.getContext('2d');
  const cx = 140, cy = 140, outerR = 100, innerR = 55;
  const colors = ['#4ea1d3', '#50c878', '#ffa500', '#9370db'];
  const isLight = document.body.classList.contains('light-theme');

  // Background
  ctx.fillStyle = isLight ? '#f7f9fc' : '#0a1c2e';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  let startAngle = -Math.PI / 2;
  breakdown.forEach((item, idx) => {
    const slice = (item.count / totalLoans) * Math.PI * 2;
    // Outer arc
    ctx.beginPath();
    ctx.moveTo(cx + innerR * Math.cos(startAngle), cy + innerR * Math.sin(startAngle));
    ctx.arc(cx, cy, outerR, startAngle, startAngle + slice);
    ctx.arc(cx, cy, innerR, startAngle + slice, startAngle, true);
    ctx.closePath();
    ctx.fillStyle = colors[idx % colors.length];
    ctx.fill();
    startAngle += slice;
  });

  // Center text
  ctx.fillStyle = isLight ? '#1a2332' : '#e6edf3';
  ctx.font = 'bold 18px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(totalLoans.toLocaleString(), cx, cy - 2);
  ctx.font = '11px sans-serif';
  ctx.fillText('Total Loans', cx, cy + 14);

  // Legend
  const legendX = 270;
  breakdown.forEach((item, idx) => {
    const y = 60 + idx * 40;
    ctx.fillStyle = colors[idx % colors.length];
    ctx.fillRect(legendX, y, 14, 14);
    ctx.fillStyle = isLight ? '#1a2332' : '#e6edf3';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(item.type, legendX + 20, y + 12);
    ctx.font = '11px sans-serif';
    ctx.fillStyle = isLight ? '#3a4a5c' : '#7fb3de';
    const pct = ((item.count / totalLoans) * 100).toFixed(1);
    ctx.fillText(`${item.count.toLocaleString()} (${pct}%)`, legendX + 20, y + 28);
  });
}

// ========================================
// FEATURE: Print Report / Copy Query
// ========================================
function addReportButtons() {
  const container = document.createElement('div');
  container.className = 'message assistant';
  container.style.cssText = 'display:flex;gap:8px;flex-wrap:wrap;';

  // Print button
  const printBtn = document.createElement('button');
  printBtn.textContent = '🖨️ Print Report';
  printBtn.style.cssText = 'padding:8px 14px;font-size:12px;';
  printBtn.addEventListener('click', () => {
    // Find the last user message, then collect everything after it (tables, charts, summaries)
    const allMessages = Array.from(chat.querySelectorAll('.message'));
    let lastUserIdx = -1;
    allMessages.forEach((m, i) => { if (m.classList.contains('user')) lastUserIdx = i; });

    // Mark messages before the last query as print-hidden
    allMessages.forEach((m, i) => {
      if (i < lastUserIdx) {
        m.setAttribute('data-print-hide', 'true');
      } else if (m.classList.contains('system')) {
        // Hide system/debug messages, keep user question + assistant results
        m.setAttribute('data-print-hide', 'true');
      }
    });

    window.print();

    // Restore after print
    allMessages.forEach(m => m.removeAttribute('data-print-hide'));
  });
  container.appendChild(printBtn);

  // Copy last query
  const copyBtn = document.createElement('button');
  copyBtn.textContent = '📋 Copy Results';
  copyBtn.style.cssText = 'padding:8px 14px;font-size:12px;';
  copyBtn.addEventListener('click', () => {
    const messages = chat.querySelectorAll('.message');
    const text = Array.from(messages).map(m => m.textContent).join('\n\n');
    navigator.clipboard.writeText(text).then(() => {
      addMessage('system', '✅ Results copied to clipboard');
    }).catch(() => {
      addMessage('system', '⚠️ Could not copy to clipboard');
    });
  });
  container.appendChild(copyBtn);

  chat.appendChild(container);
  chat.scrollTop = chat.scrollHeight;
}

// ========================================
// FEATURE: Info Panel with History & Favorites
// ========================================
function refreshInfoPanel() {
  // Find or create the history/favorites section
  let historySection = document.getElementById('infoHistorySection');
  if (!historySection) {
    // Add divider and history section to info panel
    const divider = document.createElement('hr');
    divider.style.cssText = 'border:none;border-top:1px solid rgba(255,255,255,0.1);margin:12px 0;';
    infoPanel.querySelector('.info-section').parentElement.appendChild(divider);

    // Favorites section
    const favTitle = document.createElement('div');
    favTitle.style.cssText = 'font-size:11px;text-transform:uppercase;letter-spacing:0.5px;color:#7fb3de;margin-bottom:6px;';
    favTitle.textContent = 'Saved Favorites';
    infoPanel.querySelector('.info-section').parentElement.appendChild(favTitle);

    const favSection = document.createElement('div');
    favSection.id = 'infoFavSection';
    infoPanel.querySelector('.info-section').parentElement.appendChild(favSection);

    // History section
    const histTitle = document.createElement('div');
    histTitle.style.cssText = 'font-size:11px;text-transform:uppercase;letter-spacing:0.5px;color:#7fb3de;margin:12px 0 6px;';
    histTitle.textContent = 'Recent Queries';
    infoPanel.querySelector('.info-section').parentElement.appendChild(histTitle);

    historySection = document.createElement('div');
    historySection.id = 'infoHistorySection';
    infoPanel.querySelector('.info-section').parentElement.appendChild(historySection);
  }

  // Render favorites
  const favSection = document.getElementById('infoFavSection');
  if (favSection) {
    const favs = Favorites.get();
    if (favs.length === 0) {
      favSection.innerHTML = '<div style="font-size:11px;opacity:0.4;padding:4px 10px;">No favorites yet. Click ⭐ on a query to save it.</div>';
    } else {
      favSection.innerHTML = '';
      favs.slice(0, 5).forEach(q => {
        const item = document.createElement('div');
        item.className = 'history-item';
        item.innerHTML = `<span>⭐</span><span class="history-text">${q}</span>`;
        item.addEventListener('click', () => { input.value = q; infoPanel.classList.remove('show'); input.focus(); });
        favSection.appendChild(item);
      });
    }
  }

  // Render history
  const history = QueryHistory.get();
  if (history.length === 0) {
    historySection.innerHTML = '<div style="font-size:11px;opacity:0.4;padding:4px 10px;">No queries yet.</div>';
  } else {
    historySection.innerHTML = '';
    history.slice(0, 8).forEach(q => {
      const item = document.createElement('div');
      item.className = 'history-item';
      const ago = formatTimeAgo(q.time);
      const isFav = Favorites.isFavorite(q.text);
      item.innerHTML = `
        <button class="fav-btn ${isFav ? 'active' : ''}" title="Save to favorites">${isFav ? '⭐' : '☆'}</button>
        <span class="history-text">${q.text}</span>
        <span class="history-time">${ago}</span>
      `;
      // Click text to fill input
      item.querySelector('.history-text').addEventListener('click', () => {
        input.value = q.text;
        infoPanel.classList.remove('show');
        input.focus();
      });
      // Click star to toggle favorite
      item.querySelector('.fav-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        Favorites.toggle(q.text);
        refreshInfoPanel();
      });
      historySection.appendChild(item);
    });
  }
}

function formatTimeAgo(ts) {
  const diff = Date.now() - ts;
  if (diff < 60000) return 'just now';
  if (diff < 3600000) return Math.floor(diff / 60000) + 'm ago';
  if (diff < 86400000) return Math.floor(diff / 3600000) + 'h ago';
  return Math.floor(diff / 86400000) + 'd ago';
}

// Refresh info panel when opened
infoBtn.addEventListener('click', () => {
  // Only refresh if panel is about to show
  setTimeout(() => {
    if (infoPanel.classList.contains('show')) refreshInfoPanel();
  }, 0);
});
