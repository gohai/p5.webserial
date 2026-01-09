let port;
let connectBtn;
let ledOn = false;

function setup() {
  createCanvas(400, 400);

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

  if (ledOn) {
    fill(255, 0, 0);
  } else {
    noFill();
  }
  circle(width / 2, height / 2, 200);
}

function mouseClicked() {
  if (ledOn) {
    // it's on, turn it off
    ledOn = false;
    port.println("0");
  } else {
    // it's off, turn it on
    ledOn = true;
    port.println("1");
  }
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
