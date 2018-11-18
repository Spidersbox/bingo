// Import the discord.js module
const Discord = require('discord.js');
const mysql = require('mysql');
const config=require("./config.json");
const pool = require('./database');
//const coins = require("./coins.json");
var rpc = require('node-json-rpc');

// Create an instance of Discord that we will use to control the bot
const bot = new Discord.Client();

const token = config.token;

const sqluser=config.sqluser;
const sqlpass=config.sqlpass;
const sqldatabase=config.sqldatabase;
const prefix = config.prefix;
var server=config.server;
const roomid=config.roomid;
const ticker=config.ticker;
const logo=config.logo;
const gamecost=config.gamecost;
var coinsarray=[];
coinsarray.push(ticker);

//var user="";
var done=0;
var text="";
var gamebalance=0;
var ret;
var authorid="";
var counter=0;

var players;  // holds players and their cards
var chosenArray=[]; // global so I don't have to load it 40 times
var winners=[]; // list of winners;
var tries=[];
var how=[];

bot.on('error', console.error);

bot.on('ready', () =>
{
    console.log("Let's play Bingo");
});

// Event to listen to messages sent to the server where the bot is located
bot.on('message', message =>
{
  // So the bot doesn't reply to iteself
  if (message.author.bot) return;
var type=message.channel.type;

console.log("message type=",type);
  user=message.author.username;
  authorid=message.author.discriminator;
  if(message.channel.type=="dm")
    server="dm";
  else
    server=message.guild.name.toLowerCase();
  if(message.channel.type=="dm")
    guildid="dm";
  else
    guildid=message.guild.id;
  channelid=message.channel.id;

//console.log("Server name:"+server);
//console.log("Guild id:"+guildid);
//console.log("channel id:"+channelid);

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
    if(command.startsWith('*'))
    {
      done=1;
    }

    if(server=="dm")
    {
      switch (command)
      {
        case "foo" :
          message.channel.send('bar.');
          done=1;
          break;
        case "house":
          getHouse(message);
          done=1;
          break;
        case "balance":
        case "bal":
          getBalance(message,ticker);
          done=1;
          break;
        case "help":
          getHelp(message);
          done=1;
          break;
        case "donate":
        case "donation":
        case "donations":
          donate(message);
          done=1;
          break;
      }
    }
    else
    if((channelid==roomid) || (channelid=="497999755574640677"))
    {
      switch (command)
      {
        case "playnow" :
          play(message);
          done=1;
          break;
        case "buycard":
        case "bingo":
        case "play":
          issueCard(message);
          done=1;
          break;
        case "foo" :
          message.channel.send('bar.');
          done=1;
          break;
        case "balance":
        case "bal":
          getBalance(message);
          done=1;
          break;
        case "help":
          getHelp(message);
          done=1;
          break;
        case "house":
          getHouse(message);
          done=1;
          break;
        case "deposit":
        case "dep":
          deposit(message);
          done=1;
          break;
        case "withdraw":
        case "withdrawal":
        case "send":
          withdraw(message);
          done=1;
          break;
        case "tip":
          sendTip(message);
          done=1;
          break;
        case "wallet":
          walletStatus(message);
        case "*":
          done=1;
          break;
        case "donate":
        case "donation":
        case "donations":
          donate(message);
          done=1;
          break;
        case "stats":
        case "status":
          readUser(message,user+authorid);
          done=1;
        break;
      }
    }
    if(! done)
    {
      text="sorry, you were mumbling ...";
      if(channelid!=roomid)
        text="in the games-bingo room please."
      message.channel.send(text);
    }
  }
});

bot.login(token);

//////////////////////////////////////////// functions

async function issueCard(message)
{
//bot.guilds.guildid.channels.channelid.send("playing");
//  check to see if player has a card
  let user=message.author.username;
  let authorid=message.author.discriminator;
  var test=await gamecard(user);
  if(test)
  {
    message.reply("you already have a bingo card for "+ticker);
    return;
  }
//console.log("back from gamecard test=",test);

//  check to see if player has enough coin
  var test=await getGameBalance(user+authorid);
console.log("getGameBal: test=%d gamebalance=%d",test,gamebalance);
  if(gamebalance < gamecost)
  {
    message.reply("Not enough "+ticker+" to play\n(*help for help)");
    return;
  }

  createUserTable(user+authorid);
  gamebalance=await chargeUser(user+authorid);
console.log("from chargeUser() "+ticker+" gamebalance="+gamebalance);

var B=['01','02','03','04','05','06','07','08','09','10','11','12','13','14','15'];
var I=['16','17','18','19','20','21','22','23','24','25','26','27','28','29','30'];
var N=['31','32','33','34','35','36','37','38','39','40','41','42','43','44','45'];
var G=['46','47','48','49','50','51','52','53','54','55','56','57','58','59','60'];
var O=['61','62','63','64','65','66','67','68','69','70','71','72','73','74','75'];

  // pick 25 numbers
  shuffleArray(B);
  shuffleArray(I);
  shuffleArray(N);
  shuffleArray(G);
  shuffleArray(O);
  var t;
  var line1="";
  var line2="";
  var line3="";
  var line4="";
  var line5="";
  var ch="";

  line0=" B   I   N   G   O";
  line1=" "+B[0]+"  "+I[0]+"  "+N[0]+"  "+G[0]+"  "+O[0];
  line2=" "+B[1]+"  "+I[1]+"  "+N[1]+"  "+G[1]+"  "+O[1];
  line3=" "+B[2]+"  "+I[2]+" free "+G[2]+"  "+O[2];
  line4=" "+B[3]+"  "+I[3]+"  "+N[3]+"  "+G[3]+"  "+O[3];
  line5=" "+B[4]+"  "+I[4]+"  "+N[4]+"  "+G[4]+"  "+O[4];


  text="\`\`\`cpp\n"+line0+"\n"+line1+"\n"+line2+"\n"+line3+"\n"+line4+"\n"+line5+"   \n\`\`\`";
  const embed = new Discord.RichEmbed()
  .setTitle("Here is your card "+user)
  .setColor(0x97AE86)
  .setDescription(text)
  .setFooter("Your balance "+gamebalance+" "+ticker, "http://altcoinwarz.com/images/coins-medium/"+logo)
//  message.reply({embed});
  message.channel.send({embed});
  let b= JSON.stringify(B);
  let i= JSON.stringify(I);
  let n= JSON.stringify(N);
  let g= JSON.stringify(G);
  let o= JSON.stringify(O);
  let res=await updateGame(user,authorid,ticker,b,i,n,g,o);

//  let res2=await updateGame("Spiders Bingo","8267",ticker,b,i,n,g,o);
//console.log(user+" updategame="+res);
  players=await loadPlayers(ticker);
  var playersNum=players.length;
console.log("\nplayers  =",playersNum);

  if(playersNum>1 && counter<1)
  { // trigger counter
    counter++;
    setTimeout(nextCounter,120000,message);
    message.channel.send(" game starts in 2 minutes.");
  }
}

