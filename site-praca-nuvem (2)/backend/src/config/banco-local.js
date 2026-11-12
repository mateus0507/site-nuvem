// Banco de TESTE em arquivo: usado só quando nenhum PostgreSQL foi configurado e NODE_ENV não é "production".
// O arquivo fica fora da pasta do projeto (para o Live Server não recarregar a página a cada mensagem).
const fs = require("fs");
const os = require("os");
const path = require("path");

const arquivo = process.env.LOCAL_DB_FILE || path.join(os.homedir(), ".pana-projetos-mensagens.json");

function ler() {
    try {
        return JSON.parse(fs.readFileSync(arquivo, "utf8"));
    } catch {
        return { ultimoId: 0, mensagens: [] };
    }
}

function salvar(dados) {
    fs.writeFileSync(arquivo + ".tmp", JSON.stringify(dados));
    fs.renameSync(arquivo + ".tmp", arquivo);
}

// Entende só as consultas que o projeto usa (iguais às do PostgreSQL)
async function query(sql, p = []) {
    if (/CREATE (TABLE|INDEX)/i.test(sql)) return { rows: [], rowCount: 0 };
    if (/SELECT NOW\(\)/i.test(sql)) return { rows: [{ now: new Date() }], rowCount: 1 };

    const d = ler();

    if (/INSERT INTO mensagens/i.test(sql)) {
        const nova = { id: ++d.ultimoId, nome: p[0], assunto: p[1], texto: p[2], status: p[3], criado_em: new Date().toISOString() };
        d.mensagens.push(nova);
        salvar(d);
        return { rows: [nova], rowCount: 1 };
    }

    if (/UPDATE mensagens/i.test(sql)) {
        const m = d.mensagens.find((x) => String(x.id) === String(p[1]));
        if (!m) return { rows: [], rowCount: 0 };
        m.status = p[0];
        salvar(d);
        return { rows: [m], rowCount: 1 };
    }

    if (/DELETE FROM mensagens/i.test(sql)) {
        const antes = d.mensagens.length;
        d.mensagens = d.mensagens.filter((x) => String(x.id) !== String(p[0]));
        salvar(d);
        return { rows: [], rowCount: antes - d.mensagens.length };
    }

    if (/FROM mensagens/i.test(sql)) {
        const comStatus = /texto, status/i.test(sql);
        const lista = d.mensagens
            .filter((m) => m.status === p[0])
            .sort((a, b) => b.id - a.id)
            .slice(0, comStatus ? 200 : 100)
            .map(({ status, ...resto }) => (comStatus ? { ...resto, status } : resto));
        return { rows: lista, rowCount: lista.length };
    }

    throw new Error("Consulta não suportada no banco local: " + sql);
}

module.exports = { query, on() {}, end: async () => {}, arquivo };
