import express from 'express';
import bodyParser from 'body-parser';
import pg from 'pg';
import axios from 'axios';

const app = express();
const PORT = 3000;
const API_URL = "https://covers.openlibrary.org/b/isbn/";

const db = new pg.Client({
  user: 'tcg',
  host: 'localhost',
  database: 'reviews',
  password: 'tcg',
  port: '5432'
});

db.connect();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

async function getReviews(){
    const result = await db.query("SELECT * FROM books");
    return result.rows;
}

async function getCovers(isbn){
    const result = await axios.get(API_URL + isbn + "-M.jpg");
    return result.config.url;
}

async function createBook(name, isbn, review, rating, date, description){
    try {
        await db.query("INSERT INTO books (name, coverurl, review, rating, date, description) VALUES ($1, $2, $3, $4, $5, $6);",
            [name, isbn, review, rating, date, description]
        );
    } catch (error) {
       console.log(error); 
    }
}

async function updateBook(name, isbn, review, rating, date, description, id){
    try {
        await db.query("UPDATE books SET name = $1, coverurl = $2, review = $3, rating = $4, date = $5, description = $6 WHERE id = $7;",
            [name, isbn, review, rating, date, description, id]
        );
    } catch (error) {
       console.log(error); 
    }
}

async function deleteBook(id){
    try {
        await db.query("DELETE FROM books WHERE id = $1;",
            [id]
        );
    } catch(error) {
        console.log(error);
    }
}

app.get("/", async (req, res) => {
    const books = await getReviews();
    // console.log(books);
    // res.json(books);

    // let covers = [];
    for(const book of books){
        // covers.push(await getCovers(book.coverurl));
        book.cover = await getCovers(book.coverurl);
    }
    console.log(books);

    res.render("index.ejs", {
        books: books,
        // covers: covers
    });
});

app.post("/add", async (req, res) => {
    const name = req.body.name;
    const isbn = req.body.isbn;
    const review = req.body.review;
    const rating = req.body.rating;
    const date = req.body.date;
    const description = req.body.description;

    await createBook(name, isbn, review, rating, date, description);

    res.json("success");

    // res.redirect("/");
});

// update 
app.post("/update", async (req, res) => {
    const id = req.body.id;
    const name = req.body.name;
    const isbn = req.body.isbn;
    const review = req.body.review;
    const rating = req.body.rating;
    const date = req.body.date;
    const description = req.body.description;

    await updateBook(name, isbn, review, rating, date, description, id);

    res.json("success");

    // res.redirect("/");
});

app.get("/delete/:id", async (req, res) => {
    
    try {
        const id = req.params.id;

    await deleteBook(id);
   
   
    } catch(error) {
        console.log(error);
    } finally {
        res.redirect("/");
    }   
});
























app.listen(PORT, () => {
    console.log(`Connected on port: ${PORT}`);
})