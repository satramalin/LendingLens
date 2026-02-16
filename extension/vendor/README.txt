Place local LLM runtime files here if using in-browser local Phi.

Suggested approach (WebLLM / MLC LLM):
1) Download the web runtime bundle (e.g., webllm.min.js and associated worker/wasm files) from the official release.
2) Download a compatible Phi model (e.g., phi-2 or phi-3-mini) quantized for WebGPU/WebAssembly.
3) Ensure all required files are placed under this vendor/ folder and paths are configured in the extension settings.

Note: Bundling large models inside the extension may exceed store limits. Prefer referencing model weights hosted on a CORS-enabled server or local dev server; the runtime can fetch model shards over HTTP(S).
