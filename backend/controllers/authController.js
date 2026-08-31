const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const axios = require("axios");
const prisma = require("../config/prisma");
const logger = require("../config/logger");
const responseFormatter = require("../utils/responseFormatter");

const ACCESS_TOKEN_EXPIRY = "15m";
const REFRESH_TOKEN_EXPIRY_DAYS = 7;

function generateAccessToken(user) {
  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      role: user.role,
      orgId: user.organizationId,
    },
    process.env.JWT_SECRET,
    { expiresIn: ACCESS_TOKEN_EXPIRY },
  );
}

function generateRefreshToken() {
  return crypto.randomBytes(64).toString("hex");
}

function sanitizeUser(user) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  };
}

const register = async (req, res, next) => {
  try {
    const { email, password, name, organizationName } = req.body;

    const existingEmail = await prisma.user.findUnique({ where: { email } });
    if (existingEmail) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists",
      });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const result = await prisma.$transaction(async (tx) => {
      const slug = organizationName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");

      const existingOrg = await tx.organization.findUnique({
        where: { slug },
      });
      const uniqueSlug = existingOrg
        ? `${slug}-${crypto.randomBytes(3).toString("hex")}`
        : slug;

      const organization = await tx.organization.create({
        data: { name: organizationName, slug: uniqueSlug },
      });

      const user = await tx.user.create({
        data: {
          email,
          passwordHash,
          name,
          role: "OWNER",
          organizationId: organization.id,
        },
      });

      return { user, organization };
    });

    const accessToken = generateAccessToken(result.user);
    const refreshToken = generateRefreshToken();

    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: result.user.id,
        expiresAt: new Date(
          Date.now() + REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000,
        ),
      },
    });

    logger.info(`User registered: ${email} (org: ${result.organization.slug})`);

    res.status(201).json(
      responseFormatter(
        {
          user: sanitizeUser(result.user),
          organization: {
            id: result.organization.id,
            name: result.organization.name,
            slug: result.organization.slug,
          },
          accessToken,
          refreshToken,
        },
        "Registration successful",
      ),
    );
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({
      where: { email },
      include: { organization: true },
    });

    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken();

    // Clean expired tokens for this user
    await prisma.refreshToken.deleteMany({
      where: { userId: user.id, expiresAt: { lt: new Date() } },
    });

    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: new Date(
          Date.now() + REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000,
        ),
      },
    });

    logger.info(`User logged in: ${email}`);

    res.status(200).json(
      responseFormatter(
        {
          user: sanitizeUser(user),
          organization: {
            id: user.organization.id,
            name: user.organization.name,
            slug: user.organization.slug,
          },
          accessToken,
          refreshToken,
        },
        "Login successful",
      ),
    );
  } catch (error) {
    next(error);
  }
};

const refresh = async (req, res, next) => {
  try {
    const { refreshToken: token } = req.body;
    if (!token) {
      return res
        .status(400)
        .json({ success: false, message: "Refresh token required" });
    }

    const stored = await prisma.refreshToken.findUnique({
      where: { token },
      include: { user: { include: { organization: true } } },
    });

    if (!stored || stored.expiresAt < new Date()) {
      if (stored) {
        await prisma.refreshToken.delete({ where: { id: stored.id } });
      }
      return res
        .status(401)
        .json({ success: false, message: "Invalid or expired refresh token" });
    }

    // Rotate: delete old, create new
    await prisma.refreshToken.deleteMany({ where: { id: stored.id } });

    const newAccessToken = generateAccessToken(stored.user);
    const newRefreshToken = generateRefreshToken();

    await prisma.refreshToken.create({
      data: {
        token: newRefreshToken,
        userId: stored.user.id,
        expiresAt: new Date(
          Date.now() + REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000,
        ),
      },
    });

    res.status(200).json(
      responseFormatter(
        {
          accessToken: newAccessToken,
          refreshToken: newRefreshToken,
        },
        "Token refreshed",
      ),
    );
  } catch (error) {
    next(error);
  }
};

const logout = async (req, res, next) => {
  try {
    const { refreshToken: token } = req.body;
    if (token) {
      await prisma.refreshToken
        .delete({ where: { token } })
        .catch(() => null);
    }
    res.status(200).json(responseFormatter(null, "Logged out successfully"));
  } catch (error) {
    next(error);
  }
};

const me = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: { organization: true },
    });

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    res.status(200).json(
      responseFormatter(
        {
          user: sanitizeUser(user),
          organization: {
            id: user.organization.id,
            name: user.organization.name,
            slug: user.organization.slug,
          },
        },
        "User profile",
      ),
    );
  } catch (error) {
    next(error);
  }
};

const googleLogin = async (req, res, next) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ success: false, message: "Token is required" });
    }

    let userInfo;
    try {
      const response = await axios.get("https://www.googleapis.com/oauth2/v3/userinfo", {
        headers: { Authorization: `Bearer ${token}` }
      });
      userInfo = response.data;
    } catch (err) {
      logger.error(`Google token verification failed: ${err.message}`);
      return res.status(401).json({ success: false, message: "Invalid Google token" });
    }

    const { email, name } = userInfo;

    let user = await prisma.user.findUnique({
      where: { email },
      include: { organization: true },
    });

    if (!user) {
      const passwordHash = await bcrypt.hash(crypto.randomBytes(16).toString("hex"), 12);

      const result = await prisma.$transaction(async (tx) => {
        const orgName = `${name}'s Organization`;
        const slug = orgName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
        const existingOrg = await tx.organization.findUnique({ where: { slug } });
        const uniqueSlug = existingOrg ? `${slug}-${crypto.randomBytes(3).toString("hex")}` : slug;

        const organization = await tx.organization.create({
          data: { name: orgName, slug: uniqueSlug },
        });

        const newUser = await tx.user.create({
          data: {
            email,
            passwordHash,
            name,
            role: "OWNER",
            organizationId: organization.id,
          },
        });

        return { user: newUser, organization };
      });

      user = { ...result.user, organization: result.organization };
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken();

    await prisma.refreshToken.deleteMany({
      where: { userId: user.id, expiresAt: { lt: new Date() } },
    });

    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000),
      },
    });

    logger.info(`User logged in via Google: ${email}`);

    res.status(200).json(
      responseFormatter(
        {
          user: sanitizeUser(user),
          organization: {
            id: user.organization.id,
            name: user.organization.name,
            slug: user.organization.slug,
          },
          accessToken,
          refreshToken,
        },
        "Google Login successful"
      )
    );
  } catch (error) {
    next(error);
  }
};

module.exports = { register, login, refresh, logout, me, googleLogin };