async function nextCounter(message)
{
  message.channel.send(" game starts in 1 minute.");
  setTimeout(play,60000,message);
}


//////////////////////////////////////////////////////////////////////////////////ult = await pool.query("select * from house where ticker="+"\""+ticker+"\"");
//console.log("readPot result=",result);
async function play(message)
{
//  message.channel.send("playing");

//console.log("guildid'",guildid);
  counter=0;
  winners=[];
  tries=[];
  how=[];

  var array=[01,02,03,04,05,06,07,08,09,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58,59,60,61,62,63,64,65,66,67,68,69,70,71,72,73,74,75];

  //  players global
  players=await loadPlayers(ticker);
  var playersNum=players.length;
//console.log("\nplayers  =",playersNum);
//console.log(players[0].name+" players[0].B =%j",players[0].B);
  for(let t=0;t<playersNum;t++)
  {
    players[t].B=JSON.parse(players[t].B);
    players[t].I=JSON.parse(players[t].I);
    players[t].N=JSON.parse(players[t].N);
    players[t].G=JSON.parse(players[t].G);
    players[t].O=JSON.parse(players[t].O);
    players[t].N[2]="99";
  }

  for(let i = array.length - 1; i > 0; i--)
  {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }

  var text="";
  var winner=0;
  var balls=[99];

  for(let t=0;t<75;t++)
  {
    let ball=array[t];
    balls.push(ball);
    text=text+ball+", ";
    winner=await checkCards(balls);

    if(winner==1)
    {
      tries.push(t);
      break;
    }
  }
//  message.channel.send(text);

  for(let t=0;t<players.length;t++)
  {
    user=players[t].name;
    chosenArray=balls;
    line0=" B   I   N   G   O";
    line1=await chosen(user,players[t].B[0])+
      await chosen(user,players[t].I[0])+
      await chosen(user,players[t].N[0])+
      await chosen(user,players[t].G[0])+
      await chosen(user,players[t].O[0]);

    line2=await chosen(user,players[t].B[1])+
      await chosen(user,players[t].I[1])+
      await chosen(user,players[t].N[1])+
      await chosen(user,players[t].G[1])+
      await chosen(user,players[t].O[1]);

    line3=await chosen(user,players[t].B[2])+
      await chosen(user,players[t].I[2])+
      "[XX]"+
      await chosen(user,players[t].G[2])+
      await chosen(user,players[t].O[2]);

    line4=await chosen(user,players[t].B[3])+
      await chosen(user,players[t].I[3])+
      await chosen(user,players[t].N[3])+
      await chosen(user,players[t].G[3])+
      await chosen(user,players[t].O[3]);

    line5=await chosen(user,players[t].B[4])+
      await chosen(user,players[t].I[4])+
      await chosen(user,players[t].N[4])+
      await chosen(user,players[t].G[4])+
      await chosen(user,players[t].O[4]);

    text="\`\`\`ini\n"+line0+"\n"+line1+"\n"+line2+"\n"+line3+"\n"+line4+"\n"+line5+"   \n\`\`\`";

    showCards(message,ticker,user,text);
//console.log("numbers "+text);  
  }
  var diff=[];
  diff.push(winners[0]); //push the first one
  tie=0;
  if(winners.length>1)
  {
    console.log("tie ="+winners);
    for(let t=0;t<winners.length;t++)
    {
//      let d=winners[t].indexOf(diff);
      let d=diff.indexOf(winners[t]);
console.log("(indexof)%s %d=",winners[t],d);
      if(d==-1)
        diff.push(winners[t]);
    }
    
    tie=diff.length-1;
    if(tie)
    {
      console.log("TIE!!  "+diff);
    }
  }
  var loosers=players;
  var pot=10*playersNum;
  var house=0;
  if(tie)
  {
    tie++;
console.log("diff.length=%d playerNum=%d",diff.length,playersNum);
    if(diff.length<playersNum)
    {
      pot--; // one for the house
      house++;
    }
    text="```\nit's a tie in "+tries+" rounds,\nwith "+how+"\n the pot ("+pot+" "+ticker+") will be split between "+tie+" players.\n";
    let amt=pot/tie;
    for(let t=0;t<diff.length;t++)
    {
      let credituser=diff[t];
      text=text+credituser+" gets "+amt+"\n";
      let res=await creditUser("bingo",10,"tie",ticker,credituser,amt);
    }
    text=text+"```";
  }
  else
  {
    pot=pot-1;  // 1 for the house
    house++;
    text="```"+diff+" won "+pot+" "+ticker+" in "+tries+" rounds,\nwith "+how+"```";
    let res=await creditUser("bingo",10,"win",ticker,diff[0],pot);
  }
  if(house>0)
  {
    await creditPot(ticker,house);
  }

  for(let t=0;t<diff.length;t++)
  {
    for(let i=0;i<loosers.length;i++)
    {
//console.log("diff[t]=%s ==loosers[i]",diff[t],loosers[i].name);
      if(diff[t]==loosers[i].name)
        loosers.splice(i,1);
    }
  }
//  let room=await getRoom(ticker);
  message.channel.send(text);

//bot.guilds.get(guildid).channels.get(channelid).send(text);
console.log("winners="+diff);
console.log("tries=",tries);
//console.log("loosers=",loosers);
text="";
  for(let t=0;t<loosers.length;t++)
  {
    await creditUser("bingo",10,"lose",ticker,loosers[t].name,0);
  }

  let res=await pool.query("delete from bingo where ticker=\""+ticker+"\"");
}

