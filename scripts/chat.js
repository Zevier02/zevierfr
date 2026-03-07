const chat = document.getElementById('chat');
let messages = {};
let oldestmessage = -1;

function formatChatDate(isoDate) {
    const locale = navigator.language || "en-US";
    const d = new Date(isoDate);
    const now = new Date();

    const time = d.toLocaleTimeString(locale, {
        hour: "2-digit",
        minute: "2-digit"
    });

    const dMid = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const nowMid = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const diffDays = Math.round((nowMid - dMid) / 86400000);

    if (diffDays === 0) {
        return time;
    }

    if (d.getFullYear() !== now.getFullYear()) {
        const dateFull = d.toLocaleDateString(locale, {
            day: "2-digit",
            month: "2-digit",
            year: "numeric"
        });
        return `${dateFull} ${time}`;
    }

    const dateShort = d.toLocaleDateString(locale, {
        day: "2-digit",
        month: "2-digit"
    });

    return `${dateShort} ${time}`;
}

const socket = io("https://msg.zevier.fr", {
  transports: ["websocket", "polling"],
  withCredentials: true,
  reconnection: true,
  reconnectionAttempts: 50,
  reconnectionDelay: 50,
  reconnectionDelayMax: 100,
  timeout: 20000
});

// Recevoir les messages existants
socket.on("init", msgs => getmessages(msgs));

// Recevoir un nouveau message
socket.on("newMessage", msg => getmessages([msg]));

// Mettre les anciens messages
socket.on("oldMessages", msgs => getmessages(msgs, true));

function senderror(errortext) {
    if(typeof(errortext) === "number"){
            if(errortext === 0){
                const first = chat.firstElementChild;

            if (!first || first.textContent !== "Début de la discussion.") {
                const line = document.createElement("h3");
                line.textContent = "Début de la discussion.";
                chat.prepend(line);
            }
        }
    }
    else {
        const error = document.getElementById('chaterror');
        error.innerHTML = errortext;
        setTimeout(() => {
            error.innerHTML = "";
        }, 5000)
    }
}

document.getElementById("content").addEventListener("keydown", function (e) {
    if (e.key === "Enter") {
        e.preventDefault();
        sendmessage();
    }
});

function getmessages(response, old = false) {
    if(!old) response.reverse();
    let previousScrollHeight = chatcontent.scrollHeight;
    let previousScrollTop = chatcontent.scrollTop;
    const first = !chat.firstElementChild;
    let lastNewLine = null;
    response.forEach(message => {
        if (!messages[message.id]) {
            const line = document.createElement("div");
            const dateSpan = document.createElement("span");
            dateSpan.className = "chat-date";
            dateSpan.dataset.date = message.date;
            dateSpan.textContent = `[${formatChatDate(message.date)}] `;
            const content = document.createTextNode(`${message.author} : ${message.content}`);
            line.appendChild(dateSpan);
            line.appendChild(content);

            if(old){
                chat.prepend(line);
            }
            else {
                chat.appendChild(line);
            }

            messages[message.id] = true;
            if(oldestmessage != -1){
                if(Number(message.id) < oldestmessage) oldestmessage = Number(message.id);
            }
            else {
                oldestmessage = Number(message.id);
            }
            lastNewLine = line;
        }
    });

    if (old) {
        const newScrollHeight = chatcontent.scrollHeight;
        chatcontent.scrollTop = previousScrollTop + (newScrollHeight - previousScrollHeight);
    }
    else if(first && !!lastNewLine){
        lastNewLine.scrollIntoView({ behavior: "auto" });
    }
    else if (!!lastNewLine && !old) {
        lastNewLine.scrollIntoView({ behavior: "smooth" });
    }
}

socket.on("errorMessage", error => senderror(error.content));

function sendmessage() {
    const author = document.getElementById("author").value;
    const content = document.getElementById("content").value;

    if(author.length == 0){
        return senderror("Indiquer un pseudo.");
    }
    if(content.length == 0){
        return senderror("Mettre un message.");
    }

    socket.emit("sendMessage", {author, content});
    
    document.getElementById('content').value = "";
}

function chatSave() {
    const save = {
        pseudo: document.getElementById("author").value,
        content: document.getElementById("content").value,
        hidden: (document.getElementById("chatbox").style.height !== "45%")
    };

    localStorage.setItem("chatSave", JSON.stringify(save));
}

function chatLoad() {
    const raw = localStorage.getItem("chatSave");
    if (!raw) return;
    
    const save = JSON.parse(raw);

    document.getElementById("author").value = save.pseudo;
    document.getElementById("content").value = save.content;

    if(save.hidden){
        toggleChat();
    }
}

window.addEventListener("beforeunload", () => {
    chatSave();
});

document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") {
        chatSave();
    }
});

window.addEventListener("pagehide", () => {
    chatSave();
});

chatcontent.addEventListener("scroll", () => {
    if (chatcontent.scrollTop <= 100) {
        const first = chat.firstElementChild;

        if (!!first && first.textContent !== "Début de la discussion.") {
            socket.emit("getMessages", {id: oldestmessage});
        }
    }
});

function refreshAllChatDates() {
    const dates = document.querySelectorAll(".chat-date");

    dates.forEach(el => {
        const iso = el.dataset.date;
        el.textContent = `[${formatChatDate(iso)}] `;
    });
}

function msUntilNextMidnight() {
    const now = new Date();
    const next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 1);
    return next - now;
}

setTimeout(() => {

    refreshAllChatDates();

    setInterval(refreshAllChatDates, 24 * 60 * 60 * 1000);

}, msUntilNextMidnight());

chatLoad();