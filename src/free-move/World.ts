import { Collisions } from "./Collisions";
import { RectBody } from "./Bodies";
import { CollisionEvents } from "./CollisionEvents";
import { BodyType, Rect, SaveableBodyState } from "./types";

type CollisionResolutionMem = {
    [bodyId: string]: string;
};

type SaveableWorldState = {
    bodies: SaveableBodyState[];
    collisionResolutionMem: CollisionResolutionMem;
};

const getCollisionResolutionMemId = (bodyA: BodyType, bodyB: BodyType) => {
    const { x: Ax, y: Ay, velocity: vA } = bodyA;
    const { id, x: Bx, y: By, velocity: vB } = bodyB;
    return `${Ax}-${Ay}-${vA.x}-${vA.y}-${id}-${Bx}-${By}-${vB.x}-${vB.y}`;
};

export class World {
    public width: number;
    public height: number;
    public bodies: BodyType[];
    private collisionResolutionMem: CollisionResolutionMem;

    constructor(bounds: Rect) {
        const { width, height } = bounds; 
        this.width = width;
        this.height = height;

        this.bodies = [];
        this.collisionResolutionMem = {}; 
        
        this.initBoundaries();
    }

    addBody(body: BodyType) {
        this.bodies.push(body);
    }

    update() {
        for (const body of this.bodies) {
            this.updateBody(body);
        }
    }

    getSaveableWorldState() {
        return {
            bodies: this.bodies.map(body => body.toSaveableState()),
            collisionResolutionMem: this.collisionResolutionMem,
        };
    }

    loadWorldState(saveableWorldState: SaveableWorldState) {
        const { bodies, collisionResolutionMem } = saveableWorldState;

        for (const saveableBody of bodies) {
            const { id, x, y, velocity } = saveableBody;
            
            const body = this.bodies.find(body => body.id === id);
            
            if (!body) throw new Error(`could not load body with id ${id}`);
            
            body.moveTo({ x, y });
            body.setVelocity(velocity);
        }
        
        this.collisionResolutionMem = collisionResolutionMem;
    }

    private initBoundaries() {
        const topBoundary = new RectBody(this.width, 0);
        topBoundary.moveTo({ x: 0, y: 0 });
        topBoundary.name = 'top boundary';

        const rightBoundary = new RectBody(0, this.height);
        rightBoundary.moveTo({ x: this.width, y: 0 });
        rightBoundary.name = 'right boundary';

        const bottomBoundary = new RectBody(this.width, 0);
        bottomBoundary.moveTo({ x: 0, y: this.height });
        bottomBoundary.name = 'bottom boundary';

        const leftBoundary = new RectBody(0, this.height);
        leftBoundary.moveTo({ x: 0, y: 0 });
        leftBoundary.name = 'left boundary';

        const boundaries = [topBoundary, rightBoundary, bottomBoundary, leftBoundary];
        
        for (const boundary of boundaries) {
            boundary.setFixed();
        }

        this.bodies.push(...boundaries);
    }    

    private updateBody(body: BodyType) {
        if (!body.isMoving()) return;

        const collisionEvents = CollisionEvents.getCollisionEventsInChronologicalOrder(this.bodies, body);

        if (!collisionEvents.length) {
            // no collisions; progress velocity
            const { x, y, velocity } = body;
            body.moveTo({ x: x + velocity.x, y: y + velocity.y });

            // because this body has moved, any new collision is inherently different and should
            // be processed
            this.forgetCollision(body);

            return;
        }

        for (const collisionEvent of collisionEvents) {
            // prevent resolving the same collision back-to-back (causes "stickiness" bug of infinite reversal)
            if (this.hasAlreadyProcessedCollision(body, collisionEvent.collisionBody)) continue;

            Collisions.resolveCollision(collisionEvent);
            this.rememberCollision(body, collisionEvent.collisionBody);

            return;
        }
    }

    private rememberCollision(bodyA: BodyType, bodyB: BodyType) {
        // both bodyA and bodyB are likely to encounter one another again after collision 
        // resolution; important that both remember they already processed collision
        this.collisionResolutionMem[bodyA.id] = getCollisionResolutionMemId(bodyA, bodyB);
        this.collisionResolutionMem[bodyB.id] = getCollisionResolutionMemId(bodyB, bodyA);
    }

    private hasAlreadyProcessedCollision(bodyA: BodyType, bodyB: BodyType) {
        return this.collisionResolutionMem[bodyA.id] === getCollisionResolutionMemId(bodyA, bodyB);
    }

    private forgetCollision(body: BodyType) {
        delete this.collisionResolutionMem[body.id];
    }
}
