function sign(p1, p2, p3) {
  return ((p1.x - p3.x) * (p2.y - p3.y)) - ((p2.x - p3.x) * (p1.y - p3.y));
}

export class Vector2 {
  x;
  y;
  
  constructor(x = 0, y = 0) {
    this.x = x;
    this.y = y;
  }
  
  normalize() {
    var absX = Math.abs(this.x);
    var absY = Math.abs(this.y)
    if (absX > absY) return new Vector2(this.x, this.y / absX);
    else return new Vector2(this.x / absY, this.y);
  }
  
  add(vector) {
    return new Vector2(this.x + vector.x, this.y + vector.y);
  }
  
  subtract(vector) {
    return new Vector2(this.x - vector.x, this.y - vector.y);
  }
  
  dot(vector) {
    return (this.x * vector.x) + (this.y) * (vector.y);
  }
  
  inTriangle(t) {
    var b1 = sign(this, t.a, t.b) < 0.0;
    var b2 = sign(this, t.b, t.c) < 0.0;
    var b3 = sign(this, t.c, t.a) < 0.0;
    return ((b1 == b2) && (b2 == b3));
  }
  
  inRectangle(r) {
    var t = { a: r.a, b: r.b, c: r.c };
    var inT1 = this.inTriangle(t);
    t = { a: r.a, b: r.d, c: r.c };
    var inT2 = this.inTriangle(t);
    return (inT1 || inT2);
  }
  
  rotate(radians) {
    var newVector = new Vector2(
      (this.x * Math.cos(radians)) - (this.y * Math.sin(radians)),
      (this.y * Math.cos(radians)) + (this.x * Math.sin(radians)),
    );
    return newVector;
  }
  
  rotateSelf(radians) {
    var newVector = this.rotate(radians);
    this.x = newVector.x;
    this.y = newVector.y;
  }
}

export class Transform2D {
  position;
  rotation;
  
  constructor(position, rotation = 0) {
    if (position == null) position = new Vector2();
    this.position = position;
    this.rotation = rotation;
  }
}

// returns true if the line from a->b intersects with c->d
function intersects(a,b,c,d) {
  var det, gamma, lambda;
  det = (b.x - a.x) * (d.y - c.y) - (d.x - c.x) * (b.y - a.y);
  if (det === 0) {
    return false;
  } else {
    lambda = ((d.y - c.y) * (d.x - a.x) + (c.x - d.x) * (d.y - a.y)) / det;
    gamma = ((a.y - b.y) * (d.x - a.x) + (b.x - a.x) * (d.y - a.y)) / det;
    //console.log(a.add((new Vector2(lambda * b.x, lambda * b.y))));
    return (0 < lambda && lambda < 1) && (0 < gamma && gamma < 1);
  }
};

export class Rect2D extends Vector2 {
  width;
  height;
  
  constructor(x = 0, y = 0, width = 0, height = 0) {
    super(x, y);
    this.width = width;
    this.height = height;
  }
}

export class BoxCollider2D {
  transform;
  bounds;
  
  constructor(transform, bounds) {
    this.transform = transform;
    this.bounds = bounds;
  }
  
  checkBoxCollision(boxCollider) {
    var halfBoundsX = this.bounds.x + this.bounds.width;
    var halfBoundsY = this.bounds.y + this.bounds.height;
    var point1 = new Vector2(
      this.bounds.x + this.transform.position.x,
      this.bounds.y + this.transform.position.y,
    );
    var point2 = new Vector2(
      halfBoundsX + this.transform.position.x,
      this.bounds.y + this.transform.position.y,
    );
    var point3 = new Vector2(
      this.bounds.x + this.transform.position.x,
      halfBoundsY + this.transform.position.y,
    );
    var point4 = new Vector2(
      halfBoundsX + this.transform.position.x,
      halfBoundsY + this.transform.position.y,
    );
    var selfPoints = [point1, point2, point3, point4];
    var selfRect = { a: point1, b: point2, c: point3, d: point4 };
    var selfLines = [
      [point1, point2],
      [point1, point3],
      [point4, point2],
      [point4, point3],
    ];
    halfBoundsX = boxCollider.bounds.x + boxCollider.bounds.width;
    halfBoundsY = boxCollider.bounds.y + boxCollider.bounds.height;
    var rot = boxCollider.transform.rotation - this.transform.rotation;
    if (rot < 0) rot = (2 * Math.PI) + rot;
    point1 = new Vector2(boxCollider.bounds.x, boxCollider.bounds.y).rotate(rot);
    point2 = new Vector2(halfBoundsX, boxCollider.bounds.y).rotate(rot);
    point3 = new Vector2(boxCollider.bounds.x, halfBoundsY).rotate(rot);
    point4 = new Vector2(halfBoundsX, halfBoundsY).rotate(rot);
    point1.x += boxCollider.transform.position.x;
    point1.y += boxCollider.transform.position.y;
    point2.x += boxCollider.transform.position.x;
    point2.y += boxCollider.transform.position.y;
    point3.x += boxCollider.transform.position.x;
    point3.y += boxCollider.transform.position.y;
    point4.x += boxCollider.transform.position.x;
    point4.y += boxCollider.transform.position.y;
    var otherPoints = [point1, point2, point3, point4];
    var otherRect = { a: point1, b: point2, c: point3, d: point4 };
    for (let i = 0; i != 4; i++) if (selfPoints[i].inRectangle(otherRect)) return true;
    for (let i = 0; i != 4; i++) if (otherPoints[i].inRectangle(selfRect)) return true;
    var otherLines = [
      [point1, point2],
      [point1, point3],
      [point4, point2],
      [point4, point3],
    ];
    // Check line collision
    for (let i = 0; i != 4; i++) for (let j = 0; j != 4; j++) {
      var selfLine = selfLines[i];
      var otherLine = otherLines[j];
      if (intersects(selfLine[0], selfLine[1], otherLine[0], otherLine[1])) return true;
    }
    return false;
  }
}

