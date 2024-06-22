const offcanvasShow = () => {
	document.querySelector("#offcanvas").classList.toggle("show");
};

const loadingHTML = `<div class="mx-auto spinner-border text-primary" role="status">
		<span class="visually-hidden">Loading...</span>
	</div>`;

const boardTitle = document.querySelector("#board-title");
const bgRow = document.querySelector("#bg-row");

const profileBody = document.querySelector("#profile-body");

const mainSection = document.querySelector("#main-sect");

const boardUl = document.querySelector("#board-ul");
const listsDiv = document.querySelector("#lists-div");

const bgModal = new bootstrap.Modal(
	document.getElementById("bg-modal")
);

const profile = new bootstrap.Modal(
	document.getElementById("profile")
);

let editTask = null;
let userId = null;
const page = 4;
let tasks = [];
let lists = [];
let boards = [];
let users = [];
let photos = [];
let boardId = localStorage.getItem("boardId") || null;

const runConfetti = () => {
	runConfetti({
		particleCount: 300,
		spread: 200,
		origin: { y: 0.6 },
	});
};

const toastSuccess = (text) => {
	Toastify({
		text,
		duration: 3000,
		style: {
			background: "rgb(79, 179, 79)",
			borderRadius: "10px",
		},
	}).showToast();
};

const toastError = (text) => {
	Toastify({
		text,
		duration: 3000,
		style: {
			background: "rgb(201, 68, 68)",
			borderRadius: "10px",
		},
	}).showToast();
};

const getPhotos = async () => {
	const res = await axios.get(
		`https://picsum.photos/v2/list?page=${page}`
	);

	return res.data;
};

const getUsers = async () => {
	const res = await axios.get(
		`https://cc69ac6756e6e20e.mokky.dev/users`
	);
	return res.data;
};

const getTasks = async () => {
	const res = await axios.get(
		`https://cc69ac6756e6e20e.mokky.dev/tasks`
	);
	tasks = res.data;
};

const getLists = async () => {
	try {
		const res = await axios.get(
			`https://cc69ac6756e6e20e.mokky.dev/lists?boardId=${boardId}`
		);
		return res.data;
	} catch (error) {
		toastError(error);
	}
};

const getBoards = async () => {
	const res = await axios.get(
		`https://cc69ac6756e6e20e.mokky.dev/boards?userId=${userId}`
	);
	return res.data;
};

const renderPhotos = async () => {
	try {
		bgRow.innerHTML = loadingHTML;

		photos = await getPhotos();
		bgRow.innerHTML = "";
		photos.map((p) => {
			bgRow.innerHTML += `
				<div class="col-sm-6 col-md-4 col-lg-3 mb-4" 
						 style="cursor: pointer"
						 onclick="setBgImg('${p.download_url}')">
					<img loading="lazy" src="${p.download_url}" alt="" class="w-100 h-100" style="backgorund-size: cover" />
				</div>
			`;
		});
	} catch (error) {
		toastError(error);
		bgModal.innerHTML = `
			<div class="col-12">
				<p class="text-danger text-center">${error}</p>
			</div>
		`;
	}
};

const showPhotos = () => {
	bgModal.show();
	renderPhotos();
};

const setBgImg = async (url) => {
	try {
		const response = await axios.patch(
			`https://cc69ac6756e6e20e.mokky.dev/boards/${boardId}`,
			{
				bg: url,
			}
		);
		bgModal.hide();
		console.log("Background updated successfully", response.data);
		toastSuccess("Background updated successfully");
	} catch (error) {
		console.error("Error updating background", error);
		toastError("Error updating background");
	}
	renderLists();
};

const renderBoards = async () => {
	try {
		boardUl.innerHTML = "";
		boards = await getBoards();
		boards.map((b) => {
			boardUl.innerHTML += `
        <li class="list-group-item d-flex justify-content-between align-items-center ${
			b.id == boardId ? "active" : ""
		}" onclick="showBoard(${b.id})">
					<h5 style="font-size: 18px">${b.name}</h5>
					<button class="btn text-danger" onclick="deleteBoard(${b.id})">
						<i class="fa-solid fa-trash-can"></i>
					</button>
				</li>
      `;
		});
		boardUl.innerHTML += `
			<li class="list-group-item d-flex align-items-center justify-content-center" style="height: 42px">
					<input
						style="width: 130px; border: 0; outline: 0"
						type="text"
						id="new-board-input"
						placeholder="New board name"
					/>
					<button type="button" style="border: 0; outline: 0;" class="btn text-primary fs-3 pt-0" onclick="addNewBoard()"> 
						+
					</button>
			</li>
		`;
	} catch (e) {
		// toastError(e?.message || "Error on render board");
		console.log("error on render boards");
	}
};

