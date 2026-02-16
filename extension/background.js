// Background service worker (MV3)
// Handles storage, network calls, and LLM requests

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.get(["phiEndpoint", "phiApiKey"], (cfg) => {
    if (!cfg.phiEndpoint || !cfg.phiApiKey) {
      chrome.storage.sync.set({
        phiEndpoint: "",
        phiApiKey: ""
      });
    }
  });
  // Configure side panel default page
  if (chrome.sidePanel && chrome.sidePanel.setOptions) {
    chrome.sidePanel.setOptions({ path: 'sidebar.html' }).catch(() => {});
  }
});

// Open side panel when the extension icon is clicked
if (chrome.action && chrome.sidePanel) {
  chrome.action.onClicked.addListener(async (tab) => {
    try {
      if (chrome.sidePanel.setOptions) {
        await chrome.sidePanel.setOptions({ tabId: tab.id, path: 'sidebar.html' });
      }
      await chrome.sidePanel.open({ tabId: tab.id });
    } catch (e) {
      // Fallback: try to open a window with the sidebar.html
      try {
        await chrome.windows.create({ url: chrome.runtime.getURL('sidebar.html'), type: 'popup', width: 420, height: 720 });
      } catch {}
    }
  });
}

// Proxy HMDA API calls to avoid CORS issues (if needed)
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  (async () => {
    if (msg.type === "hmdaFetch") {
      try {
        const res = await fetch(msg.url, { headers: msg.headers || {} });
        const text = await res.text();
        sendResponse({ ok: res.ok, status: res.status, body: text });
      } catch (e) {
        sendResponse({ ok: false, error: String(e) });
      }
    }

    if (msg.type === "phiComplete") {
      try {
        const { prompt, system, temperature } = msg;
        const cfg = await chrome.storage.sync.get(["phiEndpoint", "phiApiKey"]);
        const endpoint = cfg.phiEndpoint;
        const key = cfg.phiApiKey;
        if (!endpoint || !key) {
          sendResponse({ ok: false, error: "Phi config missing" });
          return;
        }
        // Azure AI Inference style for Phi-3
        const res = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "api-key": key
          },
          body: JSON.stringify({
            messages: [
              system ? { role: "system", content: system } : null,
              { role: "user", content: prompt }
            ].filter(Boolean),
            temperature: temperature ?? 0.2
          })
        });
        const json = await res.json();
        // Support both chat and text completion outputs
        const content = json.choices?.[0]?.message?.content ?? json.choices?.[0]?.text ?? "";
        sendResponse({ ok: true, content, raw: json });
      } catch (e) {
        sendResponse({ ok: false, error: String(e) });
      }
    }

    // Streaming variant: returns chunks via ports (MV3 one-off response sends only once),
    // so we synthesize chunks and finally send a done message.
    if (msg.type === "phiStream") {
      try {
        const { prompt, system, temperature } = msg;
        const cfg = await chrome.storage.sync.get(["phiEndpoint", "phiApiKey"]);
        const endpoint = cfg.phiEndpoint;
        const key = cfg.phiApiKey;
        if (!endpoint || !key) {
          sendResponse({ ok: false, error: "Phi config missing" });
          return;
        }
        const res = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "api-key": key,
            // Some Azure endpoints support SSE when accept:text/event-stream; if not, we'll fallback.
            // "Accept": "text/event-stream"
          },
          body: JSON.stringify({
            messages: [
              system ? { role: "system", content: system } : null,
              { role: "user", content: prompt }
            ].filter(Boolean),
            temperature: temperature ?? 0.2,
            // If supported: stream: true
            // stream: true
          })
        });

        // Try to read the response body as a stream; if unsupported, fallback to full parse
        const reader = res.body?.getReader ? res.body.getReader() : null;
        if (!reader) {
          const json = await res.json();
          const content = json.choices?.[0]?.message?.content ?? json.choices?.[0]?.text ?? "";
          sendResponse({ ok: true, event: "done", content });
          return;
        }

        const decoder = new TextDecoder();
        let aggregated = "";
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          aggregated += chunk;
          // Heuristic chunking: split by sentence boundaries for UI incremental updates
          const parts = aggregated.split(/(?<=[.!?])\s+/);
          // keep last incomplete part
          aggregated = parts.pop() || "";
          for (const p of parts) {
            chrome.runtime.sendMessage({ ok: true, event: "chunk", content: p });
          }
        }
        if (aggregated) {
          chrome.runtime.sendMessage({ ok: true, event: "chunk", content: aggregated });
        }
        sendResponse({ ok: true, event: "done" });
      } catch (e) {
        sendResponse({ ok: false, error: String(e) });
      }
    }
  })();
  return true; // keep channel open for async
});

// Lightweight Phi status ping
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  (async () => {
    if (msg.type === 'phiPing') {
      try {
        const cfg = await chrome.storage.sync.get(["phiEndpoint", "phiApiKey"]);
        const endpoint = cfg.phiEndpoint;
        const key = cfg.phiApiKey;
        if (!endpoint || !key) { sendResponse({ ok: false, error: 'Phi config missing' }); return; }
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'api-key': key },
          body: JSON.stringify({ messages: [{ role:'user', content:'ping' }], temperature: 0 })
        });
        if (!res.ok) { sendResponse({ ok: false, status: res.status }); return; }
        const json = await res.json();
        const content = json.choices?.[0]?.message?.content ?? json.choices?.[0]?.text ?? '';
        sendResponse({ ok: true, content });
      } catch (e) {
        sendResponse({ ok: false, error: String(e) });
      }
    }
  })();
  return true;
});