////////////////////////////////////////////////  show cards
async function showCards(message,ticker,user,text)
{
//  message.channel.send("playing");
//console.log("showCards called.");
  const embed = new Discord.RichEmbed()
  .setTitle("Your card "+user)
  .setColor(0x97AE86)
  .setDescription(text)
  .setFooter("Spiders Bingo - 2018 ", "http://altcoinwarz.com/images/coins-medium/"+ticker+".png")
  message.channel.send({embed});
}

///////////////////////////////////////////////  chosen
async function chosen(user,num)
{
  for(let t=0;t<chosenArray.length;t++)  
  {
    if(num==chosenArray[t])
      return("["+num+"]");
  }
  return(" "+num+" ");
}

//////////////////////////////////////////////  checkCards
async function checkCards(balls)
{
  var endgame=0;
  for(let i=0;i<players.length;i++)
  {
    var hits=[];
    for(let b=0;b<balls.length;b++)
    {
      for(let n=0;n<5;n++)
      {
        if(balls[b]==players[i].B[ n])
          hits.push(balls[b]);

        if(balls[b]==players[i].I[ n])
          hits.push(balls[b]);

        if(balls[b]==players[i].N[ n])
          hits.push(balls[b]);

        if(balls[b]==players[i].G[ n])
          hits.push(balls[b]);

        if(balls[b]==players[i].O[ n])
          hits.push(balls[b]);
      }

let bingo=0;
      bingo=await checkCol(players[i],hits);//    check columns
      if(bingo==1)
      {
        endgame=1;
        winners.push(players[i].name);
console.log(players[i].name+" winner!!");
      }

      bingo=await checkRow(players[i],hits);//        check rows
      if(bingo==1)
      {
        endgame=1;
        winners.push(players[i].name);
console.log(players[i].name+" winner!!");
      }

      bingo=await checkDiag(players[i],hits);//        check Diagonals
      if(bingo==1)
      {
        endgame=1;
        winners.push(players[i].name);
console.log(players[i].name+" winner!!");
      }

      bingo=await checkCorners(players[i],hits);//        check Corners
      if(bingo==1)
      {
        endgame=1;
        winners.push(players[i].name);
console.log(players[i].name+" winner!!");
      }

    }
  }
  if(endgame)
    return(1);
  return(0);
}

/////////////////////////////////////////////////////////  check corners
async function checkCorners(players,hits)
{
  let cn=[];
  cn.push(players.B[0]);
  cn.push(players.B[4]);
  cn.push(players.O[0]);
  cn.push(players.O[4]);

var cnt=0;
  for(let b=0;b<hits.length;b++)
  {
    for(let t=0;t<cn.length;t++)
    {
      if(hits[b]==cn[t])
        cnt++;
    }
    if(cnt==4)
    {
      console.log("corner winner!");
      how.push("4 corners");
      return(1);
    }
  }
}

/////////////////////////////////////////////////////////  check diagonals
async function checkDiag(players,hits)
{
  let v1=[];
  v1.push(players.B[0]);
  v1.push(players.I[1]);
  v1.push(players.N[2]);
  v1.push(players.G[3]);
  v1.push(players.O[4]);

  let v2=[];
  v2.push(players.B[4]);
  v2.push(players.I[3]);
  v2.push(players.N[2]);
  v2.push(players.G[1]);
  v2.push(players.O[0]);

var cnt=0;
  for(let b=0;b<hits.length;b++)
  {
    for(let t=0;t<v1.length;t++)
    {
      if(hits[b]==v1[t])
        cnt++;
    }
    if(cnt==5)
    {
      console.log("diag winner!");
      how.push("diagonal");
      return(1);
    }
  }

  cnt=0;
  for(let b=0;b<hits.length;b++)
  {
    for(let t=0;t<v2.length;t++)
    {
      if(hits[b]==v2[t])
        cnt++;
    }
    if(cnt==5)
    {
      console.log("diag winner!");
      how.push("diagonal");
      return(1);
    }
  }
  return(0);
}

/////////////////////////////////////////////////////////  checkRow
async function checkRow(players,hits)
{
  let line1=[];
  line1.push(players.B[0]);
  line1.push(players.I[0]);
  line1.push(players.N[0]);
  line1.push(players.G[0]);
  line1.push(players.O[0]);
  let line2=[];
  line2.push(players.B[1]);
  line2.push(players.I[1]);
  line2.push(players.N[1]);
  line2.push(players.G[1]);
  line2.push(players.O[1]);
  let line3=[];
  line3.push(players.B[2]);
  line3.push(players.I[2]);
  line3.push(players.N[2]);
  line3.push(players.G[2]);
  line3.push(players.O[2]);
  let line4=[];
  line4.push(players.B[3]);
  line4.push(players.I[3]);
  line4.push(players.N[3]);
  line4.push(players.G[3]);
  line4.push(players.O[3]);
  let line5=[];
  line5.push(players.B[4]);
  line5.push(players.I[4]);
  line5.push(players.N[4]);
  line5.push(players.G[4]);
  line5.push(players.O[4]);

var cnt=0;
  for(let b=0;b<hits.length;b++)
  {
    for(let t=0;t<line1.length;t++)
    {
      if(hits[b]==line1[t])
        cnt++;
    }
    if(cnt==5)
    {
      console.log("winner!");
      how.push("top row");
      return(1);
    }
  }
 cnt=0;
  for(let b=0;b<hits.length;b++)
  {
    for(let t=0;t<line2.length;t++)
    {
      if(hits[b]==line2[t])
        cnt++;
    }
    if(cnt==5)
    {
      console.log("winner!");
      how.push("row 2");
      return(1);
    }
  }
 cnt=0;
  for(let b=0;b<hits.length;b++)
  {
    for(let t=0;t<line3.length;t++)
    {
      if(hits[b]==line3[t])
        cnt++;
    }
    if(cnt==5)
    {
      console.log("winner!");
      how.push("middle row");
      return(1);
    }
  }
 cnt=0;
  for(let b=0;b<hits.length;b++)
  {
    for(let t=0;t<line4.length;t++)
    {
      if(hits[b]==line4[t])
        cnt++;
    }
    if(cnt==5)
    {
      console.log("winner!");
      how.push("row 4");
      return(1);
    }
  }
 cnt=0;
  for(let b=0;b<hits.length;b++)
  {
    for(let t=0;t<line5.length;t++)
    {
      if(hits[b]==line5[t])
        cnt++;
    }
    if(cnt==5)
    {
      console.log("winner!");
      how.push("bottom row");
      return(1);
    }
  }

  return(0);
}

