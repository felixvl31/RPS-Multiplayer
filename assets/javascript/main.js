//Initialize Firebase
var config = {
  apiKey: "AIzaSyB2f5c_GkJ5hh4fu1twgco69RftKBl99yU",
  authDomain: "rps-multiplayer-3103f.firebaseapp.com",
  databaseURL: "https://rps-multiplayer-3103f.firebaseio.com",
  projectId: "rps-multiplayer-3103f",
  storageBucket: "rps-multiplayer-3103f.appspot.com",
  messagingSenderId: "733984037179"
};
firebase.initializeApp(config);

//Declare vars
var database = firebase.database();
var playersRef = database.ref().child("players");
var phaseRef = database.ref().child("phase");
var viewersRef = database.ref().child("viewers");
var key1;
var key2;

var playerNumber;
var namePlayer;
var winner;
var winnerName;
var tie = false;
var tieResult = "It's a Tie";
var P1 = {
  choice:"",
  wins:0 ,
  losses:0,
  name:""
};

var P2 = {
  choice:"",
  wins:0 ,
  losses:0,
  name:""
};


phaseRef.onDisconnect().remove();


//Display Player name
playersRef.on("child_added",function(snapshot){
  var key = snapshot.key;
  $("#P"+ key + "Name").text(snapshot.val().name);
});

//Player disconnects
playersRef.on('child_removed', function(snapshot) {
  database.ref().once("value",function(snapshot){
    key1 = snapshot.child("players").val()[1];
    key2 = snapshot.child("players").val()[2];
  });
  var key = snapshot.key;
  $("#P"+ key + "Name").text("Waiting for Player " + key + " to join");

  setTimeout(function() {    
    if(key == 1 && key2!== undefined){
      playersRef.child("2").update({
        wins: 0,
        losses: 0
      });
    }else if(key == 2 && key1!== undefined){
      playersRef.child("1").update({
        wins: 0,
        losses: 0
      });
    }
  },500);

});

//Order of the game
phaseRef.on("value",function(snapshot){
  var phase = snapshot.val();
  if(phase == 1){
    playersRef.once("value",function(snapshot){
      P1.wins = snapshot.val()["1"].wins;
      P2.wins = snapshot.val()["2"].wins;
      P1.losses = snapshot.val()["1"].losses;
      P2.losses = snapshot.val()["2"].losses;
    });
    $("#FinalResults").empty();
    $("#scoreP1").html("Wins: " + P1.wins + " | Losses: " + P1.losses );
    $("#scoreP2").html("Wins: " + P2.wins + " | Losses: " + P2.losses );
    if(playerNumber === 1) {
      // Show options to P1
      $("#messageDiv").text("Make your pick");
      $("#statusP1").text("Choose an option below");
      $("#statusP2").empty();
      $("#optionsP1").css("display", "block");
    }else if(playerNumber === 2){
      // P2 waits for P1 to choose
      $("#messageDiv").text("Waiting for Player 1 to choose");
      $("#statusP1").empty();
      $("#statusP2").empty();
    }
  }

  if(phase == 2){
    if(playerNumber === 2) {
      // Show options to P2
      $("#messageDiv").text("Make your pick");
      $("#statusP1").empty();
      $("#statusP2").text("Choose an option below");
      $("#optionsP1").css("display", "none");
      $("#optionsP2").css("display", "block");
        
    }else if(playerNumber === 1){
      // P1 waits for P2 to choose
      $("#messageDiv").text("Waiting for Player 2 to choose");
      $("#statusP1").empty();
      $("#optionsP1").css("display", "none");
    }
  }

  if(phase == 3){
    $("#optionsP2").css("display", "none");
    $("#statusP2").empty();
    choseWinner();
    setTimeout(function(){
        phaseRef.set(1);
    },3000);
  }

});

