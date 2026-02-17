const express = require("express");
const { z } = require("zod");
const leadController = require("../controllers/leadController");
const validate = require("../middleware/validateMiddleware");

const router = express.Router();

const leadSchema = z.object({
  body: z.object({
    city: z.string().min(1, "City is required"),
    keyword: z.string().optional(),
    radius: z.number().positive().max(50000).optional(),
    limit: z.number().positive().max(100).optional(),
  }),
});

const advancedSearchSchema = z.object({
  body: z.object({
    city: z.string().min(1, "City is required"),
    businessType: z.string().min(1, "businessType is required"),
    limit: z.number().int().min(1).max(500),
  }),
});

const getLeadsSchema = z.object({
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    city: z.string().optional(),
    keyword: z.string().optional(),
    subCategory: z.string().optional(),
    whatsapp_status: z.string().optional(),
    search: z.string().optional(),
    sortBy: z.string().optional(),
    order: z.enum(["asc", "desc"]).optional(),
  }),
});

router.post("/generate", validate(leadSchema), leadController.generateLeads);
router.post(
  "/search",
  validate(advancedSearchSchema),
  leadController.advancedSearch,
);
router.get("/", validate(getLeadsSchema), leadController.getLeads);

module.exports = router;
