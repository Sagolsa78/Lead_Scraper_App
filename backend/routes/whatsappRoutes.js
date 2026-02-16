const express = require("express");
const { z } = require("zod");
const whatsappController = require("../controllers/whatsappController");
const validate = require("../middleware/validateMiddleware");

const router = express.Router();

const sendSchema = z.object({
  body: z.object({
    leadId: z.string().uuid("Invalid leadId"),
    customMessage: z.string().optional(),
  }),
});

const bulkSendSchema = z.object({
  body: z.object({
    leadIds: z.array(z.string().uuid("Invalid leadId")),
    customMessage: z.string().optional(),
  }),
});

const settingsSchema = z.object({
  body: z.object({
    token: z.string().optional(),
    mode: z.enum(["manual", "cloud"]),
  }),
});

router.post("/send", validate(sendSchema), whatsappController.sendMessage);
router.post(
  "/bulk-send",
  validate(bulkSendSchema),
  whatsappController.sendBulkMessages,
);
router.get("/settings", whatsappController.getSettings);
router.post(
  "/settings",
  validate(settingsSchema),
  whatsappController.updateSettings,
);

module.exports = router;
