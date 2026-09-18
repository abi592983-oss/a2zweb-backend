const fs = require('fs');
const path = require('path');
const required = ['src/appsscript.json','src/BookingBackend.gs','.clasp.json'];
let failed = false;
for (const file of required) {
  if (!fs.existsSync(path.join(process.cwd(), file))) {
    console.error('Missing required file:', file);
    failed = true;
  }
}
const manifest = JSON.parse(fs.readFileSync(path.join(process.cwd(),'src/appsscript.json'),'utf8'));
if (manifest.timeZone !== 'Asia/Colombo') {
  console.error('Unexpected Apps Script timezone');
  failed = true;
}
const clasp = JSON.parse(fs.readFileSync(path.join(process.cwd(),'.clasp.json'),'utf8'));
if (clasp.scriptId !== '1NpzDD-40LzdsX7ATucgYDenoLjhw7l8iXOaAHI_LRKzsHCb3F0_U7MPT') {
  console.error('Unexpected Apps Script project ID');
  failed = true;
}
if (failed) process.exit(1);
console.log('A2Z Web Backend validation passed.');
