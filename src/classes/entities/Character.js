import { Collisions } from '../../utilities/Collisions';
import { Vectors } from '../../utilities/Vectors';
import { Element } from './Element';

const isCircle = (entity) => entity.hasOwnProperty('radius');
const DECELERATION_DUE_TO_FRICTION = 0.01;
// TODO: is this needed?
// const round = (val) => Math.round(val * 1000) / 1000;

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

    move(vector) {
        this.velocity = vector;
    }

    moveTo(x, y) {
        this.x = x;
        this.y = y;
    }

    setWorld(world) {
        this.world = world;
    }

    update() {
        this.applyFriction();
        this.updatePosition();
        this.updateElementPosition(this.x, this.y);
    }

    updatePosition() {
        if (!this.isMoving()) {
            return;
        }

        const movementBoundingBox = Collisions.getMovementBoundingBox(this);

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
                            
                            this.move(finalVelocity);
                            entity.move(entityFinalVelocity);
                        }
                        
                        return;
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
                        
                        return;
                    }
                }
            }
        }

        this.x = this.x + this.velocity.x;
        this.y = this.y + this.velocity.y;
    }

    applyFriction() {
        const magnitude = Vectors.magnitude(this.velocity);
        if (!magnitude) {
            return;
        }

        const adjustedMag = Math.max(0, magnitude - DECELERATION_DUE_TO_FRICTION);
        const newVelocity = Vectors.rescale(this.velocity, adjustedMag);
        this.move(newVelocity); 
    }
}