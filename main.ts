const CARACTERES_PERMITIDOS = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const PESOS_DV1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
const PESOS_DV2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
const TAMANHO_CORPO = 12;
const TAMANHO_TOTAL = 14;
const DURACAO_TOAST_MS = 2500;

let valorAtual: string | null = null;
let timeoutToast: number | undefined;

const campoResultadoElemento = document.getElementById("campo-resultado");
const botaoGerarElemento = document.getElementById("botao-gerar");
const botaoCopiarElemento = document.getElementById("botao-copiar");
const toastElementoBase = document.getElementById("toast");

if (
  !(campoResultadoElemento instanceof HTMLInputElement) ||
  !(botaoGerarElemento instanceof HTMLButtonElement) ||
  !(botaoCopiarElemento instanceof HTMLButtonElement) ||
  !(toastElementoBase instanceof HTMLDivElement)
) {
  throw new Error("Elementos essenciais não encontrados na página.");
}

const campoResultado = campoResultadoElemento;
const botaoGerar = botaoGerarElemento;
const botaoCopiar = botaoCopiarElemento;
const toastElemento = toastElementoBase;

// Gera uma sequência aleatória de 12 caracteres permitidos.
function gerarCorpoAlfanumerico(): string {
  let corpo = "";
  for (let i = 0; i < TAMANHO_CORPO; i += 1) {
    const indice = Math.floor(Math.random() * CARACTERES_PERMITIDOS.length);
    corpo += CARACTERES_PERMITIDOS[indice];
  }
  return corpo;
}

// Converte cada caractere da sequência em seu valor ASCII numérico.
function converterParaASCII(corpo: string): number[] {
  return Array.from(corpo).map((caractere) => caractere.charCodeAt(0));
}

// Calcula um dígito verificador seguindo o módulo 11 com os pesos fornecidos.
function calcularDigitoVerificador(valores: number[], pesos: number[]): number {
  const soma = valores.reduce((acumulado, valor, indice) => acumulado + valor * pesos[indice], 0);
  const resto = soma % 11;
  return resto < 2 ? 0 : 11 - resto;
}

// Valida se todos os caracteres de uma sequência são iguais.
function sequenciaRepetida(valor: string): boolean {
  return valor.split("").every((caractere) => caractere === valor[0]);
}

// Aplica a máscara ##.###.###/####-## convertendo letras para dígitos visuais.
export function toMasked(valor: string): string {
  const numerosParaMascara = Array.from(valor).map((caractere) => {
    return /\d/.test(caractere) ? caractere : String(caractere.charCodeAt(0) % 10);
  });
  const mascara = "##.###.###/####-##";
  let indice = 0;
  let resultado = "";

  for (const simbolo of mascara) {
    if (simbolo === "#") {
      resultado += numerosParaMascara[indice] ?? "";
      indice += 1;
    } else {
      resultado += simbolo;
    }
  }

  return resultado;
}

// Assegura regras básicas de sanidade da sequência final.
function verificarSanidade(valor: string): void {
  if (valor.length !== TAMANHO_TOTAL) {
    throw new Error("Identificador inválido: tamanho inesperado.");
  }
  const dv1 = valor[TAMANHO_TOTAL - 2];
  const dv2 = valor[TAMANHO_TOTAL - 1];
  if (!/\d/.test(dv1) || !/\d/.test(dv2)) {
    throw new Error("Identificador inválido: dígitos verificadores não numéricos.");
  }
}

// Gera um identificador completo com corpo + DV1 + DV2, evitando sequências repetidas.
function gerarIdentificador(): { valor: string; mascarado: string } {
  for (let tentativas = 0; tentativas < 1000; tentativas += 1) {
    const corpo = gerarCorpoAlfanumerico();
    const valoresASCII = converterParaASCII(corpo);

    if (sequenciaRepetida(corpo)) {
      continue;
    }

    const dv1 = calcularDigitoVerificador(valoresASCII, PESOS_DV1);
    const dv2 = calcularDigitoVerificador([...valoresASCII, dv1], PESOS_DV2);

    const completo = `${corpo}${dv1}${dv2}`;

    if (sequenciaRepetida(completo)) {
      continue;
    }

    verificarSanidade(completo);
    return { valor: completo, mascarado: toMasked(completo) };
  }

  throw new Error("Não foi possível gerar um identificador válido após várias tentativas.");
}

// Copia o valor informado para a área de transferência.
async function copiarParaClipboard(valor: string): Promise<void> {
  await navigator.clipboard.writeText(valor);
}

// Exibe uma mensagem temporária de feedback ao usuário.
function exibirToast(mensagem: string, tipo: "sucesso" | "erro" = "sucesso"): void {
  toastElemento.textContent = mensagem;
  toastElemento.classList.remove("erro", "visivel");
  if (tipo === "erro") {
    toastElemento.classList.add("erro");
  }
  requestAnimationFrame(() => {
    toastElemento.classList.add("visivel");
  });
  if (timeoutToast !== undefined) {
    window.clearTimeout(timeoutToast);
  }
  timeoutToast = window.setTimeout(() => {
    toastElemento.classList.remove("visivel");
  }, DURACAO_TOAST_MS);
}

// Remove o toast imediatamente (útil ao gerar um novo valor).
function ocultarToast(): void {
  toastElemento.classList.remove("visivel", "erro");
  if (timeoutToast !== undefined) {
    window.clearTimeout(timeoutToast);
  }
}

// Evento principal do botão Gerar.
botaoGerar.addEventListener("click", () => {
  try {
    const { valor, mascarado } = gerarIdentificador();
    valorAtual = valor;
    campoResultado.value = mascarado;
    ocultarToast();
  } catch (erro) {
    const mensagem = erro instanceof Error ? erro.message : "Erro inesperado ao gerar.";
    valorAtual = null;
    campoResultado.value = "";
    exibirToast(mensagem, "erro");
  }
});

// Evento do botão Copiar.
botaoCopiar.addEventListener("click", async () => {
  if (!valorAtual) {
    exibirToast("Nenhum CNPJ gerado para copiar.", "erro");
    return;
  }

  try {
    await copiarParaClipboard(valorAtual);
    exibirToast(`CNPJ copiado: ${valorAtual}`);
  } catch (erro) {
    const mensagem = erro instanceof Error ? erro.message : "Falha ao copiar.";
    exibirToast(mensagem, "erro");
  }
});

// Exemplos rápidos:
// gerarCorpoAlfanumerico() -> "0AB3..." (12 caracteres)
// toMasked("ABC12345678901") -> "56.712.345/6789-01"
