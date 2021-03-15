import express from 'express';
import path from 'path';

const app = express();

app.use(express.urlencoded({ extended: false }));
app.use(function (req, res, next) {
    res.header("x-powered-by", "Sadness")
    next();
});

app.get('/', (req, res) => {
    const loc = path.join(__dirname, "../../zips/ninjartist_full.zip");
    res.download(loc);
});

app.listen(8002, () => console.log("Listening on port 8002"));