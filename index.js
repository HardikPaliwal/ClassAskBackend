const DEBUG = false;
let express = require('express');
let app = express();
let server = require('http').Server(app);
let admin = require('firebase-admin');
let io = require('socket.io') (server,{});

admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    databaseURL: "https://classask-429be.firebaseio.com/"
});

let db = admin.database();

  
app.use(express.json());
app.get('/', function(req, res){
	res.sendFile(__dirname + '/client/index.html');
});

app.post('/api/user', function(req, res){
    console.log(req.body);
    let user = req.body;
    admin.auth().createUser({
        email: user.email,
        emailVerified: false,
        password: user.password,
        displayName: user.DisplayName,
      }).then(function(userRecord) {
        // See the UserRecord reference doc for the contents of userRecord.
        return res.send({"UUID": userRecord.uid});
      })
      .catch(function(error) {
        console.log('Error creating new user:', error);
        return res.status(401).send(error);
      });
});

app.get("/api/user", function(req, res){
    let user = req.body;
    firebase.auth().signInWithEmailAndPassword(user.email, user.password).catch(function(error) {
        // Handle Errors here.
        var errorCode = error.code;
        var errorMessage = error.message;
        // ...
      });
})

app.post("/api/class", function(req, res){
    let key = makeid(8);
    let classInfo = req.body;
    db.ref("Data/" +classInfo.UID +"/Classes/" + key).set({
        "className": classInfo.className,
        "createdAt": Math.floor(Date.now() / 1000)
    }).then(() =>{
        return res.send("sucess");
    }).catch((err) =>{
        return res.status(401).send(err);
    });
})

app.get("/api/class", function(req, res){
    let classInfo = req.body;
    db.ref("Professors/" +classInfo.UID +"/Classes/").once("value").then((snapshot) =>{
        let data = snapshot.val();
        return res.send(data);
    }).catch((err) =>{
        return res.status(401).send(err);
    });
})

app.get("/api/startActiveClass", function(req, res){
    let classInfo = req.body;
    return db.ref("ActiveLectures/" + classInfo.classId).set({"Professor": classInfo.UID, "Name" : classInfo.name})
    .then(() =>{
        return db.ref("ActiveLectures/" + classInfo.UID).set({classId: classInfo.classId});
    }).then(() =>{
        res.send("Success");
    }).catch((err) =>{
        return res.status(401).send(err);
    });
})


app.use(express.static('client'));


function makeid(length) {
    var result           = '';
    var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for ( var i = 0; i < length; i++ ) {
       result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
 }

let activeLectures = {};
io.on('connection', function(socket){
	socket.id = Math.random()
	SOCKET_LIST[socket.id] = socket;
	socket.on('professor', function(data){
		signInResult(data, function(res, code){
			if(res){
				socket.emit('signInResponse', {success:true, response: code});
				Player.onConnect(socket, data.userName);
			}
			else{
				socket.emit('signInResponse', {success:false, response: code});
		}})	
	});
	socket.on('signUp', function(data){
		signUpResult(data, function(res, code){
			if(res){
				socket.emit('signInResponse', {success:true, response: code});
				Player.onConnect(socket, data.userName);
			}
			else{
				socket.emit('signInResponse', {success:false, response:code});
		}})	
	});
	socket.on('disconnect', function(){
		Player.disconnect(socket);
		removePack.player.push(socket.id);
	})

	socket.on('sendMsgToServer', function(data){
		if(data === null){
			return;
		}
		if(data.charAt(0) === '/'){
			if(DEBUG){
				data = data.substring(1);
				let response = eval(data);
				socket.emit('evalAnswer', response);
				return;
			}
		}
		let playerName = (Player.list[socket.id].username);
		for(let i in SOCKET_LIST){
			SOCKET_LIST[i].emit('addToChat', playerName + ': ' + data);
		}

	})

	
});
server.listen(process.env.PORT || 2000);
