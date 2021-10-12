import { Collisions } from "../../utilities/Collisions";
import { Vectors } from "../../utilities/Vectors";

const isCircle = (body) => body.hasOwnProperty('radius');

// abstract for now
export class Body {
    constructor() {
        this.velocity = Vectors.create(0, 0);        
        this.mass = 1;
        // TODO: implement restitution
        this.isElastic = true;
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

    isMoving() {
        return Vectors.magnitude(this.velocity);
    }

    move(movementVector) {
        const diffVelocity = Vectors.subtract(movementVector, this.velocity);
        this.applyForce(Vectors.mult(diffVelocity, this.mass));
    }

    moveTo(x, y) {
        this.x = x;
        this.y = y;
    }

    applyForce(force) {
        this.velocity = Vectors.add(this.velocity, Vectors.divide(force, this.mass));
    }
}

export class CircleBody extends Body {
    constructor() {
        super();
        this.radius = 0.5;
    }

    get center() {
        return { x: this.x + this.radius, y: this.y + this.radius };
    }

    update(world) {
        this.updatePosition(world);
    }

    updatePosition(world) {
        if (!this.isMoving()) {
            return;
        }

        const movePartiallyTowardsVelocity = (timeOfCollision) => {
            const dx = this.velocity.x * timeOfCollision;
            const dy = this.velocity.y * timeOfCollision;
            this.moveTo(this.x + dx, this.y + dy);
        };

        const movementBoundingBox = Collisions.getMovementBoundingBox(this);

        let wasCollision = false;

        // TODO: what if multiple collisions possible in movement and should react to closest?
        for (const body of world.bodies) {
            if (body === this) {
                continue;
            }

            if (isCircle(body)) {
                const vectorToRect = Vectors.getClosestVectorToRectFromCircle(body, movementBoundingBox);
                const distanceToRectangle = Vectors.magnitude(vectorToRect);
                
                if (Collisions.isCircleCollidedWithRectangle(distanceToRectangle, this.radius)) {
                    const timeOfCollision = Collisions.getTimeOfCircleOnCircleCollision(this, body);

                    if (timeOfCollision !== null) {
                        movePartiallyTowardsVelocity(timeOfCollision);

                        if (this.isElastic && body.isElastic) {
                            const [
                                finalVelocity,
                                bodyFinalVelocity,
                            ] = Collisions.resolveElasticCircleOnCircleCollision(this, body);

                            this.move(finalVelocity);
                            body.move(bodyFinalVelocity);
                        }

                        wasCollision = true;
                        continue;
                    }
                    
                }
            } else { // isRectangle
                if (Collisions.areRectanglesColliding(movementBoundingBox, body)) {
                    const timeOfCollision = Collisions.getTimeOfCircleOnRectangleCollision(this, body);

                    if (timeOfCollision !== null) {
                        movePartiallyTowardsVelocity(timeOfCollision);

                        if (this.isElastic) { // assume all rectangles are inelastic
                            const newVector = Collisions.resolveElasticCircleOnInelasticRectangleCollision(this, body);
                            this.move(newVector);
                        }
                        
                        wasCollision = true;
                        continue;
                    }
                }
            }
        }
        
        if (!wasCollision) {
            this.x = this.x + this.velocity.x;
            this.y = this.y + this.velocity.y;
        }
    }
}