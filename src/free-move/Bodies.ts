import { v4 as uuid } from 'uuid';
import { Vectors } from "./Vectors";
import { Circle as CircleType, CircleBodyType, Rect, RectBodyType, SaveableBodyState, Vector } from './types';

type ShapeConstructor = new (...args: any[]) => Point;

export const BodyMixin = <T extends ShapeConstructor>(Shape: T) => {
    return class Body extends Shape {
        public id: string;
        public velocity: Vector;
        public mass: number;
        public isElastic: boolean;
        public name?: string;
        
        constructor(...args: any[]) {
            super(...args);
            
            this.id = uuid();
            this.velocity = Vectors.create(0, 0);        
            this.mass = 1;
            // TODO: implement restitution
            this.isElastic = true;
        }

        get isFixed() {
            return this.mass === Infinity;
        }
    
        setFixed() {
            this.mass = Infinity;
        }
    
        isMoving() {
            return Vectors.magnitude(this.velocity) !== 0;
        }
    
        setVelocity(velocity: Vector) {
            if (this.isFixed && Vectors.magnitude(velocity)) {
                throw new Error(`cannot set velocity for infinite-mass body`);
            }
            this.velocity = velocity;
        }
    
        applyForce(force: Vector) {
            if (this.isFixed) return; // infinite-mass bodies can be subject to forces, even if nothing happens
            this.velocity = Vectors.add(this.velocity, Vectors.divide(force, this.mass));
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
    }
}

export class Point implements Vector {
    constructor(
        public x = 0,
        public y = 0, 
    ) {}

    get center(): Vector {
        return { x: this.x, y: this.y };
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

    moveTo({ x, y }: Vector) {
        this.x = x;
        this.y = y;
    }
}

export class Rectangle extends Point implements Rect {
    constructor(
        public width = 1,
        public height = 1,
    ) {
        super();
    }

    get center(): Vector {
        return { 
            x: this.x + this.width / 2, 
            y: this.y + this.height / 2,
        };
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
};

export class Circle extends Point implements CircleType {
    constructor(
        public radius = 0.5
    ) {
        super();
    }

    get center(): Vector {
        return { 
            x: this.x + this.radius, 
            y: this.y + this.radius,
        };
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
};

export const RectBody = BodyMixin(Rectangle);

export const isRectBody = (body: any): body is RectBodyType => {
    return body.width !== undefined && body.height !== undefined;
}

export const CircleBody = BodyMixin(Circle);

export const isCircleBody = (body: any): body is CircleBodyType => {
    return body.radius !== undefined;
}