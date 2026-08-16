#include <ESP8266WiFi.h>
#include <ESP8266HTTPClient.h>
#include <WiFiClientSecureBearSSL.h>
#include <DHT.h>

// ==========================================
// DHT22
// ==========================================

#define DHTPIN D5
#define DHTTYPE DHT22

DHT dht(DHTPIN, DHTTYPE);

// ==========================================
// WI-FI
// ==========================================

const char* SSID = "Jil";
const char* SENHA = "Jirley2026";

// ==========================================
// VERCEL API
// ==========================================

// Exemplo:
// https://estacao-meteorologica.vercel.app/api/dados

const char* API_URL =
  "https://SEU-PROJETO.vercel.app/api/dados";

// ==========================================
// SEGURANÇA
// Deve ser exatamente o mesmo DEVICE_TOKEN
// configurado nas Environment Variables da Vercel.
// ==========================================

const char* DEVICE_TOKEN =
  "SEU_DEVICE_TOKEN";

// ==========================================

void conectarWiFi() {

  Serial.println();
  Serial.println("Conectando ao Wi-Fi...");

  WiFi.mode(WIFI_STA);
  WiFi.begin(SSID, SENHA);

  while (WiFi.status() != WL_CONNECTED) {

    delay(500);
    Serial.print(".");
  }

  Serial.println();
  Serial.println("Wi-Fi conectado!");

  Serial.print("IP: ");
  Serial.println(WiFi.localIP());

  Serial.print("RSSI: ");
  Serial.print(WiFi.RSSI());
  Serial.println(" dBm");
}

// ==========================================

bool enviarDados(float temperatura, float umidade) {

  if (WiFi.status() != WL_CONNECTED) {
    conectarWiFi();
  }

  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("Não foi possível conectar ao Wi-Fi.");
    return false;
  }

  // Cliente HTTPS para ESP8266.
  // setInsecure() facilita o primeiro protótipo.
  // Em uma versão de produção, recomenda-se validar
  // o certificado do servidor.
  std::unique_ptr<BearSSL::WiFiClientSecure> client(
    new BearSSL::WiFiClientSecure
  );

  client->setInsecure();

  HTTPClient https;

  Serial.println();
  Serial.println("Enviando dados para Vercel...");
  Serial.println(API_URL);

  if (!https.begin(*client, API_URL)) {

    Serial.println("Falha ao iniciar HTTPS.");
    return false;
  }

  https.addHeader("Content-Type", "application/json");
  https.addHeader("X-Device-Token", DEVICE_TOKEN);

  String json = "{";
  json += "\"temperatura\":";
  json += String(temperatura, 2);
  json += ",";
  json += "\"umidade\":";
  json += String(umidade, 2);
  json += "}";

  Serial.print("JSON: ");
  Serial.println(json);

  int httpCode = https.POST(json);

  Serial.print("HTTP Code: ");
  Serial.println(httpCode);

  String resposta = https.getString();

  Serial.print("Resposta API: ");
  Serial.println(resposta);

  https.end();

  return httpCode >= 200 && httpCode < 300;
}

// ==========================================

void setup() {

  Serial.begin(115200);

  delay(1000);

  Serial.println();
  Serial.println("==============================");
  Serial.println("ESTAÇÃO METEOROLÓGICA IoT");
  Serial.println("ESP8266 + DHT22 + VERCEL");
  Serial.println("==============================");

  dht.begin();

  conectarWiFi();

  Serial.println("Sistema iniciado!");
}

// ==========================================

void loop() {

  float temperatura = dht.readTemperature();
  float umidade = dht.readHumidity();

  if (isnan(temperatura) || isnan(umidade)) {

    Serial.println("Erro ao ler o DHT22!");

  } else {

    Serial.println();
    Serial.println("------------------------------");

    Serial.print("Temperatura: ");
    Serial.print(temperatura, 2);
    Serial.println(" °C");

    Serial.print("Umidade: ");
    Serial.print(umidade, 2);
    Serial.println(" %");

    Serial.println("------------------------------");

    bool enviado =
      enviarDados(temperatura, umidade);

    if (enviado) {
      Serial.println("✓ Leitura gravada no banco!");
    } else {
      Serial.println("✗ Falha ao gravar leitura.");
    }
  }

  // Uma leitura a cada 30 segundos.
  delay(30000);
}