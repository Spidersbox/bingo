// Import the discord.js module
const Discord = require('discord.js')
const mysql = require('mysql');
const config=require("./config.json");


// Create an instance of Discord that we will use to control the bot
const bot = new Discord.Client();

const token = config.token;

const sqluser=config.sqluser;
const sqlpass=config.sqlpass;
const sqldatabase=config.sqldatabase;
const prefix = config.prefix;

///////////////////////////////////////////////////////////////////////
var array=[01,02,03,04,05,06,07,08,09,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58,59,60,61,62,63,64,65,66,67,68,69,70,71,72,73,74,75];


var user="";
var done=0;
var text="";
var gamebalance=0;
var server="";
var ticker="";
var logo="";
var ret;
bot.on('error', console.error);

// Gets called when our bot is successfully logged in and connected
bot.on('ready', () =>
{
    console.log("Let's play Bingo");
});

// Event to listen to messages sent to the server where the bot is located
bot.on('message', message =>
{
  // So the bot doesn't reply to iteself
  if (message.author.bot) return;

  user=message.author.username;
  server=message.guild.name.toLowerCase();
  switch (server)
  {
    case "litecoinplus":
      ticker="LCP";
      logo="LCP.png";
      break;
    case "penguincoin [peng]":
      ticker="PENG";
      logo="PENG.png";
      break;
  }
//getGameBalance(message,ticker);
  done=0;

//  const args = message.content.trim().split(/ +/g);
  const args = message.content.trim().split(/ /);
  var command = args[0].toLowerCase();

  if (!message.content.startsWith(prefix))
  {
    switch (command)
    {
      case "ping" :
        message.channel.send('Pong!');
        done=1;
        break;
      case "foo" :
        message.channel.send('bar.');
        done=1;
        break;
      case "help":
        getHelp(message);
        done=1;
        break;
    }
  }
  else
  {
    command=args[0].substring(1).toLowerCase();
    var tick="";
    if(args[1])
      tick=args[1].toUpperCase();
    switch (command)
    {
      case "buycard" :
      case "bingo" :
//getGameBalance(message,ticker);
        issueCard(message);
        done=1;
        break;
      case "foo" :
        message.channel.send('bar.');
        done=1;
        break;
      case "balance":
      case "bal":
        getBalance(message,tick);
        done=1;
        break;
      case "help":
        getHelp();
        done=1;
        break;
    }
    if(! done)
    {
      text="sorry, you were mumbling ...";
      message.channel.send(text);
    }
  }
});

bot.login(token);

//////////////////////////////////////////// functions

async function issueCard(message)
{
  var user=message.author.username;
//  var bal=getGameBalance(message,ticker); // func sets var balance
//gamebalance=-1;
 gamebalance=await getGameBalance(message,ticker);
console.log("issueCard gamebalance="+gamebalance);


//while(ret === undefined)
//{
  if(gamebalance >=0)
  {
console.log("gamebalance > -1 :"+gamebalance);
console.log("ret ="+ret);
//    ret=gamebalance;
  }
//}
console.log("from issueCard() "+ticker+" gamebalance="+gamebalance);
if(gamebalance < 10)
{
  message.reply("Not enough to play");
  return;
}
  // pick 25 numbers
  shuffleArray(array);
  var t;
  var line1="";
  var line2="";
  var line3="";
  var line4="";
  var line5="";
  var ch="";
  for(t=0;t<5;t++)
  {
    ch=array[t];
    if(ch < 10)
      ch="0"+ch;
    line1=line1+" "+ch+"  ";

    ch=array[t+5];
    if(ch < 10)
      ch="0"+ch;
    line2=line2+" "+ch+"  ";

    ch=array[t+10];
    if(t==2)
      line3=line3+"free ";
    else
    {
      if(ch < 10)
        ch="0"+ch;
      line3=line3+" "+ch+"  ";
    }

    ch=array[t+15];
    if(ch < 10)
      ch="0"+ch;
    line4=line4+" "+ch+"  ";

    ch=array[t+20];
    if(ch < 10)
      ch="0"+ch;
    line5=line5+" "+ch+"  ";
  }

  text="\`\`\`\n"+line1+"\n"+line2+"\n"+line3+"\n"+line4+"\n"+line5+"   \n\`\`\`";
  const embed = new Discord.RichEmbed()
  .setTitle("Here is your card "+user)
  .setColor(0x97AE86)
  .setDescription(text)
  .setFooter("Your balance "+gamebalance+" "+ticker, "http://altcoinwarz.com/images/coins-medium/"+logo)
  message.reply({embed});
}

function shuffleArray(array)
{
  for(let i = array.length - 1; i > 0; i--)
  {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

function getHelp(message)
{
  var text="prefix *\n";
  text=text+"  *balance  -  your current balance in the \'games\' wallet.\n";
  text=text+"  *deposit  -  to put "+ticker+" in your account to play.\n";
  text=text+"  *withdraw -  to tranfer coins out of your account.\n";
  text=text+"  *bingo    -  to get a card and play (requires 10 "+ticker+")\n";
  const embed = new Discord.RichEmbed()
  .setTitle("Spider's Bingo - **HELP** - "+server)
  .setColor(0x97AE86)
  .setDescription(text)
  .setFooter("Spidersbox - 2018", "http://altcoinwarz.com/images/coins-medium/"+logo)
  message.reply({embed});

}

function getBalance(message,tick)
{
console.log(tick);

  var con = mysql.createConnection
  ({
    host: "localhost",
    user: sqluser,
    password: sqlpass,
    database: sqldatabase
  });

con.connect(function(err) {
  if (err) throw err;
  con.query("SELECT * FROM users where name=\""+message.author.username+"\"", function (err, result, fields)
  {
    if (err) throw err;
    var numRows = result.length;
var text=message.author.username+", returned "+numRows+" records";
    console.log(text);
    if(numRows)
    {
console.log(result[0].balance);
      var found=0;
      if(tick)
      {
        if(tick == result[0].ticker)
        {
          var text="Your current balance:\n"+result[0].ticker+" - "+result[0].balance+"  Deposit address  "+result[0].address;
          found=1;
          message.reply(text);
        }
      }
      else
      {
        var text="Your current balance:\n"+result[0].ticker+" - "+result[0].balance+"  Deposit address  "+result[0].address;
        found++;
        message.reply(text);
      }
    }
    if(!found)
    {
      var text="Sorry, could not find any record of "+tick+" in the \'games\' database";
      message.reply(text);
    }


  });
});

}

async function getGameBalance(message,tick)
{
console.log("looking for "+tick);

  var con = mysql.createConnection
  ({
    host: "localhost",
    user: sqluser,
    password: sqlpass,
    database: sqldatabase
  });

  con.connect(function(err)
  {
    if (err) throw err;
    con.query("SELECT * FROM users where name=\""+message.author.username+"\" AND ticker=\""+tick+"\"", function (err, result, fields)
    {
      if (err) throw err;
      var numRows = result.length;
var text=message.author.username+", returned "+numRows+" records";
console.log(text);
      if(numRows>0)
      {
console.log("tick="+tick+"  "+result[0].balance+" ticker="+ticker);
        if(tick == result[0].ticker)
        {
console.log(" tick == ticker");
          gamebalance=result[0].balance;
          return(gamebalance);
console.log("did not return from tick == ticker");
        }
      }
      else
      {
        gamebalance=0;
        return(gamebalance);
      }
    });
  });

}
