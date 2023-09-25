const express = require('express')
const app = express()
const handlebars = require('express-handlebars')
const path = require('path')
const session = require('express-session')
const uuid = require('uuid');
const mercadopago = require('mercadopago');
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
        cookie: { secure: false }, // Em ambiente de desenvolvimento, altere para 'false'
    })
);

mercadopago.configure({
    access_token: 'APP_USR-480121886035342-091514-cb35bc42e8deeedfa47eb30485dad3d5-1255551541'
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

app.post('/processar-pagamento', (req, res) => {
    const nome = req.body.nome;
    const email = req.body.email;
    const setor = req.body.setor;
    const codigoIngresso = uuid.v4();
    const numeroAssento = 10;

    const valoresIngresso = {
        A: 50,
        B: 40,
        C: 35,
        D: 30
    };

    const compra = {
        nome: nome,
        email: email,
        setor: setor,
        assento: numeroAssento + setor,
        valorTotal: valoresIngresso[setor],
        codigo: codigoIngresso,
    };

    const pagamentoMercadoPago = {
        items: [
            {
                title: 'Ingresso para Evento',
                quantity: 1,
                currency_id: 'BRL',
                unit_price: compra.valorTotal,
            },
        ],
    };

    mercadopago.preferences
        .create(pagamentoMercadoPago)
        .then((response) => {
            res.redirect(response.body.init_point);
        })
        .catch((error) => {
            console.error('Erro ao criar pagamento no Mercado Pago:', error);
            res.status(500).send('Erro ao processar pagamento');
        });
});

app.listen(porta, () => {
    console.log(`Servidor online!`);
})