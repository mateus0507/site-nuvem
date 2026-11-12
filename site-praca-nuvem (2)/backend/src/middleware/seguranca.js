// Cabeçalhos de segurança
// Se um dia você incluir vídeos/mapas/imagens de outros sites, adicione o endereço deles na política abaixo.
const CSP = [
    "default-src 'self'",
    "script-src 'self'",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src https://fonts.gstatic.com",
    "img-src 'self' data:",
    "connect-src 'self'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'"
].join("; ");

module.exports = (req, res, next) => {
    res.set({
        "Content-Security-Policy": CSP,
        "X-Content-Type-Options": "nosniff",
        "X-Frame-Options": "DENY",
        "Referrer-Policy": "strict-origin-when-cross-origin",
        "Permissions-Policy": "camera=(), microphone=(), geolocation=()"
    });

    if (process.env.NODE_ENV === "production") {
        res.set("Strict-Transport-Security", "max-age=15552000; includeSubDomains");
    }

    if (req.path.startsWith("/admin") || req.path.startsWith("/api/admin")) {
        res.set("X-Robots-Tag", "noindex, nofollow");
    }
    next();
};
