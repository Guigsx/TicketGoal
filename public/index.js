// Adicione este código JavaScript
document.addEventListener("DOMContentLoaded", function () {
    // Defina os valores dos ingressos para cada setor (pode vir do servidor)
    const valoresIngresso = {
        A: 50.00,
        B: 40.00,
        C: 35.00,
        D: 30.00
    };

    const assentosSelect = document.getElementById("assentos");
    const valorIngressoSpan = document.getElementById("valor-ingresso");

    // Adicione um ouvinte de evento à seleção de setor
    assentosSelect.addEventListener("change", function () {
        const setorSelecionado = assentosSelect.value;
        const valorIngresso = valoresIngresso[setorSelecionado] || 0.00; // Valor padrão se não for encontrado

        // Atualize o texto exibido com o valor do ingresso selecionado
        valorIngressoSpan.textContent = `Valor do Ingresso: R$ ${valorIngresso.toFixed(2)}`;
    });
});