const deleteBoard = async (id) => {
	try {
		await axios.delete(
			`https://cc69ac6756e6e20e.mokky.dev/boards/${id}`
		);

		const listsResponse = await axios.get(
			`https://cc69ac6756e6e20e.mokky.dev/lists`,
			{
				params: { boardId: id },
			}
		);
		const lists = listsResponse.data;
		for (const list of lists) {
			const listId = list.id;

			await axios.delete(
				`https://cc69ac6756e6e20e.mokky.dev/lists/${listId}`
			);

			const tasksResponse = await axios.get(
				`
					https://cc69ac6756e6e20e.mokky.dev/tasks`,
				{
					params: { listId: listId },
				}
			);
			const tasks = tasksResponse.data;
			tasks.map(async (task) => {
				const taskId = task.id;
				await axios.delete(
					`https://cc69ac6756e6e20e.mokky.dev/tasks/${taskId}`
				);
			});
		}

		boardId = null;
		await renderBoards();
		await renderLists();
	} catch (error) {
		toastError(error);
	}
};

const deleteBoardOpen = async () => {
	try {
		await axios.delete(
			`https://cc69ac6756e6e20e.mokky.dev/boards/${boardId}`
		);

		const listsResponse = await axios.get(
			`https://cc69ac6756e6e20e.mokky.dev/lists`,
			{
				params: { boardId: boardId },
			}
		);
		const lists = listsResponse.data;
		for (const list of lists) {
			const listId = list.id;

			await axios.delete(
				`https://cc69ac6756e6e20e.mokky.dev/lists/${listId}`
			);

			const tasksResponse = await axios.get(
				`
					https://cc69ac6756e6e20e.mokky.dev/tasks`,
				{
					params: { listId: listId },
				}
			);
			const tasks = tasksResponse.data;
			tasks.map(async (task) => {
				const taskId = task.id;
				await axios.delete(
					`https://cc69ac6756e6e20e.mokky.dev/tasks/${taskId}`
				);
			});
		}

		boardId = null;
		await renderBoards();
		await renderLists();
	} catch (error) {
		toastError(error);
	}
};

const showBoard = async (id) => {
	document
		.querySelectorAll("#board-ul li")
		.forEach((el) => el.classList.remove("active"));

	document
		.querySelector(`[onclick="showBoard(${id})"]`)
		.classList.add("active");
	boardId = id;
	localStorage.setItem("boardId", boardId);
	await renderLists();
	await renderBoards();
};

const addNewBoard = async () => {
	const newBoardInput = document.querySelector("#new-board-input");
	const newBoardName = newBoardInput.value.trim();
	console.log("Input value:", newBoardName);

	if (newBoardName.length === 0) {
		toastError("Board name is required");
		return;
	}

	try {
		await axios.post(
			"https://cc69ac6756e6e20e.mokky.dev/boards",
			{
				name: newBoardName,
				bg: "",
				userId: userId,
			}
		);
		newBoardInput.value = ""; // Clear the input field
		await renderBoards();
		toastSuccess("Board created successfully");
	} catch (e) {
		console.log(e);
		toastError(e?.message || "Error creating board");
	}
};

const listsToggle = async () => {
	const listsOrderToggle = document.querySelector(
		"#lists-order-toggle"
	);

	listsDiv.classList.toggle("flex-column");
	listsOrderToggle.classList.toggle("fa-grip-lines");
	listsOrderToggle.classList.toggle("fa-grip-lines-vertical");

	if (listsDiv.classList.contains("flex-column")) {
		listsDiv.style.width = "100%";
	} else {
		listsDiv.style.width = "auto";
	}

	renderLists();
};

