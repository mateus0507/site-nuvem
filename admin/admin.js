// Painel de moderação (a senha fica só nesta aba do navegador)
const API = "/api/admin/mensagens";
const login = document.getElementById("login");
const painel = document.getElementById("painel");
const lista = document.getElementById("lista");
const aviso = document.getElementById("aviso");
let statusAtual = "pendente";

const senha = () => sessionStorage.getItem("pana-admin") || "";

async function chamar(url, opcoes = {}) {
    const r = await fetch(url, {
        ...opcoes,
        headers: { "Content-Type": "application/json", Authorization: "Bearer " + senha() }
    });
    if (r.status === 401 || r.status === 503) {
        sair();
        const dados = await r.json().catch(() => ({}));
        throw new Error(dados.mensagem || "Acesso negado.");
    }
    if (!r.ok && r.status !== 204) throw new Error("Erro " + r.status);
    return r.status === 204 ? null : r.json();
}

function botao(texto, classe, acao) {
    const b = document.createElement("button");
    b.type = "button";
    b.className = classe;
    b.textContent = texto;
    b.addEventListener("click", acao);
    return b;
}

function desenhar(m) {
    const li = document.createElement("li");
    const info = document.createElement("small");
    info.textContent = `${m.nome} · ${m.assunto} · ${new Date(m.criado_em).toLocaleString("pt-BR")}`;
    const texto = document.createElement("p");
    texto.textContent = m.texto;
    const acoes = document.createElement("div");
    acoes.className = "acoes";

    if (m.status !== "aprovada") acoes.append(botao("Aprovar", "aprovar", () => mudar(m.id, "aprovada")));
    if (m.status !== "rejeitada") acoes.append(botao("Rejeitar", "rejeitar", () => mudar(m.id, "rejeitada")));
    acoes.append(botao("Apagar", "apagar", () => apagar(m.id)));

    li.append(info, texto, acoes);
    return li;
}

async function carregar() {
    try {
        const mensagens = await chamar(`${API}?status=${statusAtual}`);
        lista.replaceChildren(...mensagens.map(desenhar));
        aviso.textContent = mensagens.length ? "" : "Nenhuma mensagem nesta aba.";
    } catch (e) {
        aviso.textContent = e.message;
    }
}

async function mudar(id, status) {
    try { await chamar(`${API}/${id}`, { method: "PATCH", body: JSON.stringify({ status }) }); carregar(); }
    catch (e) { aviso.textContent = e.message; }
}

async function apagar(id) {
    if (!confirm("Apagar esta mensagem definitivamente?")) return;
    try { await chamar(`${API}/${id}`, { method: "DELETE" }); carregar(); }
    catch (e) { aviso.textContent = e.message; }
}

function entrar() {
    login.hidden = true;
    painel.hidden = false;
    carregar();
}

function sair() {
    sessionStorage.removeItem("pana-admin");
    painel.hidden = true;
    login.hidden = false;
}

login.addEventListener("submit", (ev) => {
    ev.preventDefault();
    sessionStorage.setItem("pana-admin", document.getElementById("token").value);
    document.getElementById("token").value = "";
    entrar();
});

document.getElementById("sair").addEventListener("click", sair);

painel.querySelectorAll("[data-status]").forEach((b) => {
    b.addEventListener("click", () => {
        statusAtual = b.dataset.status;
        painel.querySelectorAll("[data-status]").forEach((x) => x.classList.toggle("ativa", x === b));
        carregar();
    });
});

if (senha()) entrar();
