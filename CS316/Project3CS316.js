#!/usr/bin/node
//Name:		P3_Rogers.js
//Author:	Ian Rogers
//		CS316: Program 3


var http = require("http");
var url = require('url');
var fs = require('fs');
var exec = require('child_process').exec;

//define constants UPPERPORT & LOWERPORT 
//LOWERPORT -> The lowest port value which can be pulled from the randomPort() function
const LOWERPORT = 2000;
//UPPERPORT -> The highest port value which can be pulled from the randomPort() function
const UPPERPORT = 35000;

//defines constants COMIC_SUBSTR_LEN, SEARCH_SUBSTR_LEN, & MYFILE_SUBSTR_LEN
//COMIC_SUBSTR_LEN -> The length of the substring making up /COMIC/
//used to create substrings /COMIC/ and ####-##-## from /COMIC/####-##-##
const COMIC_SUBSTR_LEN = 7;

//SEARCH_SUBSTR_LEN -> The length of the substring making up /SEARCH/
//used to create substrings /SEARCH/ and SEARCHTERM from /SEARCH/SEARCHTERM
const SEARCH_SUBSTR_LEN = 8;

//MYFILE_SUBSTR_LEN -> The length of the substring making up /MYFILE/
//used to create substrings /MYFILE/ and myfile.html from /MYFILE/myfile.html
const MYFILE_SUBSTR_LEN = 8;

//hostname of the server, in this case I used penstemon.cs.uky.edu
const hostname = 'penstemon.cs.uky.edu';

//port -> a random port number generated using the randomPort() function
var port = randomPort();

//randomPort() -> generates a random number between LOWERPORT & UPPERPORT
function randomPort(){
	//obtained from https://stackoverflow.com/questions/1527803/generating-random-whole-numbers-in-javascript-in-a-specific-range
	return Math.floor(Math.random() * (UPPERPORT - LOWERPORT + 1) + LOWERPORT);
}

//giveComic(url, response) -> takes a url and response object and uses exec curl
//to pull up a Dilbert comic from a specific date.
function giveComic(xurl, response){
	//url in the form /COMIC/####-##-## or COMIC/CURRENT
	//purl creates a substring of the ####-##-## or CURRENT portion
	var purl = xurl.substring(COMIC_SUBSTR_LEN);
	
	//if the substring is CURRENT
	if (purl == 'CURRENT')
		//curl the current comic
		var args = "curl http://dilbert.com";
	else
		//if it isn't current grab the comic corresponding to date given
		var args = "curl http://dilbert.com/strip/" + purl;
	//call exec to run the curl in the usr/bin env, then call anonymous function to handle output/errors
	exec(args, {env: {'PATH': '/usr/bin'}}, function(error, stdout, stderr){
		//if there was an error using exec prints the exec error
		if (error){
			response.writeHead(500, {"Content-Type": "text/plain"})
			response.write("ERROR 500: File doesn't exist!");
			console.error('EXEC: '+error);
			return;
		}
		//console.log('stdout:'+ stdout);	for debugging
		//console.log('stderr:'+ stderr);	for debugging
		//write stdout as the end response.
		response.end(stdout);
		return;
	});
}

//doSearch(url, response) -> takes a url and response object and uses exec curl
//to pull up a DuckDuckGo search of the given term in the url
function doSearch(xurl, response){
	//extracts the substring containing the search term from the url
	var purl = xurl.substring(SEARCH_SUBSTR_LEN);
	//formats the url to be curled
	var args = "curl https://duckduckgo.com/html/?q=" + purl + "&ia=web";
	//call exec to run curl 
	exec(args, {env: {'PATH': '/usr/bin'}}, function(error, stdout, stderr){
		//error checking
		if (error){
			response.writeHead(500, {"Content-Type": "text/plain"})
			response.write("ERROR 500: Internal Server Error!");
			console.error('EXEC: '+error);
			return;	
		}
		console.log('stdout:'+ stdout);
		//console.log('stderr:'+ stderr);
		//write stdout as the end response
		response.end(stdout);
		return;
	});
}
//giveFile(url, response) -> takes a url and response object and uses the 
//readFIle and existsSync functions to read and print the contents of the file
function giveFile(xurl, response){
	//extracts substring containing filename
	var purl = xurl.substring(MYFILE_SUBSTR_LEN);
	//sets path to /private_html/filename, it is to be assumed the html file is 
	//in the private_html directory
	var path = 'private_html/' + purl;
	//check to see if it exists
	if (fs.existsSync(path)) {
		//if it exists, it will attempt to read the file
    		console.log("File exists! Attempting to read...");
		fs.readFile(path, function (error, contents){
			//error checking
			if (error){
				response.writeHead(500, {"Content-Type": "text/plain"})
				response.write("ERROR 500: Internal Server Error!");
				console.error('FILE: ' +error);
				return;
			}
			//sends the contents of the file as the end response
			console.log("Success! Sending data!");
			response.end(contents);
		});
	}else{
		//prints error message
		console.error("ERROR 403: File doesn't exist!");
		response.writeHead(403, {"Content-Type": "text/plain"})
		response.write("ERROR 403: File doesn't exist!");
		response.end();
	}
}
//creates server using http.createServer and handles requests/response for the server
var server = http.createServer(function serveURL(request, response){
	//serveURL function -> handle server operations redirects to various functions
	//stores request.url in xurl
	var xurl = request.url;	
	//throws out any favicon.ico requests
	if (xurl == '/favicon.ico')
		return;	
	//uses the writeHead function to format response statusCode and text type
	response.writeHead(200, {"Content-Type": "text/html"})
	
	//defines regular expression, regex, which accepts all comic, search, or myfile requests
	// 	SIDE NOTE REGARDING COMIC REQUESTS:
	//	I tried to make it so the user can only enter valid dates but
	//  	there are several cases in which my regex will accept comic dates which don't exist.
	//	for example /COMIC/2018-12-31 will be accepted even though the comic doesn't exist yet.

	var regex =/^\/COMIC\/((201[0-8]|200[0-9]|1989|199[0-9])\-(0[1-9]|1[0-2])\-([0-2][0-9]|3[0-1])|CURRENT)$|^\/SEARCH\/\w+$|^\/MYFILE\/\w+\.html$/g;
	//stores matches in the match variable
	var match = xurl.match(regex);
	//if match is null it means the URL was invalid
	if (match == null){
		//prints out error message as a 404 because the user entered an invalid URL.
		console.log("BAD! Requested URL:  " + xurl);
		response.writeHead(404, {"Content-Type": "text/plain"})
		response.write("ERROR 404: Page Not Found!");
		response.end();
	//else the user must have entered a valid URL
	}else{
		//print message to console
		//redirect to functions based on URL entered.
		console.log("GOOD! Requested URL: " + xurl);
		if (xurl.substring(0, COMIC_SUBSTR_LEN) == '/COMIC/')
			giveComic(xurl, response);	
		if (xurl.substring(0, SEARCH_SUBSTR_LEN) == '/SEARCH/')
			doSearch(xurl, response);
		if (xurl.substring(0, MYFILE_SUBSTR_LEN) == '/MYFILE/')
			giveFile(xurl, response);
	}
//begins listening on the randomly generated port for the given hostname
}).listen(port, hostname, function() { //anonymous function which prints info to console 
	console.log('Server started. Listening on ' + hostname + ':' + port); //informs the user where we are listening
});


