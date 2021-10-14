import { v4 as uuid } from 'uuid';
import { Vectors } from "../../utilities/Vectors";

// should be abstract -- cannot work with an object if we don't know if it's
// a circle or rectangle
export class Body {
    constructor() {
        this.id = uuid();
        this.x = 0;
        this.y = 0;

        this.velocity = Vectors.create(0, 0);        
        this.mass = 1;
        // TODO: implement restitution
        this.isElastic = true;

        // TODO: make this the responsibility of world.update?
        /*
            when somebody collides into me, we calculate new velocities.
            on my next update, don't reconsider that same collision body
            as a collision, rather take that new velocity and explore
            other collisions or move uninhibited
        */
        this.collisionPartner = null; 
    }

    static isCircle(body) {
        return body.hasOwnProperty('radius');
    }

    isMoving() {
        return Vectors.magnitude(this.velocity);
    }

    setVelocity(movementVector) {
        this.velocity = movementVector;
    }

    moveTo(x, y) {
        this.x = x;
        this.y = y;
    }

    applyForce(force) {
        this.velocity = Vectors.add(this.velocity, Vectors.divide(force, this.mass));
    }
}

export class RectangleBody extends Body {
    constructor(width, height) {
        super();
        this.width = width;
        this.height = height;
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
}

export class CircleBody extends Body {
    constructor(radius = 0.5) {
        super();
        this.radius = radius;
    }

    get center() {
        return { x: this.x + this.radius, y: this.y + this.radius };
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
}
