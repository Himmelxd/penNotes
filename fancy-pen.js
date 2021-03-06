// strongly based on https://github.com/steveruizok/perfect-freehand
// by 2021 Stephen Ruiz Ltd

function W(e, t, u, x = (g) => g) {
    return e * x(0.5 - t * (0.5 - u));
}
function re(e) {
    return [-e[0], -e[1]];
}
function l(e, t) {
    return [e[0] + t[0], e[1] + t[1]];
}
function a(e, t) {
    return [e[0] - t[0], e[1] - t[1]];
}
function b(e, t) {
    return [e[0] * t, e[1] * t];
}
function le(e, t) {
    return [e[0] / t, e[1] / t];
}
function R(e) {
    return [e[1], -e[0]];
}
function ne(e, t) {
    return e[0] * t[0] + e[1] * t[1];
}
function oe(e, t) {
    return e[0] === t[0] && e[1] === t[1];
}
function fe(e) {
    return Math.hypot(e[0], e[1]);
}
function be(e) {
    return e[0] * e[0] + e[1] * e[1];
}
function Y(e, t) {
    return be(a(e, t));
}
function H(e) {
    return le(e, fe(e));
}
function ue(e, t) {
    return Math.hypot(e[1] - t[1], e[0] - t[0]);
}
function L(e, t, u) {
    let x = Math.sin(u), g = Math.cos(u), y = e[0] - t[0], n = e[1] - t[1], f = y * g - n * x, d = y * x + n * g;
    return [f + t[0], d + t[1]];
}
function V(e, t, u) {
    return l(e, b(a(t, e), u));
}
function Z(e, t, u) {
    return l(e, b(t, u));
}
var { min: T, PI: ge } = Math, se = 0.275, j = ge + 1e-4;
function ie(e, t = {}) {
    let { size: u = 16, smoothing: x = 0.5, thinning: g = 0.5, simulatePressure: y = true, easing: n = (r) => r, start: f = {}, end: d = {}, last: _ = false } = t, { cap: S = true, easing: q = (r) => r * (2 - r) } = f, { cap: C = true, easing: p = (r) => --r * r * r + 1 } = d;
    if (e.length === 0 || u <= 0)
        return [];
    let m = e[e.length - 1].runningLength, h = f.taper === false ? 0 : f.taper === true ? Math.max(u, m) : f.taper, z = d.taper === false ? 0 : d.taper === true ? Math.max(u, m) : d.taper, $ = Math.pow(u * x, 2), D = [], M = [], N = e.slice(0, 10).reduce((r, i) => {
        let o = i.pressure;
        if (y) {
            let s = T(1, i.distance / u), J = T(1, 1 - s);
            o = T(1, r + (J - r) * (s * se));
        }
        return (r + o) / 2;
    }, e[0].pressure), c = W(u, g, e[e.length - 1].pressure, n), U, B = e[0].vector, I = e[0].point, F = I, O = I, E = F;
    for (let r = 0; r < e.length; r++) {
        let { pressure: i } = e[r], { point: o, vector: s, distance: J, runningLength: K } = e[r];
        if (r < e.length - 1 && m - K < 3)
            continue;
        if (g) {
            if (y) {
                let v = T(1, J / u), Q = T(1, 1 - v);
                i = T(1, N + (Q - N) * (v * se));
            }
            c = W(u, g, i, n);
        } else
            c = u / 2;
        U === void 0 && (U = c);
        let ce = K < h ? q(K / h) : 1, ae = m - K < z ? p((m - K) / z) : 1;
        if (c = Math.max(0.01, c * Math.min(ce, ae)), r === e.length - 1) {
            let v = b(R(s), c);
            D.push(a(o, v)), M.push(l(o, v));
            continue;
        }
        let A = e[r + 1].vector, ee = ne(s, A);
        if (ee < 0) {
            let v = b(R(B), c);
            for (let Q = 1 / 13, G = 0; G <= 1; G += Q)
                O = L(a(o, v), o, j * G), D.push(O), E = L(l(o, v), o, j * -G), M.push(E);
            I = O, F = E;
            continue;
        }
        let te = b(R(V(A, s, ee)), c);
        O = a(o, te), (r <= 1 || Y(I, O) > $) && (D.push(O), I = O), E = l(o, te), (r <= 1 || Y(F, E) > $) && (M.push(E), F = E), N = i, B = s;
    }
    let k = e[0].point.slice(0, 2), P = e.length > 1 ? e[e.length - 1].point.slice(0, 2) : l(e[0].point, [1, 1]), X = [], w = [];
    if (e.length === 1) {
        if (!(h || z) || _) {
            let r = Z(k, H(R(a(k, P))), -(U || c)), i = [];
            for (let o = 1 / 13, s = o; s <= 1; s += o)
                i.push(L(r, k, j * 2 * s));
            return i;
        }
    } else {
        if (!(h || z && e.length === 1))
            if (S)
                for (let i = 1 / 13, o = i; o <= 1; o += i) {
                    let s = L(M[0], k, j * o);
                    X.push(s);
                }
            else {
                let i = a(D[0], M[0]), o = b(i, 0.5), s = b(i, 0.51);
                X.push(a(k, o), a(k, s), l(k, s), l(k, o));
            }
        let r = R(re(e[e.length - 1].vector));
        if (z || h && e.length === 1)
            w.push(P);
        else if (C) {
            let i = Z(P, r, c);
            for (let o = 1 / 29, s = o; s < 1; s += o)
                w.push(L(i, P, j * 3 * s));
        } else
            w.push(l(P, b(r, c)), l(P, b(r, c * 0.99)), a(P, b(r, c * 0.99)), a(P, b(r, c)));
    }
    return D.concat(w, M.reverse(), X);
}
function me(e, t = {}) {
    var C;
    let { streamline: u = 0.5, size: x = 16, last: g = false } = t;
    if (e.length === 0)
        return [];
    let y = 0.15 + (1 - u) * 0.85, n = Array.isArray(e[0]) ? e : e.map(({ x: p, y: m, pressure: h = 0.5 }) => [p, m, h]);
    if (n.length === 2) {
        let p = n[1];
        n = n.slice(0, -1);
        for (let m = 1; m < 5; m++)
            n.push(V(n[0], p, m / 4));
    }
    n.length === 1 && (n = [...n, [...l(n[0], [1, 1]), ...n[0].slice(2)]]);
    let f = [{ point: [n[0][0], n[0][1]], pressure: n[0][2] >= 0 ? n[0][2] : 0.25, vector: [1, 1], distance: 0, runningLength: 0 }], d = false, _ = 0, S = f[0], q = n.length - 1;
    for (let p = 1; p < n.length; p++) {
        let m = g && p === q ? n[p].slice(0, 2) : V(S.point, n[p], y);
        if (oe(S.point, m))
            continue;
        let h = ue(m, S.point);
        if (_ += h, p < q && !d) {
            if (_ < x)
                continue;
            d = true;
        }
        S = { point: m, pressure: n[p][2] >= 0 ? n[p][2] : 0.5, vector: H(a(S.point, m)), distance: h, runningLength: _ }, f.push(S);
    }
    return f[0].vector = ((C = f[1]) == null ? void 0 : C.vector) || [0, 0], f;
}
function pe(e, t = {}) {
    return ie(me(e, t), t);
}
var Te = pe;

// vanilla import

getStroke = pe;
getStrokeOutlinePoints = ie;
getStrokePoints = me;


function getSvgPathFromStroke(stroke) {
    if (!stroke.length) return ''

    const d = stroke.reduce(
        (acc, [x0, y0], i, arr) => {
            const [x1, y1] = arr[(i + 1) % arr.length]
            acc.push(x0, y0, (x0 + x1) / 2, (y0 + y1) / 2)
            return acc
        },
        ['M', ...stroke[0], 'Q']
    )

    d.push('Z')
    return d.join(' ')
}