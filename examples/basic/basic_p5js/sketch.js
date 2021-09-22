let port;
let connectBtn;
let sendBtn;

let textmovers = [];

function setup() {
  createCanvas(600, 400);

  connectBtn = createButton('Connect to Arduino');
  connectBtn.position(10, 10);
  connectBtn.mousePressed(connect);

  sendBtn = createButton('Send');
  sendBtn.position(10, 10);
  sendBtn.hide();
  sendBtn.mousePressed(send);
}

function draw() {
  background(0);

  if (port) {  // the port might not have been opened here
    let input = port.readUntil('\n');
    if (input.length > 0) {
      textmovers.push(new TextMover(input.trim(), true));
    }
  }

  for (let i=0; i < textmovers.length; i++) {
    textmovers[i].move();
    textmovers[i].display();
  }
}

function connect() {
  port = new WebSerial('Arduino', 57600);
  connectBtn.hide();
  sendBtn.show();
}

function send() {
  let output = 'Hello from the computer\n';
  port.write(output);
  textmovers.push(new TextMover(output, false));
}
