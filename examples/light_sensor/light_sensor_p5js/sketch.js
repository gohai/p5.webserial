let port;
let connectBtn;
let bright = 0;
let maxBright = 0;
let minBright = 1023;

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
  background(map(bright, minBright, maxBright, 0, 255));

  let str = port.readUntil("\n");
  if (str.length > 0) {
    str = str.trim();
    bright = parseInt(str);
    console.log(bright);
  }

  // this keeps track of the brightest and dimmest we saw
  if (bright > maxBright) {
    maxBright = bright;
  }
  if (bright < minBright) {
    minBright = bright;
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
