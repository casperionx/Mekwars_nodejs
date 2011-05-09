/* Copyright (c) 2006 YourNameHere
   See the file LICENSE.txt for licensing information. */

var net = require('net');
var fs = require('fs');

var people = [];
var config = [];
var planets = {};
var cfgFile = "cfg.txt"; //config file.
var pfile = "planets.txt";
//load first

//read server config file into var config = []; - will be JSON text file.
/*

JSON in file:
{

	server_name : "My Server Name Here",
	server_version_in_use : 0.0.1, //will be what ever version of NODEJS version of Mekwars server
	server_owner : "Heath Carruthers",
	server_contact : "fireflyx@bigpond.net.au",
	server_era : "AoW|SL|SCW|ECL|GECL|CI|FCCW|JIHAD|DA", (refer to below for explination of accronyms)
	server_status : "Active|BETA|Closed_Alpha|Closed_BETA|Closed",
	server_planet_data_file : "planets.xml" - perhaps change to JSON as well? - going to be interesting how to handle this - BIG FILE data stream
	
	
	
	AoW = Age of War
	SL = Star League
	SCW = Succession Wars
	ECL = Early Clan Years
	GECL = Golden Era Clan
	CI = Clan Invasion
	FCCW = Fed Com Civil War
	Jihad
	DA = Dark Ages

}


*/
var readSrvConfig = function(serverConfigFile)
{
	fs.readFile(serverConfigFile, function(err, data) {
		
		/*
		var tmp_cfg_data = data.toString().split("\n");
		//config file is read correctly.
		for(var i = 0; i < tmp_cfg_data.length; i++)
		{
			console.log(tmp_cfg_data[i]+"\n");
		}
		*/
		
		var tmp_cfg_data = JSON.parse(data.toString());
		console.log(tmp_cfg_data.server_name+ " - "+ tmp_cfg_data.server_owner);
		
		
	});
};

var readBuildTable = function(username, buildTableName, socket)
{
	fs.readFile(buildTableName+".txt", function(err, data) {
		
		var buildTable = JSON.parse(data.toString());
		
		return buildTable;
	});
};
/*
example planets file:
{
	"planets" : [
		
		"name" : "Terra",
		"x" : "0",
		"y" : "0",
		"original_owner" : "CS",
		"current_owner" : "WOB",
		"control_points" : "100"
		"factory_file" : "terra_factory_list.txt",
		
		]
}

*/
var planetsMaker = function(planetsFile) {
	
	fs.readFile(planetsFile, function(err, data) {
		
		//will be too big overall, might make it smaller initialy
		if(err) {
			console.log(err);
		}
		planets.uni = JSON.parse(data.toString());
		console.log(planets.uni[0].name);
	});
	
	
	
};

readSrvConfig(cfgFile);
planetsMaker(pfile);
//actual server


net.createServer(function (s) {
	s.setEncoding('utf8');
	
	
	
	var user = {};
	user.socket = s;
	user.id = s.remotePort+s.remoteAddress;//+ "" + Math.random(Math.floor(1000));
	user.addy = s.remoteAddress;
	people.push(user);
	
	s.write("Welcome to the server\n\r");
	broadcast("b:User Connected>"+user.id+"\n\r",s);
	
	s.on('data', function(d) {
		
		var data = d.split(":");//JSON.parse(d);
		if(data[0] == "broadcast")
		{
			broadcast(d, s);
			console.log(d);
		} else if(data[0] == "pm")
		{
			//find userid.
			var info = data[1].split("|");
			for (var x = 0; x < people.length; x++)
			{
				
				if(people[x].id == info[0])
				{
					people[x].socket.write("PM: "+user.id+"> "+info[1]);
					console.log("PM: "+user.id+ " > "+info[0]+ " : "+info[1]);
				}
			}
		} else if(data[0] == "setadmin")
		{
			//console.log("setadmin");
			for(var l = 0; l < people.length; l++)
			{
				var tmpsp = data[1].split("|");
				//console.log(tmpsp[0]);
				if(people[l].id == tmpsp[0])
				{
					people[l].adminlevel = tmpsp[1];
					console.log(people[l]);
				}
			}
		} else if(data[0] == "unitmake")
		{
			var unitData = data[1].split("|");
			generateUnits("casperionx", s, unitData[0], unitData[1]);
		} else if(data[0] == "purge_planets")
		{
			planets = {}; //kill planets DB
			s.write(planets.toString());
			console.log(planets);
		}
	}) ;
	
	s.on('end', function() {
		
		//var index = people.indexOf(s);
		for(var i = 0; i < people.length; i++)
		{
			if(people[i].socket === s)
			{
				people.splice(i, 1);
			}
		}
		
		
	});
	
}).listen(8125);

var broadcast = function (msg,socket)
{
	for (var i = 0; i < people.length; i++)
	{
		//if(people[i].socket === socket) continue;
		people[i].socket.write(socket.remotePort+socket.remoteAddress + '> ');
		var tmpmsg = msg.split(":");
		people[i].socket.write(tmpmsg[1]);
	}
};

var generateUnits = function(username, socket, lc, mc)
{
	unitsListing = {
		
		light : [
			
			{name : "commando", weight : 20, filename : "Commando COM-2D.MTF"},
			{name : "flea", weight : 20, filename : "Jenner FLE-4.MTF"},
			{name : "jenner", weight : 30, filename : "Jenner JR7-K.MTF"},
			{name : "javelin", weight : 35, filename : "Javelin JVN-10F.MTF"}
			
		],
		
		medium : [
			
			{name : "enforcer", weight : 50, filename : "Enforcer ENF-4R.MTF"},
			{name : "dervish", weight : 55, filename : "Dervish DV-6M.MTF"},
			{name : "wolverine", weight : 55, filename : "Wolverine WVR-6R.MTF"},
			{name : "Hoplite", weight : 55, filename : "Hoplite HOP-4B.MTF"},
			{name : "Gladiator", weight : 55, filename : "Gladiator GLD-4R.MTF"}
			
		]
		
	};
	
	//build army:
	
	var lightmechs = [];
	var mediummechs = [];
	
	//lightmech input
	for (var i = 0; i < lc; i++)
	{
		var index_l = Math.floor(Math.random() * lc);
		lightmechs.push(unitsListing.light[index_l]);
		console.log(index_l);
	}
	
	//mediummech  input
	for (var j = 0; j < mc; j++)
	{
		var index_m = Math.floor(Math.random() * mc);
		mediummechs.push(unitsListing.medium[index_m]);
		console.log(index_m);
	}
	
	for (var cc = 0; cc < people.length; cc++)
	{
		if(people[cc].socket === socket)
		{
			people[cc].mechs = {
				light : lightmechs,
				medium : mediummechs
			}
			
			socket.write(JSON.stringify(people[cc].mechs));
		}
	}
	
	console.log(lightmechs + " " + mediummechs);
};



//var 