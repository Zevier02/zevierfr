let file;

readStatus.style.display = "none";
readButton.style.display = "none";
downloadOutputBtn.style.display = "none";

fileOutput.addEventListener("change", async (e) => {
    file = e.target.files[0];

    readButton.style.display = "";
});

readButton.addEventListener("click", (e) => {
    convertFromZevierImage()
});

cryptKeyOutputtoggleBtn.addEventListener("click", (e) => {
    if(cryptKeyOutputtoggleBtn.textContent == "Afficher"){
        cryptKeyOutputtoggleBtn.textContent = "Masquer";
        cryptKeyOutput.type = "text";
    }
    else {
        cryptKeyOutputtoggleBtn.textContent = "Afficher";
        cryptKeyOutput.type = "password";
    }
});

async function convertFromZevierImage(){
    try {
        readStatus.style.display = "";
        readStatus.textContent = "Lecture du fichier...";
        let imageData = await file.text();

        if(!imageData.startsWith("ZevierImage")){
            return readStatus.textContent = "Image invalide."
        }

        readStatus.textContent = "Conversion de l'image...";
        imageData = imageData.split("\n")

        if(imageData[1] == "Crypted"){
            imageData = imageData.slice(2).join("\n")
            imageData = await decryptZevierImage(imageData)

            if(!imageData){
                return
            }
        }
        else {
            imageData = imageData.slice(2).join("\n")
        }

        const imageJSON = JSON.parse(imageData.replace(/\n/g, ""))

        const width = imageJSON[0].length;
        const height = imageJSON.length;

        const flat = new Uint8ClampedArray(imageJSON.flat(2));

        const canvas = outputCanvas;
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");

        const imgData = new ImageData(flat, width, height);
        ctx.putImageData(imgData, 0, 0);

        readStatus.style.display = "none"
        readButton.style.display = "none"
        downloadOutputBtn.style.display = "";
    }
    catch {
        return readStatus.textContent = "Erreur de lecture de l'image."
    }
}

downloadOutputBtn.addEventListener("click", () => {
    const url = outputCanvas.toDataURL("image/png");

    const a = document.createElement("a");
    a.href = url;
    a.download = "image.png";

    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
});

async function decryptZevierImage(payload) {
    readStatus.textContent = "Déchiffrement de l'image...";

    const password = cryptKeyOutput.value.trim();

    if(!password){
        readStatus.textContent = "Cette image utilise un mot de passe.";
        return false
    }


    const [saltHex, ivHex, encryptedHex] = payload.split(":");

    const salt = hexToArray(saltHex);
    const iv = hexToArray(ivHex);
    const encrypted = hexToArray(encryptedHex);

    const key = await to_derive_key(password, salt);

    try {
        const decryptedBuffer = await crypto.subtle.decrypt(
            {
                name: "AES-CBC",
                iv
            },
            key,
            encrypted
        );

        const decoder = new TextDecoder();
        const decrypted = decoder.decode(decryptedBuffer);

        if (!decrypted.startsWith("ZevierImage")) {
            readStatus.textContent = "Mot de passe invalide."
            return false
        }

        return decrypted.slice("ZevierImage".length);

    } catch (e) {
        readStatus.textContent = "Mot de passe invalide."
        return false
    }
}

function hexToArray(hex) {
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < bytes.length; i++) {
        bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
    }
    return bytes;
}

async function to_derive_key(password, salt) {
    const enc = new TextEncoder();

    const keyMaterial = await crypto.subtle.importKey(
        "raw",
        enc.encode(password),
        "PBKDF2",
        false,
        ["deriveKey"]
    );

    return await crypto.subtle.deriveKey(
        {
            name: "PBKDF2",
            salt,
            iterations: 100000,
            hash: "SHA-256"
        },
        keyMaterial,
        { name: "AES-CBC", length: 256 },
        false,
        ["decrypt"]
    );
}