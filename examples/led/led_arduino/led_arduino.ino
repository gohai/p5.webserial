#define LED_PIN 9 // change to 13 if you are using the on-board LED

void setup() {
  Serial.begin(57600);
  pinMode(LED_PIN, OUTPUT);
}

void loop() {
  if (Serial.available() > 0) {
    String line = Serial.readStringUntil('\n');
    line.trim();  // get rid of unwanted characters
		if (line == "1") {
	    digitalWrite(LED_PIN, HIGH); // turns LED on
    } else if (line == "0") {
      digitalWrite(LED_PIN, LOW);  // turns LED off
    }
  }
}
