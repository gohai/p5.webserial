let port;
let connectBtn;

function setup() {
  createCanvas(400, 400);
  background(220);

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

  let sendBtn = createButton("Send hello");
  sendBtn.mousePressed(sendBtnClick);
}

function draw() {
  // this makes received text scroll up
  copy(0, 0, width, height, 0, -1, width, height);

  // reads in complete lines and prints them at the
  // bottom of the canvas
  let str = port.readUntil("\n");
  if (str.length > 0) {
    text(str, 10, height - 20);
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

function sendBtnClick() {
  port.println("Hello from p5.js");
}
