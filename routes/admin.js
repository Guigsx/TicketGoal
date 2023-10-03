const express = require('express');
const router = express.Router();
const fs = require('fs')
const assentosModule = require('./../assentos');

// Rota de página inicial do painel de administração
router.get('/', (req, res) => {
    const jsonContent = fs.readFileSync('./database/eventos.json', 'utf8');
    const dados = JSON.parse(jsonContent)

    const resultado = assentosModule.calcularSomaEPrecos();

    const datas = {
        capacidade: {
            setores: dados.capacidade.setores,
            assentos: dados.capacidade.assentos,
        },
        eventos: {
            data: dados.evento.data,
            times: {
                time1: dados.evento.time1,
                time2: dados.evento.time2,
            },
            vendas: {
                faturamento: resultado.soma,
                tickets: resultado.quantidade,
                free: dados.capacidade.assentos - resultado.quantidade
            }
        },
    };
    res.render('admin/admin', { datas: datas })
});

// Essa rota leva para o formulário para configurar a capacidade do estádio.
router.get('/configurar', (req, res) => {
    res.render('admin/config')
})

// Essa rota salva as informações de capacidade e já cria os assentos no banco de dados.
router.post('/salvar', (req, res) => {
    try {
        const eventosJSON = fs.readFileSync('./database/eventos.json', 'utf8');
        const eventos = JSON.parse(eventosJSON);

        const { setor, assentos } = req.body;
        eventos.capacidade = {
            setores: setor,
            assentos: assentos,
        };

        const data = {
            quantidadeSetores: setor,
            quantidadeAssentos: assentos
        }
        try {
            assentosModule.criarAssentos(data)
        } catch (error) {
            console.log(error);
        }

        const eventosAtualizadosJSON = JSON.stringify(eventos, null, 2);
        fs.writeFileSync('./database/eventos.json', eventosAtualizadosJSON);

        res.redirect('/admin');
    } catch (error) {
        console.error('Erro ao atualizar configuração da capacidade:', error);
        res.status(500).send('Erro interno do servidor');
    }
});

//Rota que lista todos os pagamentos.
router.get('/payments', (req, res) => {
    try {
        const rawData = fs.readFileSync('./database/dados.json');
        const paymentsData = JSON.parse(rawData);

        res.render('geral/payments', { payments: paymentsData });
    } catch (error) {
        console.error('Erro ao ler o arquivo:', error);
        res.status(500).send('Erro ao ler dados de pagamento.');
    }
});

module.exports = router;
