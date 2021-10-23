import { ConnectionHandler } from "./fingerprint.ts";
import { serve } from "https://deno.land/std/http/server.ts";
import { pathToRegexp } from "https://raw.githubusercontent.com/pillarjs/path-to-regexp/master/src/index.ts";

export async function startService(port: number, handler: ConnectionHandler) {
    const cssRegex = pathToRegexp("/some/url/\\?:key=:value");
    const redirectRegex = pathToRegexp("/some/url/308=:redirect");

    for await (const req of serve({ port: port })) {
        try {
            // Handle the css requests first as they will be the greatest number of requests
            let match = cssRegex.exec(req.url);
            if (match) {
                req.respond({ status: 418 });
                handler.insert(
                    `${(req.conn.remoteAddr as Deno.NetAddr).hostname}`,
                    match[1],
                    match[2]
                );
            } else {
                // Handle subsequent 308 redirects
                match = redirectRegex.exec(req.url);
                if (match) {
                    req.respond({ status: 418 });
                    handler.insertCustom(
                        `${(req.conn.remoteAddr as Deno.NetAddr).hostname}`,
                        "subsequent-redirect",
                        match[1]
                    );
                    handler.addHeader(
                        `${(req.conn.remoteAddr as Deno.NetAddr).hostname}`,
                        req.headers
                    );
                } else if (req.url == "/some/url/308") {
                    // Handle 308 redirects
                    const rnd = random16Chars();
                    req.respond({
                        status: 308,
                        headers: new Headers({
                            location: "/some/url/308=" + rnd,
                        }),
                    });
                    handler.insertCustom(
                        `${(req.conn.remoteAddr as Deno.NetAddr).hostname}`,
                        "redirect",
                        rnd
                    );
                } else req.respond({ status: 400 });
            }
        } catch (e) {
            console.log(e);
        }
    }
}

function random16Chars(): string {
    return Array(16)
        .fill(0)
        .map(() => {
            return Math.ceil(Math.random() * 35).toString(36);
        })
        .join("");
}