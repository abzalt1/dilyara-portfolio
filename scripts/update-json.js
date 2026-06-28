const fs = require("fs");
const file = "public/data.json";
const data = JSON.parse(fs.readFileSync(file));
data.videos.forEach(v => {
    if (v.src) v.src = v.src.replace(/\.mov$/i, ".mp4");
});
fs.writeFileSync(file, JSON.stringify(data, null, 2));
console.log("Updated data.json");
