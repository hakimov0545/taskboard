const offcanvasShow = () => {
	document.querySelector("#offcanvas").classList.toggle("show");
};

const boardUl = document.querySelector("#board-ul");
const listsDiv = document.querySelector("#lists-div");

let editTask = null;
let tasks = [];
let lists = [];
let boards = [];
let boardId = 1;

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

const getTasks = async () => {
	const res = await axios.get(
		`https://cc69ac6756e6e20e.mokky.dev/tasks`
	);
	tasks = res.data;
};

const getLists = async () => {
	const res = await axios.get(
		`https://cc69ac6756e6e20e.mokky.dev/lists?boardId=${boardId}`
	);
	return res.data;
};

const getBoards = async () => {
	const res = await axios.get(
		"https://cc69ac6756e6e20e.mokky.dev/boards"
	);
	return res.data;
};

const renderBoards = async () => {
	try {
		boardUl.innerHTML = "";
		boards = await getBoards();
		boards.map((b) => {
			boardUl.innerHTML += `
        <li class="list-group-item ${
			b.id === boardId ? "active" : ""
		}" onclick="showBoard(${b.id})">${b.name}</li>
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
		toastError(e?.message || "Error on render board");
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
	await renderLists();
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

const renderLists = async () => {
	try {
		listsDiv.innerHTML = "";
		lists = await getLists();
		await getTasks(); // fetch tasks once
		lists.map((l) => {
			listsDiv.innerHTML += `
				<div class="list border rounded p-3">
					<h3>${l.name}</h3>
					<ul id="ul-${l.id}" class="list-group">
						<li class="list-group-item">
							<div>
								<input class="fs-4" style="width: 100%" id="title-${l.id}" type="text" placeholder="Title" />
								<input id="detail-${l.id}" type="text" placeholder="Details" />
							</div>
							<button id="addBtn-${l.id}" class="btn btn-success" style="width: 80px" type="button" onclick="addTask(${l.id})">+ Add</button>
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
									<p class="fs-4 ${
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
									class="btn btn-secondary dropdown-toggle" 
									data-bs-toggle="dropdown" 
									aria-expanded="false">
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
			<div class="list border rounded d-flex justify-content-between align-items-center">
				<input class="ms-3" id="new-list-input" placeholder="New list"/>
				<button class="btn text-primary fs-3" type="button" onclick="addNewList(${boardId})">
					+
				</button>
			</div>
		`;
	} catch (e) {
		toastError(e?.message || "Error on render list");
	}
};

const addTask = async (listId) => {
	const titleInput = document.querySelector(`#title-${listId}`);
	const title = titleInput.value.trim();
	const detailInput = document.querySelector(`#detail-${listId}`);
	const detail = detailInput.value.trim();
	console.log("text: " + title);
	console.log("desc: " + detail);

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
		addBtn.innerHTML = "+ Add";
	} else {
		await axios.post("https://cc69ac6756e6e20e.mokky.dev/tasks", {
			text: title,
			desc: detail,
			listId,
		});
	}

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
	await renderLists();
};

const deleteTask = async (id) => {
	await axios.delete(
		`https://cc69ac6756e6e20e.mokky.dev/tasks/${id}`
	);
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

	input.value = "";
	await renderLists();
};

// Init
(async () => {
	await renderBoards();
	await renderLists();
})();
