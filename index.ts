import { ConnectionHandler, DeviceRecord } from "./fingerprint.ts";
import { defaultFonts } from "./default-font-list.ts";
import { startService } from "./server.ts";
import { query } from "./db.ts";

const handler = new ConnectionHandler(
    (ip, record) => {
        if ([...(record.fingerprint.properties.entries() ?? [])].length >= 4) {
            record.fingerprint.calculateFonts(defaultFonts);

            console.log(record.fingerprint);
            const query = `INSERT INTO fingerprints (ip, timestamp, fingerprint)\nVALUES (${ip}, ${
                record.timestamp
            }, ${record.fingerprint.toJSON()});`;

            console.log(query);
        }
    },
    {
        timeoutFunction: (record: DeviceRecord) => {
            return true;
        },
        timeout: 5000,
    }
);

// Create a vanilla web-server
const PORT = 8000;

console.clear();
console.log(`🚀 Server is running on http://localhost:${PORT}`);

startService(PORT, handler);
