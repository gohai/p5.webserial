int lines = 0;
unsigned long lastSent = 0;

void setup() {
  Serial.begin(57600);
}

void loop() {
  if (Serial.available() > 0) {
    String input = Serial.readStringUntil('\n');
    if (input.length() > 0) {

      // this would be the place to parse, 
      // and act upon the message from the
      // computer

      lines++;
    }
  }

  unsigned long now = millis();
  if (now-lastSent > 2000) {
    Serial.print("Hello! I heard you ");
    Serial.print(lines);
    Serial.println(" times");
    lastSent = now;
  }
}
