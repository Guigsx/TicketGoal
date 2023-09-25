document.addEventListener("DOMContentLoaded", function () {
    const valoresIngresso = {
        A: 50.00,
        B: 40.00,
        C: 35.00,
        D: 30.00
    };

    const assentosSelect = document.getElementById("setor"); // Corrigido para corresponder ao ID correto
    const valorIngressoSpan = document.getElementById("valor-ingresso");

    assentosSelect.addEventListener("change", function () {
        const setorSelecionado = assentosSelect.value;
        const valorIngresso = valoresIngresso[setorSelecionado] || 0.00;

        valorIngressoSpan.textContent = `Valor do Ingresso: R$ ${valorIngresso.toFixed(2)}`;
    });
});

document.getElementById("ticket-form").addEventListener("submit", function (event) { // Corrigido para corresponder ao ID correto
    const nome = document.getElementById("nome").value;
    const email = document.getElementById("email").value;
    const setor = document.getElementById("setor").value;

    if (nome === "" || email === "" || setor === "Nenhum") {
        alert("Por favor, preencha todos os campos antes de comprar o ingresso.");
        event.preventDefault();
    }
});
