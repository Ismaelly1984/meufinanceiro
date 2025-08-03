const form = document.getElementById('form');
const lista = document.getElementById('lista-transacoes');
const saldoSpan = document.getElementById('saldo');
const totalReceitasSpan = document.getElementById('total-receitas');
const totalDespesasSpan = document.getElementById('total-despesas');
const limiteInput = document.getElementById("limite");
const barraProgresso = document.getElementById("barra-progresso");
const gastoAtualSpan = document.getElementById("gasto-atual");
const porcentagemGastoSpan = document.getElementById("porcentagem-gasto");

let limiteGasto = parseFloat(localStorage.getItem("limiteGasto")) || 0;
if (limiteGasto > 0) {
  limiteInput.value = limiteGasto;
}
document.getElementById('hamburger').addEventListener('click', () => {
  document.getElementById('nav-links').classList.toggle('active');
});

// Carregar transações do LocalStorage ou iniciar vazio
let transacoes = JSON.parse(localStorage.getItem('transacoes')) || [];
let graficoPizza = null; // gráfico de pizza
let graficoLinha = null; // Adicione esta linha para o gráfico de linha

// Função para exibir mensagens personalizadas (toasts)
function exibirMensagem(texto, tipo = 'info', duracao = 3000) {
    const mensagemDiv = document.getElementById('mensagem-app');

    // --- A VERIFICAÇÃO DEVE SER FEITA AQUI, NO INÍCIO ---
    console.log('Elemento mensagemDiv:', mensagemDiv); // Log para ver o elemento
    if (!mensagemDiv) {
        console.error('Erro: Elemento #mensagem-app não encontrado no HTML. Certifique-se de que está no index.html.');
        return; // Sai da função se o elemento não for encontrado
    }
    // ----------------------------------------------------

    mensagemDiv.textContent = texto;
    mensagemDiv.className = 'mensagem-app show ' + tipo; // Adiciona classe 'show' e o tipo

    // Log para ver as classes APÓS serem adicionadas
    console.log('Classes adicionadas:', mensagemDiv.className);

    setTimeout(() => {
        mensagemDiv.classList.remove('show');
        mensagemDiv.classList.remove(tipo); // Remove o tipo também
    }, duracao);
}
// Salvar no localStorage
function atualizarLocalStorage() {
    localStorage.setItem('transacoes', JSON.stringify(transacoes));
}
// Atualizar barra de progresso do limite
function salvarLimite() {
  const valor = parseFloat(limiteInput.value);
  if (!isNaN(valor) && valor > 0) {
    limiteGasto = valor;
    localStorage.setItem("limiteGasto", valor);
    atualizarBarraLimite();
  }
}

function atualizarBarraLimite() {
  let totalDespesas = 0;
  transacoes.forEach(t => {
    if (t.tipo === 'despesa') {
      totalDespesas += parseFloat(t.valor);
    }
  });

  const porcentagem = limiteGasto > 0 ? Math.min((totalDespesas / limiteGasto) * 100, 100) : 0;

  barraProgresso.style.width = `${porcentagem}%`;
  gastoAtualSpan.textContent = totalDespesas.toFixed(2);
  porcentagemGastoSpan.textContent = porcentagem.toFixed(0);
}
// Inicializar barra de progresso
atualizarBarraLimite();
// Atualizar limite ao carregar a página
limiteInput.value = limiteGasto;
// Atualizar limite ao alterar o input
limiteInput.addEventListener("change", salvarLimite);
// Atualizar barra de progresso ao alterar o limite
limiteInput.addEventListener("input", atualizarBarraLimite);
// Obter ícone por categoria    

