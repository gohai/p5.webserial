# p5.webserial.js

A library for p5.js which adds support for interacting with Serial devices, using the Web Serial API (currently supported on Chrome and Edge). It provides the following features:

* Easy to use API, largely the same as Processing's [Serial library](https://processing.org/reference/libraries/serial/index.html)
* No `async/await` or callbacks needed in sketches
* Can automatically connect to previously-used serial ports (great for installations)
* Unicode support (`Serial.print("你好"")` in Arduino)
* Multi-byte matching in `readUntil(needle)`
* Well tested, also works [in the p5.js web editor](https://editor.p5js.org/gohai/sketches/X0XD9xvIR)
* Also supported on Chrome for Android

## Reference

- [Getting started](#getting-started)
- [Examples](examples/)

## Getting started

Download the [library file](https://github.com/gohai/p5.webserial/blob/main/libraries/p5.webserial.js) and include it in the `head` section of your HTML below the line that loads `p5.js` - or simply include the online version at the same place:

```
<script src="https://unpkg.com/@gohai/p5.webserial@^1/libraries/p5.webserial.js"></script>
```
or
```
<script src="p5.webserial.js"></script>
```

#### Opening ports

Create a global variable, and set it to a new serial port instance inside setup:

```
let port;

function setup() {
  port = createSerial();
  // ...
```

To actually open a serial port, call the `open` method with the desired arguments. This prompts the user to select a serial port (at 9600 baud):

```
port.open(9600);
```

This will only show Arduino boards (and compatible) in the dialog: (Other presets are `MicroPython`, `RaspberryPi`, `Adafruit`)

```
port.open('Arduino', 9600);
```

Most browsers will only show the port picker dialog as a result of user input, e.g. after clicking a button, so you likely will need to do this outside of setup. (see this [example](examples/basic/basic_p5js/sketch.js) for how)

If the user has previously selected a serial port on a page, you can automatically connect to it on future page loads without user interaction, even inside setup, like so:

```
let usedPorts = usedSerialPorts();
if (usedPorts.length > 0) {
  port.open(usedPorts[0], 9600);
}
```

#### Reading data

This reads a single (Unicode) character from the serial port:

```
let str = port.read(1);                   // returns e.g. "你"
```

This reads all available characters:

```
let str = port.read();                    // returns e.g. "你好"
```

This reads all characters till the end of a line: (This will return an empty string if the string given as parameter was not found.)

```
let str = port.readUntil("\n");           // returns the whole line
```

This also works with more than one character to look for:

```
let str = port.readUntil("STOP");         // returns everything up to and including "STOP"
```

This returns the most reccently returned character, discarding all previously received ones in the process:

```
let str = port.last();
```

These methods allow you to receive (raw) bytes as values from 0 to 255 instead of characters:

```
let num = port.readByte();                // returns a single byte, e.g. 72
let arr = port.readBytes(2);              // returns two bytes in an array, e.g. [ 72, 69 ]
let arr = port.readBytes();               // returns all bytes in an array, e.g. [ 72, 69, ..]
let arr = port.readBytesUntil(10);        // returns all bytes till value 10 in an array
let arr = port.readBytesUntil([13, 10]);  // returns all bytes till value 13 followed by 10
let num = port.lastByte();                // returns a single byte, e.g. 10
```

To find out how many characters (or bytes) are available to be read immediately:

```
let characters = port.available();        // how many characters
let bytes = port.availableBytes();        // how many bytes
```

#### Writing data

To send "HELLO" over the serial port:

```
port.write("HELLO");
```

To send the value 72 as a sequence of digits (the characters "7" and "2"): (you want to do this most of the time)

```
port.write(String(72));
```

To send a single byte with the value 72:

```
port.write(72);
```

To send a series of bytes:

```
port.write([72, 69, 76, 76, 79]);
```

#### Other

To check if the serial port is open:

```
if (port.opened()) {
  // the port is indeed open
}
```

To close the port:

```
port.close();
```

To clear everything in the input buffer:

```
port.clear();
```

To setting the DTR (Data Terminal Ready) or RTS (Request to Send) lines:

```
port.dtr(true); // or port.dtr(false)
port.rts(true); // or port.rts(false)
```

Resetting a connected Arduino Uno microcontroller e.g. works with:

```
port.dtr(false);
setTimeout(function() {
  port.dtr(true);
}, 200);
```

## Limitations

- WebSerial might not work on sites served over the insecure `http://` protocol, so try to use a server that uses `https://` instead. (Presently, localhost works fine over http on Chrome however.)
