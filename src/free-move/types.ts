import { BodyMixin, CircleBody, RectBody } from "./Bodies";

export type Vector = {
    x: number;
    y: number;
}

export type Bounds = {
    width: number;
    height: number;
}

export type RectType = Vector & Bounds;

export type CircleType = Vector & {
    radius: number;
}

export type SaveableBodyState = Vector & {
    id: string;
    velocity: Vector;
}

export type RectSides = {
    x0: number;
    x1: number;
    y0: number;
    y1: number;
}

export type BodyType = InstanceType<ReturnType<typeof BodyMixin>>;
export type CircleBodyType = InstanceType<typeof CircleBody>;
export type RectBodyType = InstanceType<typeof RectBody>;

export type FixedBodyType = BodyType & {
    isFixed: true;
}

export type CollisionPair = {
    movingBody: BodyType;
    collisionBody: BodyType;
}

type FixedCollisionPair = {
    movingBody: BodyType;
    collisionBody: FixedBodyType;
}

export type CircleVsCircleCollisionPair = {
    movingBody: CircleBodyType;
    collisionBody: CircleBodyType;
}

export type CircleVsRectCollisionPair = {
    movingBody: CircleBodyType;
    collisionBody: RectBodyType;
}

export type RectVsCircleCollisionPair = {
    movingBody: RectBodyType;
    collisionBody: CircleBodyType;
}

export type RectVsRectCollisionPair = {
    movingBody: RectBodyType;
    collisionBody: RectBodyType;
}

export type CollisionEvent = {
    collisionPair: CollisionPair;
    timeOfCollision: number;
    collisionPoint?: Vector;
    contact?: Partial<RectSides>;
}

export type FixedCollisionEvent = CollisionEvent & {
    collisionPair: FixedCollisionPair;
}

export type CircleVsCircleCollisionEvent = CollisionEvent & {
    collisionPair: CircleVsCircleCollisionPair;
}

export type CircleVsRectCollisionEvent = CollisionEvent & {
    collisionPair: CircleVsRectCollisionPair;
    collisionPoint: Vector;
}

export type RectVsCircleCollisionEvent = CollisionEvent & {
    collisionPair: RectVsCircleCollisionPair;
    collisionPoint: Vector;
}

export type RectVsRectCollisionEvent = CollisionEvent & {
    collisionPair: RectVsRectCollisionPair;
    contact: Partial<RectSides>;
}