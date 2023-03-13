
var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var bodyParser = require('body-parser');
var flash = require('express-flash');
var session = require('express-session');
var mysql = require('mysql2');

var connection = mysql.createConnection({
  host :  'localhost',
  user  :  'master',
  password  : 'secret',
  database  : 'fridgey'
});

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
connection.connect();

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(cookieParser());
app.use(flash());

app.use(session({ 
    secret: '123456catr',
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 60000 }
}));


app.get('/', (req,res) => {
	 res.sendFile('index.html', { root: __dirname + "/static" } );
});

app.get('/index.html', (req,res) => {
        res.sendFile('index.html', { root: __dirname + "/static" } );
});
app.get('/form_add.html', (req,res) => {
	res.sendFile('form_add.html', { root: __dirname + "/static" } );
 });

app.get('/yourId', (req,res) => {
        query = `select max(UserId) as YourId from User as u`;
        console.log(query);
        connection.query(query, function(err, results, fields)  {
                console.log(err);
                console.log(results);
                res.json({'message':  'Lookup successful.',  'users':results});
        });
});
app.get('/yourId.html', (req,res) => {
        res.sendFile('yourId.html', { root: __dirname + "/static" } );
 });

app.post('/form_add', (req,res) => {
        console.log('added user: ');
        console.log(req.body);
        var UserFN = req.body.fname;
        var UserLN = req.body.lname;
	var UserId = '(select max(UserId)+1 from User as u)';
	 console.log(UserFN);
        query = `INSERT INTO User (UserId, UserFN, UserLN) VALUES (${UserId},'${UserFN}', '${UserLN}')`;
        console.log(query);
        connection.query(query, function(err, results, fields)  {
                console.log(err);
                console.log(results);
		res.redirect("/yourID.html");
        });
});

app.get('/form_delete.html', (req,res) => {
        res.sendFile('form_delete.html', { root: __dirname + "/static" } );
 });

app.post('/form_delete', (req, res) => {
        console.log('Deleted user: ');
        console.log(req.body);
        var UserUIN = req.body.uid;
        query = `DELETE FROM User where UserId = ${UserUIN}`;
        console.log(query);
        connection.query(query, function(err, results, fields)  {
                console.log(err);
                console.log(results);
                res.redirect('/');
        });
});

app.get('/form_update.html', (req,res) => {
        res.sendFile('form_update.html', { root: __dirname + "/static" } );
 });

app.post('/form_update', (req, res) => {
        console.log('Updated Dish: ');
        console.log(req.body);
	var OriginalDish = req.body.og;
	var UserId = req.body.uid;
        var DishName = req.body.nd;
	var updatedCalories = req.body.cal;
        query = `UPDATE Dish NATURAL JOIN Creates join User on User.UserId = Creates.UserId set DishName = '${DishName}',Calories = ${updatedCalories} where DishName = '${OriginalDish}' and User.UserId = ${UserId}`;
        query1 = `call Result()`;
	console.log(query);
        connection.query(query, function(err, results, fields)  {
                console.log(err);
                console.log(results);
        });
	connection.query(query1, function(err, results, fields)  {
                console.log(err);
                console.log(results);
                res.redirect('/');
        });
});

app.get('/userSearch.html', (req,res) => {
        res.sendFile('userSearch.html', { root: __dirname + "/static" } );
 });

app.get('/userSearch', (req, res) => {
        console.log('User Search: ');
        var UserFN = req.query.fname;
 	var UserLN = req.query.lname;
        console.log(UserLN);
        query = `SELECT UserFN, UserLN,DishName,Dish.DishId,Calories,count(UserId1) as Followers, CombinedRating, CalorieRating from User natural join FinalTable natural join Creates join Follows on Follows.UserId2 = User.UserId join Dish on Dish.DishId = Creates.DishId where UserFN like '${UserFN}%' and UserLN like '${UserLN}%' group by User.UserId, Creates.DishId`;
        console.log(query);
        connection.query(query, function(err, results, fields)  {
                console.log(results);
                res.json({'message':  'Lookup successful.',  'users':results});
        });
});
app.get('/dishSearch.html', (req,res) => {
        res.sendFile('dishSearch.html', { root: __dirname + "/static" } );
 });

app.get('/dishSearch', (req, res) => {
        console.log('Dish Search: ');
        var DishName = req.query.dname;
	console.log(DishName);
        query = `SELECT UserFN, UserLN, DishName,DishId,Calories from Dish natural join Creates join User on User.UserId = Creates.UserId where DishName like '${DishName}%'`;  
        console.log(query);
        connection.query(query, function(err, results, fields)  {
                console.log(err);
                console.log(results);
                res.json({'message':  'Lookup successful.',  'users':results});
        });
});

