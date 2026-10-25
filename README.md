# Prospector AI

Prospecção local com diagnóstico digital, CRM e propostas para agências.

- **Client:** React 19, TypeScript, Vite, Tailwind, TanStack Query
- **Server:** Node.js, Express 5, Firebase Admin/Firestore, Zod
- **Providers:** Geoapify (grátis), TomTom (grátis), OpenStreetMap/Overpass, Foursquare Places (opcional: Google Places)
- **IA:** Groq com fallback para Gemini (opcional)

## Estrutura

```
client/   aplicação React
server/   API Express + Firestore
.github/  CI (testes do server, lint/build do client)
```

## 1. Server

```powershell
cd server
Copy-Item .env.example .env
npm install
npm run dev
```

Preencha no `server/.env`:

- `FIREBASE_JSON` **ou** `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`
  (service account do Firebase Admin; a private key mantém os `\n` escapados)
- `GEOAPIFY_API_KEY` (busca Geoapify + geocoding)
- `TOMTOM_API_KEY` (busca TomTom + geocoding)
- `FOURSQUARE_API_KEY` (busca Foursquare)
- `GROQ_API_KEY` e/ou `GEMINI_API_KEY`
- `ALLOWED_ORIGINS` (produção + `http://localhost:5173`)
- `ALLOWED_EMAILS` (e-mails autorizados, separados por vírgula; vazio = qualquer conta)
- `OWNER_UID` (apenas para migrar o CRM legado)

O server sobe em `http://localhost:10000`. Health check: `GET /api/health`.

## 2. Client

```powershell
cd client
Copy-Item .env.example .env
npm install
npm run dev
```

Preencha no `client/.env` as chaves do **app web** do Firebase:

```
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_APP_ID=
```

No console do Firebase:

1. Ative **Authentication > Email/Senha**.
2. Adicione `localhost` e o domínio da Vercel em **Authorized domains**.
3. Crie o usuário no **Firebase Console > Authentication > Users** e coloque o e-mail em `ALLOWED_EMAILS` no server. O cadastro público fica desabilitado na tela de login.

Em desenvolvimento o client chama `http://localhost:10000/api` diretamente.
Em produção o client usa `VITE_API_URL` ou `https://prospector-api-mngo.onrender.com/api`.

## 3. Migrar CRM legado

O CRM agora é escopado por usuário (`crm_leads/{uid}_{leadId}`). Rode uma vez:

```powershell
cd server
npm run migrate:owner -- SEU_FIREBASE_UID --dry-run
npm run migrate:owner -- SEU_FIREBASE_UID
```

Documentos antigos são mantidos, mas deixam de aparecer por causa do filtro `ownerUid`.

## 4. Verificações

```powershell
cd server; npm test
cd client; npm run lint; npm run build
```

## Segurança e uso responsável

- Todas as rotas `/api`, exceto `/` e `/api/health`, exigem Bearer token do Firebase.
- `safeFetch` bloqueia IPs privados, metadata service, portas incomuns e redirecionamentos para a rede interna (proteção SSRF).
- Quotas diárias por usuário: buscas, análises e chamadas de IA (`usage/{uid}_{YYYY-MM-DD}`).
- Use apenas fontes e APIs permitidas (Geoapify/OSM, TomTom, Overpass, Foursquare). Não faça scraping de Google, Instagram ou Facebook.
- Respeite os termos de cada provider e mantenha a atribuição exigida: Geoapify/OSM, © TomTom, Foursquare.
