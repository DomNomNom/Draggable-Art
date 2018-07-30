import {abs,sin,cos,TAU,range,zip,linspace} from './util.js';

// The function that is being displayed and anlalyzed by the fourier transform.
function signalFunction(t, data) {
    return cos(data.frequency * t);
}

export const initialData = {
    frequency: 2,
    angle: 0,

    drawBoxRadius: 400,
    winding: 2.2 * TAU,
}


export function render(data, ctx) {
    const numSamples = 100;
    const minT = 0;
    const maxT = TAU;
    const samples = [...linspace(minT, maxT, numSamples)].map(
        (t) => signalFunction(t, data)
    );
    renderSamplesAsWaveform(samples, data, ctx);
    renderSamplesAsPolarPlot(samples, data, ctx);
    ctx.point(
        Math.max(data.drawBoxRadius*0.015, data.drawBoxRadius / data.frequency),
        0,
        {
            fill: 'rgba(10, 200, 10, .5)',
            r: abs(data.drawBoxRadius * .1),
            affects: ['frequency'],
        }
    );
}

function renderSamplesAsPolarPlot(samples, data, ctx) {
    let lastPos = null;
    let totalX = 0;
    let totalY = 0;
    for (const [theta, r] of zip([...linspace(0, data.winding, samples.length)], samples)) {
        const x = 0.5*data.drawBoxRadius * r * cos(theta) - 0.6 * data.drawBoxRadius;
        const y = 0.5*data.drawBoxRadius * r * sin(theta);
        totalX += x;
        totalY += y;
        if (lastPos !== null) {
            ctx.line(
                x,
                y,
                lastPos[0],
                lastPos[1],
                {
                    'stroke-width': 0.01 * data.drawBoxRadius,
                    'stroke': 'steelblue',
                    'stroke-linecap': 'round',
                    affects: ['winding'],
                }
            )
        }
        lastPos = [x,y];
    }
}

function renderSamplesAsWaveform(samples, data, ctx) {
    let lastPos = null;
    for (const [x, y] of zip([...linspace(0, 1, samples.length)], samples)) {
        if (lastPos !== null) {
            ctx.line(
                data.drawBoxRadius * x,
                data.drawBoxRadius * y,
                data.drawBoxRadius * lastPos[0],
                data.drawBoxRadius * lastPos[1],
                {
                    'stroke-width': 0.04 * data.drawBoxRadius,
                    'stroke': 'steelblue',
                    'stroke-linecap': 'round',
                    affects: ['drawBoxRadius'],
                }
            );
        }
        lastPos = [x, y];
    }
}
