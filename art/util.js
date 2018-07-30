export const abs = Math.abs;
export const sin = Math.sin;
export const cos = Math.cos;
export const PI = Math.PI;
export const TAU = 2*Math.PI;
export const sqrt = Math.sqrt;
export const pow = Math.pow;


export const sign = Math.sign;

function ord(a, b, c) {
  return sign(a - b) == sign(b - c);
}

// Modelled after python3's range()
export function* range(start, end, step) {
  if (end === undefined) {
    [start, end, step] = [0, start, sign(start)];
  } else if (step === undefined) {
    step = sign(end - start) || 1;
  } else if (sign(end - start) != sign(step)) {
    return;
  }
  if (start === end) return;

  var i = 0, result;
  do {
    result = start + i*step;
    yield result;
    ++i;
  } while (ord(start, start + i*step, end));
}


// Modelled after numpy.linspace
export function* linspace(start, stop, num=50, endpoint=true) {
  const step = (stop-start) / (endpoint? num-1 : num);
  for (const i of range(num)) {
    yield start + i*step;
  }
}

// Modelled after python's zip()
export function zip(arr, ...arrs) {
  return arr.map((val, i) => arrs.reduce((a, arr) => [...a, arr[i]], [val]));
}


export function clamp(x, bot, top) { return x<bot?bot : x>top?top : x; }
