import { Collisions } from '../../utilities/Collisions';
import { Vectors } from '../../utilities/Vectors';
import { Element } from './Element';

export class Character extends Element {
    constructor(radius = 0.5) {
        super();

        this.acceleration = Vectors.create(0, 0);
        
        this.radius = radius;
        
        this.element = Element.createCharacter();
        this.setElementDimensions(this.radius * 2, this.radius * 2);
    }

    get x0() {
        return this.x;
    }

    get center() {
        return { x: this.x + this.radius, y: this.y + this.radius };
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

    move(vector) {
        this.acceleration = vector;
    }

    moveTo(x, y) {
        this.x = x;
        this.y = y;
    }

    setWorld(world) {
        this.world = world;
    }

    update() {
        this.updatePosition();
        this.updateElementPosition(this.x, this.y);
    }

    updatePosition() {
        if (!Vectors.magnitude(this.acceleration)) {
            return;
        }

        this.x += this.acceleration.x;
        this.y += this.acceleration.y;

        for (const entity of this.world.collisionEntities) {
            if (entity === this) {
                continue;
            }
        
            if (entity.radius) { // for circles

            } else { // for rectangles
                const vectorToRect = Vectors.getClosestVectorToRectFromCircle(this, entity);
                const distanceToRectangle = Vectors.magnitude(vectorToRect);
                
                if (Collisions.isCircleCollidedWithRectangle(distanceToRectangle, this.radius)) {
                    Collisions.resolveCircleRectangleCollision(vectorToRect, this);
                }
            }

            // for lines? difference with rectangles?
        }
    }

}