/////////////////////////////////////////////////////////  checkCol
async function checkCol(players,hits)
{
  var cnt=0;
  for(let b=0;b<hits.length;b++)
  {
    for(let t=0;t<players.B.length;t++)
    {
      if(hits[b]==players.B[t])
        cnt++;
    }
    if(cnt==5)
    {
      console.log("winner!");
      how.push("column B");
      return(1);
    }
  }
  var cnt=0;
  for(let b=0;b<hits.length;b++)
  {
    for(let t=0;t<players.I.length;t++)
    {
      if(hits[b]==players.I[t])
        cnt++;
    }
    if(cnt==5)
    {
      console.log("winner!");
      how.push("column I");
      return(1);
    }
  }
  var cnt=0;
  for(let b=0;b<hits.length;b++)
  {
    for(let t=0;t<players.N.length;t++)
    {
      if(hits[b]==players.N[t])
        cnt++;
    }
    if(cnt==5)
    {
      console.log("winner!");
      how.push("column N");
      return(1);
    }
  }
  var cnt=0;
  for(let b=0;b<hits.length;b++)
  {
    for(let t=0;t<players.G.length;t++)
    {
      if(hits[b]==players.G[t])
        cnt++;
    }
    if(cnt==5)
    {
      console.log("winner!");
      how.push("column G");
      return(1);
    }
  }
  var cnt=0;
  for(let b=0;b<hits.length;b++)
  {
    for(let t=0;t<players.O.length;t++)
    {
      if(hits[b]==players.O[t])
        cnt++;
    }
    if(cnt==5)
    {
      console.log("winner!");
      how.push("column O");
      return(1);
    }
  }
  return(0);
}

///////////////////////////////////////////// loadPlayers
async function loadPlayers(ticker)
{
  let res=await pool.query("SELECT * FROM bingo where ticker=\""+ticker+"\"");
  return(res);
}

///////////////////////////////////////////// gamecard
async function gamecard(user)
{
//console.log("user %s ticker %s",user,ticker);
  let res=await pool.query("SELECT * FROM bingo where name=\""+user+"\" and ticker=\""+ticker+"\"");
//  console.log("gamecard returned %j",res);
  return(res.length);
}

async function updateGame(user,authorid,ticker,b,i,n,g,o)
{
  try
  {
    let result = await pool.query('insert into bingo (name,authorid,ticker,B,I,N,G,O,hits) VALUES (\''+ user+'\',\''+authorid+'\',\''+ticker+'\',\''+b+'\',\''+i+'\',\''+n+'\',\''+g+'\',\''+o+'\',\'0\')');
//console.log("insert result=",result);
    return(result);
  }
  catch(err)
  {
    console.log('updateGame Error occurred', err);
  }

}

