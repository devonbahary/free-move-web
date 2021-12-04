import { CollisionEvents } from "../CollisionEvents";
import { Maths } from "../Maths";
import { BodyType, CollisionEvent, CollisionPair, Vector } from "../types";
import { Vectors } from "../Vectors";
import {
    CollisionType,
    Direction,
    TestUtils,
} from "./TestUtils";

type TestVariationBodySizePair = {
    movingBodySize: number;
    collisionBodySize: number;
}

type TestVariation = TestVariationBodySizePair & {
    collisionType: CollisionType;
    direction: Direction;
}

const SHOULD = 'should return a collision event';
const SHOULD_NOT = 'should NOT return any collision event';
const TEST_SIZES = [0.5, 1, 4];

const COLLISION_PAIR_TEST_SIZES = TEST_SIZES.reduce<TestVariationBodySizePair[]>((acc, testSize) => {
    acc.push(...TEST_SIZES.reduce<TestVariationBodySizePair[]>((acc, otherTestSize) => {
        acc.push({
            movingBodySize: testSize,
            collisionBodySize: otherTestSize,
        });
        return acc;
    }, []));
    return acc;
}, []);

const TEST_VARIATIONS = Object.values(Direction).reduce<TestVariation[]>((acc, dir) => {
    acc.push(...Object.values(CollisionType).reduce<TestVariation[]>((acc, collisionType) => {
        acc.push(...COLLISION_PAIR_TEST_SIZES.reduce<TestVariation[]>((acc, collisionPairTestSize) => {
            acc.push({
                ...collisionPairTestSize,
                collisionType,
                direction: dir,
            });
            return acc;
        }, []));
        return acc;
    }, []));
    return acc;
}, []);

const expectZeroTimeOfCollision = (collisionEvent: CollisionEvent) => {
    expect(Maths.roundFloatingPoint(collisionEvent.timeOfCollision) === 0).toBe(true);
};


