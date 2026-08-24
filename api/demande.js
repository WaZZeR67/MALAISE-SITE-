const fs = require("fs");
const nodemailer = require("nodemailer");
const { formidable } = require("formidable");

function asArray(value) {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

function first(value) {
  return asArray(value)[0] || "";
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function parseForm(req) {
  const form = formidable({
    multiples: true,
    keepExtensions: true,
    maxFileSize: 10 * 1024 * 1024,
    maxTotalFileSize: 30 * 1024 * 1024
  });

  return new Promise((resolve, reject) => {
    form.parse(req, (error, fields, files) => {
      if (error) reject(error);
      else resolve({ fields, files });
    });
  });
}

function buildMessage(fields) {
  const ignored = new Set(["bot-field"]);
  const rows = Object.entries(fields)
    .filter(([key]) => !ignored.has(key))
    .map(([key, value]) => {
      const content = asArray(value).map(escapeHtml).join("<br>");
      return `<tr><th align="left" style="padding:8px;border-bottom:1px solid #ddd;">${escapeHtml(key)}</th><td style="padding:8px;border-bottom:1px solid #ddd;">${content}</td></tr>`;
    })
    .join("");

  return `
    <h2>Nouvelle demande Couverture Malaise</h2>
    <table cellspacing="0" cellpadding="0" style="border-collapse:collapse;font-family:Arial,sans-serif;font-size:14px;">
      ${rows}
    </table>
  `;
}

async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const { fields, files } = await parseForm(req);

    if (first(fields["bot-field"])) {
      res.writeHead(303, { Location: "/merci.html" });
      res.end();
      return;
    }

    const requiredEnv = ["SMTP_HOST", "SMTP_PORT", "SMTP_USER", "SMTP_PASS"];
    const missing = requiredEnv.filter((key) => !process.env[key]);
    if (missing.length) {
      res.status(500).json({
        error: "Email non configure",
        missing
      });
      return;
    }

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: String(process.env.SMTP_SECURE || "").toLowerCase() === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });

    const formName = first(fields["form-name"]) || "demande-site";
    const attachments = Object.values(files)
      .flatMap(asArray)
      .filter((file) => file && file.filepath)
      .map((file) => ({
        filename: file.originalFilename || file.newFilename || "document-client",
        path: file.filepath
      }));

    await transporter.sendMail({
      from: process.env.MAIL_FROM || process.env.SMTP_USER,
      to: process.env.MAIL_TO || "toiture@malaise.fr",
      replyTo: first(fields.Email) || first(fields.email) || undefined,
      subject: `Nouvelle ${formName} - Couverture Malaise`,
      html: buildMessage(fields),
      attachments
    });

    for (const file of attachments) {
      fs.unlink(file.path, () => {});
    }

    res.writeHead(303, { Location: "/merci.html" });
    res.end();
  } catch (error) {
    res.status(500).json({
      error: "Impossible d'envoyer la demande"
    });
  }
}

handler.config = {
  api: {
    bodyParser: false
  }
};

module.exports = handler;
