//class to store all data
class Data {
	constructor(io) {
		//ONLY FOR DEBUGGING
		//this will definitely overload the console and
		//probably break the server if stressed
		this.verbose = false;
		this.stop = false;
		this.io = io;
		//socketId: {chatroom: "myChatroom"}
		this.clients = {};
		//chatroom name: {password: "myPassword", connectedClients: {}}
		this.chatrooms = {};
		//
		//Subscribe to the connection event
		//
		this.io.on("connect", this.clientConnectHandler);
		//create default chatroom
		this.createChatroom("Default Chatroom", "");
		return;
	}

	createClient = (socketId) => {
		if (socketId in this.clients) { return; }
		this.clients[socketId] = {chatroom: ""};
		return;
	}

	deleteClient = (socketId) => {
		this.leaveChatroom(socketId);
		if (socketId in this.clients) { delete this.clients[socketId]; }
		return;
	}

	createChatroom = (name, givenPassword) => {
		if (this.stop) { return; }

		//change chatroom name to lower case
		if (name != null && name != undefined) { name = name.toLowerCase(); }

		if (name in this.chatrooms) {
			this.io.emit("createChatroomResponseEvent", {success: false, reason: "Chatroom already exists."});
			if (this.verbose) { console.log(`New chatroom failed to create: ${name}`); }
			return;
		}
		if (name == "" || name == null || name == undefined) { return; }
		if (givenPassword == null || givenPassword == undefined) { givenPassword = ""; }
		this.chatrooms[name] = {password: givenPassword, connectedClients: []};
		this.io.emit("createChatroomResponseEvent", {success: true, reason: "Chatroom created."});
		if (this.verbose) { console.log(`New chatroom created: ${name}`); }
		return;
	}

	deleteChatroom = (name) => {
		if (!name in this.chatrooms) { return; }
		//remove all clients in the chatroom
		for (client in this.chatrooms[name]) {
			this.leaveChatroom(this.clients[client]);
		}
		if (this.verbose) { console.log(`Deleting chatroom: ${name}`); }
		delete this.chatrooms[name];
		return;
	}

	joinChatroom = (socketId, chatroom) => {
		if (this.stop) { return; }
		if (!socketId in this.clients) { return; }
		if (!chatroom in this.chatrooms) { return; }
		this.clients[socketId].chatroom = chatroom;
		this.chatrooms[chatroom].connectedClients[socketId] = null;
		if (this.verbose) { console.log(`A client joined a chatroom: ${chatroom}`); }
		return;
	}

	leaveChatroom = (socketId) => {
		if (!socketId in this.clients) { return; }
		//if the client is currently in a chatroom, then search out that
		//client in the chatroom and remove it
		if (this.clients[socketId].chatroom != "") {
			let clientsChatroom = this.chatrooms[this.clients[socketId].chatroom];
			delete clientsChatroom.connectedClients[socketId];
			//if there are no more connected clients, then delete the chatroom
			if (Object.keys(clientsChatroom.connectedClients).length == 0) {
				this.deleteChatroom(clientsChatroom);
			}
			if (Object.keys(clientsChatroom.connectedClients).length > 0) {
				this.broadcastMessage(this.clients[socketId].chatroom, {socketId: 0, sender: "server",
					content: `${this.clients[socketId].username} left the chatroom.`});
			}
		}
		this.clients[socketId].chatroom = "";
		return;
	}

	joinChatroomHandler = (socketId, chatroomName, password, username) => {

		//change chatroom name to lower case
		chatroomName = chatroomName.toLowerCase();

		if (this.chatrooms[chatroomName] == null || this.chatrooms[chatroomName] == undefined) {
			console.log(`chatroom: ${chatroomName} not found in chatroom list?`);
			this.io.to(socketId).emit('joinChatroomResponseEvent', {success: false,
				reason: "Chatroom does not exist.  You must first create a chatroom."});
			return;
		}

		if (socketId in this.chatrooms[chatroomName].connectedClients) {
			this.io.to(socketId).emit("joinChatroomResponseEvent", {success: false,
				reason: "You are already in this chatroom.  Try reloading the webpage."});
		}

		if (this.chatrooms[chatroomName].password != password) {
			this.io.to(socketId).emit('joinChatroomResponseEvent', {success: false,
				reason: "Password is incorrect."});
			return;
		}
		this.joinChatroom(socketId, chatroomName);
		this.io.to(socketId).emit('joinChatroomResponseEvent', {success: true,
				reason: "Password is correct."});
		this.clients[socketId].username = username;
		//notify all clients in the chatroom that someone connected
		this.broadcastMessage(chatroomName, {socketId: 0, sender: "server",
			content: `${username} joined the chatroom.`});
		return;
	}

	broadcastMessage = (chatroom, message) => {
		//broadcasts a message to every client in the given chatroom
		//message should have socketId, sender, and content properties
		if (this.stop) { return; }
		//message should be {sender: sendersName, content: ""}
		if (!this.chatrooms[chatroom]) { return; }
		//send message to every other client in the chatroom
		let connectedClients = this.chatrooms[chatroom].connectedClients;
		//assign the username
		if (message.username) { message.username = this.clients[message.socketId].username; }
		for (let client in connectedClients) {
			this.io.to(client).emit("messageEvent", message);
			if (this.verbose) { console.log(`Message sent to ${client}.`); }
		}
	} 

	messageHandler = (message) => {
		if (this.stop) { return; }
		//message should be {sender: sendersName, content: ""}
		//
		//make sure the client is actually in a chatroom
		if (!this.clients[message.socketId].chatroom) { return; }
		//set the sender
		message.sender = this.clients[message.socketId].username;
		//broadcast the message to the chatroom
		this.broadcastMessage(this.clients[message.socketId].chatroom, message);
		return;
	}

	clientConnectHandler = (socket) => {
		if (this.stop) { return; }
		this.createClient(socket.id);
		socket.on("messageEvent", (message) => {
			//this ensures the socket id is correct.
			//clients cannot alter this.
			message.socketId = socket.id;
			this.messageHandler(message);
		})
		socket.on("disconnect", () => { this.clientDisconnectHandler(socket.id) });
		socket.on("createChatroomEvent", this.createChatroom );
		socket.on("joinChatroomEvent", (chatroom, password, username) => {
			this.joinChatroomHandler(socket.id, chatroom, password, username);
		});
		socket.on("leaveChatroomEvent", () => { this.leaveChatroom(socket.id); } );
		if (this.verbose) {
			let count = Object.keys(this.clients).length;
			console.log(`Client connected from: ${socket.handshake.address}.  Total connected clients: ${count}`);
		}
		return;
	}

	clientDisconnectHandler = (socketId) => {
		this.leaveChatroom(socketId);
		this.deleteClient(socketId);
		if (this.verbose) {
			let count = Object.keys(this.clients).length;
			console.log(`Client disconnected.  Total connected clients: ${count}`);
		}
		return;
	}

	shutdown = () => {
		console.log("Shutting down server...");
		this.stop = true;
		for (chatroom in this.chatrooms) {
			this.deleteChatroom(chatroom);
		}
		console.log("Shutdown complete.");
		return;
	}
}

module.exports = Data;