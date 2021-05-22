import { serve, ServerRequest } from "https://deno.land/std/http/server.ts";
import { extname } from "https://deno.land/std/path/mod.ts";
import { existsSync } from "https://deno.land/std/fs/mod.ts";
import { pathToRegexp } from "https://raw.githubusercontent.com/pillarjs/path-to-regexp/master/src/index.ts";
import { ConnectionHandler } from "./CSS-Fingerprint/index.ts";
import { defaultFonts } from "./default-font-list.ts";

const handler = new ConnectionHandler((fingerprint, ip, timestamp) => {
    console.log(Array.from(fingerprint?.fonts.values() ?? []));
    // Get the correct fonts
    fingerprint?.calculateFonts(defaultFonts);

    // console.log(`New participant ${ip}. ${timestamp}`);

    // console.log(fingerprint?.fonts);

    // console.log(fingerprint?.fonts.values.length);
});

const cssRegex = pathToRegexp("/some/url/\\?:key=:value");
const MEDIA_TYPES: Record<string, string> = {
    ".md": "text/markdown",
    ".html": "text/html",
    ".htm": "text/html",
    ".json": "application/json",
    ".map": "application/json",
    ".txt": "text/plain",
    ".ts": "text/typescript",
    ".tsx": "text/tsx",
    ".js": "application/javascript",
    ".jsx": "text/jsx",
    ".gz": "application/gzip",
    ".css": "text/css",
    ".wasm": "application/wasm",
    ".mjs": "application/javascript",
    ".svg": "image/svg+xml",
};

// Create a vanilla web-server
const PORT = 8080;
const server = serve({ port: 8080 });

console.clear();
console.log(`🚀 Server is running on http://localhost:${PORT}`);

for await (const req of server) {
    try {
        const connection = req.conn.remoteAddr as Deno.NetAddr;

        // Handle the css requests first as they will be the greatest number of requests
        const match = cssRegex.exec(req.url);
        if (match) {
            handler.insert(
                `${connection.hostname}`,
                match[1],
                match[2],
                req.headers
            );
            req.respond({ status: 418 });
        } else {
            // Handle everything else
            switch (req.url) {
                case "/" || "/home" || "/index.html":
                    // Home Page
                    serveFile(req, `./index.html`);
                    break;
                case "/fingerprint":
                    // Experiment Page
                    serveFile(req, `./fingerprint.html`);
                    break;
                default:
                    // Files and errors
                    if (
                        !req.url.includes("..") &&
                        req.url.substr(0, 7) == "/files/" &&
                        existsSync(`./${req.url}`)
                    ) {
                        serveFile(req, `./${req.url}`);
                    } else
                        req.respond({
                            body: "Oops something went wrong! Err 404",
                            status: 404,
                        });
            }
        }
    } catch (e) {
        console.log(e);
    }
}

/**
 * Serve a file at a given path (Taken from fileserver example)
 * @param req The server request context used to cleanup the file handle
 * @param filePath Path of the file to serve
 */
async function serveFile(req: ServerRequest, filePath: string) {
    const [file, fileInfo] = await Promise.all([
        Deno.open(filePath),
        Deno.stat(filePath),
    ]);
    const headers = new Headers();
    headers.set("content-length", fileInfo.size.toString());
    const contentTypeValue = contentType(filePath);
    if (contentTypeValue) {
        headers.set("content-type", contentTypeValue);
    }
    req.done.then(() => {
        file.close();
    });

    req.respond({
        status: 200,
        body: file,
        headers,
    });
}

/** Returns the content-type based on the extension of a path. */
function contentType(path: string): string | undefined {
    return MEDIA_TYPES[extname(path)];
}
