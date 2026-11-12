
// ==========================================
// PANA PROJETOS
// MURAL DA VIZINHANCA
// ==========================================

// 1. CONFIGURACAO DA API
// Publicado: o site e a API ficam no mesmo endereço.
// Só no seu computador: se o HTML for aberto por outro servidor (arquivo direto, Live Server...),
// usa o backend em http://localhost:3000.
const ambienteLocal =
    location.protocol === "file:" ||
    location.hostname === "localhost" ||
    location.hostname === "127.0.0.1";

let API = location.protocol === "file:" ? "http://localhost:3000/api/mensagens" : "/api/mensagens";

async function chamarApi(opcoes) {
    const resposta = await fetch(API, opcoes);
    const ehJson = (resposta.headers.get("content-type") || "").includes("application/json");

    // No seu computador (Live Server etc.), a resposta não vem do backend: tenta o backend na porta 3000
    if (ambienteLocal && !API.startsWith("http") && !ehJson) {
        API = "http://localhost:3000/api/mensagens";
        return fetch(API, opcoes);
    }

    return resposta;
}

const dicaLocal = ambienteLocal ? " Rode npm start na pasta backend e atualize a página." : "";

// 2. MENU DO SITE
const btn = document.querySelector(".menu-btn");
const menu = document.getElementById("menu");

btn?.addEventListener("click", () => {
    const aberto = menu.classList.toggle("aberto");
    btn.setAttribute("aria-expanded", aberto);
});

// 3. MURAL DA VIZINHANCA
const form = document.getElementById("form-chat");

