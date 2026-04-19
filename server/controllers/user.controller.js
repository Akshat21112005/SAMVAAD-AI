import InterviewSession from "../models/session.model.js";
import User from "../models/user.model.js";

export const getCurrentUser = async (req, res) => {
  try {
    const userId = req.userId;
    const user = await User.findById(userId).select("name email credits totalSessions lifetimeCreditsPurchased createdAt updatedAt").lean();

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    return res.status(200).json(user);
  } catch (error) {
    return res.status(500).json({
      message: "Unable to load your profile right now.",
    });
  }
};

export const getInterviewHistory = async (req, res) => {
  try {
    const sessions = await InterviewSession.find({ user: req.userId })
      .sort({ completedAt: -1, createdAt: -1 })
      .limit(50)
      .select("type status difficulty jobRole totalScore timeTaken timeUsed questionsAnswered questionCount completedAt createdAt updatedAt feedback problem.title language")
      .lean();

    return res.status(200).json({
      sessions,
      count: sessions.length,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Unable to load interview history right now.",
    });
  }
};

export const getInterviewSession = async (req, res) => {
  try {
    const session = await InterviewSession.findOne({
      _id: req.params.sessionId,
      user: req.userId,
    }).select("-__v").lean();

    if (!session) {
      return res.status(404).json({
        message: "Session not found",
      });
    }

    return res.status(200).json(session);
  } catch (error) {
    return res.status(500).json({
      message: "Unable to load this session right now.",
    });
  }
};

export const addCredits = async (req, res) => {
  try {
    const requestedPackage = req.body?.packageId || "starter";
    const packages = {
      starter: { credits: 25, price: 99 },
      growth: { credits: 60, price: 199 },
      pro: { credits: 150, price: 399 },
    };
    const selectedPackage = packages[requestedPackage] || packages.starter;

    const user = await User.findByIdAndUpdate(
      req.userId,
      {
        $inc: {
          credits: selectedPackage.credits,
          lifetimeCreditsPurchased: selectedPackage.credits,
        },
      },
      { new: true }
    ).select("-__v");

    return res.status(200).json({
      message: "Credits added successfully",
      package: {
        id: requestedPackage,
        ...selectedPackage,
      },
      user,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Unable to update credits right now.",
    });
  }
};