describe('CollisionEvents', () => {
    describe('getCollisionEventsInChronologicalOrder()', () => {
        let getCollisionEventsInChronologicalOrder: () => ReturnType<typeof CollisionEvents['getCollisionEventsInChronologicalOrder']>;
                
        const expectNoCollisionEvents = () => {
            const collisionEvents = getCollisionEventsInChronologicalOrder();
            expect(collisionEvents).toHaveLength(0);
        }

        for (const testVariation of TEST_VARIATIONS) {
            const { collisionType, direction, movingBodySize, collisionBodySize } = testVariation;

            describe(`${collisionType} (${movingBodySize} -> ${direction} -> ${collisionBodySize})`, () => {
                let collisionPair: CollisionPair;
                let movingBody: BodyType;
                let collisionBody: BodyType;
                let getDiffPos: () => Vector;
                let expectCollisionEvent: (collisionEvent: CollisionEvent) => void;
                
                beforeEach(() => {
                    collisionPair = TestUtils.initCollisionPair(collisionType, movingBodySize, collisionBodySize);
                    ({ movingBody, collisionBody } = collisionPair);

                    const bodies = [ movingBody, collisionBody ];
                    
                    getCollisionEventsInChronologicalOrder = () => CollisionEvents.getCollisionEventsInChronologicalOrder(bodies, movingBody);
                    
                    getDiffPos = () => Vectors.subtract(collisionBody.center, movingBody.center);

                    expectCollisionEvent = (collisionEvent: CollisionEvent) => {
                        expect(collisionEvent).toMatchObject({ collisionPair });
                    }
                });
    
                describe('invalid collision events', () => {
                    it(`${SHOULD_NOT} for two bodies that are not touching or moving`, () => {
                        TestUtils.moveBodiesApartFromEachOther(collisionPair, direction);
                        expectNoCollisionEvents();
                    });
            
                    it(`${SHOULD_NOT} for two bodies that are touching but not moving`, () => {
                        TestUtils.moveBodiesAdjacentToEachOther(collisionPair, direction);
                        expectNoCollisionEvents();
                    });
    
                    it(`${SHOULD_NOT} when one body is moving away from another body it is touching`, () => {
                        TestUtils.moveBodiesAdjacentToEachOther(collisionPair, direction);
                        TestUtils.moveBodyAwayFromBody(collisionPair);
                        expectNoCollisionEvents();
                    });
    
                    it(`${SHOULD_NOT} when one body is moving away from another body it isn't touching`, () => {
                        TestUtils.moveBodiesApartFromEachOther(collisionPair, direction);
                        TestUtils.moveBodyAwayFromBody(collisionPair);
                        expectNoCollisionEvents();
                    });
                });
    
                describe('intersecting bodies (allow for movement out of another body)', () => {
                    beforeEach(() => {
                        TestUtils.moveBodiesIntoEachOther(collisionPair, direction);
                    });
                    
                    it.skip(`${SHOULD_NOT} when one body is moving towards another body that the moving body is already intersecting`, () => {
                        TestUtils.moveBodyTowardsBody(collisionPair);
                        expectNoCollisionEvents();
                    });
    
                    it(`${SHOULD_NOT} when one body is moving away from another body that the moving body is already intersecting`, () => {
                        TestUtils.moveBodyAwayFromBody(collisionPair);
                        expectNoCollisionEvents();
                    });
                });
    
                describe('continous collision detection', () => {
                    it(`${SHOULD} when one body is moving towards another body it is already touching`, () => {
                        TestUtils.moveBodiesAdjacentToEachOther(collisionPair, direction);
                        TestUtils.moveBodyTowardsBody(collisionPair);
            
                        const [ collisionEvent ] = getCollisionEventsInChronologicalOrder();
                        
                        expectCollisionEvent(collisionEvent);
                        expectZeroTimeOfCollision(collisionEvent);
                    });
    
                    it(`${SHOULD} when one body is moving towards another body with a movement path that would end within the other body`, () => {
                        TestUtils.moveBodiesApartFromEachOther(collisionPair, direction);
    
                        const diffPos = getDiffPos();
                        movingBody.setVelocity(diffPos);
    
                        const [ collisionEvent ] = getCollisionEventsInChronologicalOrder();
                        
                        expectCollisionEvent(collisionEvent);
                        expect(collisionEvent.timeOfCollision).toBeGreaterThan(0);
                        expect(collisionEvent.timeOfCollision).toBeLessThanOrEqual(1);
                    });
    
                    it(`${SHOULD} when one body is moving towards another body with a movement path that passes all the way through the other body (prevent tunneling)`, () => {
                        TestUtils.moveBodiesApartFromEachOther(collisionPair, direction);
    
                        const diffPos = getDiffPos();
                        const twiceDiffPos = Vectors.rescale(diffPos, Vectors.magnitude(diffPos) * 2);
                        movingBody.setVelocity(twiceDiffPos);
    
                        const [ collisionEvent ] = getCollisionEventsInChronologicalOrder();
                        
                        expectCollisionEvent(collisionEvent);
                        expect(collisionEvent.timeOfCollision).toBeGreaterThan(0);
                        expect(collisionEvent.timeOfCollision).toBeLessThanOrEqual(1);
                    });
        
                    it(`${SHOULD_NOT} when one body is moving towards another body that is beyond the reach of the movement path (don't return future events)`, () => {
                        TestUtils.moveBodiesApartFromEachOther(collisionPair, direction);
    
                        const diffPos = getDiffPos();
                        movingBody.setVelocity(Vectors.rescale(diffPos, 0.5));
    
                        expectNoCollisionEvents();
                    });
                });
    
                describe("tangential movement (don't recognize collision events for grazing bodies)", () => {
                    beforeEach(() => {
                        TestUtils.moveBodiesAdjacentToEachOther(collisionPair, direction);
                    });

                    it(`${SHOULD_NOT} when a body moves tangentially to another body`, () => {
                        const tangentialVectors = TestUtils.getTangentialMovementVectors(collisionPair, direction, getDiffPos);
                        
                        for (const tangent of tangentialVectors) {
                            movingBody.setVelocity(tangent);
                            expectNoCollisionEvents();
                        }

                    });
                });
            });   
        }

    });
});