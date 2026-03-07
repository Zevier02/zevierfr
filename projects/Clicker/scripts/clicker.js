Decimal.set({ precision: 100 });

const Game = {
    z: new Decimal(0),
    upgrades: {},
    items: {},
    clickpower: new Decimal(1),
    clickmulti : new Decimal(1),
    rest: new Decimal(0),
    zsec: new Decimal(0),
    unlockedupgrades: {}
};

const GameConst = {
    items:{
        escl: { cost: new Decimal(10), basecost: new Decimal(10), secpower: new Decimal(0.1) },
        stag: { cost: new Decimal(100), basecost: new Decimal(100), secpower: new Decimal(0.5) },
        mach: { cost: new Decimal(1250), basecost: new Decimal(1250), secpower: new Decimal(5) },
        newgen: { cost: new Decimal(72700), basecost: new Decimal(72700), secpower: new Decimal(34) },
    },
    upgrades:{
        dc: { cost: new Decimal(100), clickpower: new Decimal(1) },
        mult: { cost: new Decimal(1200), clickmulti: new Decimal(2),
            requirements: { z: Decimal(500) }
        },
        mouse: { cost: new Decimal(200000), clickpower: new Decimal(0),
            requirements: { upgrade: ["mult"] }
        },
        fou: {
            cost: new Decimal(500),
            itempower: { escl: { secpower: new Decimal(0.1) } },
            requirements: { item: { escl: new Decimal(10) } }
        },
        surv: {
            cost: new Decimal(2000),
            itempower: { stag: { secpower: new Decimal(0.5) } },
            requirements: { item: { stag: new Decimal(10) } }
        },
        tech: {
            cost: new Decimal(60000),
            itempower: { mach: { secpower: new Decimal(5) } },
            requirements: { item: { mach: new Decimal(10) } }
        },
        ai: {
            cost: new Decimal(1300000),
            itempower: { newgen: { secpower: new Decimal(34) } },
            requirements: { item: { newgen: new Decimal(10) } }
        }
    }
};

function formatDecimal(value) {
    const units = ["", "K", "M", "B", "T", "Qa", "Qi", "Sx", "Sp", "Oc", "No", "Dc"];
    let unitIndex = 0;

    while (value.gte(1000) && unitIndex < units.length - 1) {
        value = value.div(1000);
        unitIndex++;
    }

    if (unitIndex === 0) {
        return value.toDecimalPlaces(0, Decimal.ROUND_DOWN).toString() + units[unitIndex];
    } else {
        return value.toDecimalPlaces(3, Decimal.ROUND_DOWN).toString() + units[unitIndex];
    }
}

function CalculateZSec() {
    let tempzsec = new Decimal(0);
    Object.keys(Game.items).forEach(key => {
        const item = Game.items[key];
        if(item.secpower){
            tempzsec = tempzsec.plus(item.secpower.times(item.number));
        }
    });
    Game.zsec = tempzsec;

    let zpersecond = Game.zsec;
    // Affichage avec 1 chiffre après la virgule
    document.getElementById('clickernbs').innerHTML = zpersecond.toFixed(1);
}

function Clicker() {
    const zPerSecondBonus = new Decimal(Game.upgrades.mouse? Game.zsec.div(100).toDecimalPlaces(0):0);
    const clickPower = Game.clickpower.plus(zPerSecondBonus);
    const totalClickPower = clickPower.times(Game.clickmulti);

    Game.z = Game.z.plus(totalClickPower);
    document.getElementById('clickernb').innerHTML = formatDecimal(Game.z);
}

function checkRequirements(){
    for (const key of Object.keys(GameConst.upgrades)) {
        if(!Game.upgrades[key]){
            let requirementmet = true;
            const obj = GameConst.upgrades[key];
            if(obj.requirements){
                if(obj.requirements.z){
                    if(obj.requirements.z.gt(Game.z)) requirementmet = false;
                }
                if(obj.requirements.item){
                    Object.keys(obj.requirements.item).forEach(key => {
                        const items = obj.requirements.item[key];
                        if(!Game.items[key]) requirementmet = false;
                        else if(items.gt(Game.items[key].number)) requirementmet = false;
                    });
                }
                if(obj.requirements.upgrade){
                    obj.requirements.upgrade.forEach(key => {
                        if(!Game.upgrades[key]) requirementmet = false;
                    });
                }
            }
            if(requirementmet){
                document.getElementById(key+'container').style.display = 'block';
                Game.unlockedupgrades[key] = true;
            }
            else {
                document.getElementById(key+'container').style.display = 'none';
                if(Game.unlockedupgrades[key]){
                    delete Game.unlockedupgrades[key]
                }
            }
        }
    };
}

