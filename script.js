// ============================================================
// CONFIGURAÇÕES
// ============================================================

const API_URL = "/api/data";

const INTERVALO_ATUALIZACAO = 10000;

const LIMITE_REGISTROS = 20;


// ============================================================
// ELEMENTOS DA INTERFACE
// ============================================================

const elementoTemperatura =
  document.getElementById("temperatura");

const elementoUmidade =
  document.getElementById("umidade");

const elementoTabela =
  document.getElementById("tabela");

const elementoStatus =
  document.getElementById("status");

const elementoAtualizacao =
  document.getElementById("atualizacao");

const botaoAtualizar =
  document.getElementById("atualizar");

const elementoTotalRegistros =
  document.getElementById("total-registros");


// ============================================================
// VARIÁVEIS DO GRÁFICO
// ============================================================

let grafico = null;


// ============================================================
// FORMATAR DATA
// ============================================================

function formatarData(data) {

  if (!data) {
    return "--";
  }

  const valor = new Date(data);

  if (Number.isNaN(valor.getTime())) {
    return data;
  }

  return valor.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  });
}


// ============================================================
// CONVERTER NÚMERO
// ============================================================

function numero(valor) {

  const resultado = Number(valor);

  if (!Number.isFinite(resultado)) {
    return null;
  }

  return resultado;
}


// ============================================================
// ATUALIZAR STATUS
// ============================================================

function alterarStatus(online, mensagem) {

  if (online) {

    elementoStatus.className =
      "status online";

    elementoStatus.textContent =
      "● Online";

  } else {

    elementoStatus.className =
      "status offline";

    elementoStatus.textContent =
      "● Offline";

  }

  if (mensagem) {

    elementoAtualizacao.textContent =
      mensagem;

  }
}


// ============================================================
// CARREGAR DADOS DA API
// ============================================================

async function carregarDados() {

  try {

    alterarStatus(
      false,
      "Consultando dados..."
    );


    // --------------------------------------------------------
    // IMPORTANTE:
    // Mantemos a mesma API da Vercel.
    // --------------------------------------------------------

    const resposta = await fetch(
      API_URL,
      {
        method: "GET",
        headers: {
          "Accept": "application/json"
        },

        cache: "no-store"
      }
    );


    // --------------------------------------------------------
    // VERIFICAR RESPOSTA
    // --------------------------------------------------------

    if (!resposta.ok) {

      throw new Error(
        `HTTP ${resposta.status}`
      );

    }


    const dados = await resposta.json();


    console.log(
      "Dados recebidos da API:",
      dados
    );


    // --------------------------------------------------------
    // NORMALIZAR DADOS
    // --------------------------------------------------------

    const registros =
      obterRegistros(dados);


    if (!registros.length) {

      mostrarSemDados();

      alterarStatus(
        true,
        "API conectada, mas não existem registros."
      );

      return;

    }


    // --------------------------------------------------------
    // ORDENAR
    // --------------------------------------------------------

    const registrosOrdenados =
      ordenarRegistros(registros);


    // --------------------------------------------------------
    // PEGAR OS ÚLTIMOS 20
    // --------------------------------------------------------

    const ultimos =
      registrosOrdenados.slice(
        -LIMITE_REGISTROS
      );


    // --------------------------------------------------------
    // ATUALIZAR CARDS
    // --------------------------------------------------------

    atualizarCards(ultimos);


    // --------------------------------------------------------
    // ATUALIZAR TABELA
    // --------------------------------------------------------

    atualizarTabela(ultimos);


    // --------------------------------------------------------
    // ATUALIZAR GRÁFICO
    // --------------------------------------------------------

    atualizarGrafico(ultimos);


    // --------------------------------------------------------
    // TOTAL DE REGISTROS
    // --------------------------------------------------------

    elementoTotalRegistros.textContent =
      `${ultimos.length} registros`;


    // --------------------------------------------------------
    // STATUS
    // --------------------------------------------------------

    alterarStatus(
      true,
      `Última atualização: ${new Date().toLocaleTimeString("pt-BR")}`
    );


  } catch (erro) {

    console.error(
      "Erro ao carregar dados:",
      erro
    );


    alterarStatus(
      false,
      "Erro ao consultar a API."
    );

  }

}


// ============================================================
// OBTER REGISTROS
// ============================================================

function obterRegistros(dados) {

  // ----------------------------------------------------------
  // Caso a API retorne:
  //
  // {
  //   dados: [...]
  // }
  // ----------------------------------------------------------

  if (Array.isArray(dados.dados)) {

    return dados.dados;

  }


  // ----------------------------------------------------------
  // Caso a API retorne:
  //
  // {
  //   data: [...]
  // }
  // ----------------------------------------------------------

  if (Array.isArray(dados.data)) {

    return dados.data;

  }


  // ----------------------------------------------------------
  // Caso a API retorne diretamente um array
  // ----------------------------------------------------------

  if (Array.isArray(dados)) {

    return dados;

  }


  // ----------------------------------------------------------
  // Nenhum registro encontrado
  // ----------------------------------------------------------

  return [];

}


// ============================================================
// ORDENAR REGISTROS
// ============================================================

function ordenarRegistros(registros) {

  return [...registros].sort(
    (a, b) => {

      const dataA =
        new Date(
          a.horario ||
          a.data ||
          a.created_at ||
          a.timestamp ||
          0
        ).getTime();


      const dataB =
        new Date(
          b.horario ||
          b.data ||
          b.created_at ||
          b.timestamp ||
          0
        ).getTime();


      return dataA - dataB;

    }
  );

}


// ============================================================
// ATUALIZAR CARDS
// ============================================================

