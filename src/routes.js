const programRoutes = require("./routes/programRoutes");
const lessonRoutes = require("./routes/lessonRoutes");
const leaderRoutes = require("./routes/leaderRoutes");
const fileRoutes = require("./routes/fileRoutes");
const attendanceRoutes = require("./routes/attendanceRoutes");
const masterDataRoutes = require("./routes/masterDataRoutes");

module.exports = (app) => {
  // Master data endpoints (/api/v1/common-programs, /api/v1/locations)
  app.use("/api/v1", masterDataRoutes);

  // Programs endpoints (/api/v1/programs)
  app.use("/api/v1/programs", programRoutes);

  // Lessons standalone endpoints (/api/v1/lessons)
  app.use("/api/v1/lessons", lessonRoutes);

  // Leaders & User Proxy endpoints (/api/v1/program-lessons/... & /api/v1/users)
  app.use("/api/v1", leaderRoutes);

  // Files endpoints (/api/v1/program-lessons/.../files)
  app.use("/api/v1", fileRoutes);

  // Attendance & Session endpoints (/api/v1/program-lessons/.../attendance)
  app.use("/api/v1", attendanceRoutes);
};