function shuffleArray(array)
{
  for(let i = array.length - 1; i > 0; i--)
  {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  array.length=5;
  array.sort(function(a, b){return a - b;});
}

function getHelp(message)
{
  var sendmess=0;
  var text="";
  var title="";

  if(server=="dm")
  {
    title="Spider's Bingo - **HELP** - "+server;
    text="  *balance  -  your current balance in the \'games\' wallet.\n";
    text=text+"  that is all for now in DM commands\n";

    const embed = new Discord.RichEmbed()
    .setTitle(title)
    .setColor(0x97AE86)
    .setDescription(text)
    .setFooter("Spidersbox - 2018", "http://altcoinwarz.com/images/coins-medium/"+logo);
    message.reply({embed});
    return;
  }

  const args = message.content.trim().split(/ /);
  if(args[1])
  {
    arg1=args[1].toLowerCase();
    if(arg1="wallet")
    {
      title=" Wallet HELP  - "+server;
      text=" nothing yet.";
      sendmess=1;
    }
    if(arg1="bingo")
    {
      title=" Bingo HELP  - "+server;
      text=" still working on that.";
      sendmess=1;
    }

  }
  if(sendmess==0)
  {
    title="Spider's Bingo - **HELP** - "+server;
    text="prefix *\n";
    text=text+"  *bingo    -  to get a card and play (requires 10 "+ticker+")\n";
    text=text+"  *balance  -  your current balance in the \'games\' wallet.\n";
    text=text+"  *deposit  -  to put "+ticker+" in your account to play.\n";
    text=text+"  *withdraw -  to tranfer coins out of your account.\n";
    text=text+"  *tip      -  tip a user with coins out of your account.\n";
    text=text+"  *stats    -  game stats like games won, lost ...\n";
    sendmess=1;
  }

  if(sendmess==1)
  {
    const embed = new Discord.RichEmbed()
    .setTitle(title)
    .setColor(0x97AE86)
    .setDescription(text)
    .setFooter("Spidersbox - 2018", "http://altcoinwarz.com/images/coins-medium/"+logo);
    message.reply({embed});
  }
}

async function sendTip(message,quiet)
{
  const args = message.content.trim().split(/ /);
  var user=message.author.username;
  var authorid=message.author.discriminator;
  var text;
  var tipuser;
  var amount;
  var tipcoin=ticker;
  var arg4;
  var bad=0;
  var errmsg="";
  if(args[1])
  {
    text="**  that user was not found.";
    tipuser=args[1].toLowerCase();

    if((tipuser[0] =="<") && (tipuser[1] =="@"))
    { // found user id
      id=tipuser.substring(2,tipuser.length-1);
      tipuser=bot.users.get(id).username.toLowerCase();
    }
    //  checking for valid user
    var usersfound=0;
    const list=message.guild.members;
    list.forEach(member =>
    {
      if(tipuser == member.user.username.toLowerCase())
      {
        usersfound++;
        tipuser=member.user.username+member.user.discriminator;
        text="";      
      }
    });
    if(usersfound==0)
    {
      message.reply("**  user "+tipuser+" not found");
      return;
    }
     if(usersfound >1)
    {
      message.reply("hummm, small problem - I found "+usersfound+" users by that name.");
      return;
    }
  }
  else
    bad=1;

  if(!args[2] && args[3])
  {
    errmsg=errmsg+"\n** one space between please";
    bad=1;
  }
 
  if(args[2] && bad==0) /////////////////  amount
  {
    if(args[2]==' ')
    {
      errmsg=errmsg+"\n** one space between please";
      bad=1;
    }
    else
    {
      amount =args[2].replace(/[^\d.-]/g, '');
      if(amount <= 0)
      {
        bad=1;
        errmsg=errmsg+"\n**  tip amount seems to be zero";
      }
    }
  }
  else  
  {
    if(bad==0)
    {
      bad=1;
      errmsg=errmsg+"\n**   amount is incorrect.";
    }
  }

  if(args[3] && bad==0) ////////////////  coin
  {//  check to see if we handle that coin
    var found=0;
    tipcoin=args[3].toUpperCase();
    coinsarray.forEach(cn =>
    {
      if(cn==tipcoin)
        found++;
    });
    if(!found)
    {
      bad=1;
      errmsg=errmsg+"\n**  that coin is not used here.";
    }
  }

  if(args[4] && bad==0)
  {
    arg4=args[4].toLowerCase();
    text="**  what you talkin about Willis?";
    message.channel.send(text);

  }

  if(bad && args[1])
  {
    errmsg=errmsg+"\n\nnope.  not going to work.";
    message.reply(errmsg);
  }

  if(bad)
  {
    text="tip @user amount\n\n";
//    text=text+"  if ticker is not used, "+ticker+" will be used.\n";
    const embed = new Discord.RichEmbed()
    .setTitle("Tip help")
    .setColor(0x97AE86)
    .setDescription(text)
    .setFooter("Spidersbox - 2018", "http://altcoinwarz.com/images/coins-medium/"+logo)
    message.reply({embed});
    return;
  }

  var tippersbalance=await getGameBalance(user+authorid,tipcoin);

  var otherbalance=await getGameBalance(tipuser,tipcoin,true);

  if(tippersbalance < amount)
  {
    text="you do not have that much  :(";
    message.reply(text);
    return;
  }

  if(otherbalance ==-1)
  {
    text=tipuser+" does not have a "+tipcoin+" account.";
    text=text+"\nPlease have "+tipuser+" create one by typing:";
    text=text+"\n*dep\n";
    text=text+"(for a "+ticker+" address)\n\n";
    text=text+"  if using a different crypto - (like "+tipcoin+")\nthey will have to go to that Discord to create an address for it's coin"; 
    const embed = new Discord.RichEmbed()
    .setTitle("Tip help")
    .setColor(0x97AE86)
    .setDescription(text)
    .setFooter("Spidersbox - 2018", "http://altcoinwarz.com/images/coins-medium/"+logo)
    message.reply({embed});
    return;
  }

  var res=await subTip(user+authorid,(tippersbalance*1)-(amount*1),amount*1,tipcoin);
  var changed=res.affectedRows;
  var res=await addTip(tipuser,(otherbalance*1)+(amount*1),amount*1,tipcoin);
  changed=(changed*1)+(res.affectedRows*1);
  if(changed==2)
  {
    text=user+" tipped "+tipuser+" "+amount+" "+ticker;
    console.log(text);
    message.reply(text);
  }
  else
  {
    text=" something went horribly wrong. tip did not work  :( ";
    console.log(text);
    message.reply(text);
  }

//console.log("\nchanged ="+changed);
}

/////////////////////////////////////////////// addTip
async function addTip(user,amount,tipamount,ticker)
{//  write new balance of tipper
console.log("\nlooking to addtip for user ",user);
// get tips_sent balance
  let res= await  pool.query("select * from addresses where name = \""+user+"\"");
  let nmRows=res.length;
  var tbal=0;
  var bbal=0;
  var address="";

  for(let t=0;t<nmRows;t++)
  {
    if(ticker == res[t].ticker)
    {
      tbal=res[t].tips*1;
      bbal=(res[t].balance)*1;
      address=res[t].address;
      break;
    }
  }

  tbal=tbal+tipamount*1;
  try
  {
    let ad=await pool.query("update addresses set tips=\""+tbal+
        "\", balance=\""+amount+"\" where address = \""+address+"\"");
    return(ad);
  }
  catch(err)
  {
    console.log('udate Account Error occurred', err);
  }

}

/////////////////////////////////////////////// subTip
async function subTip(user,amount,tipamount,ticker)
{//  write new balance of tipper
// get tips_sent balance
  let res= await  pool.query("select * from addresses where name = \""+user+"\"");
  let nmRows=res.length;
  var tbal=0;
  var bbal=0;
  var address="";

  for(let t=0;t<nmRows;t++)
  {
    if(ticker == res[t].ticker)
    {
      tbal=res[t].tips_sent;
      bbal=res[t].balance;
      address=res[t].address;
      break;
    }
  }

  tbal=tbal+tipamount;
  try
  {
    let ad=await pool.query("update addresses set tips_sent=\""+tbal+
        "\", balance=\""+amount+"\" where address = \""+address+"\"");
    return(ad);
  }
  catch(err)
  {
    console.log('udate Account Error occurred', err);
  }
}


////////////////////////////////////////////////////////////// chargeUser
async function chargeUser(user)
{//  write new balance of tipper
// get tips_sent balance
// user=user+authorid;

  let bal=0;
  let spent=0;
  let address="";
  let res= await  pool.query("select * from addresses where name = \""+user+"\"");
//console.log("chargeUser user=",user);
//console.log("chargeUser res=",res);
  let nmRows=res.length;
  for(let t=0;t<nmRows;t++)
  {
    if(ticker == res[t].ticker)
    {
      spent=res[t].spent;
      bal=res[t].balance;
      address=res[t].address;
      break;
    }
  }

  bal=bal-gamecost;
//console.log("chargeUser bal now is ",bal);
  spent=spent+gamecost;
  try
  {
    let ad=await pool.query("update addresses set spent=\""+spent+
        "\", balance=\""+bal+"\" where address = \""+address+"\"");
    return(bal);
  }
  catch(err)
  {
    console.log('udate Account Error occurred', err);
  }
}

/////////////////////////////////////////////  getBalance
async function getBalance(message,tick)
{
  let user=message.author.username;
  let authorid=message.author.discriminator;
  var thisuser=user+authorid;
  pool.query("SELECT * FROM addresses where name=\""+thisuser+"\"", function (err, result, fields)
  {
    if (err) throw err;
    var numRows = result.length;
    var text=thisuser+", returned "+numRows+" records";
    console.log(text);
    if(numRows)
    {
      var found=0;
      for(let i=0;i<numRows;i++)
      {
        console.log(result[i].balance);
//        if(tick)
//        {
          if(ticker == result[i].ticker)
          {
            text="Your current balance:\n"+result[i].ticker+"  "+result[i].balance+"  Deposit address  "+result[i].address;
            found=1;
            message.reply(text);
          }
//        }
//        else
//        {
//          text="Your current balance:\n"+result[i].ticker+"  "+result[i].balance+"  Deposit address  "+result[i].address;
//          found++;
//          message.reply(text);
//        }
      }
    }
    if(!found)
    {
      text="Sorry, could not find any record of "+ticker+" in the \'games\' database for you.";
        text=text+"\nyou need to make an address by using the command *dep";
        text=text+"\n(*help for help)";
      message.reply(text);
    }
  });
}

async function getGameBalance(user)
{
//  var tempuser=user+authorid;
 // if(id) // true if id is included in user
//    tempuser=user;
//console.log("looking for user %s and ticker %s",user,ticker);
  try
  {
    let result = await pool.query(
        "select * from addresses where name = \""+user+
        "\" AND ticker = \""+ticker+"\"");
//console.log("getGameBalance result=",result);
    var numRows = result.length;
    if(numRows>0)
    {
      for(let i=0;i<numRows;i++)
      {
        if(ticker == result[i].ticker)
        {
          gamebalance=result[i].balance;
          return(gamebalance);
        }
      }
    }
    else
    {
      gamebalance=-1;
      return(gamebalance);
    }
  }
  catch(err)
  {
    console.log('Error occurred', err);
  }  
}

async function insertAddress(user,address,ticker)
{
  try
  {
    let result = await pool.query("insert into addresses (name,ticker,address,balance,tips,wallet) VALUES (\""+ user+"\",\""+ticker+"\",\""+address+"\",\"0\",\"0\",\"0\")");
//console.log("insert result=",result);
    return(result);
  }
  catch(err)
  {
    console.log('insertAddress Error occurred', err);
  }

}

async function insertUser(user)
{
// first query to see if user is listed
  pool.query("SELECT * FROM users where name=\""+user+"\"", async function (err, result, fields)
  {
    if (err) throw err;
    var numRows = result.length;
//console.log("numRows="+numRows);
    if(numRows>0)
    {
//console.log("numRows="+numRows);
      return("exists");
    }
    else
    {
      try
      {
        let result = await pool.query("replace into users (name) VALUES (\""+ user+"\")");
//console.log("replace result=",result);
        return(result);
      }
      catch(err)
      {
        console.log('insertUser Error occurred', err);
      }
    }
  });
}

async function deposit(message)
{
  let user=message.author.username;
  let authorid=message.author.discriminator;
  let text="";
  let bal=await getWalletBalance(message,user+authorid,ticker);

  // check for exsisting account
  let param=user+authorid;
  let method="getaddressesbyaccount";

  text="";
//  address=await Daemon(message,user+authorid,ticker,method,param);
  address=await Daemon(message,ticker,method,param);
console.log("answer from await Daemon.  address=%j",address);
  if(bal==0)
  {
    if(address[0])
    {
      address=address[0];
    }
    else
    {
      method="getnewaddress";
//console.log("going to ask: "+method+" param "+param);
      address=await Daemon(message,ticker,method,param);

//  add user to database
      var result=await insertUser(user+authorid);

//  add address to database
      result=await insertAddress(user+authorid,address,ticker);

//  create user table
      result=await createUserTable(user+authorid);
console.log("result from createUserTable=",result);
    }

//console.log("reply from getBalance address="+address);
  }
    text=" this is your "+ticker+" deposit address:\n"+address;
    message.reply(text);
}

/////////////////////////////////////////  createUserTable
async function createUserTable(xuser)
{
// first query to see if user is listed
// replace space in user name with underscore
  let user=xuser.replace(/\ /g,"_");
  pool.query("show tables", async function (err, result, fields)
  {
    if (err) throw err;
    var numRows = result.length;
    let found=0;
    for(let t=0;t<numRows;t++)
    {
      let tab=result[t].Tables_in_BANK;
      if(tab==user)
        found++;
;
    }
    if(!found)
    {
// create table
      try
      {
        let result = await pool.query( "create table "+user+" (ID INT AUTO_INCREMENT,game VARCHAR(24),ticker VARCHAR(5),cost DECIMAL(24,8) DEFAULT 0.00,loss DECIMAL(24,8) DEFAULT 0.00,win DECIMAL(24,8) DEFAULT 0.00,draw DECIMAL(24,8) DEFAULT 0.00,date timestamp default now(),PRIMARY KEY(ID),INDEX(game))");
        return(result);
      }
      catch(err)
      {
        console.log('createTableUser Error occurred', err);
      }

    }
  });
}

////////////////////////////////////////////////////////////////////////  withdraw
async function withdraw(message)
{
  const args = message.content.trim().split(/ /);
  var user=message.author.username;
  var authorid=message.author.discriminator;
  var text;
  var amount;
  var address;
  var res=[];

  if(args[1])
  {
    amount=args[1];
  }
  else
  {
    text="*withdraw amount address\n";
    text=text+"you can use witdraw/withdrawal/send to send amount to address\n";
    const embed = new Discord.RichEmbed()
    .setTitle(ticker+" Withdraw help")
    .setColor(0x97AE86)
    .setDescription(text)
    .setFooter("Spiders Bingo - 2018 ", "http://altcoinwarz.com/images/coins-medium/"+logo)
    message.channel.send({embed});
    return;
  }

  if(!args[2] && args[3])
  {
    message.reply(" only one space between please.");
    return;
  }

  if(args[2])
  {
    address=args[2];
    let first=address.startsWith("X")
    let len=address.length; //34
    if((first) && (len==34))
    {
      res=await send(message,user+authorid,amount,address);
      console.log("returned from send",res);
    }
    else
    {
      message.reply("address seems wrong. please check it again.");
      return;
    }
  } 
  else
  {
    message.reply(" I need an address to send to");
    return;
  }
console.log("returned from send res=",res);

  let ins=await insertTx(user+authorid,ticker,address,res,"send",amount,1);
console.log("from insertTx ins=",ins);
  
  text="\nsend "+amount+" to address "+address;
  text=text+"\n tx "+res;
//  text=text+"\n(still working on wallet calls)";
//  text=text+"\n(not really sending ...)";
  message.reply(text);

}

//////////////////////////////////////////////////////////  subWithdrawal
async function subWithdrawal(user,ticker,amount,wamount)
{//  write new balance of tipper
console.log("\nlooking to subtract withdrawal from user ",user);
  let res= await  pool.query("select * from addresses where name = \""+user+"\"");
  let nmRows=res.length;
  var address="";

  for(let t=0;t<nmRows;t++)
  {
    if(ticker == res[t].ticker)
    {
      address=res[t].address;
      break;
    }
  }

  try
  {
    let ad=await pool.query("update addresses set withdrawal=\""+wamount+
        "\", balance=\""+amount+"\" where address = \""+address+"\"");
    return(ad);
  }
  catch(err)
  {
    console.log('subWithdrawal Error occurred', err);
  }

}

async function insertTx(user,coin,addr,txid,txtype,amt,done)
{
  return new Promise((resolve,reject) =>
  {
    pool.query("insert into transactions (name,ticker,address,txid,txtype,amount,done) VALUES (\""+user+"\",\""+coin+"\",\""+addr+"\",\""+txid+"\",\""+txtype+"\",\""+amt+"\",\""+done+"\")", function(err,txresults)
    {
      if (err) resolve(err);
      resolve(txresults);
    });
  });
}

///////////////////////////////////////////////////////////////////////////////  send
async function send(message,user,amount,address)
{
  var text;
  var balance=await getGameBalance(user);
  var newbalance=balance-amount;

  if(newbalance>0)
    text=text+"     so far, so good ...\n";
  else
  {
    text="You dont have enough "+ticker+" to send "+amount+" "+ticker+"\n";
    message.reply(text);
    return;
  }

  let response= await Daemon(message,ticker,"sendtoaddress",address,amount*1);
console.log("daemon response=",response);

//  update users balance
  await subWithdrawal(user,ticker,newbalance,amount);
  return response;
}


async function getWalletBalance(message,theuser,ticker)
{//for exsisting address
  let response= await Daemon(message,ticker,"getbalance",theuser);
//  let text=ticker+" balance ="+response;
//  message.reply(text);
  return(response);
}

async function getHouse(message)
{
  let house=await pool.query("select * from house where ticker = \""+ticker+"\"");

  let text="kitty got "+house[0].balance+" "+ticker+" hidden in the litter box.";
  message.reply(text);
  return;
}

////////////////////////////////////////////////////////////////////  wallet status
async function walletStatus(message)
{
  let user="Spiders Bingo8267";
  let res= await  pool.query("select * from addresses where name = \""+user+"\"");
  let nmRows=res.length;
  var tbal=0;
  var bbal=0;
  var address="";

  for(let t=0;t<nmRows;t++)
  {
    if(ticker == res[t].ticker)
    {
      tbal=res[t].tips_sent;
      bbal=res[t].balance;
      address=res[t].address;
      break;
    }
  }

  let house=await pool.query("select * from house where ticker = \""+ticker+"\"");

  let response= await Daemon(message,ticker,"getinfo","");
  let text=   "Version:     "+response.version;
  text=text+"\nBlocks:      "+response.blocks;
  text=text+"\nConnections: "+response.connections;

  text=text+"\n\nDonation Address:\n"+address;
  text=text+"\nDonation bal "+bbal+" "+ticker;
  text=text+"\n(tips sent to Spiders Bingo)";
  text=text+"\nHouse bal.   "+house[0].balance+" "+ticker;

  const embed = new Discord.RichEmbed()
  .setTitle(ticker+" Wallet Info")
  .setColor(0x97AE86)
  .setDescription(text)
  .setFooter("Spiders Bingo - 2018 ", "http://altcoinwarz.com/images/coins-medium/"+logo)
  message.channel.send({embed});

  return(response);
}

////////////////////////////////////////////////////////////////////  donate
async function donate(message)
{
  let title="";
  if(ticker=="LCP")
  {
    title="BTC Donation status";
    response= await Daemon(message,"BTC","getinfo","");
//console.log("Donate getinfo response ",response);
    let text=   "Version:     "+response.version;
    text=text+"\nBlocks:      "+response.blocks;
    text=text+"\nConnections: "+response.connections;
    text=text+"\nBalance:     "+response.balance+" BTC";
    text=text+"\n\nDonation BTC address: \n13YuyPtXs96g8gR45Gfn1PBAWuxGVGMdhk";

    let user="Spiders Bingo8267";
    let res=await pool.query("select * from addresses where name = \""+user+"\"");
    let nmRows=res.length;
    var tbal=0;
    var bbal=0;
    var address="";

    for(let t=0;t<nmRows;t++)
    {
      if(ticker == res[t].ticker)
      {
        tbal=res[t].tips_sent;
        bbal=res[t].balance;
        address=res[t].address;
        break;
      }
    }

    text=text+"\n\n"+ticker+" Donation Address:\n"+address;
    text=text+"\nDonation bal "+bbal+" "+ticker;
    text=text+"\n(plus tips sent to Spiders Bingo)";

    const embed = new Discord.RichEmbed()
    .setTitle(title)
    .setColor(0x97AE86)
    .setDescription(text)
    .setFooter("Spiders Bingo - 2018 ", "http://altcoinwarz.com/images/coins-medium/"+logo)
    message.channel.send({embed});
    return(response);
  }
  message.channel.send("Donations are not set up.");
}

///////////////////////////////////////////////////////////////////  creditUser
async function creditUser(game,cost,txtype,ticker,user,amt)
{
  let cuser=user
  let res=await loadPlayers(ticker);
  for(let t=0;t<res.length;t++)
  {
    if(res[t].name==cuser)
    {
      cuser=cuser+res[t].authorid;
      break;
    }
  }
// we are adding the game to the history
  res=await setUser(game,cost,txtype,ticker,cuser,amt);
//  update his address amount (winnings)
  res=await getUserAddress(cuser,ticker,amt);
//console.log(cuser+" amt="+amt);
//console.log(cuser+" res="+res);
  res=await setUserAddress(cuser,ticker,res);
}

///////////////////////////////////////////////////////////////////  getUserAddress
async function getUserAddress(user,ticker,amt)
{
  try
  {
    let result = await pool.query("select * from addresses where name=\""+user+"\" and  ticker="+"\""+ticker+"\"");
    let bal=result[0].balance;
    bal=bal+amt;
//console.log(user+" getUserAddress-> bal="+bal);
    return(bal);
  }
  catch(err)
  {
    console.log('getUserAddress Error occurred', err);
  }
}
//////////////////////////////////////////////////////////////////  setUserAddress
async function setUserAddress(user,ticker,amt)
{
  try
  {
    let result = await pool.query("update addresses set balance=\""+amt+"\" where name=\""+user+"\" and ticker="+"\""+ticker+"\"");
    return(result);
  }
  catch(err)
  {
    console.log('setUserAddress Error occurred', err);
  }
}

//////////////////////////////////////////////////////////////////  readUser       ******
async function readUser(message,user)
{
//  let res=await loadPlayers(ticker);
//  for(let t=0;t<res.length;t++)
//  {
//    if(res[t].name==user)
//    {
//      user=user+res[t].authorid;
//      break;
//    }
//  }

// replace space with underscore
  let cuser=user.replace(/\ /g,"_");
  let cost=0;
  let loss=0;
  let win=0;
  let draw=0;
  try
  {
    let result = await pool.query("select * from  "+cuser+" where ticker=\""+ticker+"\"");
    for(let t=0;t<result.length;t++)
    {
      cost=cost+result[t].cost;
      loss=loss+result[t].loss;
      win=win+result[t].win;
      draw=draw+result[t].draw;
    }

    title=user+"'s stats for "+ticker;

    text=     "spent "+cost;
    text=text+"\nwon   "+win;
    text=text+"\nlost  "+loss;
    text=text+"\nties  "+draw;
let total=win+draw-cost;
text=text+"\n\nbingo total: "+total;
  const embed = new Discord.RichEmbed()
  .setTitle(title)
  .setColor(0x97AE86)
  .setDescription(text)
  .setFooter("Spiders Bingo - 2018 ", "http://altcoinwarz.com/images/coins-medium/"+logo)
  message.channel.send({embed});
  }
  catch(err)
  {
    console.log('readUser Error occurred', err);
  }
}

///////////////////////////////////////////////////////////////////  setUser
async function setUser(game,cost,txtype,ticker,xuser,amt)
{
// replace space with underscore
  let user=xuser.replace(/\ /g,"_");
  let win=0;
  let loss=0;
  let draw=0;
  if(txtype=="win")
    win=amt;
  if(txtype=="lose")
    loss=cost;
  if(txtype=="tie")
    draw=amt;

  try
  {
    let result = await pool.query("insert into "+user+" (game,ticker,cost,loss,win,draw) value (\""+game+"\",\""+ticker+"\",\""+cost+"\",\""+loss+"\",\""+win+"\",\""+draw+"\")");
    return(result);
  }
  catch(err)
  {
    console.log('setUser Error occurred', err);
  }
}

///////////////////////////////////////////////////////////////////  creditPot
async function creditPot(ticker,amt)
{
//console.log("creditPot ticker=",ticker);
  let res=await readPot(ticker);
  amt=amt+res[0].balance;
  res=await setPot(ticker,amt);
}

async function readPot(ticker)
{
//console.log("readPot ticker=",ticker);
  try
  {
    let result = await pool.query("select * from house where ticker="+"\""+ticker+"\"");
//console.log("readPot result=",result);
    return(result);
  }
  catch(err)
  {
    console.log('readPot Error occurred', err);
  }
}

async function setPot(ticker,amt)
{
  try
  {
    let result = await pool.query("update house set balance=\""+amt+"\" where ticker="+"\""+ticker+"\"");
    return(result);
  }
  catch(err)
  {
    console.log('setPot Error occurred', err);
  }
}

//async function Daemon(message,user,ticker,method,param)
async function Daemon(message,ticker,method,param,param2)
{
  let myport="coins."+ticker+"port";
  var coinfile="./coins/"+ticker+".json";
//console.log("coinfile=",coinfile);
  let coins=require(coinfile);
  var options=
  {
    port: coins.port,
    host: "localhost",
    path: "/",
    strict: true,
    login: coins.user,
    hash: coins.password
  };

//test daemon
//console.log ("\n Daemon ticker ="+ticker);
//console.log ("\n Daemon options.port ="+options.port);
console.log(" Daemon method= "+method);
console.log(" Daemon param=  "+param);
console.log(" Daemon param2= "+param2);
  var client = new rpc.Client(options);

  if(param2)
  {
    return new Promise((resolve, reject) =>
    {
      var resp=client.call(
      {
        "jsonrpc": "1.0", "method": method, "params": [param,param2], "id": 1
      },
      function (err, res)
      {
        if( err )
        {
          resolve(err);
          console.log("Daemon error: "+err);
          return;
        }
        else
        if(res)
        {
console.log("daemon res =",res);
          resolve(res.result);
          return(res);
        }
      });
    });
  }


  if(param)
  {
    return new Promise((resolve, reject) =>
    {
      var resp=client.call(
      {
        "jsonrpc": "1.0", "method": method, "params": [param], "id": 1
      },
      function (err, res)
      {
        if( err )
        {
          resolve(err);
          console.log("Daemon error: "+err);
        }
        else
        {
//console.log("daemon res =",res);
          resolve(res.result);
          return(res);
        }
      });
    });
  }
  else
  {
    return new Promise((resolve, reject) =>
    {
      var resp=client.call(
      {
        "jsonrpc": "1.0", "method": method, "params": [], "id": 1
      },
      function (err, res)
      {
        if( err )
        {
          resolve(err);
          console.log("Daemon error: "+err);
        }
        else
        {
//console.log("daemon res =",res);
          resolve(res.result);
          return(res);
        }
      });
    });
  }
}


