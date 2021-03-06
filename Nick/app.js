const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const path=require("path");
const staticCSS = express.static(path.join(__dirname + "/public"));
const handle = require("express-handlebars");
const cookies=require("cookie-parser");
const bcrypt=require("bcrypt");
const userAPI = require("./db/user.js");

const pokemanAPI = require("./pokemanAPI.js");

app.use("/",staticCSS);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded());
app.use(cookies());

app.engine("handlebars",handle({defaultLayout: "main"}));
app.set("view engine","handlebars");

// users=[
// {
// hash:"$2a$16$7JKSiEmoP3GNDSalogqgPu0sUbwder7CAN/5wnvCWe6xCKAKwlTD.",
// username: "masterdetective123",
// FirstName: "Sherlock",
// LastName: "Holmes",
// Profession: "Detective",
// Bio: 'Sherlock Holmes (/ˈʃɜːrlɒk ˈhoʊmz/) is a fictional private detective created by British author Sir Arthur Conan Doyle. \
// Known as a "consulting detective" in the stories, Holmes is known for a proficiency with observation, forensic science, \
// and logical reasoning that borders on the fantastic, which he employs when investigating cases for a wide variety of clients, \
// including Scotland Yard.'},
// {
// hash:"$2a$16$SsR2TGPD24nfBpyRlBzINeGU61AH0Yo/CbgfOlU1ajpjnPuiQaiDm",
// username: "lemon",
// FirstName: "Elizabeth",
// LastName: "Lemon",
// Profession: "Writer",
// Bio: 'Elizabeth Miervaldis "Liz" Lemon is the main character of the American television series 30 Rock.\
//  She created and writes for the fictional comedy-sketch show The Girlie Show or TGS with Tracy Jordan.'},
// {
// hash:"$2a$16$4o0WWtrq.ZefEmEbijNCGukCezqWTqz1VWlPm/xnaLM8d3WlS5pnK",
// username:"theboywholived",
// FirstName: "Harry",
// LastName: "Potter",
// Profession: "Student",
// Bio: "Harry Potter is a series of fantasy novels written by British author J. K. Rowling.\
//  The novels chronicle the life of a young wizard, Harry Potter, and his friends Hermione Granger and Ron Weasley,\
//   all of whom are students at Hogwarts School of Witchcraft and Wizardry . \
//   The main story arc concerns Harry's struggle against Lord Voldemort, a dark wizard who intends to become immortal,\
//    overthrow the wizard governing body known as the Ministry of Magic, and subjugate all wizards and Muggles."}
// ];