app.get('/query1.html', (req,res) => {
        res.sendFile('query1.html', { root: __dirname + "/static" } );
 });

app.get('/getQuery1', (req, res) => {
        console.log('Getting users.');
        query = `SELECT UserFN,UserLN, Calories,dishName, (SELECT AVG(Score) FROM Rating WHERE User.UserId=Rating.UserId GROUP BY UserId) AS averageRating FROM User NATURAL JOIN Rating JOIN Dish ON Dish.DishId= Rating.DishId WHERE Calories>200 GROUP BY User.UserId HAVING averageRating>6 ORDER BY averageRating;`;
        connection.query(query, function(err, results, fields)  {
		console.log(results);
                res.json({'message':  'Lookup successful.',  'users':results});
        });
});

app.get('/query2.html', (req,res) => {
        res.sendFile('query2.html', { root: __dirname + "/static" } );
 });

app.get('/getQuery2', (req, res) => {
        console.log('Getting users.');
        query = `SELECT u.UserFN, u.UserLN, (Select Count(*) from Creates c1 where u.UserId = c1.UserId) as dishCount FROM User u,Creates c GROUP BY u.UserId Having dishCount > 1 ORDER BY dishCount desc`
        connection.query(query, function(err, results, fields)  {
                console.log(results);
                res.json({'message':  'Lookup successful.',  'users':results});
        });
});

app.post('/addDish', (req,res) => {
        console.log('added user: ');
        console.log(req.body);
        var DishName = req.body.dname;
        var Calories = req.body.cal;
	var UserId = req.body.uid
        var DishId = '(select max(DishId)+1 from Dish as d)';
	var CuisineName = req.body.cn;
	var Taste = req.body.taste;
	var CId = '(select max(CuisineId)+1 from Cuisine as c)';
         console.log(DishName);
	query1 = `INSERT INTO Dish (DishId, DishName, Calories) VALUES (${DishId},'${DishName}', ${Calories})`;
        query2 = `INSERT INTO Creates (UserId,DishId) VALUES (${UserId},${DishId}-1)`;
	query3 = `INSERT INTO Cuisine (CuisineId,CuisineName,Taste) VALUES (${CId},'${CuisineName}','${Taste}')`;
	query4 = `INSERT INTO Madeof (CuisineId,DishId) VALUES (${CId}-1,${DishId}-1)`;
        query5 = `call Result()`;
	console.log(query1);
        connection.query(query1, function(err, results, fields)  {
                console.log(err);
                console.log(results);
        });
	console.log(query2);
	connection.query(query2, function(err, results, fields)  {
                console.log(err);
                console.log(results);
	 });
	console.log(query3);
        connection.query(query3, function(err, results, fields)  {
                console.log(err);
                console.log(results);
        });
	console.log(query4);
        connection.query(query4, function(err, results, fields)  {
                console.log(err);
                console.log(results);
        });
	connection.query(query5, function(err, results, fields)  {
                console.log(err);
                console.log(results);
                res.redirect("/DishId.html");
        });
});

app.get('/addDish.html', (req,res) => {
        res.sendFile('addDish.html', { root: __dirname + "/static" } );
 });
app.get('/DishId', (req,res) => {
        query = `select max(DishId) as DishId from Dish as d`;
	console.log(query);
        connection.query(query, function(err, results, fields)  {
                console.log(err);
                console.log(results);
                res.json({'message':  'Lookup successful.',  'users':results});
        });
});
app.get('/DishId.html', (req,res) => {
        res.sendFile('DishId.html', { root: __dirname + "/static" } );
 });

app.post('/addIng', (req,res) => {
        console.log('added user: ');
        console.log(req.body);
        var IngName = req.body.iname;
        var Mes = req.body.mes;
        var Price = req.body.price;
	var DishId = req.body.did;
        var IngredientId = '(select max(IngredientId)+1 from Ingredient as i)';
         console.log(IngName);
        query1 = `INSERT INTO Ingredient (IngredientId, IngredientName, Measurement, Price) VALUES (${IngredientId},'${IngName}', ${Mes}, ${Price})`;
        query2 = `INSERT INTO Contains (IngredientId,DishId) VALUES (${IngredientId}-1,${DishId})`;
        console.log(query1);
        connection.query(query1, function(err, results, fields)  {
                console.log(err);
                console.log(results);
        });
        console.log(query2);
        connection.query(query2, function(err, results, fields)  {
                console.log(err);
                console.log(results);
		res.redirect("/addIng.html");
        });
});

