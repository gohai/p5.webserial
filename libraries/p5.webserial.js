/**
 * p5.webserial
 * (c) Gottfried Haider 2021
 * LGPL
 * https://github.com/gohai/p5.webserial
 */

p5.prototype.WebSerial = function() {
	if (!('serial' in navigator)) {
		throw 'Web Serial is not supported (try Chrome or Edge)';
	}

	let filters = [ {} ];
	let options = { baudRate: 9600 };

	const presets = {
		'Arduino': [                                        // from Arduino's board.txt files as of 9/13/21
			{ usbVendorId: 0x03eb, usbProductId: 0x2111 },  // Arduino M0 Pro (Atmel Corporation)
			{ usbVendorId: 0x03eb, usbProductId: 0x2157 },  // Arduino Zero (Atmel Corporation)
			{ usbVendorId: 0x10c4, usbProductId: 0xea70 },  // Arduino Tian (Silicon Laboratories)
			{ usbVendorId: 0x1b4f },                        // Spark Fun Electronics
			{ usbVendorId: 0x2341 },                        // Arduino SA
			{ usbVendorId: 0x239a },                        // Adafruit
			{ usbVendorId: 0x2a03 },                        // dog hunter AG
		],
		'MicroPython': [                                    // from mu-editor as of 9/13/21
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

	if (1 <= arguments.length) {
		if (typeof arguments[0] === 'object' && Array.isArray(arguments[0])) {
			filters = arguments[0];
		} else if (typeof arguments[0] === 'object') {
			filters = [ arguments[0] ];
		} else if (typeof arguments[0] === 'string') {
			let preset = arguments[0];
			if (preset in presets) {
				filters = presets[preset];
			} else {
				throw 'Unrecognized preset "' + preset + '", available: ' + Object.keys(presets).join(', ');
			}
		} else if (typeof arguments[0] === 'number') {
			options.baudRate = arguments[0];
		} else {
			throw 'Unexpected first argument "' + arguments[0] + '"';
		}
	}

	if (2 <= arguments.length) {
		if (typeof arguments[1] === 'object') {
			options = arguments[1];
		} else if (typeof arguments[1] === 'number') {
			options.baudRate = arguments[1];
		} else {
			throw 'Unexpected second argument "' + arguments[1] + '"';
		}
	}


	let port;
	let reader;
	let writer;
	let buffer = '';

	async function run() {
		port = await navigator.serial.requestPort({ filters: filters });
		await port.open(options);

		let encoder = new TextEncoderStream();
		encoder.readable.pipeTo(port.writable);
		writer = encoder.writable.getWriter();

		let decoder = new TextDecoderStream();
		port.readable.pipeTo(decoder.writable);
		reader = decoder.readable.getReader();

		while (true) {
			const { value, done } = await reader.read();
			if (done) {
				break;
			}
			buffer += value;

			if (10000000 < buffer.length) {
				console.log('Discarding 1 MB of unread serial data');
				buffer = buffer.substring(1000000);
			}
		}

		reader = null;
	};
	run();


	this.available = function() {
		return buffer.length;
	};
	this.read = function() {
		len = buffer.length;
		out = buffer.substring(0, len);
		buffer = buffer.substring(len);
		return out;
	};
	this.readUntil = function(needle) {
		for (let i=0; i < buffer.length; i++) {
			if (buffer[i] === needle) {
				out = buffer.substring(0, i+1);
				buffer = buffer.substring(i+1);
				return out;
			}
		}
		return '';
	};
	this.write = function(data) {
		if (writer) {
			writer.write(data);
		} else {
			console.warn('Serial port is not available, ignoring write');
		}
	};
};
