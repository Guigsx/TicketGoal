const fs = require('fs');

function criarAssentos(data) {
    const assentos = {};

    for (let setorId = 1; setorId <= data.quantidadeSetores; setorId++) {
        const setor = String.fromCharCode(64 + setorId); // Converte número para letra (A, B, C, ...)
        assentos[setor] = {};

        for (let assentoId = 1; assentoId <= data.quantidadeAssentos; assentoId++) {
            assentos[setor][assentoId] = false; // Inicialmente, nenhum assento está ocupado
        }
    }

    const assentosJSON = JSON.stringify(assentos, null, 2);
    fs.writeFileSync('./database/assentos.json', assentosJSON);
}

const data = {
    quantidadeSetores: 4,
    quantidadeAssentos: 10
}

function escolherAssento(setor) {
    const assentosJSON = fs.readFileSync('./database/assentos.json', 'utf8');
    const assentos = JSON.parse(assentosJSON);

    if (!assentos.hasOwnProperty(setor)) {
        return null;
    }

    for (let assentoId = 1; assentoId <= Object.keys(assentos[setor]).length; assentoId++) {
        if (!assentos[setor][assentoId.toString()]) {
            assentos[setor][assentoId.toString()] = true;
            fs.writeFileSync('./database/assentos.json', JSON.stringify(assentos, null, 2));
            return `${setor}${assentoId}`;
        }
    }

    return null;
}

function calcularSomaEPrecos() {
    try {
        const dadosJSON = fs.readFileSync('./database/dados.json', 'utf8');
        const dados = JSON.parse(dadosJSON);

        let soma = 0;
        let quantidade = 0;

        for (const key in dados) {
            if (dados.hasOwnProperty(key)) {
                const item = dados[key];
                if (item.hasOwnProperty('price') && item.status === 'Pago') {
                    soma += item.price;
                    quantidade++;
                }
            }
        }

        return { soma, quantidade };
    } catch (error) {
        console.error('Erro ao ler ou processar os dados:', error);
        return null;
    }
}

module.exports = { escolherAssento, criarAssentos, calcularSomaEPrecos }