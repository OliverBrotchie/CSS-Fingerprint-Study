import { ConnectionHandler } from "./CSS-Fingerprint/index.ts";
import { defaultFonts } from "./default-font-list.ts";
import { startService } from "./server.ts";
import { query } from "./db.ts";

const handler = new ConnectionHandler((fingerprint, ip, timestamp) => {
    fingerprint?.calculateFonts(defaultFonts);

    console.log({
        ip: ip,
        timestamp: timestamp,
        fingerprint: fingerprint?.toJSON(),
    });
});

// Create a vanilla web-server
const PORT = 8080;

console.clear();
console.log(`🚀 Server is running on http://localhost:${PORT}`);

startService(PORT, handler);
