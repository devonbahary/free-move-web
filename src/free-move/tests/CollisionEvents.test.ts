import { CircleBody } from "../Bodies";
import { CollisionEvents } from "../CollisionEvents";
import { World } from "../World";

describe('CollisionEvents', () => {
    describe('getCollisionEventsInChronologicalOrder', () => {
        let world: World;

        beforeEach(() => {
            world = new World({ width: 10, height: 10 });
        });

        it('should not return any collision events for two bodies that are not touching', () => {
            const circleA = new CircleBody();
            circleA.moveTo({ x: 1, y: 1 });
            
            const circleB = new CircleBody();
            circleB.moveTo({ x: 4, y: 4 });
            const bodies = [ circleA, circleB ];

            const collisionEvents = CollisionEvents.getCollisionEventsInChronologicalOrder(bodies, circleB);
            expect(collisionEvents).toHaveLength(0);
        });
    });
});