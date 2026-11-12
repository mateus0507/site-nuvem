// Cria a tabela automaticamente ao iniciar (não precisa rodar o schema.sql à mão)
const fs = require("fs");
const path = require("path");
const pool = require("./database");

const schema = fs.readFileSync(path.join(__dirname, "..", "..", "database", "schema.sql"), "utf8");
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));

module.exports = async function iniciarBanco(tentativas = 10) {
    for (let i = 1; i <= tentativas; i++) {
        try {
            await pool.query(schema);
            console.log("Banco de dados pronto.");
            return;
        } catch (erro) {
            console.error(`Banco indisponível (tentativa ${i}/${tentativas}): ${erro.message}`);
            if (i === tentativas) throw erro;
            await esperar(3000);
        }
    }
};
