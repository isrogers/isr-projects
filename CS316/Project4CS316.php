<?php
//Author: Ian Rogers
//Class: CS316 Web Programming - Paul Linton
//Project 4 - PHP
//Rogers_p4.php


//defines constants used as a flag
define("FLAG_CATEGORY", "0");
define("FLAG_SEARCHTERMS", "1");
//defines constant which determines the data source
//I made this a constant so that the programmer could easily change the name 
//of the initial DataSources file.
define("DATASOURCES", "DataSources.json");

//start_html function: defines header tags for html
function start_html() {
	echo "
	<html>
	<head>
	<title>Xelkalai's Culture Shock!</title>
	</head>
	<body>
	<h1>Xelkalai's Culture Shock!</h1>
	";

}
//end_html function: closes body & html tags
function end_html() {
	echo "
	</body>
	</html>
	";
}
//validate_input: takes a dataSource json object (from DATASOURCES or DataSources.json),
//an input, and a flag; it determines whether the input is valid based on the json object
function validate_input($dataSource, $input, $flag){
	//foreach loop which iterates through the json object
	foreach($dataSource as $key => $value){
		//if the flag indicates it is for a category input
		if ($flag==FLAG_CATEGORY){
			if ($key == $input) //category input is the key, value is the filename
				return $value;
		}else{
			if ($value == $input) //searchterms input is the value, checks to see that it exists
				return $value;
		}
	}
	error_msg("Unable to locate " . $input . " in " . DATASOURCES . " file!"); //if nothing is returned there was an error
}
//print_match function: prints matches found in the search function in the form of a json object
function print_match($match){
	echo "<p> MATCH FOUND! Printing match: " . json_encode($match) . "</p>";
}
//search function: recursively searches the category json object for a matching term
//then determines whether the keyword ever occurs
//also note that if you do not enter a keyword it will print all objects with matching term.
function search($categories, $term, $keyword){
	//foreach loop which iterates through json object
	foreach($categories as $key => $value){
		if (gettype($value) == "array"){ //if the value is an array it will call search(..) again
			search($value, $term, $keyword);
		}else{
			if ($term == $key) //if the value exists and key is a match
				if (strpos($value, $keyword) !== false) //if a substring exists 
					print_match($categories); //prints the matches
			//if keyword is empty it prints all parent objects
			if ($keyword == "")
				if ($term == $key) 
					print_match($categories);
		}
	}
					
}
//process_form function: processes user input and searches assuming input is valid
function process_form($categories, $searchterms) {
	//retrieves user input
	$chosenCategory = $_GET['category'];
	$chosenTerm = $_GET['whichfield'];
	$chosenKeyword = $_GET['findme'];

	//validates category input to determine filename
	$validCategory = validate_input($categories, $chosenCategory, FLAG_CATEGORY);

	//reads the file
	$categoryData = read_file($validCategory);
	
	//validates term input
	$validTerm = validate_input($searchterms, $chosenTerm, FLAG_SEARCHTERMS);
	
	start_html(); //starts html
	search($categoryData, $validTerm, $chosenKeyword); //searches for matches
	echo "<p> Search complete! </p>"; //print message letting user know search is over
	end_html(); //ends html
}
//display_options function: displays options for drop down menu in the form
function display_options($dataSource, $flag){
	//foreach which iterates through the dataSource json object
	foreach ($dataSource as $key => $value){
		//flag indicates category or searchterm
		if ($flag == FLAG_CATEGORY)
			$result = $key; //if it is a category the key is what we want as the option value
		else
			$result = $value; //if it is a searchterm we want the value as the option value
		//prints the option
		echo "<option value='" . $result . "'>" . $result . "</option>";
	}
}
//display_form function: prints the html form which is displayed until the user enters all the inputs
function display_form($categories, $searchterms) {
	start_html(); //starts html
	//html for the form
	echo "
	<form action='Rogers_p4.php' method='get'>
		Categories: <select name='category'>";
	display_options($categories, FLAG_CATEGORY); //calls display options with category flag
        echo "  </select><br>
		Terms: <select name='whichfield'>";
	display_options($searchterms, FLAG_SEARCHTERMS); //calls display options with searchterms flag
        echo "	</select><br>
		Keywords: <input type='text' name='findme'><br>
		<input type='submit' value='Search!'>
	</form>";
	end_html(); //ends html
}
//error_msg function: prints error message in case of error and then exits
function error_msg($msg){
	start_html();
	echo "<p> Error: " . $msg . "</p>";
	end_html();
	exit(0);
}
//read_file function: gets the contents of a file and then converts the contents
//to a json object.
function read_file($filename){
	//make sure the file exists
	if (file_exists($filename))
		$contents = file_get_contents($filename); //gets contents of the file
	else 
		error_msg("File " . $filename . " doesn't exist!"); //prints error message if file doesn't exist
	//creates json object (associative array) using json_decode and the contents of the file, note the true flag
	$json = json_decode($contents, true);
	//if there was a json error it prints error message
	if (json_last_error() !== JSON_ERROR_NONE)
		error_msg("A json error occured in " . $filename);
	return $json; //return json object
}
//main function: reads initial json object (DataSources.json) and determines whether user input exists or not
//if not prints form, if user input exists call process_form function to search
function main(){
	//read DATASOURCES file (DataSources.json) and decode contents
	$dataSources = read_file(DATASOURCES);

	//extracts categories subobject from the json object dataSources
	$categories = $dataSources["categories"];

	//extracts searchterms subobject
	$searchterms = $dataSources["searchterms"];

	//all parameters must exist
	if (isset($_GET['category'])) {
		if (isset($_GET['whichfield'])) {
			if (isset($_GET['findme'])) {
				process_form($categories, $searchterms); //process the form passing in the two subobjects
			} else
				display_form($categories, $searchterms); //display the form passing in the two subobjects
		} else
			display_form($categories, $searchterms);
	}else 
		display_form($categories, $searchterms);
}
main(); //run the main() function!
?>
