//the socket that ties this client to the server
var socket = io();

//set default username
var username = "Random User";
var joinDefault = true;

socket.on("connect", () => {
	socket.on("messageEvent", (message) => {
		if (message.socketId == socket.id) { return; }
		showReceivedMessage(message.sender, message.content)

	});
	socket.on("joinChatroomResponseEvent", joinChatroomResponseHandler);
	socket.on("createChatroomResponseEvent", createChatroomResponseHandler);
	//join default chatroom
	socket.emit("joinChatroomEvent", "Default Chatroom", "", username);
});

//when a chatroom is created, this is used to auto join it
var createdChatroom = { name: null, password: null };

function showReceivedMessage(username, content) {
	let $usernameTag = $("<em>");
	$usernameTag.text(username);
	$usernameTag.attr("class", "usernameTag");
	let $lineBreak = $("<br>");
	let $label = $("<label>");
	$label.text(content);
	let $div = $("<div>");
	$div.append($usernameTag);
	$div.append($lineBreak);
	$div.append($label);
	$div.attr("class" , "w3-margin w3-padding receivedMessage w3-round");
	$("#scrollable").append($div);
	scrollToLastMessage();
	return;
}

function showSentMessage(content) {
	let $usernameTag = $("<em>");
	$usernameTag.text(`${username} (me)`);
	$usernameTag.attr("class", "usernameTag");
	let $lineBreak = $("<br>");
	let $label = $("<label>");
	$label.text(content);
	let $div = $("<div>");
	$div.append($usernameTag);
	$div.append($lineBreak);
	$div.append($label);
	$div.attr("class" , "w3-margin w3-padding sentMessage w3-round w3-right-align");
	$("#scrollable").append($div);
	scrollToLastMessage();
	return;
}

function scrollToLastMessage() {
	window.scrollTo(0, document.querySelector("#scrollable").scrollHeight);
	return;
}

function send() {
	let typedText = document.getElementById("textinput");
	if (typedText.value != "" && typedText.value != null) {
		showSentMessage(typedText.value);
		//emit send message to server
		socket.emit("messageEvent", {content: typedText.value});
	}
	typedText.value = "";
	typedText.focus();
	return;
}

function joinChatroom() {
	toggleSidebar();
	showPopup("Join Chatroom", "Join", submitJoinChatroom);
	return;
}

function createChatroom() {
	toggleSidebar();
	showPopup("Create New Chatroom", "Create", submitCreateChatroom);
	return;
}

function leaveChatroom() {
	//clear messages and send leave chatroom event
	//clear popup fields
	let messageArea = document.querySelector("#scrollable");
	messageArea.innerHTML = "";
	socket.emit("leaveChatroomEvent");
	let chatroomName = document.querySelector("#chatroomName");
	chatroomName.value = "";
	let password = document.querySelector("#chatroomPassword");
	password.value = "";
	let username = document.querySelector("#username");
	username.value = "";
	closePopup();
	return;
}

function submitJoinChatroom() {
	//join a chatroom
	//
	//emit joinEvent
	//wait for response
	//set username
	//close popup

	//get chatroom name and password
	let chatroomName = document.querySelector("#chatroomName").value;
	if (!chatroomName) { return; }
	let password = document.querySelector("#chatroomPassword").value;
	let givenUsername = document.querySelector("#username").value;
	if (givenUsername) { username = givenUsername; }
	socket.emit("joinChatroomEvent", chatroomName, password, username);
	//must receive a joinChatroomResponseEvent with a success to continue
	return;
}

function submitCreateChatroom() {
	//create a chatroom
	//
	//emit create Event
	//wait for response
	//emit joinEvent

	createdChatroom.name = document.querySelector("#chatroomName").value;
	if (!chatroomName) { return; }
	createdChatroom.password = document.querySelector("#chatroomPassword").value;
	socket.emit("createChatroomEvent", createdChatroom.name, createdChatroom.password);
	return;
}

function createChatroomResponseHandler(data) {
	if (data.success) {
		let givenUsername = document.querySelector("#username").value;
		if (givenUsername) { username = givenUsername; }
		socket.emit("joinChatroomEvent",
			createdChatroom.name,
			createdChatroom.password,
			username);
	}
	else {
		//display the reason for failure on popup
		showPopupError(`Failed to create chatroom: ${data.reason}`);
	}
	return;
}

function joinChatroomResponseHandler(data) {
	if (data.success) {
		//show the chatroom name
		let chatroomName = document.querySelector("#chatroomName").value;
		let chatroomNameDisplayer = document.getElementById("chatroomNameDisplayer");
		if (joinDefault) {
			chatroomName = "Default Chatroom";
			joinDefault = false;
		}
		chatroomNameDisplayer.innerHTML = `Chatroom: ${chatroomName.toLowerCase()}`;
		closePopup();
	}
	else {
		//show reason for failure on popup
		showPopupError(`Failed to join chatroom: ${data.reason}`);
	}
	return;
}

function keyPressHandler(e) {
	//13 = Enter
	if (e.which == 13  && document.querySelector("#textinput") == document.activeElement) {
		send();
	}
	return;
}

document.addEventListener("keypress", keyPressHandler);