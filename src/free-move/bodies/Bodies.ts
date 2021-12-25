import { v4 as uuid } from 'uuid';
import { Vector, Vectors } from '@vectors/Vectors';
import {
    BodyType,
    CircleBodyType,
    CircleType,
    FixedBodyType,
    RectBodyType,
    RectType,
    SaveableBodyState,
} from '@bodies/types';

type ShapeConstructor = new (...args: any[]) => Point;

export const BodyMixin = <T extends ShapeConstructor>(Shape: T) => {
    return class Body extends Shape {
        public id: string;
        public velocity: Vector;
        public mass: number;
        public elasticity: number;
        public name?: string;

        constructor(...args: any[]) {
            super(...args);

            this.id = uuid();
            this.velocity = Vectors.create();
            this.mass = 1;
            this.elasticity = 0.4;
        }

        static get MIN_SPEED() {
            return 0.01;
        }

        get isFixed() {
            return this.mass === Infinity;
        }

        setFixed() {
            this.mass = Infinity;
            this.velocity = Vectors.create(); // fixed bodies can't be moving bodies
        }

        isMoving() {
            return Vectors.magnitude(this.velocity) !== 0;
        }

        setVelocity(velocity: Vector) {
            if (this.isFixed && Vectors.magnitude(velocity)) {
                throw new Error(`cannot set velocity for fixed body`);
            }
            this.velocity = velocity;
        }

        applyForce(force: Vector) {
            if (this.isFixed) return; // fixed bodies can be subject to forces, even if nothing happens
            this.velocity = Vectors.add(this.velocity, Vectors.divide(force, this.mass));
        }

        applyFriction() {
            if (!this.isMoving()) return;

            const { x, y } = this.velocity;

            const newX = x * 0.9;
            const newY = y * 0.9;

            this.setVelocity({
                x: Math.abs(newX) >= Body.MIN_SPEED ? newX : 0,
                y: Math.abs(newY) >= Body.MIN_SPEED ? newY : 0,
            });
        }

        toSaveableState(): SaveableBodyState {
            const { id, x, y, velocity } = this;
            return {
                id,
                x,
                y,
                velocity: { ...velocity },
            };
        }
    };
};

export class Point implements Vector {
    constructor(public x = 0, public y = 0) {}

    get center(): Vector {
        return Vectors.create(this.x, this.y);
    }

    get x0() {
        return this.x;
    }

    get x1() {
        return this.x;
    }

    get y0() {
        return this.y;
    }

    get y1() {
        return this.y;
    }

    get pos() {
        return Vectors.create(this.x, this.y);
    }

    moveTo({ x, y }: Vector) {
        this.x = x;
        this.y = y;
    }
}

export class Rect extends Point implements RectType {
    constructor(public width = 1, public height = 1) {
        super();
    }

    get center(): Vector {
        return Vectors.create(this.x + this.width / 2, this.y + this.height / 2);
    }

    get x0() {
        return this.x;
    }

    get x1() {
        return this.x + this.width;
    }

    get y0() {
        return this.y;
    }

    get y1() {
        return this.y + this.height;
    }
}

export class Circle extends Point implements CircleType {
    constructor(public radius = 0.5) {
        super();
    }

    get center(): Vector {
        return Vectors.create(this.x + this.radius, this.y + this.radius);
    }

    get x0() {
        return this.x;
    }

    get x1() {
        return this.x + this.radius * 2;
    }

    get y0() {
        return this.y;
    }

    get y1() {
        return this.y + this.radius * 2;
    }
}

export const RectBody = BodyMixin(Rect);

export const isRectBody = (body: any): body is RectBodyType => {
    return body.width !== undefined && body.height !== undefined;
};

export const CircleBody = BodyMixin(Circle);

export const isCircleBody = (body: any): body is CircleBodyType => {
    return body.radius !== undefined;
};

export const isFixedBody = (body: BodyType): body is FixedBodyType => {
    return body.isFixed === true;
};
