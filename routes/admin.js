const express = require('express');
const router = express.Router();
const fs = require('fs')
const assentosModule = require('./../assentos');
const config = require('./../config.json')
const pinDeAcesso = config.pin

function verificarAutenticacao(req, res, next) {
    const autenticado = req.session.autenticado;
    if (autenticado) {
        next()
    } else {
        res.redirect('/admin/login');
    }
}

// Rota para a página de login
router.get('/login', (req, res) => {
    res.render('admin/login');
});

router.post('/login', (req, res) => {
    const { pin } = req.body;

    if (pin === pinDeAcesso) {
        req.session.autenticado = true;
        res.redirect('/admin');
    } else {
        res.render('admin/login', { error: 'PIN incorreto' });
    }
});

// Aplica o middleware de autenticação a todas as rotas abaixo
router.use(verificarAutenticacao);

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
router.post('/configurar', (req, res) => {
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

router.get('/createevent', (req, res) => {
    res.render('admin/createEvent')
})

router.post('/createevent', (req, res) => {
    try {
        const eventosJSON = fs.readFileSync('./database/eventos.json', 'utf8');
        const eventos = JSON.parse(eventosJSON);

        const { data, time1, time2 } = req.body;
        eventos.evento = {
            data: data,
            time1: time1,
            time2: time2
        };

        const eventosAtualizadosJSON = JSON.stringify(eventos, null, 2);
        fs.writeFileSync('./database/eventos.json', eventosAtualizadosJSON);

        res.redirect('/admin');
        console.log('Evento criado com sucesso!');
    } catch (error) {
        console.error('Erro ao atualizar configuração da capacidade:', error);
        res.status(500).send('Erro interno do servidor');
    }
});


module.exports = router;