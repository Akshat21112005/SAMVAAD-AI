import User from "../models/user.model.js";

export const CREDIT_COSTS = {
  "generate-questions": 2,
  "evaluate-answer": 1,
  "evaluate-dsa": 3,
  "session-feedback": 2,
  "interview-start": 2,
  "interview-answer": 1,
  "interview-finish": 1,
};

export const creditsMiddleware = (action) => async (req, res, next) => {
  try {
    const cost = CREDIT_COSTS[action] || 1;

    const user = await User.findOneAndUpdate(
      {
        _id: req.userId,
        credits: { $gte: cost },
      },
      {
        $inc: { credits: -cost },
      },
      { new: true }
    ).select("-__v");

    if (!user) {
      const currentUser = await User.findById(req.userId).select("credits");
      return res.status(402).json({
        message: "Insufficient credits",
        required: cost,
        available: currentUser?.credits || 0,
      });
    }

    req.creditAction = action;
    req.creditCost = cost;
    req.updatedUser = user;
    return next();
  } catch (error) {
    return res.status(500).json({
      message: `Credits check failed: ${error.message || error}`,
    });
  }
};
