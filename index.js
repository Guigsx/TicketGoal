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

app.listen(porta, () => {
    console.log(`Servidor online!`);
})