function getIconClass(categoria) {
    const icons = {
        alimentacao: "fa-utensils",
        transporte: "fa-bus",
        lazer: "fa-gamepad",
        saude: "fa-heartbeat",
        educacao: "fa-book",
        salario: "fa-money-bill-wave",
        outros: "fa-ellipsis-h"
    };
    return icons[categoria] || "fa-folder";
}
// Calcular saldo total, receitas e despesas
function calcularSaldo() {
    let totalReceitas = 0;
    let totalDespesas = 0;

    transacoes.forEach(t => {
        if (t.tipo === 'receita') {
            totalReceitas += parseFloat(t.valor);
        } else {
            totalDespesas += parseFloat(t.valor);
        }
    });

    const saldo = totalReceitas - totalDespesas;

    totalReceitasSpan.textContent = saldo.toFixed(2); // Corrigido para exibir o saldo total
    totalDespesasSpan.textContent = totalDespesas.toFixed(2);
    saldoSpan.textContent = saldo.toFixed(2);
    // Adicionar classe 'negativo' se o saldo for menor que zero
    if (saldo < 0) {
        saldoSpan.classList.add('negativo');
    } else {
        saldoSpan.classList.remove('negativo');
    }
}

// Renderizar a lista de transações
function renderizarTransacoes() {
    lista.innerHTML = '';

    transacoes.forEach((t, index) => {
        const li = document.createElement('li');
        li.classList.add(t.tipo); // receita ou despesa

        const iconClass = getIconClass(t.categoria);

        // Adição da estrutura de classes para aprimorar o CSS existente
        li.innerHTML = `
      <div class="info-transacao">
        <i class="fas ${iconClass}"></i> 
        <span class="descricao">${t.descricao}</span>
        <small class="data">${t.data} - ${t.categoria}</small>
      </div>
      <span class="valor-transacao">R$ ${parseFloat(t.valor).toFixed(2)}</span>
      <button title="Remover" onclick="removerTransacao(${index})" class="btn-remover">❌</button>
    `;

        lista.appendChild(li);
    });

    calcularSaldo();
    atualizarGrafico();
    atualizarGraficoLinha(); 
}

// Atualizar gráfico de linha
function atualizarGraficoLinha() {
    const despesas = transacoes.filter(t => t.tipo === 'despesa'); // Filtra apenas despesas.

    // Agrupar despesas por mês
    const despesasPorMes = {};
    despesas.forEach(t => {
        const [ano, mes, dia] = t.data.split('-'); // Divide a data (ex: 2025-07-30)
        const chaveMes = `${ano}-${mes}`; // Cria a chave 'AAAA-MM'
        despesasPorMes[chaveMes] = (despesasPorMes[chaveMes] || 0) + parseFloat(t.valor);
    });

    // Ordenar os meses cronologicamente
    const labels = Object.keys(despesasPorMes).sort();
    const valores = labels.map(mes => despesasPorMes[mes]);

    // Destruir o gráfico anterior se existir
    if (graficoLinha) graficoLinha.destroy();

    const ctx = document.getElementById('graficoLinha').getContext('2d');
    graficoLinha = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Gastos por Mês (R$)',
                data: valores,
                borderColor: '#00bcd4', // Cor da linha
                backgroundColor: 'rgba(0, 188, 212, 0.2)', // Cor da área abaixo da linha
                fill: true,
                tension: 0.4 // Curvatura da linha
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'top'
                },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            const valor = context.raw.toFixed(2).replace('.', ',');
                            return `${context.dataset.label}: R$ ${valor}`;
                        },
                        title: function (context) {
                            // Formata o título para mostrar "Mês/Ano"
                            const [ano, mes] = context[0].label.split('-');
                            const data = new Date(ano, mes - 1); // mes-1 pois o mês em Date é 0-indexado
                            return data.toLocaleString('pt-BR', { month: 'long', year: 'numeric' });
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Valor (R$)'
                    },
                    ticks: {
                        callback: function(value) {
                            return `R$ ${value.toFixed(2).replace('.', ',')}`;
                        }
                    }
                }
            }
        }
    });
}
// Remover transação
function removerTransacao(index) {
    transacoes.splice(index, 1);
    atualizarLocalStorage();
    renderizarTransacoes();
    atualizarBarraLimite(); // Atualiza a barra de limite após remover transação
    exibirMensagem('Transação removida com sucesso!', 'info'); // Adiciona esta linha
}

