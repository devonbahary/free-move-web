import { PIXELS_IN_SQUARE } from "./constants";

export const convertSizeToPixels = (size) => `${size * PIXELS_IN_SQUARE}px`;

export const vector = (x, y) => ({ x, y });
