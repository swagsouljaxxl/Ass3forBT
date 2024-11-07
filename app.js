const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 3002;

// Подключение к MongoDB
mongoose.connect('mongodb://localhost:27017/login', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('Failed to connect to MongoDB', err));

// Схемы и модели для MongoDB
const userSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
});

const User = mongoose.model('User', userSchema);

const supplySchema = new mongoose.Schema({
    name: { type: String, required: true },
    space: { type: Number, required: true },
    price: { type: Number, required: true },
});

const Supply = mongoose.model('Supply', supplySchema);

// Middleware для парсинга данных форм
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'public'));

// Главная страница
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// Регистрация пользователя
app.post('/signup', async (req, res) => {
    const { email, pswd } = req.body;

    try {
        const newUser = new User({ email, password: pswd });
        await newUser.save();
        res.redirect('/');
    } catch (error) {
        console.error(error);
        res.send('Ошибка при регистрации. Попробуйте еще раз.');
    }
});

// Вход пользователя
app.post('/login', async (req, res) => {
    const { email, pswd } = req.body;

    try {
        const user = await User.findOne({ email });
        if (user && user.password === pswd) {
            res.redirect('/main.html');
        } else {
            res.send('Неверные данные для входа. Пожалуйста, <a href="/">попробуйте еще раз</a>.');
        }
    } catch (error) {
        console.error(error);
        res.send('Ошибка при входе. Попробуйте еще раз.');
    }
});

// Добавление нового предложения
app.post('/submit-supply', async (req, res) => {
    const { name, space, price } = req.body;

    if (!name || !space || !price) {
        return res.status(400).send('Все поля обязательны для заполнения');
    }

    try {
        const newListing = new Supply({ name, space, price });
        await newListing.save();
        res.redirect('/main.html'); // Вернемся на страницу main.html после добавления
    } catch (err) {
        res.status(500).send('Ошибка при сохранении предложения: ' + err);
    }
});

// Переход на main.html
app.get('/main.html', async (req, res) => {
    try {
        const listings = await Supply.find();
        res.render('main', { listings });
    } catch (err) {
        res.status(500).send('Ошибка при получении списка предложений: ' + err);
    }
});

// Запуск сервера
app.listen(PORT, () => console.log(`Сервер запущен на http://localhost:${PORT}`));
