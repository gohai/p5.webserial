void setup() {
  Serial.begin(57600);
}

void loop() {
  int val = analogRead(A0);
  Serial.println(val);
  // make sure to wait at least 20 ms,
  // to not overwhelm p5 running at 60 fps
  delay(100);
}
