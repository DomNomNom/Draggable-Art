import {range, clamp} from './util.js';

export const initialData = {
    x: 0,
    y: 0
};

export function render(data, ctx) {
    const point = (x,y, options={}) => {
        if (undefined === options.fill) options.fill = 'green';
        if (undefined === options.r) options.r = 10;
        ctx.point(x,y, options)
    };

    point (data.x, data.y +  0, {fill: 'red'});
    point (data.x, data.y + 50, {fill: 'red'});

    const clampedX = clamp(Math.abs(data.x), 0, 1000);
    for (const y of range(0, clampedX, 50)) {
        point(data.x + 50, data.y + y);
    }
    for (const y of range(0, clampedX, 50)) {
        point(data.x - 50, data.y + y);
    }
}
