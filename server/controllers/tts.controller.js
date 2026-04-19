const sanitize = (value = "", max = 4096) =>
  String(value)
    .replace(/[<>]/g, "")
    .trim()
    .slice(0, max);

/**
 * POST /api/ai/tts
 * Returns text for the client to speak with the Web Speech API (SpeechSynthesis) — no paid API.
 */
export const postTts = async (req, res) => {
  try {
    const text = sanitize(req.body?.text || "", 4096);
    if (!text) {
      return res.status(400).json({ message: "text is required" });
    }

    return res.status(200).json({
      mode: "browser",
      text,
      message: "Use the browser Web Speech API (SpeechSynthesis) to read this text — no server TTS key required.",
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message || "TTS error",
    });
  }
};