const renderLists = async () => {
	try {
		listsDiv.innerHTML = "";
		const board = await axios.get(
			`https://cc69ac6756e6e20e.mokky.dev/boards/${boardId}`
		);
		console.log("board data", board.data);
		mainSection.style.background =
			`url("${board.data.bg}")` || "";

		boards = await getBoards();
		boardTitle.innerHTML = boards.find(
			(b) => b.id == boardId
		).name;

		lists = await getLists();
		await getTasks(); // fetch tasks once
		lists.map((l) => {
			listsDiv.innerHTML += `
				<div class="list border rounded p-3" style="width: 400px">
					<h3>${l.name}</h3>
					<ul id="ul-${l.id}" class="list-group">
						<li class="list-group-item d-flex justify-content-center align-items-center">
							<div>
								<input class="fs-4" style="width: 100%" id="title-${l.id}" type="text" placeholder="Title" />
								<input id="detail-${l.id}" type="text" placeholder="Details" />
							</div>
							<button id="addBtn-${l.id}" class="btn btn-primary" style="width: 80px; height: 40px" type="button" onclick="addTask(${l.id})">Add</button>
						</li>
					</ul>
				</div>
			`;
			const ul = document.querySelector(`#ul-${l.id}`);
			let done = 0;
			let haveToDo = 0;
			let all = 0;
			tasks
				.filter((task) => task.listId === l.id)
				.map((item, index) => {
					ul.innerHTML += `
					<li class="list-group-item d-flex justify-content-between align-items-start">
							<div class="d-flex align-items-start">
								<button class="btn border-0 p-0 me-2 mt-1" onclick="complete(${
									item.id
								})">
								${
									item.isCompleted
										? `<i class="fa-regular fa-circle-check"></i>`
										: `<i class="fa-regular fa-circle"></i>`
								}
								</button>
								<div class="">
									<p class="fs-5 ${
										item.isCompleted
											? "text-secondary text-decoration-line-through"
											: ""
									}">${item.text}</p>
									<p>${item.desc}</p>
								</div>
							</div>
							<div class="btn-group dropend">
								<button 
									type="button" 
									class="btn text-dark border-0" 
									data-bs-toggle="dropdown" 
									aria-expanded="false">
									<i class="fa-solid fa-ellipsis-vertical"></i>
  							</button>
								<ul class="dropdown-menu ps-3">
									<li>
										<button class="btn border-0 p-0 me-2 edit-btn dropdown-item" onclick="editClick(${
											item.id
										})">
										<i class="fa-solid fa-pencil"></i>Edit
									</button>
									</li>
									<li>
										<button class="btn border-0 p-0 text-danger dropdown-item" onclick="deleteTask(${
											item.id
										})">
											<i class="fa-solid fa-trash-can"></i>Delete
										</button>
									</li>
  							</ul>
							</div>
					</li>
				`;
					all++;
					item.isCompleted ? done++ : haveToDo++;
				});
			const totalLi = document.createElement("li");
			totalLi.className =
				"list-group-item d-flex justify-content-between align-items-start pt-4";
			totalLi.innerHTML = `
				<p class="text-danger">Have to do: ${haveToDo}</p>
				<p class="text-success">Done: ${done}</p>
				<p class="text-warning">Total: ${all}</p>
			`;
			ul.appendChild(totalLi);
		});
		listsDiv.innerHTML += `
			<div class="list border rounded d-flex justify-content-between align-items-center"
				style="width: 300px"
			>
				<input class="ms-3" id="new-list-input" placeholder="New list"/>
				<button class="btn text-primary fs-3" type="button" onclick="addNewList(${boardId})">
					+
				</button>
			</div>
		`;
	} catch (e) {
		// toastError(e?.message || "Error on render list");
		console.log("error on render lists");
	}
};

const addTask = async (listId) => {
	const titleInput = document.querySelector(`#title-${listId}`);
	const title = titleInput.value.trim();
	const detailInput = document.querySelector(`#detail-${listId}`);
	const detail = detailInput.value.trim();

	if (title.length == 0) {
		toastError("Task kiritilmagan");
		titleInput.value = "";
		detailInput.value = "";
		return;
	}

	if (editTask) {
		await axios.patch(
			`https://cc69ac6756e6e20e.mokky.dev/tasks/${editTask.id}`,
			{
				...editTask,
				text: title,
				desc: detail,
			}
		);

		editTask = null;
		const addBtn = document.querySelector(`#addBtn-${listId}`);
		addBtn.innerHTML = "Add";
	} else {
		await axios.post("https://cc69ac6756e6e20e.mokky.dev/tasks", {
			text: title,
			desc: detail,
			listId,
		});
	}

	toastSuccess("Task added successfully");

	titleInput.value = "";
	detailInput.value = "";
	await renderLists();
};

const editClick = (id) => {
	editTask = tasks.find((t) => t.id === id);
	const input = document.querySelector(`#title-${editTask.listId}`);
	const detail = document.querySelector(
		`#detail-${editTask.listId}`
	);
	const addBtn = document.querySelector(
		`#addBtn-${editTask.listId}`
	);
	input.value = editTask.text;
	detail.value = editTask.desc;
	addBtn.innerHTML = "Save";
};

const complete = async (id) => {
	const task = tasks.find((t) => t.id === id);
	await axios.patch(
		`https://cc69ac6756e6e20e.mokky.dev/tasks/${id}`,
		{
			isCompleted: !task.isCompleted,
		}
	);
	toastSuccess(
		`Task ${task.isCompleted ? "un" : ""}completed successfully`
	);
	await renderLists();
};

const deleteTask = async (id) => {
	await axios.delete(
		`https://cc69ac6756e6e20e.mokky.dev/tasks/${id}`
	);
	toastError("Task deleted successfully");
	await renderLists();
};

