import { Collisions } from '../../utilities/Collisions';
import { Vectors } from '../../utilities/Vectors';
import { Element } from './Element';

const isCircle = (entity) => entity.hasOwnProperty('radius');

export class Character extends Element {
    constructor() {
        super();

        this.velocity = Vectors.create(0, 0);
        
        this.radius = 0.5;
        this.mass = 1;
        this.isElastic = true;
        
        this.element = Element.createCharacter();
        this.setElementDimensions(this.radius * 2, this.radius * 2);
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

    setWorld(world) {
        this.world = world;
    }

    update() {
        super.update();
        this.updatePosition();
    }

    applyForce(force) {
        this.velocity = Vectors.add(this.velocity, Vectors.divide(force, this.mass));
    }

    updatePosition() {
        if (!this.isMoving()) {
            return;
        }

        const movementBoundingBox = Collisions.getMovementBoundingBox(this);

        let wasCollision = false;

        // TODO: what if multiple collisions possible in movement and should react to closest?
        for (const entity of this.world.collisionEntities) {
            if (entity === this) {
                continue;
            }

            if (isCircle(entity)) {
                const vectorToRect = Vectors.getClosestVectorToRectFromCircle(entity, movementBoundingBox);
                const distanceToRectangle = Vectors.magnitude(vectorToRect);
                
                if (Collisions.isCircleCollidedWithRectangle(distanceToRectangle, this.radius)) {
                    const timeOfCollision = Collisions.getTimeOfCircleOnCircleCollision(this, entity);

                    if (timeOfCollision !== null) {
                        this.x = this.x + this.velocity.x * timeOfCollision;
                        this.y = this.y + this.velocity.y * timeOfCollision;

                        if (this.isElastic && entity.isElastic) {
                            const [
                                finalVelocity,
                                entityFinalVelocity,
                            ] = Collisions.resolveElasticCircleOnCircleCollision(this, entity);
                            
                            this.move(getFinalVelocityOvercomingFriction(finalVelocity));
                            entity.move(getFinalVelocityOvercomingFriction(entityFinalVelocity));
                        }

                        wasCollision = true;
                        continue;
                    }
                    
                }
            } else { // isRectangle
                if (Collisions.areRectanglesColliding(movementBoundingBox, entity)) {
                    const timeOfCollision = Collisions.getTimeOfCircleOnRectangleCollision(this, entity);

                    if (timeOfCollision !== null) {
                        this.x = this.x + this.velocity.x * timeOfCollision;
                        this.y = this.y + this.velocity.y * timeOfCollision;

                        if (this.isElastic) { // assume all rectangles are inelastic
                            Collisions.resolveElasticCircleOnInelasticRectangleCollision(this, entity);
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