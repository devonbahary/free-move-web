import { v4 as uuid } from 'uuid';
import { Vectors } from "../../utilities/Vectors";

// should be abstract -- cannot work with an object if we don't know if it's
// a circle or rectangle
const BodyMixin = superclass => class extends superclass {
    constructor(...args) {
        super(...args);
        
        this.id = uuid();
        this.velocity = Vectors.create(0, 0);        
        this.mass = 1;
        // TODO: implement restitution
        this.isElastic = true;
    }

    isMoving() {
        return Vectors.magnitude(this.velocity);
    }

    setVelocity(movementVector) {
        this.velocity = movementVector;
    }

    applyForce(force) {
        this.velocity = Vectors.add(this.velocity, Vectors.divide(force, this.mass));
    }

    toSaveableState() {
        const { id, x, y, velocity } = this;
        return {
            id,
            x,
            y,
            velocity: { ...velocity },
        };
    }
}

class Point {
    constructor() {
        this.x = 0;
        this.y = 0;
    }

    moveTo(x, y) {
        this.x = x;
        this.y = y;
    }
}

export class Rectangle extends Point {
    constructor(width, height) {
        super();
        this.width = width;
        this.height = height;
    }

    get center() {
        return { 
            x: this.x + this.width / 2, 
            y: this.y + this.height / 2,
        };
    }

    get x0() {
        return this.x;
    }

    get x1() {
        return this.x + this.width;
    }

    get y0() {
        return this.y;
    }

    get y1() {
        return this.y + this.height;
    }
};

export class Circle extends Point {
    constructor(radius = 0.5) {
        super();
        this.radius = radius;
    }

    get center() {
        return { 
            x: this.x + this.radius, 
            y: this.y + this.radius,
        };
    }

    get x0() {
        return this.x;
    }

    get x1() {
        return this.x + this.radius * 2;
    }

    get y0() {
        return this.y;
    }

    get y1() {
        return this.y + this.radius * 2;
    }
};

export class RectangleBody extends BodyMixin(Rectangle) {}

export class CircleBody extends BodyMixin(Circle) {}
