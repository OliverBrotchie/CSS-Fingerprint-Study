import { ConnectionHandler } from "./fingerprint.ts";
import { defaultFonts } from "./default-font-list.ts";
import { startService } from "./server.ts";
import { query } from "./db.ts";

const handler = new ConnectionHandler((ip, record) => {
    
    //Filter small changes or basic inserts
    if ([...record.fingerprint.properties.entries()].length >= 10) {
        record.fingerprint.calculateFonts(defaultFonts);

        
        // console.log(
        //     query(`INSERT INTO fingerprints (ip, timestamp, fingerprint)\nVALUES (${ip}, ${
        //         record.timestamp
        //     }, ${record.fingerprint.toJSON()});`)
        // );
    }
});

// Create a vanilla web-server
const PORT = 8000;

console.clear();
console.log(`🚀 Server is running on http://localhost:${PORT}`);

startService(PORT, handler);
