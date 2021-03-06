const urlSearchParams = new URLSearchParams(window.location.search);
const urlParams = Object.fromEntries(urlSearchParams.entries());

const urlPeerType = urlParams['type']; //"sender" or "receiver"
const ignoreDatGui = urlParams['ignoreDatGui'];
let customId = urlParams['id'];
const peerType = ["sender", "receiver"].includes(urlPeerType) ? urlPeerType : "sender";

const peer = new Peer(customId ?? null, {
    // port: 9000,
    host: "pubsubtest-272606.uc.r.appspot.com",
    path: "/",
    secure: true
}); 

let repalceURL = () => history.replaceState("", "", window.location.origin + window.location.pathname + `?type=${peerType}&id=${peer.id}&ignoreDatGui=${ignoreDatGui}`);
repalceURL();

let retryCount = 0;
let retrySetUrlId = () => {
    if(!peer.id) {
        console.log("retrying url id setting", retryCount++);
        setTimeout(retrySetUrlId, 1000)
    } else {
        repalceURL();
    }
}

retrySetUrlId();

const remoteState = {
    mouseX: 0,
    mouseY: 0,
    mouseIsPressed: false,
    stroke: [255, 255, 255],
    background: [0, 0, 0],
    strokeWeight: 5
};
let connection = null;

const drawParams = {
    strokeWeight: 5,
    stroke: [255, 255, 255], // RGB array
    background: [0, 0, 0], //RGB array
    receiverId: "pasteIdHere",
    connectToReciever: () =>{
        connection = peer.connect(drawParams.receiverId);
    },
    hideGUI: () => {
        gui.hide();
    }
}

function bounceDatGuiToRemote(val, paramName) {
    let data = {};
    data[paramName] = val;
    connection.send(data);
}

peer.on('connection', (conn) => {
    conn.on('data', (data) => {
        Object.assign(remoteState, data);
    });
    conn.on('error', (e) => {
        console.warn("peer connection error", e);
    });
    connection = conn
    console.log("got connection from sender");
});

const gui = new dat.GUI();
gui.remember(drawParams);
gui.add(drawParams, 'strokeWeight').min(1).max(10).step(0.25).onFinishChange(v => bounceDatGuiToRemote(v, 'strokeWeight') );
gui.addColor(drawParams, 'stroke').onFinishChange(v => bounceDatGuiToRemote(v, 'stroke'));
gui.addColor(drawParams, 'background').onFinishChange(v => bounceDatGuiToRemote(v, 'backround') );
gui.add(drawParams, 'receiverId');
gui.add(drawParams, 'connectToReciever');
gui.add(drawParams, 'hideGUI');

if(peerType == "receiver" || ignoreDatGui) {
  gui.hide();
}

let mouseDownInDatGui = false;
const datGuiContainer = document.getElementsByClassName("dg ac")[0];
datGuiContainer.addEventListener('mousedown', () => {mouseDownInDatGui = true});
datGuiContainer.addEventListener('mouseup', () => {mouseDownInDatGui = false});



let pts = [];
function setup() {
    createCanvas(window.innerWidth, window.innerHeight);
    let handleMove = (e) => e.preventDefault();
    const body = document.getElementsByTagName("body")[0]
    body.style.overflow = 'hidden';
    body.addEventListener("touchmove", handleMove);
}


function getDrawVals() {
    if(peerType == "receiver") {
        return remoteState;
    } else {
        return Object.assign({}, {mouseX, mouseY, mouseIsPressed}, drawParams);
    }
}

function sendDrawVals() {
    if(peerType == "sender" && connection && !mouseDownInDatGui) {
        connection.send({mouseX, mouseY, mouseIsPressed});
    }
}


let lastBackground = [-1, -1, -1];
let colorsAreSame = (c1, c2) => c1[0] === c2[0] && c1[1] === c2[1] && c1[2] === c2[2]

function draw() {

    drawVals = getDrawVals();
    sendDrawVals();

    if (!colorsAreSame(drawVals.background, lastBackground)) {
        push();
        stroke(drawVals.background[0], drawVals.background[1], drawVals.background[2]);
        fill(drawVals.background[0], drawVals.background[1], drawVals.background[2]);
        rect(0, 0, width, height);
        pop();
        lastBackground = drawVals.background.map(e => e);
    }
    

    stroke(drawVals.stroke);
    strokeWeight(drawVals.strokeWeight);
    if (drawVals.mouseIsPressed) {
        pts.push([drawVals.mouseX, drawVals.mouseY]);
        // console.log('mosue down');
    } else {
        pts = [];
    }
    if (pts.length > 4) {
        beginShape();
        for (let i = pts.length - 4; i < pts.length; i++) {
            curveVertex(pts[i][0], pts[i][1]);
        }
        endShape();
    }
}
