# p5.webserial.js

A library for p5.js which adds support for interacting with Serial devices, using the Web Serial API (currently supported on Chrome and Edge). It provides the following features:

* Easy to use API, largely the same as Processing's [Serial library](https://processing.org/reference/libraries/serial/index.html)
* No `async/await` or callbacks needed in sketches
* Can automatically connect to previously-used serial ports (great for installations)
* Unicode support (`Serial.print("你好"")` in Arduino work)
* Multi-byte matching in `readUntil(needle)`
* Well tested, also works in the p5.js web editor

## Reference

- [Usage]()
- [API Reference]()
- [Examples](examples/)

## Usage

Download the [library file](https://github.com/gohai/p5.webserial/blob/main/libraries/p5.webserial.js) and include it in the `head` section of your HTML below the line that loads `p5.js` - or simply include the online version at the same place.

```
<script src="https://unpkg.com/@gohai/p5.webserial/libraries/p5.webserial.js"></script>

```
or
```
<script src="p5.webserial.js"></script>
```

### Opening ports

Prompts the user to select a serial port (at 9600 baud):

```
let port = createSerial(9600);
```

This will only show Arduino boards (and compatible) in the dialog: (Other presets are `MicroPython`, `RaspberryPi`, `Adafruit`.)

```
let port = createSerial('Arduino', 9600);
```

If the user has previously selected a serial port on a page, you can automatically connect to it on future page loads without user interaction like so:

```
let port;
let usedPorts = usedSerialPorts();
if (usedPorts > 0) {
  port = createSerial(usedPorts[0], 9600);
}
```

Most browsers will only show the dialog to select a port as a result of user input (see this example).

### Reading data

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

This returns the most reccently returned character, discarding all previously received ones as well:

```
let str = port.last();
```

These methods allow you to receive (raw) bytes as values from 0 to 255 instead of characters:

```
let num = port.readByte();                // returns a single byte, e.g. 72
let arr = port.readBytes(2);              // returns two bytes in an array, e.g. [ 72, 69 ]
let arr = port.readBytes();               // returns all bytes in an array, e.g. [ 72, 69, ..]
let arr = port.readBytesUntil(10);        // returns all bytes till value 10 in an array
let arr = port.readBytesUntil([13, 10]);  // returns all bytes till value 13 followed by 10 in an array
let num = port.lastByte();                // returns a single byte, e.g. 10
```

To find out how many characters (or bytes) are available to be read immediately:

```
let characters = port.available();        // how many characters
let bytes = port.availableBytes();        // how many bytes
```

### Writing data

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

### Other

To check if the serial port is open:

```
if (port.opened()) {
  // the port is open and can be read and written to
}
```

To close the port:

```
port.stop();
```

To clear everything in the input buffer:

```
port.clear();

```

## Limitations
