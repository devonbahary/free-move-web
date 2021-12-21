import { RectSides } from '@bodies/types';
import {
    CircleVsCircleCollisionPair,
    CircleVsRectCollisionPair,
    CollisionPair,
    FixedCollisionPair,
    RectVsCircleCollisionPair,
    RectVsRectCollisionPair,
} from '@collisions/types';
import { Vector } from '@vectors/Vectors';

export type CollisionEvent = {
    collisionPair: CollisionPair;
    timeOfCollision: number;
    collisionPoint?: Vector;
    contact?: Partial<RectSides>;
};

export type FixedCollisionEvent = CollisionEvent & {
    collisionPair: FixedCollisionPair;
};

export type CircleVsCircleCollisionEvent = CollisionEvent & {
    collisionPair: CircleVsCircleCollisionPair;
};

export type CircleVsRectCollisionEvent = CollisionEvent & {
    collisionPair: CircleVsRectCollisionPair;
    collisionPoint: Vector;
};

export type RectVsCircleCollisionEvent = CollisionEvent & {
    collisionPair: RectVsCircleCollisionPair;
    collisionPoint: Vector;
};

export type RectVsRectCollisionEvent = CollisionEvent & {
    collisionPair: RectVsRectCollisionPair;
    contact: Partial<RectSides>;
};