app.listen(3000, () => {
  console.log("We've now got a server!");
  console.log("Your routes will be running on http://localhost:3000");

if(process && process.send) process.send({done: true});

	app.get("/", async (req, res) => {

		var user = await getUser(req.cookies.AuthCookie);

		if(user)
		{
			res.redirect("home");
		}
		else
		{
			// pokemanAPI.getPokemonByName("bulbasaur", function(error, result){
			// 	if(error){
			// 		//do an error
			// 	}else{
			// 		//render the correct pokemon screen
					
			// 	}
			// });
			// pokemanAPI.getFullPokemanList(function(error, result){

			// });

			res.render("index",
				{
					layout: "login",
					title: "Welcome! Please Login"
				}
			);
		}
	});

	app.post("/login", async (req, res) => {
		try{
			var user = await userAPI.getUserByName(req.body.username);
			var ifValidCredentials;
			if(req.body.password === user.password){
				ifValidCredentials = true
			}else{
				ifValidCredentials = false;
			}
			//var ifValidCredentials = await bcrypt.compare(req.body.password, user.password);
			if(ifValidCredentials){
				res.cookie("AuthCookie",user._id);
				res.redirect("home");
			}else{
				res.render("index",
					{
						layout: "login",
						title: "Retry!",
						error: "Error, incorrect login info"
					});
			}
		}catch(e){
			res.render("index", 
				{
					layout: "login",
					title: "Retry!",
					error: "LOGIN Error: " + e
				}
			);
		}
	});

	app.get("/home", async (req, res) => {
		var user = await getUser(req.cookies.AuthCookie);

		if(!user){
			res.render("notLoggedIn",{
		 			title: "Sorry you are not logged in"
		 	});
		}else{
			user1=Object.assign({},user);
			delete(user1.password);
			res.render("userDisplay",{
		 			title: "User info",
		 			username: user1.username,
		 			favorite: user1.favorites
		 	});
			res.status(403);
		}
	});

	app.get("/pokemon", async (req, res) => {
		var user = await getUser(req.cookies.AuthCookie);

		if(!user){
			res.render("notLoggedIn",{
		 			title: "Sorry you are not logged in"
		 	});
		}else{
			user1=Object.assign({},user);
			delete(user1.hash);

			pokemanAPI.getFullPokemanList(function(error, result){
				res.render("pokemanList",{
			 			title: "All Pokemon",
			 			user: JSON.stringify(user1),
			 			pokemon: result
			 	});
				res.status(403);
			});
		}
	});

	app.post("/pokemon/getPokemon", async (req, res) => {
		var user = await getUser(req.cookies.AuthCookie);

		if(!user){
			res.render("notLoggedIn",{
		 			title: "Sorry you are not logged in"
		 	});
		}else{
			user1=Object.assign({},user);
			delete(user1.hash);

			//req.params.studentId
			pokemanAPI.getPokemonByName(req.body.pokename, function(error, result){
				if(error){
					//do an error
					console.log(error);
					res.render("pokemon/pokemonView",{
			 			title: "Not a valid pokemon!"
				 	});
				}else{
					//render the correct pokemon screen
					//console.log(result);
					res.render("pokemon/pokemonView",{
			 			title: "Pokemon :: " + result.name,
			 			user: JSON.stringify(user1),
			 			height: Math.ceil((result.height*10)/2.54) ,
			 			weight: Math.ceil((result.weight/(10*0.45359237))),
			 			moves: result.moves,
			 			types: result.types,
			 			sprite: result.sprite
				 	});
					res.status(403);
				}
			});
			
		}
	});

	app.post("/pokemon/getMatchup", async (req, res) => {
		var user = await getUser(req.cookies.AuthCookie);

		if(!user){
			res.render("notLoggedIn",{
		 			title: "Sorry you are not logged in"
		 	});
		}else{
			user1=Object.assign({},user);
			delete(user1.hash);

			//let matchupPokemon=""

			pokemanAPI.getPokemonMatchup(req.body.pokename, function(error, result){
				//matchupPokemon=result.name;
			});
			//req.params.studentId
			pokemanAPI.getPokemonByName(req.body.pokename, function(error, result){
				if(error){
					//do an error
					console.log(error);
					res.render("pokemon/matchup",{
			 			title: "Error: Not a valid pokemon!"
				 	});
				}else{
					//render the correct pokemon screen
					res.render("pokemon/matchupResults",{
			 			title: "Pokemon :: " + result.name,
			 			user: JSON.stringify(user1),
			 			height: Math.ceil((result.height*10)/2.54) ,
			 			weight: Math.ceil((result.weight/(10*0.45359237))),
			 			moves: result.moves,
			 			types: result.types,
			 			sprite: result.sprite
				 	});
					res.status(403);
				}
			});
		}
	});

	app.get("/matchup", async (req, res) => {
		var user = await getUser(req.cookies.AuthCookie);

		if(!user){
			res.render("notLoggedIn",{
		 			title: "Sorry you are not logged in"
		 	});
		}else{
			user1=Object.assign({},user);
			delete(user1.hash);
			res.render("pokemon/matchup",{
		 			title: "Matchup!",
		 			user: JSON.stringify(user1)
		 	});
			res.status(403);
		}
	});

	app.get("/forum", async (req, res) => {
		var user = await getUser(req.cookies.AuthCookie);

		if(!user){
			res.render("notLoggedIn",{
		 			title: "Sorry you are not logged in"
		 	});
		}else{
			user1=Object.assign({},user);
			delete(user1.hash);
			res.render("userDisplay",{
		 			title: "User info",
		 			user: JSON.stringify(user1)
		 	});
			res.status(403);
		}
	});

	app.get("/create-account", (req, res) => {
		res.render("create-account",
			{
				layout: "login",
	 			title: "Create an account!"
	 		}
	 	);
		res.status(403);
	});




	app.post("/create-account-attempt", async (req, res) => {
		// i=0
		// index=-1
		// while(i<users.length)
		// {
		// 	if(users[i].username===req.body.username)
		// 	{
		// 		index=i;
		// 		break;
		// 	}
		// 	i++;
		// }

		// if(index!=-1)
		// {
		// 	hash=users[index].hash;
		// 	result=await bcrypt.compare(req.body.password, hash);
		// }
		// if(index!=-1 && result){
		// 	res.cookie("AuthCookie",hash);
		// 	res.redirect("home");
		// }else{
		
		// }
		try{
			const user = await userAPI.addUser(req.body.username,req.body.password,[]);
			res.render("index",
				{
					layout: "login",
					title: "Account successfully created. Please login!"
				}
			);
		}catch(e){
			res.render("create-account",
				{
					layout: "login",
					title: "Try again",
					error: "Unable to create account! Error " + e 
			});
		}
	});

	app.get("/logout", (req, res) => {
	 	res.clearCookie("AuthCookie");
	 	res.render("loggedOut",{
		 			title: "You have been logged out"
		});
	});

});

async function getUser(id){
	if(!id)
		return undefined;
	try{
		let the_user = await userAPI.getUser(id);
		return the_user;
	}catch(e){
		return undefined;
	}
}
