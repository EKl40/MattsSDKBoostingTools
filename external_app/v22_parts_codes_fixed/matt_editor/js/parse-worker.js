/**
 * Web Worker: parses JSON off the main thread to avoid blocking.
 * Message: { text: string }
 * Response: { data: object } or { error: string }
 */
self.onmessage = function (e) {
    try {
        const data = JSON.parse(e.data.text);
        self.postMessage({ data: data });
    } catch (err) {
        self.postMessage({ error: err.message || String(err) });
    }
};
