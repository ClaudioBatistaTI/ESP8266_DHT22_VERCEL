const tabela = document.getElementById("tabela");
const temperaturaEl = document.getElementById("temperatura");
const umidadeEl = document.getElementById("umidade");
const statusEl = document.getElementById("status");
const atualizacaoEl = document.getElementById("atualizacao");
const atualizarBtn = document.getElementById("atualizar");

function formatarData(data) {
  if (!data) return "--";
  const valor = new Date(data.replace(" ", "T") + (data.endsWith("Z") ? "" : "Z"));
  if (Number.isNaN(valor.getTime())) return data;
  return valor.toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "medium"
  });
}

function colocarStatus(online, texto) {
  statusEl.textContent = online ? "● Online" : "● Offline";
  statusEl.classList.toggle("online", online);
  statusEl.classList.toggle("offline", !online);
  if (texto) atualizacaoEl.textContent = texto;
}

function renderizar(leitura) {
  if (!leitura) {
    temperaturaEl.textContent = "-- °C";
    umidadeEl.textContent = "-- %";
    tabela.innerHTML = `<tr><td colspan="3" class="vazio">Nenhum dado recebido.</td></tr>`;
    return;
  }

  temperaturaEl.textContent = `${Number(leitura.temperatura).toFixed(1)} °C`;
  umidadeEl.textContent = `${Number(leitura.umidade).toFixed(1)} %`;
}

function renderizarTabela(leitura) {
  tabela.innerHTML = "";

  if (!leitura.length) {
    tabela.innerHTML = `<tr><td colspan="3" class="vazio">Nenhum dado recebido.</td></tr>`;
    return;
  }

  for (const item of leitura) {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${formatarData(item.data_hora)}</td>
      <td>${Number(item.temperatura).toFixed(1)} °C</td>
      <td>${Number(item.umidade).toFixed(1)} %</td>
    `;
    tabela.appendChild(tr);
  }
}

async function carregarDados() {
  try {
    const resposta = await fetch("/api/dados?limit=20", {
      cache: "no-store"
    });

    const dados = await resposta.json();

    if (!resposta.ok || !dados.ok) {
      throw new Error(dados.erro || `HTTP ${resposta.status}`);
    }

    const leituras = dados.leituras || [];
    const ultima = leituras[0];

    renderizar(ultima);
    renderizarTabela(leituras);

    colocarStatus(
      true,
      ultima
        ? `Última leitura: ${formatarData(ultima.data_hora)}`
        : "API conectada; aguardando a primeira leitura."
    );
  } catch (erro) {
    console.error("Erro ao carregar dados:", erro);
    colocarStatus(false, `Erro: ${erro.message}`);
  }
}

atualizarBtn.addEventListener("click", carregarDados);

carregarDados();
setInterval(carregarDados, 10000);