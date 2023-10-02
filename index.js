const express = require('express')
const app = express()
const handlebars = require('express-handlebars')
const path = require('path')
const session = require('express-session')
const uuid = require('uuid');
const mercadopago = require('mercadopago');
const fs = require('fs')
const sendEmail = require('./sendEmail');
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

const valoresIngresso = {
    A: 50,
    B: 40,
    C: 35,
    D: 30
};

//função que salva os dados do pagamento no banco de dados local.
function saveData(data) {
    try {
        // Lê o conteúdo atual do arquivo JSON
        const currentData = fs.readFileSync('./database/dados.json', 'utf8');
        const parsedData = JSON.parse(currentData);

        // Adiciona ou atualiza os dados com base no data.id_payment
        parsedData[data.id_payment] = {
            name: data.name,
            price: data.price,
            status: data.status,
            email: data.email,
            nome: data.nome
        };

        // Converte os dados atualizados em uma string JSON
        const updatedData = JSON.stringify(parsedData, null, 2);

        // Escreve os dados atualizados de volta no arquivo JSON
        fs.writeFileSync('./database/dados.json', updatedData);
        console.log('Dados salvos com sucesso!');
    } catch (error) {
        console.log('Houve um erro ao salvar os dados no banco de dados.', error);
    }
}

app.get('/', (req, res) => {
    res.render('geral/home')
})

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
        external_reference: codigoIngresso
    };

    mercadopago.preferences
        .create(pagamentoMercadoPago)
        .then((response) => {
            const dados = {
                email: email,
                id_payment: codigoIngresso,
                name: `Ingresso para o evento - ${numeroAssento + setor}`,
                price: valoresIngresso[setor],
                status: 'Pendente',
                nome: nome
            }
            saveData(dados)
            res.redirect(response.body.init_point);
        })
        .catch((error) => {
            console.error('Erro ao criar pagamento no Mercado Pago:', error);
            res.status(500).send('Erro ao processar pagamento');
        })
});

//Aqui o mercadopago irá retornar se o pagamento foi efetuado ou não.
app.post('/notify', (req, res) => {
    const id = req.query.id;
    console.log('Novo pagamento recebido!', req.query)

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
                    // Lê os dados do arquivo JSON existente
                    fs.readFile('./database/dados.json', 'utf8', (err, jsonData) => {
                        if (err) {
                            console.log('Erro ao ler o arquivo JSON:', err);
                            return;
                        }

                        try {
                            const dados = JSON.parse(jsonData);

                            // Atualiza o status do pagamento no objeto 'dados'
                            //hasOwnProperty verifica se há alguma propiedade com igual no array
                            if (dados.hasOwnProperty(payment.external_reference)) {
                                dados[payment.external_reference].status = 'Pago';

                                // Salva os dados atualizados de volta no arquivo JSON
                                const updatedJsonData = JSON.stringify(dados, null, 2);
                                fs.writeFileSync('./database/dados.json', updatedJsonData);

                                console.log('Pagamento aprovado:', payment.external_reference);
                                console.log(dados[payment.external_reference].email);

                                const options = {
                                    from: 'TicketGoal <guilhermeschmitzguii@gmail.com>',
                                    to: dados[payment.external_reference].email,
                                    subject: 'Compra de ingresso aprovada!',
                                    text: `Olá!\n\nSua compra do ingresso para "${dados[payment.external_reference].name}" foi aprovada. Obrigado por sua compra!`
                                }
                                sendEmail(options)
                            } else {
                                console.log('ID de pagamento não encontrado no arquivo JSON');
                            }
                        } catch (error) {
                            console.log('Erro ao analisar o arquivo JSON:', error);
                        }
                    });
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

app.get('/payments', (req, res) => {
    try {
        const rawData = fs.readFileSync('./database/dados.json');
        const paymentsData = JSON.parse(rawData);

        res.render('geral/payments', { payments: paymentsData });
    } catch (error) {
        console.error('Erro ao ler o arquivo:', error);
        res.status(500).send('Erro ao ler dados de pagamento.');
    }
});

app.listen(porta, () => {
    console.log(`Servidor online!`);
})