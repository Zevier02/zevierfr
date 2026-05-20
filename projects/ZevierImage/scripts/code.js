const input = document.getElementById("fileInput");

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

downloadBtn.style.display = "none"
convertButton.style.display = "none"
convertStatus.style.display = "none"

let width = 0;
let height = 0;

let toConvertImage = "";

fileInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    const img = new Image();

    img.onload = () => {
        width = img.width;
        height = img.height;

        canvas.width = width;
        canvas.height = height;

        ctx.drawImage(img, 0, 0);

        downloadBtn.style.display = "none"
        convertButton.style.display = ""
        convertStatus.style.display = "none";
    };

    img.src = URL.createObjectURL(file);
});

cryptKeyInputtoggleBtn.addEventListener("click", (e) => {
    if(cryptKeyInputtoggleBtn.textContent == "Afficher"){
        cryptKeyInputtoggleBtn.textContent = "Masquer"
        cryptKeyInput.type = "text"
    }
    else {
        cryptKeyInputtoggleBtn.textContent = "Afficher"
        cryptKeyInput.type = "password"
    }
});

convertButton.addEventListener("click", (e) => {
    convertStatus.style.display = "";
    convertStatus.textContent = "Conversion en cours...";
    const imageData = ctx.getImageData(0, 0, width, height).data;

    buildPixelString(imageData, width, height).then(result => {
        toConvertImage = result
        if(!result){
            return
        }
        downloadBtn.style.display = "";
        convertButton.style.display = "none";
        convertStatus.textContent = "Conversion terminée.";
    });
});

downloadBtn.addEventListener("click", () => {
    const content = toConvertImage

    const blob = new Blob([content], { type: "application/octet-stream" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "image.ZevierImage";

    document.body.appendChild(a);
    a.click();

    document.body.removeChild(a);
    URL.revokeObjectURL(url);
});

async function buildPixelString(imageData, width, height) {
    try {
        let lignePixels = "";
        let imagePixels = "";

        for (let i = 0; i < imageData.length; i += 4) {

            const r = imageData[i];
            const g = imageData[i + 1];
            const b = imageData[i + 2];
            const a = imageData[i + 3];

            lignePixels += `[${r},${g},${b},${a}],`;

            const pixelIndex = i / 4;
            const x = pixelIndex % width;

            if (x === width - 1) {
                imagePixels += `[${lignePixels.slice(0, -1)}],\n`;
                lignePixels = "";
            }
        }

        // sécurité ligne incomplète
        if (lignePixels.length > 0) {
            imagePixels += `[${lignePixels.slice(0, -1)}],\n`;
        }

        let result = `[${imagePixels.slice(0, -2)}]`;

        const password = cryptKeyInput.value.trim();

        if (password) {
            convertStatus.textContent = "Chiffrement en cours...";
            try {
                const salt = crypto.getRandomValues(new Uint8Array(16));
                const iv = crypto.getRandomValues(new Uint8Array(16));
                
                const key = await derive_key(password, salt);
                
                const data = new TextEncoder().encode("ZevierImage" + result).buffer;

                const encryptedBuffer = await crypto.subtle.encrypt(
                    { name: "AES-CBC", iv: iv },
                    key,
                    data
                );

                const encrypted = new Uint8Array(encryptedBuffer);
                result = `${arrayToHex(salt)}:${arrayToHex(iv)}:${arrayToHex(encrypted)}`;
            } catch {
                convertStatus.textContent = "Erreur de chiffrement.";
                return false
            }
        }

        return `ZevierImage V2\n${password ? "Crypted" : ""}\n${result}`;
    }
    catch {
        convertStatus.textContent = "Erreur de conversion.";
        return false
    }
}

async function derive_key(password, salt) {
    const enc = new TextEncoder();

    const keyMaterial = await crypto.subtle.importKey(
        "raw",
        enc.encode(password),
        "PBKDF2",
        false,
        ["deriveKey"]
    );

    const key = await crypto.subtle.deriveKey(
        {
            name: "PBKDF2",
            salt,
            iterations: 100000,
            hash: "SHA-256"
        },
        keyMaterial,
        { name: "AES-CBC", length: 256 },
        false,
        ["encrypt", "decrypt"]
    );

    return key
}

function arrayToHex(buffer) {
    return [...buffer].map(b => b.toString(16).padStart(2, "0")).join("");
}