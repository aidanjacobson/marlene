// get encrypted data
const useEncryption = true;
const app = require("electron").remote.app;
async function getJSONEncrypted(passphrase) {
    /*
    var response = await fetch("data.txt");
    var output = await response.text();
    */
    var filePath = path.join(app.getPath("userData"), "data.txt");
    var output = fs.readFileSync(filePath, {encoding: "utf-8"});
    try {
        var decrypted = CryptoJS.AES.decrypt(output, passphrase).toString(CryptoJS.enc.Utf8);
        var data = JSON.parse(decrypted);
        return data;
    } catch(e) {
        return {decrypted:false};
    }
}

async function getJSONUnencrypted() {
    var response = await fetch("data.json");
    return await response.json();
}

window.getJSON = getJSONEncrypted;
if (!useEncryption) {
    window.getJSON = getJSONUnencrypted;
}