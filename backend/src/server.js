// Importar dependências
const path = require("path");
const express = require("express");
const cors = require("cors");
require("dotenv").config();

const pool = require("./config/database");
const iniciarBanco = require("./config/iniciar-banco");
const seguranca = require("./middleware/seguranca");
const mensagensRoutes = require("./routes/mensagens");
const adminRoutes = require("./routes/admin");

// Inicializar aplicação
const app = express();

// Pasta do site (uma acima de /backend)
const RAIZ = path.join(__dirname, "..", "..");

// Atrás de proxy (Caddy, Nginx, hospedagem), o IP real vem do cabeçalho do proxy
app.set("trust proxy", Number(process.env.TRUST_PROXY ?? 1));
app.disable("x-powered-by");

// Configurações
app.use(seguranca);

// O site e a API ficam no mesmo endereço, então CORS só é necessário se CORS_ORIGIN for definido
const origens = (process.env.CORS_ORIGIN || "").split(",").map((o) => o.trim()).filter(Boolean);
// (em desenvolvimento, também aceita o site aberto por outro servidor local, como o Live Server)
const localhost = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;
app.use(cors({
    origin: (origem, retorno) => retorno(null, Boolean(origem) && (
        origens.includes(origem) || (process.env.NODE_ENV !== "production" && localhost.test(origem))
    ))
}));

app.use(express.json({ limit: "10kb" }));

// Rotas da API
app.get("/api/status", (req, res) => {
    res.json({ status: "online", projeto: "PANA Projetos" });
});

// Testar banco de dados
app.get("/api/db-status", async (req, res) => {
    try {
        const resultado = await pool.query("SELECT NOW()");
        res.json({
            status: "conectado",
            banco: "PostgreSQL",
            horario: resultado.rows[0].now
        });
    } catch (erro) {
        console.error("Erro ao conectar ao banco:", erro);
        res.status(500).json({
            status: "erro",
            mensagem: "Não foi possível conectar ao banco de dados."
        });
    }
});

app.use("/api/mensagens", mensagensRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api", (req, res) => res.status(404).json({ mensagem: "Rota não encontrada." }));

// Site (somente as pastas públicas; o código do backend nunca é exposto)
const opcoesEstaticas = {
    index: false,
    maxAge: "1h",
    setHeaders: (res, arquivo) => {
        if (arquivo.endsWith(".html")) res.setHeader("Cache-Control", "no-cache");
    }
};

["assets", "pg-inicial", "pg-historia", "pg-plano", "pg-sugestao", "admin"].forEach((pasta) => {
    app.use("/" + pasta, express.static(path.join(RAIZ, pasta), opcoesEstaticas));
});

app.get("/", (req, res) => res.sendFile(path.join(RAIZ, "index.html")));

app.use((req, res) => res.status(404).send("Página não encontrada."));

// Erros gerais (JSON inválido, corpo grande demais etc.)
app.use((erro, req, res, next) => {
    if (erro.type === "entity.parse.failed" || erro.type === "entity.too.large") {
        return res.status(400).json({ mensagem: "Requisição inválida." });
    }
    console.error(erro);
    res.status(500).json({ mensagem: "Erro interno." });
});

module.exports = app;

// Iniciar servidor (só quando executado diretamente)
if (require.main === module) {
    const PORT = process.env.PORT || 3000;

    iniciarBanco()
        .then(() => {
            const servidor = app.listen(PORT, () => {
                console.log(`Servidor rodando na porta ${PORT}`);
            });

            const encerrar = () => {
                servidor.close(() => pool.end().then(() => process.exit(0)));
                setTimeout(() => process.exit(1), 10000).unref();
            };
            process.on("SIGTERM", encerrar);
            process.on("SIGINT", encerrar);
        })
        .catch((erro) => {
            console.error("Não foi possível iniciar:", erro.message);
            process.exit(1);
        });
}
