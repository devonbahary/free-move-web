export class CollisionEvent {
    constructor(movingBody, collisionBody, timeOfCollision, contact, collisionPoint) {
        this.movingBody = movingBody;
        this.collisionBody = collisionBody;
        this.timeOfCollision = timeOfCollision;
        this.contact = contact;
        this.collisionPoint = collisionPoint;
    }
}
