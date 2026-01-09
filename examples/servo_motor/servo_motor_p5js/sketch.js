// Press and hold the mouse button to actuate
// the servo motor

let port;
let connectBtn;

let pos = 0; // displacement from center
let speed = 0; // velocity
let k = 0.005; // spring constant
let damping = 0.995;
let mousePressedTime = 0;
let circleSize = 0;

function setup() {
  createCanvas(400, 200);

  port = createSerial();
  connectBtn = createButton("Connect to Arduino");
  connectBtn.mousePressed(connectBtnClick);

  // in setup, we can open ports we have used previously
  // without user interaction
  let usedPorts = usedSerialPorts();
  if (usedPorts.length > 0) {
    port.open(usedPorts[0], 57600);
    connectBtn.html("Disconnect");
    //connectBtn.hide();
  }
}

function draw() {
  background(255);

  // spring force toward center
  // see https://natureofcode.com/oscillation/#spring-forces
  let force = -k * pos;
  speed += force;
  speed *= damping;
  pos += speed;

  let servoPos = map(pos, -width / 2, width / 2, 0, 180); // to 0-180
  servoPos = constrain(pos, 0, 180); // make sure we don't go beyond
  servoPos = floor(servoPos); // floor() to get rid of decimals
  port.println(servoPos);

  // draw the mass
  noStroke();
  fill(50);
  ellipse(width / 2 + pos, height / 2, 40, 40);

  // feedback for mouse press
  if (mousePressedTime != 0) {
    fill(255, 0, 0, 100);
    circle(width / 2, height / 2, circleSize);
    circleSize += 1;
  }
}

function mousePressed() {
  mousePressedTime = millis();
  circleSize = 0;
}

function mouseReleased() {
  let duration = millis() - mousePressedTime;
  speed = map(duration, 0, 1000, 0, 10); // impulse strength
  mousePressedTime = 0;
}

function connectBtnClick() {
  if (connectBtn.html() != "Disconnect") {
    port.open("Arduino", 57600);
    connectBtn.html("Disconnect");
    //connectBtn.hide();
  } else {
    port.close();
    connectBtn.html("Connect to Arduino");
  }
}
