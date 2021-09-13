class TextMover {
  constructor(str, isInput) {
    this.str = str;
    if (isInput) {
      this.x = width;
      this.y = 0.4 * height;
      this.speedX = -1;
      this.color = '#ff5f49';
    } else {
      this.x = 0;
      this.y = 0.6 * height;
      this.speedX = 1;
      this.color = '#54cea3';
    }
  }

  move() {
    this.x += this.speedX * random(0.8, 1.2);
  }

  display() {
    fill(this.color);
    text(this.str, this.x, this.y);
  }
}