if (form) {
    // Elementos do mural
    const lista = document.getElementById("mensagens");
    const campoNome = document.getElementById("nome");
    const campoAssunto = document.getElementById("assunto");
    const campoTexto = document.getElementById("texto");
    const botao = form.querySelector('button[type="submit"]');
    const status = document.getElementById("status-envio");
    const contadorTexto = document.getElementById("contador-texto");

    const areaComentarios = document.querySelector(".comentarios");
    const anteriorComentario = document.getElementById("comentario-anterior");
    const proximoComentario = document.getElementById("comentario-proximo");
    const contadorComentarios = document.getElementById("contador-comentarios");

    let comentarioAtual = 0;
    let carregando = false;
    let ultimoEnvio = 0;
    let primeiraCarga = true;
    let pausado = false;

    // Aviso ao lado do botão (em vez de janelas pop-up)
    function avisar(texto, tipo) {
        if (!status) {
            alert(texto);
            return;
        }
        status.textContent = texto;
        status.className = tipo || "";
    }

    // Contador de caracteres
    campoTexto.addEventListener("input", () => {
        if (contadorTexto) contadorTexto.textContent = `${campoTexto.value.length} / 400`;
    });

    // 4. CARROSSEL DE COMENTARIOS
    function atualizarComentarios() {
        const itens = lista.querySelectorAll(".msg:not(.msg-vazio)");

        if (itens.length === 0) {
            contadorComentarios.textContent = "0 / 0";
            return;
        }

        comentarioAtual = ((comentarioAtual % itens.length) + itens.length) % itens.length;

        itens.forEach((item, indice) => {
            item.classList.toggle("ativa", indice === comentarioAtual);
        });

        contadorComentarios.textContent = `${comentarioAtual + 1} / ${itens.length}`;
    }

    function trocarComentario(direcao) {
        comentarioAtual += direcao;
        atualizarComentarios();
    }

    anteriorComentario?.addEventListener("click", () => trocarComentario(-1));
    proximoComentario?.addEventListener("click", () => trocarComentario(1));

    // Pausa a troca automática enquanto a pessoa lê (mouse em cima ou foco nos botões)
    ["mouseenter", "focusin"].forEach((e) => areaComentarios?.addEventListener(e, () => (pausado = true)));
    ["mouseleave", "focusout"].forEach((e) => areaComentarios?.addEventListener(e, () => (pausado = false)));

    // Troca automaticamente a cada 6 segundos
    setInterval(() => {
        if (!document.hidden && !pausado) trocarComentario(1);
    }, 6000);

    // 5. EXIBIR UMA MENSAGEM
    function corDoNome(nome) {
        let h = 0;
        for (const letra of nome) h = (h * 31 + letra.charCodeAt(0)) % 1000;
        return h % 5;
    }

    function mostrarMensagem(m) {
        const li = document.createElement("li");
        li.className = "msg";

        const avatar = document.createElement("span");
        avatar.className = `avatar cor-${corDoNome(m.nome)}`;
        avatar.textContent = (m.nome.trim()[0] || "?").toUpperCase();
        avatar.setAttribute("aria-hidden", "true");

        const nome = document.createElement("strong");
        nome.textContent = m.nome;

        const info = document.createElement("em");
        const data = new Date(m.criado_em);

        const horario = Number.isNaN(data.getTime()) ? "" : data.toLocaleString("pt-BR", {
            dateStyle: "short",
            timeStyle: "short"
        });

        info.textContent = `${m.assunto} · ${horario}`;

        const texto = document.createElement("span");
        texto.className = "texto";
        texto.textContent = m.texto;

        li.append(avatar, nome, info, texto);
        lista.appendChild(li);
    }

    function mostrarAviso(texto) {
        const aviso = document.createElement("li");
        aviso.className = "msg msg-vazio";
        aviso.textContent = texto;
        lista.replaceChildren(aviso);
    }

    // 6. CARREGAR MENSAGENS PUBLICADAS (as mais novas primeiro)
    async function carregarMensagens() {
        if (carregando) return;

        carregando = true;

        try {
            const resposta = await chamarApi({
                method: "GET",
                cache: "no-store"
            });

            if (!resposta.ok) {
                throw new Error(`Erro ao carregar: ${resposta.status}`);
            }

            const mensagens = await resposta.json();
            const posicaoAnterior = comentarioAtual;

            if (mensagens.length === 0) {
                mostrarAviso("Ainda não há mensagens. Seja a primeira pessoa a escrever!");
            } else {
                lista.replaceChildren();
                mensagens.forEach(mostrarMensagem);
                // Mantém a mensagem que a pessoa estava lendo
                comentarioAtual = Math.min(posicaoAnterior, mensagens.length - 1);
            }

            atualizarComentarios();
            primeiraCarga = false;

        } catch (erro) {
            console.error("Erro ao atualizar mural:", erro);

            if (primeiraCarga) {
                mostrarAviso("Não foi possível carregar o mural agora." + dicaLocal);
                atualizarComentarios();
            }
        } finally {
            carregando = false;
        }
    }

    // 7. ENVIAR NOVA SUGESTAO
    form.addEventListener("submit", async (evento) => {
        evento.preventDefault();

        const nome = campoNome.value.trim();
        const assunto = campoAssunto.value;
        const texto = campoTexto.value.trim();

        if (!nome || !assunto || !texto) {
            avisar("Preencha todos os campos obrigatórios.", "erro");
            return;
        }

        if (nome.length > 40 || texto.length > 400) {
            avisar("A mensagem ultrapassa o limite permitido.", "erro");
            return;
        }

        // Intervalo entre envios
        const espera = 30000 - (Date.now() - ultimoEnvio);

        if (espera > 0) {
            avisar(`Aguarde ${Math.ceil(espera / 1000)} segundos antes de enviar novamente.`, "erro");
            return;
        }

        botao.disabled = true;
        botao.textContent = "Enviando...";
        avisar("", "");

        try {
            const resposta = await chamarApi({
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    nome,
                    assunto,
                    texto
                })
            });

            const resultado = await resposta.json();

            if (!resposta.ok) {
                const erroServidor = new Error(resultado.mensagem || "Erro ao enviar mensagem.");
                erroServidor.doServidor = true;
                throw erroServidor;
            }

            ultimoEnvio = Date.now();
            form.reset();
            if (contadorTexto) contadorTexto.textContent = "0 / 400";

            avisar(resultado.mensagem, "ok");

            // Mensagem já publicada: mostra no mural (a mais nova fica em primeiro)
            if (resultado.dados?.status === "aprovada") {
                comentarioAtual = 0;
                carregando = false;
                carregarMensagens();
            }

        } catch (erro) {
            console.error("Erro ao enviar mensagem:", erro);
            avisar(erro.doServidor ? erro.message : "Não foi possível enviar a mensagem." + (dicaLocal || " Tente novamente."), "erro");
        } finally {
            botao.disabled = false;
            botao.textContent = "Enviar mensagem";
        }
    });

    // 8. ATUALIZACAO AUTOMATICA
    carregarMensagens();

    // Consulta o banco a cada 10 segundos
    setInterval(() => {
        if (!document.hidden) carregarMensagens();
    }, 10000);

    // Atualiza quando o visitante volta para a aba
    document.addEventListener("visibilitychange", () => {
        if (!document.hidden) carregarMensagens();
    });
}
