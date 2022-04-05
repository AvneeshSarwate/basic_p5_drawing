
let pts = [];
function setup() {
  createCanvas(window.innerWidth, window.innerHeight);
  let handleMove = e => e.preventDefault();
  document.getElementsByTagName('body')[0].addEventListener('touchmove', handleMove);
}

function draw() {
  if(mouseIsPressed) {
    pts.push([mouseX, mouseY]);
    // console.log('mosue down');
  } else {
    pts = [];
  }
  if(pts.length > 4) {
    beginShape();
    for(let i = pts.length-4; i < pts.length; i++) {
      curveVertex(pts[i][0], pts[i][1]);
    }
    endShape();
  }
}