function atualizarCards(registros) {

  if (!registros.length) {
    return;
  }


  // Último registro

  const ultimo =
    registros[registros.length - 1];


  const temperatura =
    numero(
      ultimo.temperatura
    );


  const umidade =
    numero(
      ultimo.umidade
    );


  if (temperatura !== null) {

    elementoTemperatura.textContent =
      `${temperatura.toFixed(1)} °C`;

  }


  if (umidade !== null) {

    elementoUmidade.textContent =
      `${umidade.toFixed(1)} %`;

  }

}


// ============================================================
// ATUALIZAR TABELA
// ============================================================

function atualizarTabela(registros) {

  elementoTabela.innerHTML = "";


  // ----------------------------------------------------------
  // Mostrar registros mais recentes primeiro
  // ----------------------------------------------------------

  const registrosTabela =
    [...registros].reverse();


  registrosTabela.forEach(
    registro => {

      const linha =
        document.createElement("tr");


      const data =
        registro.horario ||
        registro.data ||
        registro.created_at ||
        registro.timestamp;


      const temperatura =
        numero(
          registro.temperatura
        );


      const umidade =
        numero(
          registro.umidade
        );


      linha.innerHTML = `

        <td>
          ${formatarData(data)}
        </td>

        <td>
          ${
            temperatura !== null
              ? temperatura.toFixed(1) + " °C"
              : "--"
          }
        </td>

        <td>
          ${
            umidade !== null
              ? umidade.toFixed(1) + " %"
              : "--"
          }
        </td>

      `;


      elementoTabela.appendChild(
        linha
      );

    }
  );

}


// ============================================================
// CRIAR / ATUALIZAR GRÁFICO
// ============================================================

function atualizarGrafico(registros) {

  const canvas =
    document.getElementById("grafico");


  if (!canvas) {
    return;
  }


  // ----------------------------------------------------------
  // LABELS
  // ----------------------------------------------------------

  const labels =
    registros.map(
      registro => {

        const data =
          registro.horario ||
          registro.data ||
          registro.created_at ||
          registro.timestamp;

        return formatarHora(data);

      }
    );


  // ----------------------------------------------------------
  // TEMPERATURA
  // ----------------------------------------------------------

  const temperaturas =
    registros.map(
      registro =>
        numero(
          registro.temperatura
        )
    );


  // ----------------------------------------------------------
  // UMIDADE
  // ----------------------------------------------------------

  const umidades =
    registros.map(
      registro =>
        numero(
          registro.umidade
        )
    );


  // ----------------------------------------------------------
  // SE JÁ EXISTE GRÁFICO, ATUALIZAR
  // ----------------------------------------------------------

  if (grafico) {

    grafico.data.labels =
      labels;

    grafico.data.datasets[0].data =
      temperaturas;

    grafico.data.datasets[1].data =
      umidades;

    grafico.update();

    return;

  }


  // ----------------------------------------------------------
  // CRIAR GRÁFICO
  // ----------------------------------------------------------

  grafico =
    new Chart(
      canvas,
      {

        type: "line",

        data: {

          labels: labels,

          datasets: [

            // ----------------------------------------------
            // TEMPERATURA
            // ----------------------------------------------

            {
              label: "Temperatura (°C)",

              data: temperaturas,

              borderWidth: 3,

              tension: 0.35,

              fill: false,

              pointRadius: 4,

              pointHoverRadius: 7
            },


            // ----------------------------------------------
            // UMIDADE
            // ----------------------------------------------

            {
              label: "Umidade (%)",

              data: umidades,

              borderWidth: 3,

              tension: 0.35,

              fill: false,

              pointRadius: 4,

              pointHoverRadius: 7
            }

          ]

        },


        options: {

          responsive: true,

          maintainAspectRatio: false,


          interaction: {

            intersect: false,

            mode: "index"

          },


          plugins: {

            legend: {

              display: true,

              position: "top"

            },


            tooltip: {

              enabled: true

            }

          },


          scales: {

            x: {

              title: {

                display: true,

                text: "Horário"

              }

            },


            y: {

              title: {

                display: true,

                text: "Valor"

              },

              beginAtZero: false

            }

          }

        }

      }
    );

}


// ============================================================
// FORMATAR SOMENTE A HORA
// ============================================================

function formatarHora(data) {

  if (!data) {
    return "--:--";
  }


  const valor =
    new Date(data);


  if (
    Number.isNaN(
      valor.getTime()
    )
  ) {

    return String(data);

  }


  return valor.toLocaleTimeString(
    "pt-BR",
    {
      hour: "2-digit",
      minute: "2-digit"
    }
  );

}


// ============================================================
// SEM DADOS
// ============================================================

function mostrarSemDados() {

  elementoTemperatura.textContent =
    "-- °C";

  elementoUmidade.textContent =
    "-- %";


  elementoTabela.innerHTML = `

    <tr>

      <td
        colspan="3"
        class="vazio">

        Nenhum dado recebido.

      </td>

    </tr>

  `;


  elementoTotalRegistros.textContent =
    "0 registros";


  // Destruir gráfico

  if (grafico) {

    grafico.destroy();

    grafico = null;

  }

}


// ============================================================
// BOTÃO ATUALIZAR
// ============================================================

botaoAtualizar.addEventListener(
  "click",
  carregarDados
);


// ============================================================
// PRIMEIRA EXECUÇÃO
// ============================================================

carregarDados();


// ============================================================
// ATUALIZAÇÃO AUTOMÁTICA
// ============================================================

setInterval(
  carregarDados,
  INTERVALO_ATUALIZACAO
);