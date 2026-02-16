const express = require("express");
const { z } = require("zod");
const leadController = require("../controllers/leadController");
const validate = require("../middleware/validateMiddleware");

const router = express.Router();

const leadSchema = z.object({
  body: z.object({
    city: z.string().min(1, "City is required"),
    keyword: z.string().min(1, "Keyword is required"),
    radius: z.number().positive().max(50000).optional(),
    limit: z.number().positive().max(60).optional(),
  }),
});

const getLeadsSchema = z.object({
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    city: z.string().optional(),
    keyword: z.string().optional(),
    whatsapp_status: z.string().optional(),
    search: z.string().optional(),
    sortBy: z.string().optional(),
    order: z.enum(["asc", "desc"]).optional(),
  }),
});

router.post("/generate", validate(leadSchema), leadController.generateLeads);
router.get("/", validate(getLeadsSchema), leadController.getLeads);

module.exports = router;
