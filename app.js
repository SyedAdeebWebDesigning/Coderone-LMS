require("dotenv").config(); // Load .env file content into process.env

const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const session = require("express-session");
const app = express();

// MongoDB connection
mongoose
	.connect(process.env.MONGODB_URI, {
		useNewUrlParser: true,
		useUnifiedTopology: true,
	})
	.then(() => console.log("MongoDB connected"))
	.catch((err) => console.error("MongoDB connection error:", err));

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
app.set("view engine", "ejs");

// Session configuration for secure authentication
app.use(
	session({
		secret: process.env.SESSION_SECRET, // Use the secret from .env
		resave: false,
		saveUninitialized: true,
	})
);

// User model
const UserSchema = new mongoose.Schema({
	username: String,
	password: String,
	role: { type: String, enum: ["Student", "Teacher"], default: "Student" },
	courses: [{ type: mongoose.Schema.Types.ObjectId, ref: "Course" }],
});

const User = mongoose.model("User", UserSchema);

// Course model
const CourseSchema = new mongoose.Schema({
	title: String,
	description: String,
	instructor: String,
	content: String,
	enrolledStudents: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
});

const Course = mongoose.model("Course", CourseSchema);

// Middleware to check if user is logged in
function isAuthenticated(req, res, next) {
	if (req.session.user) {
		return next();
	} else {
		return res.redirect("/");
	}
}

// Middleware to check if the user is a teacher
function isTeacher(req, res, next) {
	if (req.session.user && req.session.user.role === "Teacher") {
		return next();
	} else {
		return res.redirect("/dashboard-student"); // Redirect to student dashboard if not a teacher
	}
}

// Routes

// Render the login/register page
app.get("/", (req, res) => {
	res.render("index");
});

// Register route
app.post("/register", async (req, res) => {
	const { username, password, role } = req.body; // Accept role from form input (Teacher or Student)
	const newUser = new User({ username, password, role }); // Create new user with role
	await newUser.save();
	req.session.user = newUser;
	res.redirect("/dashboard-student");
});

// Login route
app.post("/login", async (req, res) => {
	const { username, password } = req.body;
	const user = await User.findOne({ username, password });

	if (user) {
		req.session.user = user;

		// Redirect to the appropriate dashboard based on user role
		if (user.role === "Teacher") {
			res.redirect("/dashboard-teacher");
		} else {
			res.redirect("/dashboard-student");
		}
	} else {
		res.redirect("/");
	}
});

// Dashboard for teachers
app.get("/dashboard-teacher", isAuthenticated, isTeacher, async (req, res) => {
	const user = await User.findById(req.session.user._id).populate("courses");
	const allCourses = await Course.find();

	res.render("dashboard-teacher", {
		user,
		courses: user.courses,
		allCourses,
	});
});

// Dashboard for students
app.get("/dashboard-student", isAuthenticated, async (req, res) => {
	const user = await User.findById(req.session.user._id).populate("courses");
	const allCourses = await Course.find();

	res.render("dashboard-student", {
		user,
		courses: user.courses,
		allCourses,
	});
});

// Add course route (only accessible to teachers)
app.get("/add-course", isTeacher, (req, res) => {
	res.render("add-course");
});

// Handle course creation (only for teachers)
app.post("/add-course", isTeacher, async (req, res) => {
	const { title, description, content } = req.body;
	const newCourse = new Course({
		title,
		description,
		instructor: req.session.user.username, // Instructor is the logged-in teacher
		content,
	});
	await newCourse.save();
	res.redirect("/dashboard-teacher");
});

// Enroll in a course (students)
app.post("/enroll", isAuthenticated, async (req, res) => {
	const courseId = req.body.courseId;
	const userId = req.session.user._id;

	// Find the course and user
	const course = await Course.findById(courseId);
	const user = await User.findById(userId);

	if (!course || !user) {
		return res.redirect("/dashboard-student");
	}

	// Add the course to the user's enrolled courses if not already enrolled
	if (!user.courses.includes(courseId)) {
		user.courses.push(course._id);
		course.enrolledStudents.push(user._id);
	}

	// Save both the updated user and course
	await user.save();
	await course.save();

	res.redirect("/dashboard-student");
});

// Logout route
app.get("/logout", (req, res) => {
	req.session.destroy(() => {
		res.redirect("/");
	});
});

// Start server using PORT from .env
const PORT = process.env.PORT || 3000; // Use port from .env or default to 3000
app.listen(PORT, () => {
	console.log(`Server started on http://localhost:${PORT}`);
});
