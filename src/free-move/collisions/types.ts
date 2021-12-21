import { BodyType, CircleBodyType, FixedBodyType, RectBodyType } from '@bodies/types';

export type CollisionPair = {
    movingBody: BodyType;
    collisionBody: BodyType;
};

export type FixedCollisionPair = {
    movingBody: BodyType;
    collisionBody: FixedBodyType;
};

export type CircleVsCircleCollisionPair = {
    movingBody: CircleBodyType;
    collisionBody: CircleBodyType;
};

export type CircleVsRectCollisionPair = {
    movingBody: CircleBodyType;
    collisionBody: RectBodyType;
};

export type RectVsCircleCollisionPair = {
    movingBody: RectBodyType;
    collisionBody: CircleBodyType;
};

export type RectVsRectCollisionPair = {
    movingBody: RectBodyType;
    collisionBody: RectBodyType;
};
