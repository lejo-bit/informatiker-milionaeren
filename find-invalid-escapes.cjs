const fs = require("fs");
const content = fs.readFileSync("fragen.json", "utf8");
const lines = content.split("\n");
lines.forEach((line, i) => {
  // Find backslashes not followed by valid JSON escape chars ( " \ / b f n r t u or digit for \u)
  const matches = line.match(/\\([^"\\/bfnrtu0-9])/g);
  if (matches) {
    console.log((i + 1) + ": " + line.trim() + "  => " + matches.join(", "));
  }
});
console.log("Done.");