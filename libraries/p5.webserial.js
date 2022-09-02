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
    // XXX: UTF-8
    return this.inLength;
  }

  availableBytes() {
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
    if (!this.inLength) {
      return '';
    }

    const view = new Uint8Array(this.inBuffer, 0, this.inLength);

    let startByteOffset = null;
    let byteLength = null;

    for (let i=view.length-1; 0 <= i; i--) {
      const byte = view[i];
      if (byte >> 7 == 0b0) {
        startByteOffset = i;
        byteLength = 1;
        break;
      } else if (byte >> 5 == 0b110 && i < view.length-1) {
        startByteOffset = i;
        byteLength = 2;
        break;
      } else if (byte >> 4 == 0b1110 && i < view.length-2) {
        startByteOffset = i;
        byteLength = 3;
        break;
      } else if (byte >> 3 == 0b11110 && i < view.length-3) {
        startByteOffset = i;
        byteLength = 4;
        break;
      }
    }

    if (startByteOffset !== null) {
      const view2 = new Uint8Array(this.inBuffer, startByteOffset, byteLength);
      const str = this.textDecoder.decode(view2);

      // shift in buffer
      if (startByteOffset+byteLength < this.inLength) {
        const src = new Uint8Array(this.inBuffer, startByteOffset+byteLength, this.inLength-byteLength-startByteOffset);
        const dst = new Uint8Array(this.inBuffer, 0, this.inLength-byteLength-startByteOffset);
        dst.set(src);
      }
      this.inLength -= startByteOffset+byteLength;

      return str;
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
    if (!this.inLength || length === 0) {
      return '';
    }

    const view = new Uint8Array(this.inBuffer, 0, this.inLength);

    // 0xxxxxxx
    // 110xxxxx 10xxxxxx
    // 1110xxxx 10xxxxxx 10xxxxxx
    // 11110xxx 10xxxxxx 10xxxxxx 10xxxxxx

    let codepointToConsume = 0;
    let startByteOffset = null;
    let byteLength = null;
    let charLength = 0;

    for (let i=0; i < view.length; i++) {
      const byte = view[i];
      //console.log('Byte', byte);

      let codepointStart;
      if (byte >> 7 == 0b0) {
        codepointStart = true;
        codepointToConsume = 0;
        //console.log('ASCII character');
      } else if (byte >> 5 == 0b110) {
        codepointStart = true;
        codepointToConsume = 1;
        //console.log('Begin 2-byte codepoint');
      } else if (byte >> 4 == 0b1110) {
        codepointStart = true;
        codepointToConsume = 2;
        //console.log('Begin 3-byte codepoint');
      } else if (byte >> 3 == 0b11110) {
        codepointStart = true;
        codepointToConsume = 3;
        //console.log('Begin 4-byte codepoint');
      } else {
        codepointStart = false;
        codepointToConsume--;
        //console.log('Continuation codepoint');
      }

      if (startByteOffset === null && codepointStart) {
        startByteOffset = i;
        //console.log('String starts at', i);
      }
      if (startByteOffset !== null && codepointToConsume <= 0) {
        charLength++;
        byteLength = i-startByteOffset+1;
        //console.log('Added character', charLength, 'characters', byteLength, 'bytes');
      }
      if (length <= charLength) {
        //console.log('Enough characters');
        break;
      }
    }

    if (startByteOffset !== null && byteLength !== null) {
      const view2 = new Uint8Array(this.inBuffer, startByteOffset, byteLength);
      const str = this.textDecoder.decode(view2);
      //console.log('String is', str);

      // shift in buffer
      if (startByteOffset+byteLength < this.inLength) {
        const src = new Uint8Array(this.inBuffer, startByteOffset+byteLength, this.inLength-byteLength-startByteOffset);
        const dst = new Uint8Array(this.inBuffer, 0, this.inLength-byteLength-startByteOffset);
        dst.set(src);
      }
      this.inLength -= startByteOffset+byteLength;

      return str;
    } else {
      return '';
    }
  }

  readUntil(needle) {
    let buffer = this.readArrayBufferUntil(needle);

    // trim leading invalid bytes, as does read()
    let i;
    for (i=0; i < buffer.length; i++) {
      const byte = buffer[i];
      if (byte >> 7 == 0b0) {
        break;
      } else if (byte >> 5 == 0b110) {
        break;
      } else if (byte >> 4 == 0b1110) {
        break;
      } else if (byte >> 3 == 0b11110) {
        break;
      }
    }
    if (0 < i) {
      const newBuffer = new ArrayBuffer(buffer.length-i);
      const src = new Uint8Array(buffer.buffer, i, buffer.length-i);
      const dst = new Uint8Array(newBuffer, 0, buffer.length-i);
      dst.set(src);
      buffer = dst;
    }

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
      const buffer = new Uint8Array(view);  // XXX: needs .buffer?

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
    // check argument
    if (typeof needle === 'string') {
      needle = this.textEncoder.encode(needle);
    } else if (typeof needle === 'number' && Number.isInteger(needle)) {
      if (needle < 0 || 255 < needle) {
        throw new TypeError('Argument needs to be between 0 and 255');
      }
      needle = new Uint8Array([ needle ]);
    } else if (Array.isArray(needle)) {
      for (let i=0; i < needle.length; i++) {
        if (typeof needle[i] !== 'number' || !Number.isInteger(needle) ||
            needle[i] < 0 || 255 < needle[i]) {
              throw new TypeError('Array contained a value that wasn\'t an integer, or outside of 0 to 255');
        }
      }
      needle = new Uint8Array(needle);
    } else if (needle instanceof Uint8Array) {
      // nothing to do
    } else {
      throw new TypeError('Supported types are: string, integer number [0..255], array of integer numbers [0..255], Uint8Array');
    }

    if (!needle.length) {
      return new Uint8Array([]);
    }

    const view = new Uint8Array(this.inBuffer, 0, this.inLength);

    let needleMatchLen = 0;

    for (let i=0; i < view.length; i++) {
      if (view[i] === needle[needleMatchLen]) {
        needleMatchLen++;
      } else {
        needleMatchLen = 0;
      }

      if (needleMatchLen == needle.length) {
        let src = new Uint8Array(this.inBuffer, 0, i+1);
        const buffer = new Uint8Array(src);  // XXX: needs .buffer?

        // shift in buffer
        if (i+1 < view.length) {
          src = new Uint8Array(this.inBuffer, i+1, this.inLength-i-1);
          const dst = new Uint8Array(this.inBuffer, 0, this.inLength-i-1);
          dst.set(src);
        }
        this.inLength -= i+1;

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
      // XXX: should this take a number even?
      if (out < 0 || 255 < out) {
        throw new TypeError('Argument needs to be between 0 and 255');
      }
      buffer = new Uint8Array([ out ]);
    } else if (Array.isArray(out)) {
      for (let i=0; i < out.length; i++) {
        if (typeof out[i] !== 'number' || !Number.isInteger(out) ||
            out[i] < 0 || 255 < out[i]) {
              throw new TypeError('Array contained a value that wasn\'t an integer, or outside of 0 to 255');
        }
      }
      buffer = new Uint8Array(out);
    } else if (out instanceof ArrayBuffer || ArrayBuffer.isView(out)) {
      buffer = out;
    } else {
      throw new TypeError('Supported types are: string, integer number [0..255], array of integer numbers [0..255], ArrayBuffer, TypedArray or DataView');
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
      console.error(error.message);  // this might happen when the port is already open in another tab
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
            // XXX: audit all memset
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
