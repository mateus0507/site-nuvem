# Site da Praça Américo Ferreira de Abreu (PANA Projetos)

O site, o mural e o banco PostgreSQL são publicados juntos. A tabela do banco é criada sozinha na primeira execução e as mensagens aparecem no mural assim que são enviadas. Não precisa de Docker.

## Como publicar (Render, sem configurar nada)
1. **GitHub:** crie um repositório e envie **todo o conteúdo desta pasta** para a raiz dele (o arquivo `render.yaml` precisa ficar na raiz, não dentro de outra pasta). Pelo site do GitHub: *Add file > Upload files* e arraste tudo.
2. **Render:** crie uma conta em render.com, clique em **New > Blueprint**, escolha o repositório e clique em **Apply**. O Render pede um cartão porque o `render.yaml` usa planos pagos (site *starter* e banco *basic-256mb*); confira os valores atuais no painel.
3. **Pronto:** quando o build terminar, abra o endereço `https://...onrender.com` que aparece no painel. Para conferir o banco, abra `/api/db-status` (deve mostrar "conectado") e envie uma mensagem de teste no mural.

A senha da moderação é gerada sozinha: no Render, abra o serviço > **Environment** > `ADMIN_TOKEN`. O painel fica em `/admin/admin.html`.

Se der erro no deploy, abra a aba **Logs** do serviço e envie o erro para análise.

## Antes de publicar
- [ ] Trocar fotos e textos de exemplo pelos reais (as fotos ficam em `assets/img/`)
- [ ] Trocar `contato@seudominio.com.br` e `@seuperfil` no rodapé das 4 páginas

## Outra hospedagem
Serve qualquer uma que rode Node e tenha PostgreSQL:

| Item | Valor |
|---|---|
| Build | `npm ci --prefix backend` |
| Start | `node backend/src/server.js` |
| `NODE_ENV` | `production` |
| `DATABASE_URL` | URL do banco (e `DB_SSL=true` se ele exigir SSL) |
| `ADMIN_TOKEN` | senha longa (mín. 16 caracteres) para a moderação |

## Moderação
As mensagens são publicadas na hora. Para esconder ou apagar alguma, entre em `/admin/admin.html` com a senha e use **Rejeitar** ou **Apagar** (aba *Aprovadas*). Para que toda mensagem espere aprovação antes de aparecer, defina `PUBLICAR_DIRETO=false`.

## Proteções já incluídas
Limite de envios por IP, bloqueio de links nas mensagens, cabeçalhos de segurança e senha na moderação.

## Testar no seu computador (opcional)
Precisa só do Node 20+ instalado (não precisa de banco: no computador as mensagens ficam guardadas num arquivo de teste).
```
cd backend
npm install
npm start
```
Deixe esse terminal aberto e abra http://localhost:3000. Se preferir o Live Server do VS Code, ele também funciona, **desde que o `npm start` esteja rodando**. Sem o backend rodando o mural não consegue salvar nada.
Na hospedagem (Render) o banco é o PostgreSQL de verdade.

## Observações
- Para usar vídeo, mapa ou imagem hospedada em outro site, libere o endereço dele em `backend/src/middleware/seguranca.js`; senão o navegador bloqueia.