app.get('/addIng.html', (req,res) => {
        res.sendFile('addIng.html', { root: __dirname + "/static" } );
 });

app.get('/delDish.html', (req,res) => {
        res.sendFile('delDish.html', { root: __dirname + "/static" } );
 });

app.post('/delDish', (req, res) => {
        console.log('Deleted user: ');
        console.log(req.body);
        var DishId = req.body.did;
	var UserId = req.body.uid;
        query1 = `Delete from Dish where DishId = (Select DishId from Creates where DishId = ${DishId} and UserId = ${UserId})`;
        query5 = `Delete from Creates where DishId =  ${DishId} and UserId = ${UserId}`;
        query2 = `Delete from Contains where DishId = (Select DishId from Creates where DishId = ${DishId} and UserId = ${UserId})`;
        query4 = `Delete from Madeof where DishId = (select DishId from Creates where DishId = ${DishId} and UserId = ${UserId})`;
        query3 = `DELETE FROM Cuisine where CuisineId = (Select CuisineId from Madeof where DishId = (select DishId from Creates where DishId = ${DishId} and UserId = ${UserId}))`;
        query6 = `call Result()`;
	console.log(query1);
        connection.query(query1, function(err, results, fields)  {
                console.log(err);
                console.log(results);
        });
	connection.query(query2, function(err, results, fields)  {
                console.log(err);
                console.log(results);
        });
	connection.query(query3, function(err, results, fields)  {
                console.log(err);
                console.log(results);
        });
	connection.query(query4, function(err, results, fields)  {
                console.log(err);
                console.log(results);
        });
	connection.query(query5, function(err, results, fields)  {
                console.log(err);
                console.log(results);
        });
	connection.query(query6, function(err, results, fields)  {
                console.log(err);
                console.log(results);
                res.redirect('/');
        });
});

app.get('/follows.html', (req,res) => {
        res.sendFile('follows.html', { root: __dirname + "/static" } );
 });

app.post('/followUser', (req,res) => {
        console.log('added user: ');
        console.log(req.body);
        var UserId = req.body.uid;
        var DishId = req.body.did;
         console.log(UserId);
        query1 = `INSERT INTO Follows (UserId1, UserId2) VALUES (${UserId},${UserId})`;
	query2 = `UPDATE Follows set UserId2 = (Select UserId from Creates where DishId = ${DishId}) where UserId1 = ${UserId} and UserId2 = ${UserId}`; 
        console.log(query1);
        connection.query(query1, function(err, results, fields)  {
                console.log(err);
                console.log(results);
        });
	console.log(query2);
        connection.query(query2, function(err, results, fields)  {
                console.log(err);
                console.log(results);
                res.redirect("/");
        });
});

app.get('/rating.html', (req,res) => {
        res.sendFile('rating.html', { root: __dirname + "/static" } );
 });

app.post('/rateDish', (req,res) => {
        console.log('added user: ');
        console.log(req.body);
        var UserId = req.body.uid;
        var DishId = req.body.did;
	var Score = req.body.score;
        console.log(UserId);
        query1 = `INSERT INTO Rating (UserId, DishId, Score) VALUES (${UserId},${DishId},${Score})`;
	query2 = `Call Result()`;
        console.log(query1);
        connection.query(query1, function(err, results, fields)  {
                console.log(err);
                console.log(results);
        });
	console.log(query2);
        connection.query(query2, function(err, results, fields)  {
                console.log(err);
                console.log(results);
                res.redirect("/");
        });
});

app.get('/changeIng.html', (req,res) => {
        res.sendFile('changeIng.html', { root: __dirname + "/static" } );
 });

app.post('/changeIng', (req, res) => {
        console.log('Updated Dish: ');
        console.log(req.body);
        var DishId = req.body.did;
        var IngredientName = req.body.ing;
        var newName = req.body.name;
	var mes = req.body.mes;
	var price = req.body.price;
        query = `UPDATE Ingredient join Contains on Contains.IngredientId = Ingredient.IngredientId set IngredientName = '${newName}',Measurement = ${mes},Price = ${price} where IngredientName = '${IngredientName}' and DishId = ${DishId}`
        console.log(query);
        connection.query(query, function(err, results, fields)  {
                console.log(err);
                console.log(results);
                res.redirect('/');
        });
});

const PORT = 80;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}...`);
});
