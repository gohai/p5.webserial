let port;
let connectBtn;
let sendBtn;
let textmovers = [];

function setup() {
  createCanvas(600, 400);

  connectBtn = createButton('Connect to Arduino');
  connectBtn.position(10, 10);
  connectBtn.mousePressed(connectBtnClick);

  sendBtn = createButton('Send');
  sendBtn.position(10, 10);
  sendBtn.hide();
  sendBtn.mousePressed(sendBtnClick);

  // automatically connect if possible
  let usedPorts = usedSerialPorts();
  if (usedPorts.length > 0) {
    port = createSerial(usedPorts[0], 9600);
  }
}

function draw() {
  background(0);

  if (port) {
    connectBtn.hide();
    sendBtn.show();

    let data = port.readUntil('\n');
    if (data.length > 0) {
      textmovers.push(new TextMover(data.trim(), true));
    }
  }

  for (let i=0; i < textmovers.length; i++) {
    textmovers[i].move();
    textmovers[i].display();
  }
}

function connectBtnClick(port) {
  // this will only show a dialog in reaction to user input
  // like in this event handler for a button click
  port = createSerial('Arduino', 57600);
}

function sendBtnClick() {
  let output = 'Hello from the computer\n';
  port.write(output);
  textmovers.push(new TextMover(output, false));
}
