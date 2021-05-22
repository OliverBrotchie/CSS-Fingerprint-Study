const s: Set<Array<string>> = new Set();

(await Deno.readTextFile("./CSS-Fingerprint/default-font-list.txt"))
    .split("[")
    .forEach((e) => {
        let words = e.split("]")[0].split(",")[0].split(" ");

        words = words.map((word) => {
            return word.charAt(0).toUpperCase() + word.substr(1);
        });

        s.add([words.join(" "), `'${words.join("-")}'`]);
    });

const arr: Array<Array<string>> = Array.from(s.values());

const dash = arr.map((e) => {
    return e[0].split(" ").join("-");
});

Deno.writeTextFile(
    "./default-font-list.ts",
    `export const defaultFonts = ['${dash.join("','")}']`
);

//console.log(Array.from(s.values()));

Deno.writeTextFile(
    "./fonts.txt",
    `[${arr.map((e) => {
        return `[${e[0]},${e[1]}]`;
    })}]`
);
