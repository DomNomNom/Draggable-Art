import {range, clamp, pow} from './util.js';

export const initialData = {
    x: 200,
    y: 100,
    vx: -500,
    vy: 1,
};

const gravity = 3000;  // positive = down
const simulationPeriod = 2.5;
const timeStep = 0.05;
const ballR = 20;  // Ball radius
const bounceFactor = .8;  // scaling down of velocity on bounce

let simulationBoxWd = 100;
let simulationBoxHt = 100;

function reducePrecision(float, decimals) {
    return Number.parseFloat(float.toFixed(decimals));
}

function getIntersectionTimeX(data, wallX) {
    // Note: We downsample the the distance from the wall, otherwise we get bad floating point behavior and the ball goes through the wall.
    return reducePrecision(wallX-data.x, 10) / data.vx;
}
function getIntersectionTimeY(data, floorY) {
    // 0.5*gravity*dt*dt + data.vy * dt - dy = 0
    return solveQuadratic(.5*gravity, data.vy, data.y - floorY);
}
// Solves a quadratic equation of the form `a*x*x + b*x + c = 0`
// Returns the most positive solution and in cases where there is no real solution, return null.
function solveQuadratic(a, b, c) {
    const determinant = b*b - (4 * a * c);
    if (determinant < 0) return null;
    return (-1 * b + Math.sqrt(determinant)) / (2 * a);
}

function simulateWithoutCollisions(data, dt) {
    return {
        x: data.x + data.vx * dt,
        y: data.y + data.vy * dt + 0.5*gravity*dt*dt,
        vx: data.vx,
        vy: data.vy + gravity*dt,
    };
}

function handleWallCollision(data, intersectionTime) {
    const dataAtHit = simulateWithoutCollisions(data, intersectionTime);
    dataAtHit.vx *= -bounceFactor;
    return dataAtHit;
}
function handleFloorCeilingCollision(data, intersectionTime) {
    const dataAtHit = simulateWithoutCollisions(data, intersectionTime);
    dataAtHit.vy *= -bounceFactor;
    if (reducePrecision(dataAtHit.vy, 3) == 0) {
        dataAtHit.vy = 0;
    }
    return dataAtHit;
}
function simulate(data, dt) {
    // min/max coordinates for the ball's center.
    const minX = ballR;
    const minY = ballR;
    const maxX = simulationBoxWd - ballR;
    const maxY = simulationBoxHt - ballR;

    if (dt == 0) {
        return data;
    }
    // Intersection with vertical walls.
    const intersects = [
        {t: getIntersectionTimeX(data, minX), handleCollision: handleWallCollision},
        {t: getIntersectionTimeX(data, maxX), handleCollision: handleWallCollision},
        {t: getIntersectionTimeY(data, minY), handleCollision: handleFloorCeilingCollision},
        {t: getIntersectionTimeY(data, maxY), handleCollision: handleFloorCeilingCollision},
    ].filter(({t}) => t!==null && 0<t && t<=dt).sort((a,b) => a.t-b.t);
    if (intersects.length) {
        const intersect = intersects[0];
        const dataAtHit = intersect.handleCollision(data, intersect.t);
        // if (new Error().stack.split('\n').length > 10)    debugger;
        return simulate(dataAtHit, dt - intersect.t);
    }

    const out = simulateWithoutCollisions(data, dt);
    // if (out.x < minX) debugger
    return out
}


function simulateUntilTime(data, animationTime) {
    for (const i of range(animationTime / timeStep)) {
        data = simulate(data, timeStep);
    }
    return simulate(data, animationTime % timeStep);
}
function generateStates(data) {
    const states = [data];
    for (const i of range(simulationPeriod / timeStep)) {
        data = simulate(data, timeStep);
        states.push(data);
    }
    return states;
}


function strokeWidth(i) {
    return 1+20*pow(2, -i*.05);
}
export function render(data, ctx) {

    const states = generateStates(data);  // The physics simulation sampled at constant-time intervals

    const point = (x,y, options={}) => {
        if (undefined === options.r) options.r = 20;
        ctx.point(x,y, options);
    };
    for (let i=0; i<states.length-1; ++i) {
        const now = states[i];
        const next = states[i+1];
        ctx.line(
            now.x, now.y,
            next.x, next.y, {
                'stroke-width': strokeWidth(i),
                'stroke': 'rgba(10, 222, 10, .5)',
                'stroke-linecap': 'round',
                affects: ['vx', 'vy'],
            }
        );
    }
    for (let i=1; i<states.length; ++i) {
        const data = states[i];
        point (data.x, data.y, {fill: 'red', r: .1*strokeWidth(i), affects: ['vx', 'vy']});
    }
    point (data.x, data.y, {fill: 'red', affects: ['x', 'y']});

}

let animatedBall;
function renderAnimation(animationTime, canvas) {
    if (!animatedBall) {
        // animatedBall = document.createElement('circle')
        animatedBall = document.createElementNS("http://www.w3.org/2000/svg",'circle');
        canvas.node.insertBefore(animatedBall, canvas.node.firstElementChild);
    }
    const ballData = simulateUntilTime(canvas.getData(), animationTime % simulationPeriod);
    animatedBall.style['r'] = ballR;
    animatedBall.style['fill'] = 'steelblue';
    animatedBall.style['cx'] = ballData.x;
    animatedBall.style['cy'] = ballData.y;
    animatedBall.style['type'] = 'point';
    animatedBall.style['stack'] = '0';
}
function handleResize(canvas) {
    const boundingRect = canvas.node.getBoundingClientRect();
    simulationBoxWd = boundingRect.width;
    simulationBoxHt = boundingRect.height;
    canvas.resize(true);
}
{
    let canvas;  // HACK: global scoping fuckery.
    function animationLoop(time_ms) {
        if (!window.canvas) return;
        if (!canvas) {
            // first render
            canvas = window.canvas;
            canvas.align('left', 'top')
            new ResizeObserver(() => { handleResize(canvas); }).observe(canvas.node);
            handleResize(canvas);
        }
        renderAnimation(time_ms / 1000, canvas);
        requestAnimationFrame(animationLoop)
    }
    requestAnimationFrame(animationLoop)
}
