// This example is also available online in the p5.js web editor:
// https://editor.p5js.org/gohai/sketches/X0XD9xvIR

let port;
let connectBtn;

function setup() {
  createCanvas(400, 400);
  background(220);
  
  connectBtn = createButton('Connect to Arduino');
  connectBtn.position(80, 200);
  connectBtn.mousePressed(connectBtnClick);

  let sendBtn = createButton('Send hello');
  sendBtn.position(220, 200);
  sendBtn.mousePressed(sendBtnClick);

  // automatically open ports we've used before
  let usedPorts = usedSerialPorts();
  if (usedPorts.length > 0) {
    port = createSerial(usedPorts[0], 57600);
  }
}

function draw() {
  // make received text scroll up
  copy(0, 0, width, height, 0, -1, width, height);

  // add new lines of text to the bottom
  let str = port.readUntil("\n");
  if (str.length > 0) {
    text(str, 10, height-20);
  }

  // change button label based on connection status
  if (!port || !port.opened()) {
    connectBtn.html('Connect to Arduino');
  } else {
    connectBtn.html('Disconnect');
  }
}

function connectBtnClick() {
  if (!port || !port.opened()) {
    port = createSerial('Arduino', 57600);
  } else {
    port.stop();
  }
}

function sendBtnClick() {
  port.write("Hello from p5.js\n");
}
