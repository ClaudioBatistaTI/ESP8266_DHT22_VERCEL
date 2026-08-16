# Estação Meteorológica IoT — ESP8266 + DHT22 + Vercel + SQLite

Projeto inicial para receber temperatura e umidade do ESP8266 e armazenar os dados em SQLite usando Turso Cloud.

## Arquitetura

ESP8266 → Wi-Fi → `POST /api/dados` → Vercel Function → Turso/SQLite → Dashboard → Smartphone

## 1. Banco de dados

A integração oficial Turso Cloud para Vercel fornece:

- `TURSO_DATABASE_URL`
- `TURSO_AUTH_TOKEN`

Depois de conectar o Turso ao projeto Vercel, essas variáveis devem aparecer no projeto.

O endpoint `/api/dados` cria automaticamente a tabela `leituras` na primeira chamada.

## 2. Variável de segurança

Crie também na Vercel:

`DEVICE_TOKEN`

Use uma senha/token aleatório longo, por exemplo:

`ESTACAO-2026-TOKEN-TROQUE-ESTE-VALOR`

O ESP8266 enviará esse valor no cabeçalho:

`X-Device-Token`

Se `DEVICE_TOKEN` não estiver definido, a API aceita POST sem token (útil somente para testes).

## 3. Deploy

1. Suba este projeto para um repositório GitHub.
2. Importe o repositório na Vercel.
3. Framework: projeto simples/Other.
4. Root Directory: raiz do repositório.
5. Não defina Build Command para este projeto estático.
6. Conecte o Turso pelo Marketplace/Storage da Vercel.
7. Confira as variáveis de ambiente.
8. Adicione `DEVICE_TOKEN`.
9. Faça Redeploy.

## 4. Teste da API

Depois do deploy:

GET:

`https://SEU-PROJETO.vercel.app/api/dados`

POST de exemplo:

```bash
curl -X POST "https://SEU-PROJETO.vercel.app/api/dados" \
  -H "Content-Type: application/json" \
  -H "X-Device-Token: SEU_DEVICE_TOKEN" \
  -d "{\"temperatura\":25.3,\"umidade\":72.1}"
```

## 5. ESP8266

Use o código fornecido em `ESP8266_DHT22_VERCEL.ino`.

Altere:

- `SSID`
- `SENHA`
- `API_URL`
- `DEVICE_TOKEN`

A URL deve ser:

`https://SEU-PROJETO.vercel.app/api/dados`

## 6. Dashboard

A página inicial consulta `/api/dados` a cada 10 segundos e mostra a última leitura e as 20 últimas leituras.

## Observação

SQLite local em arquivo dentro do filesystem da Vercel não deve ser usado como banco persistente. Aqui usamos Turso, que fornece SQLite/libSQL hospedado e adequado ao ambiente serverless.