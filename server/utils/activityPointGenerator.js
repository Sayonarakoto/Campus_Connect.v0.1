const ActivityPointRule = require("../models/ActivityPointRule");
const SportsActivityPoint = require("../models/SportsActivityPoint");

const generateActivityPoint = async ({
  studentId,
  eventId,
 sportsResultId,
  position
}) => {
  const rule = await ActivityPointRule.findOne({
    position
  });

  if (!rule) {
    return;
  }

  await SportsActivityPoint.findOneAndUpdate(
    {
      student: studentId,
      event: eventId
    },
    {
      student: studentId,
      event: eventId,
      sportsResult: sportsResultId,
      position,
      points: rule.points
    },
    {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true
    }
  );
};

module.exports = generateActivityPoint;