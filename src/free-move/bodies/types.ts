import { Vector } from '@vectors/Vectors';
import { BodyMixin, CircleBody, RectBody } from '@bodies/Bodies';

export type Bounds = {
    width: number;
    height: number;
};

export type RectType = Vector & Bounds;

export type CircleType = Vector & {
    radius: number;
};

export type SaveableBodyState = Vector & {
    id: string;
    velocity: Vector;
};

export type RectSides = {
    x0: number;
    x1: number;
    y0: number;
    y1: number;
};

export type BodyType = InstanceType<ReturnType<typeof BodyMixin>>;
export type CircleBodyType = InstanceType<typeof CircleBody>;
export type RectBodyType = InstanceType<typeof RectBody>;

export type FixedBodyType = BodyType & {
    isFixed: true;
};
