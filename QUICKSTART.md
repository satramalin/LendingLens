# Quick Start Guide

## 1. Install WebLLM

Download WebLLM and place in the vendor folder:

```bash
# Download from:
https://cdn.jsdelivr.net/npm/@mlc-ai/web-llm/lib/index.min.js

# Save as:
extension/vendor/webllm.js
```

## 2. Load Extension

1. Open Microsoft Edge
2. Navigate to `edge://extensions/`
3. Enable "Developer mode" (top right)
4. Click "Load unpacked"
5. Select the `extension` folder

## 3. First Use

1. Click the extension icon (side panel opens)
2. First query will download Phi model (1-3 minutes)
3. Wait for "✅ Phi model loaded and ready"
4. You're all set!

## 4. Example Query

Type in the chat:
```
How many VA loans in Illinois for 2024?
```

You'll get:
- 📊 Query plan from Phi
- 📋 Data table
- 📈 Bar chart
- 🤖 AI summary

## Settings

Click ⚙️ to configure:
- **Local Phi Model**: Default is "Phi-2-Q4" (recommended)
- **Max Pages**: How many pages to fetch (default: 3)
- **Diagnostics**: Show detailed execution logs
- **Test URL**: Test last API call

## More Query Examples

```
"Show me FHA loans in California"
"Refinance loans in Maryland"
"First lien conventional loans in Texas"
"VA loans for age 35-44 in Florida"
```

## Troubleshooting

### Model Not Loading
- Ensure webllm.js is in extension/vendor/
- Check browser console for errors (F12)
- Try reloading the extension

### No Results
- Enable diagnostics to see what's happening
- Click "Test URL" to verify API call
- Try a simpler query first

### Slow Performance
- First query downloads model (normal, 1-3 min)
- Subsequent queries are fast (2-5 seconds)
- Model is cached in browser

## Tips

1. **Be specific**: Include year, state, loan type
2. **Use diagnostics**: See exactly what's happening
3. **Test URL**: Verify API calls are working
4. **Export CSV**: Download results for analysis

## Support

For issues or questions, check:
- README.md - Full documentation
- CODEBASE_OVERVIEW.md - Technical details
- extension/vendor/README.md - WebLLM setup

## Privacy

- ✅ 100% local processing (Phi runs in browser)
- ✅ No external API keys needed
- ✅ No data tracking or telemetry
- ✅ Direct FFIEC API calls (public data)
