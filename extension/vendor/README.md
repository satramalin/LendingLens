# Vendor Dependencies

## WebLLM Installation Required

This extension requires WebLLM to run the Phi language model locally in the browser.

### Quick Install

**Download WebLLM and save as `webllm.js` in this folder:**

```
https://cdn.jsdelivr.net/npm/@mlc-ai/web-llm@0.2.46/lib/index.min.js
```

**Save to:**
```
extension/vendor/webllm.js
```

### Step-by-Step

1. Open the URL above in your browser
2. Right-click → Save As...
3. Save as `webllm.js` in this `vendor/` folder
4. Reload the extension

### Verify Installation

After downloading, you should have:
```
extension/vendor/
├── README.md (this file)
└── webllm.js (downloaded file)
```

### Using PowerShell (Alternative)

```powershell
cd c:\AI\HMDAChatBot\extension\vendor
Invoke-WebRequest -Uri "https://cdn.jsdelivr.net/npm/@mlc-ai/web-llm@0.2.46/lib/index.min.js" -OutFile "webllm.js"
```

### Supported Models

The extension works with any WebLLM-compatible model:
- **Phi-2-Q4** (default, ~200MB, recommended)
- Phi-3-mini-4k (~400MB)
- Llama-3.1-8B (~4GB)
- Other quantized models

Configure the model ID in extension settings.

## Troubleshooting

**Error: "WebLLM failed to load"**
- Ensure `webllm.js` exists in this folder
- Check file is not empty (should be ~500KB+)
- Reload the extension after adding the file

**Download fails**
- Try direct download from jsdelivr.net
- Or use PowerShell command above
- Check internet connection

## Notes

- WebLLM enables running AI models entirely in the browser
- First load downloads the model (~200MB for Phi-2)
- Subsequent loads use cached model (instant)
- No external API keys or servers required
- 100% local and private
