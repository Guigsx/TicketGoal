const express = require('express')
const app = express()
const handlebars = require('express-handlebars')
const path = require('path')
const session = require('express-session')
const uuid = require('uuid');
const mercadopago = require('mercadopago');
const fs = require('fs')
const porta = 2000

app.engine('handlebars', handlebars.engine({ defaultLayout: 'main' }));
app.set('view engine', 'handlebars');

app.use(express.urlencoded({ extended: false }))
app.use(express.json())

app.use(express.static(path.join(__dirname, "/public")))
app.use(
    session({
        secret: 'root',
        resave: true,
        saveUninitialized: true,
        cookie: { secure: false },
    })
);

mercadopago.configure({
    access_token: 'APP_USR-480121886035342-091514-cb35bc42e8deeedfa47eb30485dad3d5-1255551541'
})

app.get('/', (req, res) => {
    res.render('geral/home')
})

const valoresIngresso = {
    A: 0.5,
    B: 0.4,
    C: 0.35,
    D: 0.3
};

app.post('/pagamento', (req, res) => {
    const nome = req.body.nome;
    const email = req.body.email;
    const setor = req.body.setor;
    const codigoIngresso = uuid.v4();
    const numeroAssento = 10

    const compra = {
        nome: nome,
        email: email,
        setor: setor,
        assento: numeroAssento + setor,
        valorTotal: `R$ ${valoresIngresso[setor]}`,
        codigo: codigoIngresso,
    };

    res.render('geral/pagamento', { compra });
});

function saveData(compra, ip, paymentID) {
    fs.readFile('./database/dados.json', 'utf8', (err, data) => {
        if (err) {
            console.error('Erro ao ler o arquivo de dados:', err);
            return;
        }

        let dados = {};

        if (data) {
            try {
                dados = JSON.parse(data);
            } catch (error) {
                console.error('Erro ao analisar dados JSON:', error);
                return;
            }
        }

        if (!dados[ip]) {
            dados[ip] = {};
        }

        const ipData = dados[ip];

        if (!ipData.compra) {
            ipData.compra = [];
        }

        const novaCompra = {
            nome: compra.nome,
            email: compra.email,
            setor: compra.setor,
            assento: compra.assento,
            valorTotal: compra.valorTotal,
            codigo: compra.codigo,
            pagamentoAprovado: false, // Define como pagamento não aprovado
            pagamentoId: paymentID, // ID do pagamento no Mercado Pago
        };

        ipData.compra.push(novaCompra);

        fs.writeFile('./database/dados.json', JSON.stringify(dados, null, 2), 'utf8', (err) => {
            if (err) {
                console.error('Erro ao escrever o arquivo de dados:', err);
                return;
            }
            console.log('Dados da compra e ID do pagamento foram salvos com sucesso.');
        });
    });
}

app.post('/processar-pagamento', (req, res) => {
    const nome = req.body.nome;
    const email = req.body.email;
    const setor = req.body.setor;
    const ip = req.ip;
    const codigoIngresso = uuid.v4();
    const numeroAssento = 10;

    const compra = {
        nome: nome,
        email: email,
        setor: setor,
        assento: numeroAssento + setor,
        valorTotal: valoresIngresso[setor],
        codigo: codigoIngresso,
    };

    console.log('Uma nova possível compra:', ip, compra);

    const pagamentoMercadoPago = {
        items: [
            {
                title: 'Ingresso para Evento',
                quantity: 1,
                unit_price: valoresIngresso[setor],
            },
        ],
        payer: {
            email: email,
        },
    };

    mercadopago.preferences
        .create(pagamentoMercadoPago)
        .then((response) => {
            const paymentID = response.body.id;
            console.log(response);
            saveData(compra, ip, paymentID);
            res.redirect(response.body.init_point);
        })
        .catch((error) => {
            console.error('Erro ao criar pagamento no Mercado Pago:', error);
            res.status(500).send('Erro ao processar pagamento');
        });
});

app.post('/notificacao-pagamento', (req, res) => {
    const payment = req.body;
    const clientIp = req.ip;

    const authorizedIps = ['172.31.196.1', '::ffff:172.31.196.1'];

    if (!authorizedIps.includes(clientIp)) {
        console.log('Tentativa de notificação de IP não autorizado:', clientIp);
        return res.sendStatus(403);
    }

    console.log('Pagamento recebido de IP autorizado:', clientIp);
    console.log(payment);

    if (payment.action === 'payment.updated') {
        console.log('Pagamento aprovado.');
    }
    console.log(req);
    res.sendStatus(200);
});

app.listen(porta, () => {
    console.log(`Servidor online!`);
})