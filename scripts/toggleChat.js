/* ---- Bouton masquage ---- */
const toggle = document.getElementById("toggleChat");
const chatbox = document.getElementById("chatbox");
const chatinput = document.getElementById("chatinput");
const chattitle = document.getElementById("chattitle");
const chatcontent = document.getElementById("chatcontent");

function toggleChat(){
    if (chatbox.style.height === "45%") {
        chatbox.style.height = "0%";
        chatbox.style.border = "none";
        chattitle.style.display = "none";
        chatinput.style.display = "none";
        chatcontent.style.padding = "0px";
        toggle.textContent = "Afficher le chat";
        toggle.style.backgroundColor = "green";
    } else {
        chatbox.style.height = "45%";
        chatbox.style.border = "solid blue";
        chattitle.style.display = "block";
        chatinput.style.display = "block";
        chatcontent.style.padding = "3px";
        toggle.textContent = "Masquer le chat";
        toggle.style.backgroundColor = "grey";
    }
};