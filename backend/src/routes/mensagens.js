
// Importar dependências
const express = require("express");
const router = express.Router();

const pool = require("../config/database");
const { criarLimite } = require("../middleware/limite");

// Assuntos aceitos (iguais às opções do formulário)
const ASSUNTOS = ["Sugestão", "Dúvida", "Elogio", "Problema na praça"];

// Por padrão a mensagem é publicada na hora. PUBLICAR_DIRETO=false faz ela esperar aprovação em /admin/admin.html
const STATUS_NOVO = process.env.PUBLICAR_DIRETO === "false" ? "pendente" : "aprovada";

// Bloqueia links (principal tipo de spam)
const TEM_LINK = /(https?:\/\/|www\.|\.com\b|\.net\b|\.ru\b)/i;

// Limites por IP
const limiteEnvio = criarLimite({
    janelaMs: 10 * 60 * 1000,
    max: Number(process.env.LIMITE_ENVIOS) || 5,
    mensagem: "Você enviou muitas mensagens. Tente novamente em alguns minutos."
});

const limiteLeitura = criarLimite({
    janelaMs: 60 * 1000,
    max: 120,
    mensagem: "Muitas consultas. Aguarde um instante."
});

// Cadastrar uma mensagem
router.post("/", limiteEnvio, async (req, res) => {
    try {
        const { nome, assunto, texto } = req.body || {};

        // Validar campos
        if (
            typeof nome !== "string" ||
            typeof assunto !== "string" ||
            typeof texto !== "string" ||
            !nome.trim() ||
            !assunto.trim() ||
            !texto.trim()
        ) {
            return res.status(400).json({
                mensagem: "Preencha todos os campos."
            });
        }

        // Validar limites
        if (nome.trim().length > 40 || texto.trim().length > 400) {
            return res.status(400).json({
                mensagem: "Um dos campos ultrapassa o limite permitido."
            });
        }

        // Bloquear links
        if (TEM_LINK.test(nome) || TEM_LINK.test(texto)) {
            return res.status(400).json({
                mensagem: "Links não são permitidos nas mensagens."
            });
        }

        // Validar assunto
        if (!ASSUNTOS.includes(assunto.trim())) {
            return res.status(400).json({
                mensagem: "Assunto inválido."
            });
        }

        const resultado = await pool.query(
            `INSERT INTO mensagens (nome, assunto, texto, status)
             VALUES ($1, $2, $3, $4)
             RETURNING id, nome, assunto, texto, status, criado_em`,
            [nome.trim(), assunto.trim(), texto.trim(), STATUS_NOVO]
        );

        res.status(201).json({
            mensagem: STATUS_NOVO === "aprovada"
                ? "Mensagem publicada com sucesso!"
                : "Mensagem recebida! Ela será exibida após aprovação da equipe.",
            dados: resultado.rows[0]
        });

    } catch (erro) {
        console.error("Erro ao cadastrar mensagem:", erro);

        res.status(500).json({
            mensagem: "Erro interno ao publicar mensagem."
        });
    }
});

// Consultar mensagens publicadas
router.get("/", limiteLeitura, async (req, res) => {
    try {
        const resultado = await pool.query(
            `SELECT id, nome, assunto, texto, criado_em
             FROM mensagens
             WHERE status = $1
             ORDER BY criado_em DESC
             LIMIT 100`,
            ["aprovada"]
        );

        res.json(resultado.rows);

    } catch (erro) {
        console.error("Erro ao consultar mensagens:", erro);

        res.status(500).json({
            mensagem: "Erro ao consultar mensagens."
        });
    }
});

// Exportar rotas
module.exports = router;
