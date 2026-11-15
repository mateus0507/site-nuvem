
// ==========================================
// PANA PROJETOS
// GALERIAS DA PAGINA DO PROJETO
// ==========================================

const visualizador = document.getElementById("visualizador");

if (visualizador && typeof visualizador.showModal === "function") {
    const titulo = visualizador.querySelector("#vis-titulo");
    const imagem = visualizador.querySelector(".vis-img");
    const legenda = visualizador.querySelector(".vis-legenda");
    const contador = visualizador.querySelector(".vis-contador");
    const tiras = visualizador.querySelector(".vis-tiras");
    const palco = visualizador.querySelector(".vis-palco");

    let fotos = [];
    let atual = 0;

    // Mostra a foto de número "indice"
    function mostrar(indice) {
        atual = (indice + fotos.length) % fotos.length;

        const foto = fotos[atual];

        imagem.src = foto.href;
        imagem.alt = foto.alt;
        legenda.textContent = foto.legenda;
        contador.textContent = `${atual + 1} / ${fotos.length}`;

        [...tiras.children].forEach((botao, n) => {
            botao.setAttribute("aria-current", n === atual ? "true" : "false");
        });

        tiras.children[atual]?.scrollIntoView({ block: "nearest", inline: "center" });
    }

    // Abre o visualizador com as fotos de um quadro
    function abrir(quadro, indice) {
        fotos = [...quadro.querySelectorAll(".mosaico a")].map((link) => {
            const mini = link.querySelector("img");

            return {
                href: link.getAttribute("href"),
                alt: mini.alt,
                legenda: link.dataset.legenda || "",
                mini: mini.getAttribute("src")
            };
        });

        titulo.textContent = quadro.querySelector("h3").textContent;

        // Miniaturas embaixo
        tiras.replaceChildren(...fotos.map((foto, n) => {
            const botao = document.createElement("button");
            const mini = document.createElement("img");

            botao.type = "button";
            botao.setAttribute("aria-label", `Ver foto ${n + 1}`);
            mini.src = foto.mini;
            mini.alt = "";
            botao.appendChild(mini);
            botao.addEventListener("click", () => mostrar(n));

            return botao;
        }));

        // Com uma só foto, não precisa de setas
        visualizador.querySelectorAll(".vis-seta").forEach((seta) => {
            seta.hidden = fotos.length < 2;
        });
        tiras.hidden = fotos.length < 2;

        visualizador.showModal();
        mostrar(indice);
    }

    // Prepara cada quadro
    document.querySelectorAll("[data-galeria]").forEach((quadro) => {
        const links = quadro.querySelectorAll(".mosaico a");
        const botao = quadro.querySelector(".abrir");

        if (botao) {
            botao.textContent = links.length === 1 ? "Ver a foto" : `Ver as ${links.length} fotos`;
            botao.addEventListener("click", () => abrir(quadro, 0));
        }

        // "+N" no último quadradinho visível
        if (links.length > 4) {
            links[3].dataset.extra = `+${links.length - 4}`;
        }

        links.forEach((link, i) => {
            link.addEventListener("click", (evento) => {
                evento.preventDefault();
                abrir(quadro, i);
            });
        });
    });

    // Botões do visualizador
    visualizador.querySelector(".vis-anterior").addEventListener("click", () => mostrar(atual - 1));
    visualizador.querySelector(".vis-proxima").addEventListener("click", () => mostrar(atual + 1));
    visualizador.querySelector(".vis-fechar").addEventListener("click", () => visualizador.close());

    // Setas do teclado (Esc já fecha sozinho)
    visualizador.addEventListener("keydown", (evento) => {
        if (fotos.length < 2) return;
        if (evento.key === "ArrowRight") mostrar(atual + 1);
        if (evento.key === "ArrowLeft") mostrar(atual - 1);
    });

    // Clique fora da janela fecha
    visualizador.addEventListener("click", (evento) => {
        if (evento.target === visualizador) visualizador.close();
    });

    // Arrastar o dedo no celular
    let toqueX = null;

    palco.addEventListener("touchstart", (evento) => {
        toqueX = evento.changedTouches[0].clientX;
    }, { passive: true });

    palco.addEventListener("touchend", (evento) => {
        if (toqueX === null || fotos.length < 2) return;

        const diferenca = evento.changedTouches[0].clientX - toqueX;

        if (Math.abs(diferenca) > 50) mostrar(atual + (diferenca < 0 ? 1 : -1));
        toqueX = null;
    });
}
