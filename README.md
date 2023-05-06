# Sistema de Eventos

 Esse projeto foi desenvolvido para fins acadêmico como parte da disciplina TCC - Desenvolvimento Web Full Stack, do curso de pós-graduação Desenvolvimento Web Full Stack da PUC Minas

Para execução execute o primeiramente o comando no terminal

```
npm install
```

Crie o arquivo .env na raiz do projeto com com as seguintes informações

```
DB_HOST=<host-do-banco>
DB_USER=<usuario-do-banco>
DB_PASSWORD=<senha-do-banco>
DB_NAME=<nome-do-banco>
DB_PORT=<porta-do-banco>
CP_ALG=<algoritmo-de-criptografia>
CP_KEY=<chave-de-criptografia>
EMAIL_SERVICE=<serviço-de-email>
EMAIL_MAIL=<email>
EMAIL_PASS=<senha-do-email>
PORT=<porta-da-aplicacao>
USER_ADM=<email-admin-default>
PASS_ADM=<senha-admin-default>
GOOGLE_CLIENT_ID=<google-app-id>
GOOGLE_CLIENT_SECRET=<google-app-secret>
GOOGLE_CALLBACK_URL=<url-site>/google/callback
FACEBOOK_CLIENT_ID=<facebook-app-id>
FACEBOOK_CLIENT_SECRET=<facebook-app-secret>
FACEBOOK_CALLBACK_URL=<url-site>/facebook/callback
```

Execute o comando abaixo para inserção dos dados default do sistema.

```
node insert.js
```

Para execução do sistema use o comando

node index.js