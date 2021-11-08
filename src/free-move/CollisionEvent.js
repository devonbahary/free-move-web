export class CircleVsCircleCollisionEvent {
    constructor({ movingBody, collisionBody, timeOfCollision }) {
        this.movingBody = movingBody;
        this.collisionBody = collisionBody;
        this.timeOfCollision = timeOfCollision;
    }
};

export class CircleVsRectangleCollisionEvent extends CircleVsCircleCollisionEvent {
    constructor({ collisionPoint, ...rest }) {
        super(rest);
        this.collisionPoint = collisionPoint;
    }
};

export class RectangleVsRectangleCollisionEvent extends CircleVsCircleCollisionEvent {
    constructor({ contact, ...rest }) {
        super(rest);
        this.contact = contact;
    }
};
