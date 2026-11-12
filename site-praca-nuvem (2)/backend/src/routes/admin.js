// Moderação: aprovar, rejeitar e apagar mensagens (protegido por ADMIN_TOKEN)
const crypto = require("crypto");
const express = require("express");
const router = express.Router();

const pool = require("../config/database");
const { criarLimite } = require("../middleware/limite");

const STATUS = ["pendente", "aprovada", "rejeitada"];

const hash = (v) => crypto.createHash("sha256").update(String(v)).digest();

function autenticar(req, res, next) {
    const token = process.env.ADMIN_TOKEN || "";

    if (token.length < 16) {
        return res.status(503).json({
            mensagem: "Moderação desativada: defina ADMIN_TOKEN com pelo menos 16 caracteres."
        });
    }

    const enviado = (req.get("authorization") || "").replace(/^Bearer\s+/i, "");

    if (!crypto.timingSafeEqual(hash(enviado), hash(token))) {
        return res.status(401).json({ mensagem: "Senha inválida." });
    }
    next();
}

router.use(
    criarLimite({ janelaMs: 15 * 60 * 1000, max: 200, mensagem: "Muitas tentativas. Aguarde alguns minutos." }),
    autenticar
);

// Listar por status (padrão: pendentes)
router.get("/mensagens", async (req, res) => {
    const status = req.query.status || "pendente";

    if (!STATUS.includes(status)) {
        return res.status(400).json({ mensagem: "Status inválido." });
    }

    try {
        const r = await pool.query(
            `SELECT id, nome, assunto, texto, status, criado_em
             FROM mensagens
             WHERE status = $1
             ORDER BY criado_em DESC
             LIMIT 200`,
            [status]
        );
        res.json(r.rows);
    } catch (erro) {
        console.error("Erro (admin) ao listar:", erro);
        res.status(500).json({ mensagem: "Erro ao listar mensagens." });
    }
});

// Mudar status
router.patch("/mensagens/:id", async (req, res) => {
    const { status } = req.body || {};

    if (!/^\d+$/.test(req.params.id) || !STATUS.includes(status)) {
        return res.status(400).json({ mensagem: "Dados inválidos." });
    }

    try {
        const r = await pool.query(
            `UPDATE mensagens SET status = $1 WHERE id = $2
             RETURNING id, nome, assunto, texto, status, criado_em`,
            [status, req.params.id]
        );
        if (r.rowCount === 0) return res.status(404).json({ mensagem: "Mensagem não encontrada." });
        res.json(r.rows[0]);
    } catch (erro) {
        console.error("Erro (admin) ao atualizar:", erro);
        res.status(500).json({ mensagem: "Erro ao atualizar mensagem." });
    }
});

// Apagar
router.delete("/mensagens/:id", async (req, res) => {
    if (!/^\d+$/.test(req.params.id)) {
        return res.status(400).json({ mensagem: "Dados inválidos." });
    }

    try {
        const r = await pool.query(`DELETE FROM mensagens WHERE id = $1`, [req.params.id]);
        if (r.rowCount === 0) return res.status(404).json({ mensagem: "Mensagem não encontrada." });
        res.status(204).end();
    } catch (erro) {
        console.error("Erro (admin) ao apagar:", erro);
        res.status(500).json({ mensagem: "Erro ao apagar mensagem." });
    }
});

module.exports = router;
