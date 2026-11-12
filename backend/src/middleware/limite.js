// Limite de requisições por IP (em memória; suficiente para 1 servidor)
function criarLimite({ janelaMs, max, mensagem }) {
    const acessos = new Map();

    setInterval(() => {
        const agora = Date.now();
        for (const [ip, r] of acessos) if (r.fim <= agora) acessos.delete(ip);
    }, janelaMs).unref();

    return (req, res, next) => {
        const agora = Date.now();
        let r = acessos.get(req.ip);

        if (!r || r.fim <= agora) {
            r = { n: 0, fim: agora + janelaMs };
            acessos.set(req.ip, r);
        }

        r.n++;

        if (r.n > max) {
            res.set("Retry-After", Math.ceil((r.fim - agora) / 1000));
            return res.status(429).json({ mensagem });
        }
        next();
    };
}

module.exports = { criarLimite };