function Buy(a, type, number = new Decimal(1)) {
    const item = GameConst[type][a];
    if(!item) return console.error("Item or type does not exist.");

    if(item.cost.times(number).greaterThan(Game.z)){
        return console.warn("Not enough to buy.");
    }

    if(type == 'items'){
        if(!Game.items[a]){
            Game.items[a] = { number, secpower: item.secpower };
        } else {
            Game.items[a].number = Game.items[a].number.plus(number);
        }
        checkRequirements()
    }

    if(type == 'upgrades'){
        if(Game.upgrades[a]) return console.error("Upgrade already got.");
        if(item.requirements && !Game.unlockedupgrades[a]){
            return console.error("Requirement(s) not met.");
        }
        Game.upgrades[a] = true;
        document.getElementById(a+'container').style = 'display:none';
        if(item.clickpower) Game.clickpower = Game.clickpower.plus(item.clickpower);
        if(item.clickmulti) Game.clickmulti = Game.clickmulti.times(item.clickmulti);
        if(item.itempower){
            Object.keys(item.itempower).forEach(key => {
                const obj = item.itempower[key];
                if(obj.secpower){
                    Game.items[key].secpower = Game.items[key].secpower.plus(obj.secpower);
                    document.getElementById('g'+key).innerHTML = Game.items[key].secpower.toString();
                }
            });
        }
        checkRequirements()
    }

    CalculateZSec();
    Game.z = Game.z.minus(item.cost.times(number));

    if(type == "items"){
        GameConst[type][a].cost = item.basecost.times(new Decimal(1.15).pow(Game.items[a].number)).floor();
        document.getElementById(a+'co').innerHTML = formatDecimal(GameConst[type][a].cost);
        document.getElementById('p'+a).innerHTML = formatDecimal(Game.items[a].number);
    }

    document.getElementById('clickernb').innerHTML = formatDecimal(Game.z);
}

function loadGame() {
    const raw = localStorage.getItem("clickerSave");
    if (!raw) return console.warn("Aucune sauvegarde trouvée.");
    
    const save = JSON.parse(raw);

    Game.z = new Decimal(save.z).floor();
    Game.rest = new Decimal(save.rest);
    Game.zsec = new Decimal(save.zsec);
    Game.upgrades = save.upgrades || {};
    Game.items = {};
    Game.unlockedupgrades = save.unlockedupgrades || {}
    Game.clickpower = new Decimal(save.clickpower);
    Game.clickmulti = save.clickmulti? new Decimal(save.clickmulti) : new Decimal(Game.upgrades.mult? 2:1);

    Object.keys(save.items).forEach(key => {
        Game.items[key] = {
            number: new Decimal(save.items[key].number),
            secpower: new Decimal(save.items[key].secpower)
        };

        // Rafraîchir l’affichage des items
        if (document.getElementById('p' + key)) {
            document.getElementById('p' + key).innerHTML = formatDecimal(Game.items[key].number);
        }
        if (document.getElementById('g' + key)) {
            document.getElementById('g' + key).innerHTML = Game.items[key].secpower.toFixed(1);
        }
        if (document.getElementById(key + 'co')) {
            GameConst.items[key].cost = GameConst.items[key].basecost.times(new Decimal(1.15).pow(Game.items[key].number));
            document.getElementById(key + 'co').innerHTML = formatDecimal(GameConst.items[key].cost);
        }
    });

    for (const key of Object.keys(Game.unlockedupgrades)) {
        if (Game.unlockedupgrades[key]) {
            const el = document.getElementById(key+'container');
            if (el) el.style.display = 'block';
        }
    }

    checkRequirements()

    Object.keys(GameConst.upgrades).forEach(key => {
        if (Game.upgrades[key]) {
            if (document.getElementById(key + 'container')) {
                document.getElementById(key + 'container').style.display = "none";
            }
        }
    });

    CalculateZSec();
    document.getElementById('clickernb').innerHTML = formatDecimal(Game.z);
    document.getElementById('clickernbs').innerHTML = Game.zsec.toFixed(1);

    console.log("Jeu chargé !");
}

function saveGame() {
    const save = {
        z: Game.z.toString(),
        clickpower: Game.clickpower.toString(),
        clickmulti: Game.clickmulti.toString(),
        rest: Game.rest.toString(),
        zsec: Game.zsec.toString(),
        items: {},
        upgrades: Game.upgrades,
        unlockedupgrades: Game.unlockedupgrades
    };

    // Sauvegarder les items
    Object.keys(Game.items).forEach(key => {
        save.items[key] = {
            number: Game.items[key].number.toString(),
            secpower: Game.items[key].secpower.toString()
        };
    });

    localStorage.setItem("clickerSave", JSON.stringify(save));
    console.log("Jeu sauvegardé !");
}

let lastTime = Date.now();
let ms = 0;

function Refresh() {
    const now = Date.now();
    const deltaMs = now - lastTime;
    lastTime = now;

    const zPerMs = Game.zsec.dividedBy(1000); 
    const zToAdd = zPerMs.times(deltaMs);

    const zInt = zToAdd.floor();
    const zFrac = zToAdd.mod(1);

    Game.z = Game.z.plus(zInt);
    Game.rest = Game.rest.plus(zFrac);

    if(Game.rest.greaterThanOrEqualTo(1)){
        const extra = Game.rest.floor();
        Game.z = Game.z.plus(extra);
        Game.rest = Game.rest.mod(1);
    }

    checkRequirements()

    document.getElementById('clickernb').innerHTML = formatDecimal(Game.z);
    if(ms >= 30000){
        saveGame()
        ms = 0
    }
    ms += 10
}
loadGame()
setInterval(Refresh, 10);

window.addEventListener("beforeunload", () => {
    saveGame();
});

document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") {
        saveGame();
    }
});

window.addEventListener("pagehide", () => {
    saveGame();
});