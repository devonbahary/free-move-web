import { BodyMixin, CircleBody, RectBody } from "./Bodies";

export type Vector = {
    x: number;
    y: number;
}

export type Bounds = {
    width: number;
    height: number;
}

export type Rect = Vector & Bounds;

export type Circle = Vector & {
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

export type CollisionEvent = {
    movingBody: BodyType;
    collisionBody: BodyType;
    timeOfCollision: number;
    collisionPoint?: Vector;
    contact?: Partial<RectSides>;
}

export type CircleVsRectCollisionEvent = CollisionEvent & {
    movingBody: CircleBodyType;
    collisionBody: RectBodyType;
    collisionPoint: Vector;
}

export type RectVsCircleCollisionEvent = CollisionEvent & {
    movingBody: RectBodyType;
    collisionBody: CircleBodyType;
    collisionPoint: Vector;
}

export type RectVsRectCollisionEvent = CollisionEvent & {
    movingBody: RectBodyType;
    collisionBody: RectBodyType;
    contact: Partial<RectSides>;
}