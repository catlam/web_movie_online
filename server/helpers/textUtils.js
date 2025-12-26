// helpers/textUtils.js

export function findMatchesLowercase(input, candidates) {
    const q = input.toLowerCase();
    const res = [];

    for (const c of candidates) {
        if (!c) continue;
        const cc = String(c).toLowerCase();
        if (q.includes(cc)) res.push(c);
    }
    return res;
}
