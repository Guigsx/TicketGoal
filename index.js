const express = require('express')
const app = express()
const handlebars = require('express-handlebars')
const path = require('path')
const session = require('express-session')
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

app.get('/', (req, res) => {
    res.render('geral/home')
})

app.post('/pagamento', (req, res) => {
    const nome = req.body.nome;
    const email = req.body.email;
    const setor = req.body.setor;
    
    const valoresIngresso = {
        A: 50.00,
        B: 40.00,
        C: 35.00,
        D: 30.00
    };

    const compra = {
        nome: nome,
        email: email,
        assento: `12${setor}`,
        valorTotal: `R$ ${valoresIngresso[setor]}`,
        codigo: '395260656875733002'
    }

    res.render('geral/pagamento', { compra });
});

app.listen(porta, () => {
    console.log(`Servidor online!`);
})