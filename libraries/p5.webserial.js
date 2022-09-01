/**
 * p5.webserial
 * (c) Gottfried Haider 2021-2022
 * LGPL
 * https://github.com/gohai/p5.webserial
 * Greatly inspired by https://web.dev/serial/
 */

'use strict';

(async function() {
  let ports = [];
  p5.prototype.usedSerialPorts = function() {
    return ports;
  }
  if ('serial' in navigator) {
    try {
      ports = await navigator.serial.getPorts();
    } catch (error) {
    }
  }
})();

// WebSerial()
// WebSerial( 9600 )
// WebSerial( 'Arduino' )
// WebSerial( usedPorts()[0] )
// WebSerial( 'Arduino', 9600 )

p5.prototype.WebSerial = class {
  constructor() {
    this.options     = { baudRate: 9600 };
    this.port        = null;
    this.reader      = null;
    this.keepReading = true;
    this.inBuffer    = new ArrayBuffer(1024 * 1024);  // 1M
    this.inLength    = 0;
    this.textEncoder = new TextEncoder();             // UTF-8
    this.textDecoder = new TextDecoder();             // UTF-8

    if (!('serial' in navigator)) {
      throw 'WebSerial is not supported in your browser (try Chrome or Edge)';
    }

    // XXX: there must be a cleaner way
    // XXX: then?
    (async function(webserial, args) {
      await webserial.selectPort(args);
      webserial.open();
    })(this, arguments);
  }

  available() {
    return this.inLength;
  }

  bufferSize(size) {
    if (size != this.inBuffer.byteLength) {
      const newBuffer = new ArrayBuffer(size);
      const length = Math.min(this.inLength, size);
      const src = new Uint8Array(this.inBuffer, this.inLength-length, length);
      const dst = new Uint8Array(this.newBuffer, 0, length);
      dst.set(src);
      this.inBuffer = newBuffer;
      this.inLength = length;
    }
  }

  bufferUntil(needle) {
    // TODO
  }

  clear() {
    this.inLength = 0;
  }

  close() {
    // signal the reader to stop looping
    if (this.reader) {
      this.keepReading = false;
      this.reader.cancel();
    } else {
      console.log('Serial port is already closed');
    }
  }

  forget() {
    if (this.port) {
      this.port.forget();
    }
  }

  last() {
    // XXX: how to properly deal with UTF-8 here?
    if (this.inLength) {
      const view = new Uint8Array(this.inBuffer, this.inLength-1, 1);
      this.inLength = 0;  // on Processing last() clears the buffer
      return this.textDecoder.decode(view);
    } else {
      return '';
    }
  }

  lastByte() {
    if (this.inLength) {
      const view = new Uint8Array(this.inBuffer, this.inLength-1, 1);
      this.inLength = 0;  // on Processing last() clears the buffer
      return view[0];
    } else {
      return null;
    }
  }

  opened() {
    return this.port && this.port.readable;
  }

  presets = {
    'Arduino': [                                      // from Arduino's board.txt files as of 9/13/21
      { usbVendorId: 0x03eb, usbProductId: 0x2111 },  // Arduino M0 Pro (Atmel Corporation)
      { usbVendorId: 0x03eb, usbProductId: 0x2157 },  // Arduino Zero (Atmel Corporation)
      { usbVendorId: 0x10c4, usbProductId: 0xea70 },  // Arduino Tian (Silicon Laboratories)
      { usbVendorId: 0x1b4f },                        // Spark Fun Electronics
      { usbVendorId: 0x2341 },                        // Arduino SA
      { usbVendorId: 0x239a },                        // Adafruit
      { usbVendorId: 0x2a03 },                        // dog hunter AG
    ],
    'MicroPython': [                                  // from mu-editor as of 9/13/21
      { usbVendorId: 0x0403, usbProductId: 0x6001 },  // M5Stack & FT232/FT245 (XinaBox CW01, CW02)
      { usbVendorId: 0x0403, usbProductId: 0x6010 },  // FT2232C/D/L/HL/Q (ESP-WROVER-KIT)
      { usbVendorId: 0x0403, usbProductId: 0x6011 },  // FT4232
      { usbVendorId: 0x0403, usbProductId: 0x6014 },  // FT232H
      { usbVendorId: 0x0403, usbProductId: 0x6015 },  // FT X-Series (Sparkfun ESP32)
      { usbVendorId: 0x0403, usbProductId: 0x601c },  // FT4222H
      { usbVendorId: 0x0d28, usbProductId: 0x0204 },  // BBC micro:bit
      { usbVendorId: 0x10c4, usbProductId: 0xea60 },  // CP210x
      { usbVendorId: 0x1a86, usbProductId: 0x7523 },  // HL-340
      { usbVendorId: 0xf055, usbProductId: 0x9800 },  // Pyboard
    ],
  };

  read(length) {
    // XXX: how to properly deal with UTF-8 here?
    const buffer = this.readArrayBuffer(length);

    if (buffer.length) {
      return this.textDecoder.decode(buffer);
    } else {
      return '';
    }
  }

  readUntil(needle) {
    // XXX: how to properly deal with UTF-8 here?
    const buffer = this.readArrayBufferUntil(needle);

    if (buffer.length) {
      return this.textDecoder.decode(buffer);
    } else {
      return '';
    }
  }

  readArrayBuffer(length = this.inLength) {
    if (this.inLength) {
      length = Math.min(length, this.inLength);
      const view = new Uint8Array(this.inBuffer, 0, length);
      const buffer = new Uint8Array(view);

      // shift in buffer
      if (length < this.inLength) {
        const src = new Uint8Array(this.inBuffer, length, this.inLength-length);
        const dst = new Uint8Array(this.inBuffer, 0, this.inLength-length);
        dst.set(src);
      }
      this.inLength -= length;

      return buffer;
    } else {
      return new Uint8Array([]);
    }
  }

  readArrayBufferUntil(needle) {
    const view = new Uint8Array(this.inBuffer);

    for (let i=0; i < view.length; i++) {
      if (view[i] === needle) {
        let src = new Uint8Array(this.inBuffer, 0, i+1);
        const buffer = new Uint8Array(src);

        // shift in buffer
        if (i+1 < view.length) {
          src = new Uint8Array(this.inBuffer, i+1, this.inLength-i-1);
          const dst = new Uint8Array(this.inBuffer, 0, this.inLength-i-1);
          dst.set(src);
        }
        this.inLength -= i+2;

        return buffer;
      }
    }

    return new Uint8Array([]);
  }

  readByte() {
    const buffer = this.readArrayBuffer(1);

    if (buffer.length) {
      return buffer[0];
    } else {
      return null;
    }
  }

  readBytes(length = this.inLength) {
    const buffer = this.readArrayBuffer(length);

    const bytes = [];
    for (let i=0; i < buffer.byteLength; i++) {
      bytes.push(buffer[i]);
    }
    return bytes;
  }

  readBytesUntil(needle) {
    const buffer = this.readArrayBufferUntil(needle);

    const bytes = [];
    for (let i=0; i < buffer.byteLength; i++) {
      bytes.push(buffer[i]);
    }
    return bytes;
  }

  async selectPort(args) {
    let filters = [{}];

    console.log(args);

    if (1 <= args.length) {
      if (Array.isArray(args[0])) {
        filters = args[0];
      } else if (args[0] instanceof SerialPort) {
        this.port = args[0];
        filters = null;
      } else if (typeof args[0] === 'object') {
        filters = [args[0]];
      } else if (typeof args[0] === 'string') {
        const preset = args[0];
        if (preset in this.presets) {
          filters = this.presets[preset];
        } else {
          throw 'Unrecognized preset "' + preset + '", available: ' + Object.keys(presets).join(', ');
        }
      } else if (typeof args[0] === 'number') {
        this.options.baudRate = args[0];
      } else {
        throw new TypeError('Unexpected first argument "' + args[0] + '"');
      }
    }

    if (2 <= args.length) {
      if (typeof args[1] === 'object') {
        this.options = args[1];
      } else if (typeof args[1] === 'number') {
        this.options.baudRate = args[1];
      } else {
        throw new TypeError('Unexpected second argument "' + args[1] + '"');
      }
    }

    try {
      if (filters) {
        this.port = await navigator.serial.requestPort({ filters: filters });
      } else {
        // nothing to do if we got passed a SerialPort instance
      }
    } catch (error) {
      console.error(error.message);
      this.port = null;
    }
  }

  stop() {
    this.close();
  }

  async write(out) {
    let buffer;

    // check argument
    if (typeof out === 'string') {
      buffer = this.textEncoder.encode(out);
    } else if (typeof out === 'number' && Number.isInteger(out)) {
      if (out < 0 || 255 < out) {
        throw new TypeError('Number needs to be between 0 and 255');
      }
      buffer = new Uint8Array([ out ]);
    } else if (Array.isArray(out)) {
      for (let i=0; i < out.length; i++) {
        if (typeof out[i] !== 'number' || Number.isInteger(out) ||
            out[i] < 0 || 255 < out[i]) {
              throw new TypeError('Array contained a value that wasn\'t an integer, our outside of 0 to 255');
        }
      }
      buffer = new Uint8Array(out);
    } else {
      throw new TypeError('Supported types for write are: string, integer number [0..255] or array of integer numbers [0..255]');
    }

    if (!this.port || !this.port.writable) {
      console.warn('Serial port is not open, ignoring write');
      return false;
    }

    const writer = this.port.writable.getWriter();
    await writer.write(buffer);  // XXX: await?
    writer.releaseLock();  // allow the serial port to be closed later
    return true;
  }

  async open() {
    if (!this.port) {
      console.error('No serial port selected');
      return false;
    }

    try {
      await this.port.open(this.options);
      console.log('Connected to serial port');
    } catch (error) {
      console.error(error);  // this might happen when the port is already open in another tab
      return false;
    }

    while (this.port.readable && this.keepReading) {
      this.reader = this.port.readable.getReader();

      try {
        while (true) {
          const { value, done } = await this.reader.read();

          if (done) {
            this.reader.releaseLock();  // allow the serial port to be closed later
            break;
          }

          if (value) {
            // XXX: shift by a chunk at once?
            // XXX: handle value length being larger than buffer length
            // XXX: use a ring buffer instead?

            // discard the oldest parts of the input buffer on overflow
            if (this.inBuffer.byteLength < this.inLength + value.length) {
              const src = new Uint8Array(this.inBuffer, this.inLength+value.length-this.inBuffer.byteLength, this.inBuffer.byteLength-value.length);
              const dst = new Uint8Array(this.inBuffer, 0, this.inBuffer.byteLength-value.length);
              dst.set(src);
              console.warn('Discarding the oldest ' + (this.inLength+value.length-this.inBuffer.byteLength) + ' bytes of Serial input data (you might want to read more frequently or increase the buffer via bufferSize())');
              this.inLength -= this.inLength+value.length-this.inBuffer.byteLength;
            }

            // copy to the input buffer
            const dst = new Uint8Array(this.inBuffer, this.inLength, value.length);
            dst.set(value);
            this.inLength += value.length;
            console.log(this.inLength);
          }
        }
      } catch (error) {
        // if a non-fatal (e.g. framing) error occurs, generate a new
        // Reader and continue
        this.reader.releaseLock();
        console.warn(error.message);
      }
    }

    this.reader = null;
    this.port.close();
    console.log('Disconnected from serial port');
  }
}
