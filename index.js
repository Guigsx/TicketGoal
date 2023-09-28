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
    sandbox: true, // Modo desenvolvimento
    access_token: 'TEST-480121886035342-091514-97dd2e504361cbd467e0e948656ce7fd-1255551541'
})

app.get('/', (req, res) => {
    res.render('geral/home')
})

const valoresIngresso = {
    A: 50,
    B: 40,
    C: 35,
    D: 30
};

var database = {
    payments: [
    ]
}

//Aqui irá mostrar todas as informações da compra e por fim o usuário pode seguir com a compra.
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

//Aqui o pagamento será criado.
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

    console.log(compra);

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
            database.payments.push({
                email: email,
                id_payment: codigoIngresso,
                name: 'ingresso',
                price: valoresIngresso[setor],
                status: 'A pagar'
            })
            res.redirect(response.body.init_point);
        })
        .catch((error) => {
            console.error('Erro ao criar pagamento no Mercado Pago:', error);
            res.status(500).send('Erro ao processar pagamento');
        });
});

//Aqui o mercadopago irá retornar se o pagamento foi efetuado ou não.
app.post('/notify', (req, res) => {
    const id = req.query.id;
    console.log('chegou!', id)

    setTimeout(() => {
        const filtro = { "order.id": id }

        // Verifica se o pagamento está no banco de dados do mercado pago
        mercadopago.payment.search({
            qs: filtro
        }).then(data => {
            // Pagamento está no banco de dados
            var payment = data.body.results[0];
            if (payment != undefined) {
                if (payment.status === 'approved') {
                    let id_payment = database.payments.findIndex(pay => pay.id_payment == payment.external_reference);
                    if (id_payment !== -1) {
                        database.payments[id_payment].status = 'Pago';
                        console.log('Pagamento aprovado:', payment.external_reference);
                    } else {
                        console.log('ID de pagamento não encontrado no banco de dados fictício');
                    }
                } else {
                    console.log('Pagamento não aprovado!', payment.status);
                }
            } else {
                console.log('Pagamento não existe!', payment);
            }
        }).catch(error => {
            console.log(error);
        });
    }, 20000)

    res.send('ok');
})

app.listen(porta, () => {
    console.log(`Servidor online!`);
})