import express from 'express';
import bodyParser from 'body-parser';
import pg from 'pg';
import axios from 'axios';
import moment from 'moment';

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

async function getReview(id){
    const result = await db.query("SELECT * FROM books WHERE id = $1;",
        [id]
    );
    return result.rows;
}

async function getRatAsc(){
    const result = await db.query("SELECT * FROM books ORDER BY Rating ASC;");
    return result.rows;
}

async function getRatDesc(){
    const result = await db.query("SELECT * FROM books ORDER BY Rating DESC;");
    return result.rows;
}

async function getRecAsc(){
    const result = await db.query("SELECT * FROM books ORDER BY Date ASC;");
    return result.rows;
}

async function getRecDesc(){
    const result = await db.query("SELECT * FROM books ORDER BY Date DESC;");
    return result.rows;
}

async function getCovers(isbn){
    const result = await axios.get(API_URL + isbn + "-M.jpg");
    return result.config.url;
}

async function createBook(name, isbn, review, rating, date, description){
    try {
        await db.query("INSERT INTO books (name, coverurl, review, rating, date, description) VALUES ($1, $2, $3, $4, DATE($5), $6);",
            [name, isbn, review, rating, date, description]
        );
    } catch (error) {
       console.log(error); 
    }
}

async function updateBook(name, isbn, review, rating, description, id){
    try {
        await db.query("UPDATE books SET name = $1, coverurl = $2, review = $3, rating = $4, description = $5 WHERE id = $6;",
            [name, isbn, review, rating, description, id]
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

function formatDate(date){
    let dateStr = moment(date).format('L');
    let arr = dateStr.split("/");
    console.log(arr);
    dateStr = `${arr[2]}-${arr[1]}-${arr[0]}`;
    console.log(dateStr);
    return dateStr;
}

app.get("/", async (req, res) => {
    const books = await getReviews();
    // console.log(books);
    // res.json(books);

    // let covers = [];
    for(const book of books){
        // covers.push(await getCovers(book.coverurl));
        book.cover = await getCovers(book.coverurl);
        book.date = moment(book.date).format('L').toString();
        // console.log(book.date);
    }
    // console.log(books);

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
    const date = formatDate(req.body.date);
    const description = req.body.description;

    await createBook(name, isbn, review, rating, date, description);

    // res.json("success");

    res.redirect("/");
});

// update 
app.post("/update", async (req, res) => {
    const id = req.body.id;
    const name = req.body.name;
    const isbn = req.body.isbn;
    const review = req.body.review;
    const rating = Number(req.body.rating);
    // const date = await getDate(id);
    // console.log(date);
    const description = req.body.description;

    await updateBook(name, isbn, review, rating, description, id);

    // res.json("success");

    res.redirect("/");
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

app.get("/edit/:id", async (req, res) => {
    const id = req.params.id;
    const review = await getReview(id);
    // console.log(review[0])
    res.render("edit.ejs", { review: review[0] });
});

app.get("/view/:id", async (req, res) => {
    const id = req.params.id;
    const result = await getReview(id);
    const book = result[0];
    book.cover = await getCovers(book.coverurl);
    book.date = moment(book.date).format('L').toString();
    res.render("book.ejs", { book: book });
});

app.get("/add", (req, res) => {
    res.render("add.ejs");
});

app.get("/form/sort", (req, res) => {
    res.render("filter.ejs");
});

app.post("/sort", async (req, res) => {
    const sort = req.body.sort;
    const arr = sort.split("-");

    const sortMethod = arr[0];
    const sortOrder = arr[1];

    console.log(sortMethod);
    console.log(sortOrder);

    let books = [];

    if((sortMethod === "rating") && (sortOrder === "asc")){
         books = await getRatAsc();                                                                                       
    }

    if((sortMethod === "rating") && (sortOrder === "desc")){
         books = await getRatDesc();                                                                                       
    }

    if((sortMethod === "recency") && (sortOrder === "asc")){
        books = await getRecAsc();                                                                                   
    }

    if((sortMethod === "recency") && (sortOrder === "desc")){
        books = await getRecDesc();                                                                                      
    }
    

    for(const book of books){
        // covers.push(await getCovers(book.coverurl));
        book.cover = await getCovers(book.coverurl);
        book.date = moment(book.date).format('L').toString();
        // console.log(book.date);
    }
    // console.log(books);

    res.render("index.ejs", {
        books: books,
        // covers: covers
    });
});

app.listen(PORT, () => {
    console.log(`Connected on port: ${PORT}`);
})