# p5.webserial.js

A library for p5.js which adds support for interacting with Serial devices, using the Web Serial API (currently supported on Chrome and Edge).

Download the library file [here](https://github.com/gohai/p5.webserial/blob/main/libraries/p5.webserial.js) or simply embed this script tag:
```
<script src="https://raw.githubusercontent.com/gohai/p5.webserial/main/libraries/p5.webserial.js"></script>
```


## Usage

### Opening a port

```
let port = new WebSerial(baudRate)
let port = new WebSerial('Arduino', baudRate)
let port = new WebSerial('MicroPython', baudRate)
```

The constructor prompts the user to select a serial port for communication. Browsers allow showing this dialog only after user input, so add this code e.g. to `mouseClicked()`.

If the first argument is the string "Arduino" or "MicroPython", the dialog will only list ports associated with the USB Vendor- and Product IDs of Arduino and various MicroPython boards respectively.


### Writing data

```
port.write('Hello from the computer');
```

If the port is not yet available, you'll a notification in the console.


### Finding out how many bytes are available for reading

```
print(port.available() + ' bytes received');
```

avilable returns the number of bytes available for reading.


### Reading data

```
let in = port.read();
if (in.length > 0) {
	print('Received: ' + in);
}
```

read returns the received data as a string. This function returns an empty string if no data has been received.


### Reading data up to a special character

```
let in = port.readUntil("\n");
if (in.length > 0) {
	print('Received: ' + in.trim());
}
```

readUntil returns all received data up to (and including) the provided character. This function returns empty string if the character to look for is not found.
