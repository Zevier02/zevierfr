const canvas = document.getElementById("canvas1"); 
const context = canvas.getContext("2d");
let refreshrate = 60;

let mousex = 0;
let mousey = 0;
const worldHeight = 20;

function metersToPixels(m) {
    return m * (canvas.height / worldHeight);
}

function pixelsToMeters(p) {
    return p * (worldHeight / canvas.height);
}

function circle(x, y, r) {
    context.beginPath();
    context.lineWidth="2";
    context.strokeStyle = "#FFFFFF";
    context.arc(x, y, r, 0, 2 * Math.PI);
    context.stroke();
}

function clear() {
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.beginPath();
    context.moveTo(0, metersToPixels(worldHeight));
    context.lineTo(canvas.width, metersToPixels(worldHeight));
    context.stroke();
    context.beginPath();
    context.moveTo(0, 0);
    context.lineTo(canvas.width, 0);
    context.stroke();
    context.beginPath();
    context.moveTo(0, 0);
    context.lineTo(0, metersToPixels(worldHeight));
    context.stroke();
    context.beginPath();
    context.moveTo(canvas.width, 0);
    context.lineTo(canvas.width, metersToPixels(worldHeight));
    context.stroke();
}

canvas.addEventListener("mousemove", function(event) {
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    mousex = x;
    mousey = y;
});

function resizeCanvas() {
    canvas.width  = window.innerWidth * 0.90;
    canvas.height = window.innerHeight * 0.90 - 150;

    canvas.style.position = "absolute";
    canvas.style.left = (window.innerWidth * 0.05) + "px";
    canvas.style.top  = (window.innerHeight * 0.05) + 150 + "px";
    const div = document.getElementById("sim");
    div.style.width = canvas.width + (window.innerWidth * 0.05) + "px";
    div.style.height = canvas.height + (window.innerHeight * 0.05) + "px";
}

resizeCanvas();

window.addEventListener("resize", resizeCanvas);

let simulationspeed = 1;
let g = 9.81; // gravity constant
let k = 0.002; // air deceleration coefficient
let b = 0.9; // bounce energy conservation coefficient
let dt = simulationspeed / refreshrate; // delta t, the time passed between 2 frames
let rad = 10;
let speedy = 0;
let speedx = 0;
let posy = pixelsToMeters(canvas.width > canvas.height? canvas.height/10 : canvas.width/10) * rad / 10;
let posx = pixelsToMeters(canvas.width/2);
let accelerationy = 0;
let accelerationx = 0;
let fmousex = 2;
let fmousey = 2;
let date = performance.now();
let frames = 0;
let time = 0;

function display() {
    const mousepresent = (mousex > 0 + 10 && mousex < canvas.width - 10 && mousey > 0 + 10 && mousey < canvas.height - 10)? true : false
    dt = (performance.now() - date) / 1000 * simulationspeed;
    radiusm = pixelsToMeters(canvas.width > canvas.height? canvas.height/10 : canvas.width/10) * rad / 10;

    if(posy + radiusm > worldHeight){
        speedy = -speedy * b;
        posy = worldHeight - radiusm;
    }
    if(posy - radiusm < 0){
        speedy = -speedy * b;
        posy = 0 + radiusm;
    }

    if(posx + radiusm > pixelsToMeters(canvas.width)){
        speedx = -speedx * b;
        posx = pixelsToMeters(canvas.width) - radiusm;
    }
    if(posx - radiusm < 0){
        speedx = -speedx * b;
        posx = 0 + radiusm;
    }

    let accelerationx = 0;
    let accelerationy = 0;
    if(!mousepresent){
        speedy += g * dt;
    }
    else {
        accelerationx = (pixelsToMeters(mousex) - posx) * fmousex;
        accelerationy = (pixelsToMeters(mousey) - posy) * fmousey;
    }
    accelerationy -= k * speedy;
    accelerationx -= k * speedx;
    speedx += accelerationx * dt;
    speedy += accelerationy * dt;
    posx += speedx * dt;
    posy += speedy * dt;
    clear();
    circle(metersToPixels(posx), metersToPixels(posy), metersToPixels(radiusm));
    if(mousepresent){
        circle(mousex, mousey, canvas.width > canvas.height? canvas.height/75 : canvas.width/75);
    }


    time += performance.now() - date;
    frames += 1;
    if(time > 1000){
        time -= 1000;
        document.getElementById('fps').innerHTML = frames;
        frames = 0;
    }
    date = performance.now();
}

let intervalId = setInterval(display, 1000/refreshrate);

function getValue(element) {
    const input = Number(document.getElementById(element).value);
    if(element == "gravity"){
        g = input;
    }
    else if(element == "air"){
        k = input;
    }
    else if(element == "b"){
        b = input;
    }
    else if(element == "rad"){
        rad = input;
    }
    else if(element == "mousex"){
        fmousex = input;
    }
    else if(element == "mousey"){
        fmousey = input;
    }
    else if(element == "fr"){
        clearInterval(intervalId);
        if(input == 0){
            refreshrate = 1;
        }
        else {
            refreshrate = input;
        }
        intervalId = setInterval(display, 1000/refreshrate);
    }
    else if(element == "sp"){
        simulationspeed = input;
    }
}

function reset(){
    clearInterval(intervalId);
    g = 9.81;
    document.getElementById("gravity").value = 9.81
    k = 0.002;
    document.getElementById("air").value = 0.002
    b = 0.9;
    document.getElementById("b").value = 0.9
    rad = 10;
    document.getElementById("rad").value = 10
    fmousex = 5;
    document.getElementById("mousex").value = 2
    fmousey = 5;
    document.getElementById("mousey").value = 2
    speedy = 0;
    speedx = 0;
    posy = pixelsToMeters(canvas.width > canvas.height? canvas.height/10 : canvas.width/10) * rad / 10;
    posx = pixelsToMeters(canvas.width/2);
    accelerationy = 0;
    accelerationx = 0;
    simulationspeed = 1;
    document.getElementById("sp").value = 1
    refreshrate = 60;
    document.getElementById("fr").value = 60
    intervalId = setInterval(display, 1000 / refreshrate);
}