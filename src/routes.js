const programRoutes = require("./routes/programRoutes");
const lessonRoutes = require("./routes/lessonRoutes");
const leaderRoutes = require("./routes/leaderRoutes");
const fileRoutes = require("./routes/fileRoutes");
const attendanceRoutes = require("./routes/attendanceRoutes");
const masterDataRoutes = require("./routes/masterDataRoutes");

module.exports = (app) => {
  app.get("/api/v1/health", (req, res) => {
    res.status(200).json({ status: "ok" });
  });

  app.use("/api/v1", masterDataRoutes);
  app.use("/api/v1/programs", programRoutes);
  app.use("/api/v1/lessons", lessonRoutes);
  app.use("/api/v1", leaderRoutes);
  app.use("/api/v1", fileRoutes);
  app.use("/api/v1", attendanceRoutes);
};