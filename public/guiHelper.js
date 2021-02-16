var sidebarStyle = document.getElementById("sidebar").style;
var popup = document.querySelector("#popup");

function toggleSidebar() {
	if (sidebarStyle.display == "") {
		sidebarStyle.display = "block";
	}
	else if (sidebarStyle.display == "block") {
		sidebarStyle.display = "";
	}
	return;
}

function toggleDropdown(elementId) {
	let dropdownContent = document.querySelector(`#${elementId}`);
	if (dropdownContent.classList.contains("w3-show")) {
		//hide the dropdown elements
		dropdownContent.classList.remove("w3-show");
		dropdownContent.previousElementSibling.classList.remove("dropdownOpen");
	}
	else if (dropdownContent.classList.contains("w3-show") == false) {
		//show the dropdown elements
		dropdownContent.classList.add("w3-show");
		dropdownContent.previousElementSibling.classList.add("dropdownOpen");
	}
	return;
}

function closePopup() {
	popup.style.display = "none";
	hidePopupError();
	return;
}

function showPopup(name, button, submitFunction) {
	let popupName = document.querySelector("#popupName");
	let buttonName = document.querySelector("#popupButton");
	if (name) { popupName.innerText = name; }
	if (button) { buttonName.innerText = button; }
	buttonName.onclick = submitFunction;
	popup.style.display = "block";
	return;
}

function showPopupError(errorMessage) {
	let div = document.getElementById("popupResultsDiv");
	div.style.display = "block";
	let label = document.getElementById("popupResultsLabel");
	label.innerHTML = errorMessage;
	return;
}

function hidePopupError() {
	let div = document.getElementById("popupResultsDiv");
	div.style.display = "none";
	return;
}