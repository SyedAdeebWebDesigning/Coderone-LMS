// Simulating a notification system
function showNotification(message) {
	const notification = document.createElement("div");
	notification.classList.add("notification");
	notification.innerText = message;
	document.body.appendChild(notification);
	setTimeout(() => {
		notification.remove();
	}, 3000);
}

async function enrollInCourse(courseId) {
	try {
		const response = await fetch(`/enroll/${courseId}`, {
			method: "POST",
		});
		const result = await response.json();
		if (result.success) {
			showNotification("Successfully enrolled in the course!");
			updateUserDashboard();
		} else {
			showNotification("Error enrolling in the course.");
		}
	} catch (error) {
		console.error("Error:", error);
		showNotification("An error occurred while enrolling in the course.");
	}
}

async function fetchProgress() {
	try {
		const response = await fetch("/progress");
		const progress = await response.json();
		document.getElementById("progress-bar").style.width = progress + "%";
	} catch (error) {
		console.error("Error fetching progress:", error);
	}
}

async function updateUserDashboard() {
	try {
		const response = await fetch("/user/courses");
		const courses = await response.json();

		const courseList = document.getElementById("course-list");
		courseList.innerHTML = ""; // Clear the list
		courses.forEach((course) => {
			const listItem = document.createElement("li");
			listItem.innerText = `${course.title} - ${course.instructor}`;
			const enrollButton = document.createElement("button");
			enrollButton.innerText = "Enroll";
			enrollButton.onclick = () => enrollInCourse(course._id);
			listItem.appendChild(enrollButton);
			courseList.appendChild(listItem);
		});
	} catch (error) {
		console.error("Error updating dashboard:", error);
	}
}

async function checkForNewCourses() {
	try {
		const response = await fetch("/new-courses");
		const courses = await response.json();
		if (courses.length > 0) {
			showNotification("New courses are available! Check them out.");
		}
	} catch (error) {
		console.error("Error checking for new courses:", error);
	}
}

document.addEventListener("DOMContentLoaded", () => {
	fetchProgress();
	updateUserDashboard();
	setInterval(checkForNewCourses, 60000);
});

document.addEventListener("DOMContentLoaded", () => {
	const showRegisterButton = document.getElementById("show-register");
	const showLoginButton = document.getElementById("show-login");
	const container = document.querySelector(".container");

	// Show Register form
	showRegisterButton.addEventListener("click", () => {
		container.classList.add("show-register");
	});

	// Show Login form
	showLoginButton.addEventListener("click", () => {
		container.classList.remove("show-register");
	});
});