// Adicionar nova transação
form.addEventListener('submit', (e) => {
    e.preventDefault();

    const descricao = document.getElementById('descricao').value.trim();
    const valor = document.getElementById('valor').value;
    const tipo = document.getElementById('tipo').value;
    const categoria = document.getElementById('categoria').value;
    const data = document.getElementById('data').value;

    if (!descricao || !valor || !tipo || !categoria || !data) {
        alert('Por favor, preencha todos os campos.'); // Mensagem mais amigável
        return;
    }

    // Nova validação: Verificar se o valor é um número válido e positivo
    const valorNumerico = parseFloat(valor);
    if (isNaN(valorNumerico) || valorNumerico <= 0) {
        alert('Por favor, insira um valor numérico válido e positivo para a transação.'); // Mensagem de erro específica
        return;
    }

    // Nova validação: Verificar se a data não é futura
    const dataTransacao = new Date(data + 'T00:00:00'); // Adiciona T00:00:00 para evitar problemas de fuso horário
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0); // Zera a hora para comparar apenas a data

    if (dataTransacao > hoje) {
        alert('A data da transação não pode ser futura.'); // Mensagem de erro específica
        return;
    }

    transacoes.push({ descricao, valor, tipo, categoria, data });
    atualizarLocalStorage();
    renderizarTransacoes();
    atualizarBarraLimite(); // Atualiza a barra de limite após adicionar transação
    form.reset();
    exibirMensagem('Transação adicionada com sucesso!', 'success'); // Adiciona esta linha
});

// Gráfico de pizza (por categoria)
function atualizarGrafico() {
    const despesas = transacoes.filter(t => t.tipo === 'despesa'); // Filtra apenas despesas.

    const categorias = {};
    despesas.forEach(t => {
        categorias[t.categoria] = (categorias[t.categoria] || 0) + parseFloat(t.valor);
    });

    const labels = Object.keys(categorias);
    const valores = Object.values(categorias);

    const cores = [
        '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0',
        '#9966FF', '#FF9F40', '#8BC34A', '#EC407A'
    ];

    if (graficoPizza) graficoPizza.destroy();

    const ctx = document.getElementById('graficoPizza').getContext('2d');
    graficoPizza = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                label: 'Despesas por Categoria',
                data: valores,
                backgroundColor: cores.slice(0, labels.length),
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'bottom'
                },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            const valor = context.raw.toFixed(2).replace('.', ',');
                            return `${context.label}: R$ ${valor}`;
                        }
                    }
                }
            }
        }
    });
}

// Inicializar app
renderizarTransacoes();
atualizarBarraLimite(); // Garante que a barra de limite seja inicializada corretamente ao carregar a página.


if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('service-worker.js')
    .then(() => console.log("✔️ Service Worker registrado"))
    .catch(err => console.error("Erro ao registrar o Service Worker", err));
}

// ** Código para navegação suave e centralização da seção (corrigido) **
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault(); // Impede o comportamento padrão do link

        const targetId = this.getAttribute('href');
        const targetElement = document.querySelector(targetId);

        if (targetElement) {
            // Fecha o menu hambúrguer se estiver aberto (apenas para mobile)
            const navLinks = document.getElementById('nav-links');
            if (navLinks.classList.contains('active')) {
                navLinks.classList.remove('active');
            }

            // Pega a altura da navbar para ajuste
            const navbar = document.querySelector('.navbar');
            const navbarHeight = navbar ? navbar.offsetHeight : 0; // Obtém a altura real da navbar

            // Calcula a posição de rolagem para centralizar a seção
            const elementRect = targetElement.getBoundingClientRect();
            const absoluteElementTop = elementRect.top + window.pageYOffset;
            
            // Calcula a posição para centralizar
            // (Altura total visível - altura navbar - altura elemento) / 2
            const offset = (window.innerHeight - navbarHeight - elementRect.height) / 2;
            const scrollToPosition = absoluteElementTop - navbarHeight - offset;

            // Rola suavemente para a posição calculada
            window.scrollTo({
                top: Math.max(0, scrollToPosition), // Garante que não role para um valor negativo
                behavior: 'smooth'
            });
        }
    });
});