// Adding a new player
var determinePlayer = function(){
  database.ref().once("value",function(snapshot){
    var numberOfPlayers = snapshot.child("players").numChildren();
    // In case there are not Players
    if(numberOfPlayers == 0){
      playerNumber = 1;
      P1.wins = 0;
      P1.losses = 0;
      $("#P1Name").empty();
      $("#P1Name").text(namePlayer);
      $("#nameInputDiv").css("display","none");
      $("#messageDiv").text("Welcome " + namePlayer + ", you are Player #" + playerNumber);
      $("#nameInputDiv").css("display","none");
      playersRef.child(playerNumber).onDisconnect().remove();
      playersRef.child(playerNumber).set({
        name: namePlayer,
        wins: 0,
        losses: 0,
      });
    }

    // P2 is online, but P1 is not
    else if(numberOfPlayers == 1 && snapshot.child("players").val()[2] !== undefined){
      playerNumber = 1;
      P1.wins = 0;
      P1.losses = 0;
      $("#P1Name").empty();
      $("#P1Name").text(namePlayer);
      $("#messageDiv").text("Welcome " + namePlayer + ", you are Player #" + playerNumber);
      $("#nameInputDiv").css("display","none");
      playersRef.child(playerNumber).onDisconnect().remove();
      playersRef.child(playerNumber).set({
        name: namePlayer,
        wins: 0,
        losses: 0,
      });
      phaseRef.set(1);
    }

    // P1 is online, but P2 is not
    else if(numberOfPlayers == 1){
      playerNumber = 2;
      P2.wins = 0;
      P2.losses = 0;
      $("#P2Name").empty();
      $("#P2Name").text("Welcome " + namePlayer + ", you are Player #" + playerNumber);
      $("#messageDiv").text("Welcome " + namePlayer + ", you are Player #" + playerNumber);
      $("#nameInputDiv").css("display","none");
      playersRef.child(playerNumber).onDisconnect().remove();
      playersRef.child(playerNumber).set({
        name: namePlayer,
        wins: 0,
        losses: 0,
      });
      phaseRef.set(1);
    }

    // 3rd Player
    else if(numberOfPlayers == 2){
      $("#messageDiv").text("Welcome " + namePlayer + ", you are Viewer");
      $("#nameInputDiv").css("display","none");
      playerNumber = 3;
      viewersRef.onDisconnect().remove();
      database.ref("viewers").push({
        name: namePlayer,
      });
    }

  })
};

//Define player Name
$("#playerNameBtn").on("click",function(event){
  event.preventDefault();
  namePlayer = $("#playerNameInpt").val();
  determinePlayer();
});

//Select Rock,paper or scissor
$(".item").on("click",function(){
  playersRef.child(playerNumber).update({
    choice: $(this).attr("data")
  });
  if(playerNumber == 1){
    phaseRef.set(2)
  }else if(playerNumber == 2){
    phaseRef.set(3)
  }
});

//Function to determine who wins
var choseWinner = function(){
  tie = false;
  playersRef.once("value",function(snapshot){
    P1.choice = snapshot.val()["1"].choice;
    P2.choice = snapshot.val()["2"].choice;
    P1.name = snapshot.val()["1"].name;
    P2.name = snapshot.val()["2"].name;
    if ((P1.choice === "rock") && (P2.choice === "scissors")||(P1.choice === "paper") && (P2.choice === "rock")||(P1.choice === "scissors") && (P2.choice === "paper")) {
      winner = 1;
      winnerName = P1.name;
      playersRef.child("1").update({
        wins: P1.wins + 1
      });
      playersRef.child("2").update({
        losses: P2.losses + 1
      });
    }
    else if ((P1.choice === "rock") && (P2.choice === "paper")||(P1.choice === "scissors") && (P2.choice === "rock")||(P1.choice === "paper") && (P2.choice === "scissors")) {
      winner = 2;
      winnerName = P2.name;
      playersRef.child("2").update({
        wins: P2.wins + 1
      });
      playersRef.child("1").update({
        losses: P1.losses + 1
      });
    }
    else if (P1.choice === P2.choice) {
      tie = true;
    }
    var img1 = $("<img>").attr("src","assets/images/"+ P1.choice + ".png");
    var img2 = $("<img>").attr("src","assets/images/"+ P2.choice + ".png");
    $("#statusP1").html(img1);
    $("#statusP2").html(img2);
    if(tie === true){
      $("#FinalResults").html(tieResult);
    }else{
      $("#FinalResults").html("The winner is " + winnerName);
    }
  });
};

//Chat
$("#chatBtn").on("click",function(){
  var message = $("#chatInput").val();
  $("#chatInput").val("");
  if(namePlayer == undefined){
      database.ref().child("chat").push({
          message: "Viewer: " + message
      });
  }else{
      database.ref().child("chat").push({
          message: namePlayer + ": " + message
      });
  }
});

database.ref().child("chat").orderByKey().on("child_added",function(snapshot) {
  var newMessage = $("<p>").html(snapshot.val().message);
  $("#chat").append(newMessage);
});


//Delete all chat
playersRef.on('child_removed', function(snapshot) {
  console.log(snapshot);
  database.ref().once("value",function(snapshot){
    var numberOfPlayers = snapshot.child("players").numChildren();
    console.log(numberOfPlayers);
    if(numberOfPlayers == 0){
      database.ref().child("chat").onDisconnect().remove();
    }
  });
});