const addNewList = async (boardId) => {
	const input = document.querySelector("#new-list-input");
	const listName = input.value.trim();

	if (listName.length === 0) {
		toastError("List nomini kiriting!");
		return;
	}

	await axios.post(`https://cc69ac6756e6e20e.mokky.dev/lists`, {
		name: listName,
		boardId,
	});

	toastSuccess("List added successfully");

	input.value = "";
	await renderLists();
};

const showSignIn = async () => {
	document.getElementById("show-sign-in").classList.add("active");
	document
		.getElementById("show-sign-up")
		.classList.remove("active");

	document.getElementById("sign-in-div").classList.remove("d-none");
	document.getElementById("sign-up-div").classList.add("d-none");
};

const showSignUp = async () => {
	document
		.getElementById("show-sign-in")
		.classList.remove("active");
	document.getElementById("show-sign-up").classList.add("active");

	document.getElementById("sign-in-div").classList.add("d-none");
	document.getElementById("sign-up-div").classList.remove("d-none");
};

const login = async (event) => {
	event.preventDefault();
	const users = await getUsers();
	const username = document
		.getElementById("username-login")
		.value.trim();
	const password = document
		.getElementById("password-login")
		.value.trim();
	const user = users.find((u) => u.username == username);

	if (user) {
		if (user.pass == password) {
			toastSuccess("Logged in successfully");
			document
				.getElementById("log-sect")
				.classList.add("d-none");
			document
				.getElementById("main-sect")
				.classList.remove("d-none");
			userId = user.id;
			renderBoards();
			renderLists();
		} else {
			toastError("Uncorrect password");
		}
	} else {
		toastError("Uncorrect username");
	}
};

const signup = async (event) => {
	event.preventDefault();
	const username = document
		.getElementById("username-sign")
		.value.trim();
	const password = document
		.getElementById("password-sign")
		.value.trim();
	const name = document.getElementById("name-sign").value.trim();
	const lName = document
		.getElementById("last-name-sign")
		.value.trim();

	users = await getUsers();
	users.find((u) => u.username == username);
	if (username) {
		toastError("Bunday username mavjud");
		return;
	}

	await axios.post("https://cc69ac6756e6e20e.mokky.dev/users", {
		username: username,
		pass: password,
		name: name,
		lName: lName,
	});
	toastSuccess("User created successfully");

	showSignIn();
};

const logout = () => {
	document.getElementById("log-sect").classList.remove("d-none");
	document.getElementById("main-sect").classList.add("d-none");
	document.getElementById("username-sign").value = "";
	document.getElementById("password-sign").value = "";
	document.getElementById("username-login").value = "";
	document.getElementById("password-login").value = "";
	document.getElementById("name-sign").value = "";
	document.getElementById("last-name-sign").value = "";
};

const showProfile = async () => {
	users = await getUsers();
	const user = users.find((u) => u.id == userId);

	console.log("User find", user);

	profileBody.innerHTML = `
	<div class="mb-3 w-100">
		<label
			for="name-edit"
			class="form-label"
			>Name</label>
		<input
			type="text"
			class="form-control w-60 text-center"
			id="name-edit" value="${user.name}"/>
	</div>
	<div class="mb-3 w-100">
		<label
			for="last-name-edit"
			class="form-label"
		>Lats name</label>
		<input
			type="text"
			class="form-control w-60 text-center"
			id="last-name-edit"
			 value="${user.lName}"/>
	</div>
	<div class="mb-3 w-100">
		<label
			for="username-edit"
			class="form-label"
			>Username</label>
		<input
			type="text"
			class="form-control w-60 text-center"
			id="username-edit"
			 value="${user.username}"/>
	</div>
	<div class="mb-3 w-100">
		<label
			for="password-edit"
			class="form-label"
			>Password</label>
		<input
			type="password"
			class="form-control w-60 text-center"
			id="password-edit"
			 value="${user.pass}"/>
	</div>
	`;
};

const saveProfile = async () => {
	const newName = document.querySelector("#name-edit").value.trim();
	const newLastName = document
		.querySelector("#last-name-edit")
		.value.trim();
	const newUsername = document
		.querySelector("#username-edit")
		.value.trim();
	const newPass = document
		.querySelector("#password-edit")
		.value.trim();
	try {
		const user = await axios.patch(
			`https://cc69ac6756e6e20e.mokky.dev/users/${userId}`,
			{
				name: newName,
				lName: newLastName,
				username: newUsername,
				pass: newPass,
			}
		);
		console.log(user);
		toastSuccess("user successfully updated");
		profile.hide();
	} catch (error) {
		toastError("error");
	}
};

// Init
window.onload = (async () => {
	await renderBoards();
	await renderLists();
})();
