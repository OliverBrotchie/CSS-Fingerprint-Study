import { ConnectionHandler } from "./CSS-Fingerprint/index.ts";
import { defaultFonts } from "./default-font-list.ts";
import { startService } from "./server.ts";
import { query } from "./db.ts";

const handler = new ConnectionHandler((fingerprint, ip, timestamp) => {
    if ([...(fingerprint?.properties.entries() ?? [])].length >= 4) {
        fingerprint?.calculateFonts(defaultFonts);

        console.log(fingerprint);
        const query = `INSERT INTO fingerprints (ip, timestamp, fingerprint)\nVALUES (${ip}, ${timestamp}, ${fingerprint?.toJSON()});`;

        console.log(query);
    }
});

// Create a vanilla web-server
const PORT = 8080;

console.clear();
console.log(`🚀 Server is running on http://localhost:${PORT}`);

startService(PORT, handler);
