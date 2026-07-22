// Defence-in-depth against NoSQL operator injection (CWE-943).
//
// Strips MongoDB operator keys ($ne, $gt, $regex, $where, …) and dotted paths
// ("a.b", which can reach into sub-documents) out of request bodies before any
// controller can pass them into a query. Controllers still cast their own inputs
// — this is the second layer, not the only one.
//
// Scope note: we deliberately rewrite ONLY req.body.
//   • Express 5 exposes req.query as a read-only getter, so the usual
//     express-mongo-sanitize package throws on this stack; mutating it here would
//     break the same way.
//   • Express 5's default "simple" query parser never builds nested objects from
//     a query string, so `?email[$ne]=x` arrives as the literal key "email[$ne]"
//     — a harmless string, not an operator object.
//   • req.params values are always strings by construction.
const FORBIDDEN_KEY = /^\$|\./;

// Depth-capped so a deeply nested payload can't be used to burn CPU here.
const scrub = (value, depth = 0) => {
    if (value === null || typeof value !== 'object' || depth > 10) return value;

    if (Array.isArray(value)) {
        value.forEach((item, i) => { value[i] = scrub(item, depth + 1); });
        return value;
    }

    for (const key of Object.keys(value)) {
        if (FORBIDDEN_KEY.test(key)) {
            delete value[key];
        } else {
            value[key] = scrub(value[key], depth + 1);
        }
    }
    return value;
};

const sanitizeMongo = (req, res, next) => {
    if (req.body && typeof req.body === 'object') {
        scrub(req.body);
    }
    next();
};

export default sanitizeMongo;
