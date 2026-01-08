#include <Servo.h>

Servo servo;

void setup() {
  Serial.begin(57600);
  servo.attach(9);
}

void loop() {
  if (Serial.available() > 0) {
    String line = Serial.readStringUntil('\n');
    line.trim();  // get rid of unwanted characters
    if (line.length() > 0) {
      int value = line.toInt();
      if (value >= 0 && value <= 180) {
        servo.write(value);  // moves the servo motor
      }
    }
  }
}
