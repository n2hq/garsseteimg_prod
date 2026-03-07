import { jsx, jsxs } from "react/jsx-runtime";
import { PassThrough } from "node:stream";
import { createReadableStreamFromReadable } from "@remix-run/node";
import { RemixServer, Outlet, Meta, Links, ScrollRestoration, Scripts } from "@remix-run/react";
import { isbot } from "isbot";
import { renderToPipeableStream } from "react-dom/server";
import path from "path";
import fs, { writeFile, unlink } from "fs/promises";
import mysql from "mysql2/promise";
import crypto$1 from "crypto";
const ABORT_DELAY = 5e3;
function handleRequest(request, responseStatusCode, responseHeaders, remixContext, loadContext) {
  return isbot(request.headers.get("user-agent") || "") ? handleBotRequest(
    request,
    responseStatusCode,
    responseHeaders,
    remixContext
  ) : handleBrowserRequest(
    request,
    responseStatusCode,
    responseHeaders,
    remixContext
  );
}
function handleBotRequest(request, responseStatusCode, responseHeaders, remixContext) {
  return new Promise((resolve, reject) => {
    let shellRendered = false;
    const { pipe, abort } = renderToPipeableStream(
      /* @__PURE__ */ jsx(
        RemixServer,
        {
          context: remixContext,
          url: request.url,
          abortDelay: ABORT_DELAY
        }
      ),
      {
        onAllReady() {
          shellRendered = true;
          const body = new PassThrough();
          const stream = createReadableStreamFromReadable(body);
          responseHeaders.set("Content-Type", "text/html");
          resolve(
            new Response(stream, {
              headers: responseHeaders,
              status: responseStatusCode
            })
          );
          pipe(body);
        },
        onShellError(error) {
          reject(error);
        },
        onError(error) {
          responseStatusCode = 500;
          if (shellRendered) {
            console.error(error);
          }
        }
      }
    );
    setTimeout(abort, ABORT_DELAY);
  });
}
function handleBrowserRequest(request, responseStatusCode, responseHeaders, remixContext) {
  return new Promise((resolve, reject) => {
    let shellRendered = false;
    const { pipe, abort } = renderToPipeableStream(
      /* @__PURE__ */ jsx(
        RemixServer,
        {
          context: remixContext,
          url: request.url,
          abortDelay: ABORT_DELAY
        }
      ),
      {
        onShellReady() {
          shellRendered = true;
          const body = new PassThrough();
          const stream = createReadableStreamFromReadable(body);
          responseHeaders.set("Content-Type", "text/html");
          resolve(
            new Response(stream, {
              headers: responseHeaders,
              status: responseStatusCode
            })
          );
          pipe(body);
        },
        onShellError(error) {
          reject(error);
        },
        onError(error) {
          responseStatusCode = 500;
          if (shellRendered) {
            console.error(error);
          }
        }
      }
    );
    setTimeout(abort, ABORT_DELAY);
  });
}
const entryServer = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: handleRequest
}, Symbol.toStringTag, { value: "Module" }));
const links = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous"
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap"
  }
];
function Layout({ children }) {
  return /* @__PURE__ */ jsxs("html", { lang: "en", children: [
    /* @__PURE__ */ jsxs("head", { children: [
      /* @__PURE__ */ jsx("meta", { charSet: "utf-8" }),
      /* @__PURE__ */ jsx("meta", { name: "viewport", content: "width=device-width, initial-scale=1" }),
      /* @__PURE__ */ jsx(Meta, {}),
      /* @__PURE__ */ jsx(Links, {})
    ] }),
    /* @__PURE__ */ jsxs("body", { children: [
      children,
      /* @__PURE__ */ jsx(ScrollRestoration, {}),
      /* @__PURE__ */ jsx(Scripts, {})
    ] })
  ] });
}
function App() {
  return /* @__PURE__ */ jsx(Outlet, {});
}
const route0 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  Layout,
  default: App,
  links
}, Symbol.toStringTag, { value: "Module" }));
const meta = () => {
  return [
    { title: "New Remix App" },
    { name: "description", content: "Welcome to Remix!" }
  ];
};
function Index() {
  return /* @__PURE__ */ jsx("div", { className: "flex h-screen items-center justify-center", children: /* @__PURE__ */ jsx("div", { className: "flex flex-col items-center gap-5", children: /* @__PURE__ */ jsx("nav", { className: `flex flex-col items-center justify-center 
          gap-4 rounded  border-gray-200
          px-6 py-2 dark:border-gray-700 underline`, children: /* @__PURE__ */ jsx("p", { className: "leading-6 text-gray-700 dark:text-gray-200", children: "Image API v1.0" }) }) }) });
}
const route1 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: Index,
  meta
}, Symbol.toStringTag, { value: "Module" }));
const headers = {
  "Access-Control-Allow-Origin": "*",
  // Allow all origins
  "Access-Control-Allow-Methods": "*",
  // Allow specific methods
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  // Allow specific headers
  //"Access-Control-Allow-Credentials": "true", // Optional: if using cookies/auth
  "Cache-Control": "no-store"
  // Note: "cache" isn't valid; use "Cache-Control"
};
function DoResponse(json, code = 500) {
  return new Response(
    JSON.stringify(json),
    {
      status: code
    }
  );
}
let cachedPool = global.mysqlPool || null;
const DATABASE_HOST = "localhost";
const DATABASE_PORT = "3306";
const DATABASE_NAME = "garssete";
const DATABASE_PASS = "Querty123$$$$";
const DATABASE_USER = "garssete_user";
if (!cachedPool) {
  cachedPool = global.mysqlPool = mysql.createPool({
    host: DATABASE_HOST,
    port: Number(DATABASE_PORT) || 3306,
    user: DATABASE_USER,
    password: DATABASE_PASS,
    database: DATABASE_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  });
}
async function getConnection() {
  console.log(`${DATABASE_USER} accessed connection`);
  return cachedPool.getConnection();
}
async function query(sql, values = []) {
  const connection = await getConnection();
  try {
    const [results] = await connection.execute(sql, values);
    connection.commit();
    return results;
  } finally {
    connection.release();
  }
}
const userProfileUploadsDir$1 = path.resolve("public/user_profile_pics");
const loader$a = async ({ request, params }) => {
  return DoResponse({ error: "method not allowed" }, 405);
};
const action$a = async ({ request }) => {
  var _a;
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const guid = (_a = formData.get("guid")) == null ? void 0 : _a.toString();
    if (!file || typeof file === "string") {
      return DoResponse({ error: "No file uploaded" }, 400);
    }
    if (!guid) {
      return DoResponse({ error: "Missing user GUID" }, 400);
    }
    await fs.mkdir(userProfileUploadsDir$1, { recursive: true });
    const buffer = Buffer.from(await file.arrayBuffer());
    const ext = path.extname(file.name);
    const uniqueName = `${Date.now()}_${crypto.randomUUID()}${ext}`;
    const filePath = path.join(userProfileUploadsDir$1, uniqueName);
    await fs.writeFile(filePath, buffer);
    const fileUrl = `/user_profile_pics/${uniqueName}`;
    const mimeType = file.type;
    const imageGuid = crypto.randomUUID();
    const [exists] = await query(
      `SELECT * FROM tbl_user_profile_image WHERE user_guid = ?`,
      [guid]
    );
    const existingRecord = exists;
    if (!existingRecord) {
      const [result] = await query(
        `INSERT INTO tbl_user_profile_image (image_filename, user_guid, image_guid, image_url, mimetype)
         VALUES (?, ?, ?, ?, ?)`,
        [uniqueName, guid, imageGuid, fileUrl, mimeType]
      );
      return DoResponse({
        message: "File uploaded and saved to database successfully",
        fileUrl,
        insertId: result.insertId
      }, 200);
    } else {
      const existingImage = exists;
      const oldFilePath = path.join(userProfileUploadsDir$1, existingImage.image_filename);
      console.log(oldFilePath);
      try {
        await fs.unlink(oldFilePath);
      } catch (err) {
        if (err.code !== "ENOENT") console.error("File deletion error:", err);
      }
      await query(
        `UPDATE tbl_user_profile_image SET image_filename = ?, image_guid = ?, image_url = ?, mimetype = ?
         WHERE user_guid = ?`,
        [uniqueName, imageGuid, fileUrl, mimeType, guid]
      );
      return DoResponse({
        message: "File updated and saved to database successfully",
        fileUrl,
        insertId: exists.id
      }, 200);
    }
  } catch (error) {
    console.error("Upload error:", error);
    return DoResponse({ error: error.message || "Upload failed" }, 500);
  }
};
const route2 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  action: action$a,
  loader: loader$a
}, Symbol.toStringTag, { value: "Module" }));
const userProfileUploadsDir = path.resolve("public/user_profile_bg");
const loader$9 = async ({ request, params }) => {
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "http://localhost:3393",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Credentials": "true"
        // optional
      }
    });
  }
  return DoResponse({ error: "method not allowed" }, 405);
};
const action$9 = async ({ request }) => {
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const guid = formData.get("guid");
    if (!file || typeof file === "string") {
      return DoResponse({ message: "No file uploaded" }, 405);
    }
    const buffer = Buffer.from(await file.arrayBuffer());
    const ext = path.extname(file.name);
    const uuidname = crypto.randomUUID();
    const uniqueName = `${Date.now()}_${uuidname}${ext}`;
    await fs.mkdir(userProfileUploadsDir, { recursive: true });
    const filePath = path.join(userProfileUploadsDir, uniqueName);
    await fs.writeFile(filePath, buffer);
    const fileUrl = `/user_profile_bg/${uniqueName}`;
    const mimeType = file.type;
    const imageGuid = crypto.randomUUID();
    const exists = await query(
      `SELECT * FROM tbl_user_profile_bg WHERE user_guid = ?`,
      [guid]
    );
    if (exists.length === 0) {
      const result = await query(
        `INSERT INTO tbl_user_profile_bg (image_filename, user_guid, image_guid, image_url, mimetype)
         VALUES (?, ?, ?, ?, ?)`,
        [uniqueName, guid, imageGuid, fileUrl, mimeType]
      );
      return DoResponse(
        {
          message: "File uploaded and saved to database successfully",
          fileUrl,
          insertId: result.insertId
        },
        200
      );
    } else {
      const existingImage = exists[0];
      const existingPath = path.join(userProfileUploadsDir, existingImage.image_filename);
      try {
        await fs.unlink(existingPath);
      } catch (err) {
        if (err.code !== "ENOENT") console.error("Error deleting old file:", err);
      }
      await query(
        `UPDATE tbl_user_profile_bg SET image_filename = ?, image_guid = ?, image_url = ?, mimetype = ?
                WHERE user_guid = ?`,
        [uniqueName, imageGuid, fileUrl, mimeType, guid]
      );
      return DoResponse(
        {
          message: "File updated and saved to database successfully",
          fileUrl,
          insertId: existingImage.id
        },
        200
      );
    }
  } catch (error) {
    console.error("Upload error:", error);
    return DoResponse({ message: error.message || "Upload failed" }, 500);
  }
};
const route3 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  action: action$9,
  loader: loader$9
}, Symbol.toStringTag, { value: "Module" }));
const businessProfileUploadsDir$1 = path.resolve("public/business_profile_pics");
const loader$8 = async ({ request, params }) => {
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "http://localhost:3393",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Credentials": "true"
        // optional
      }
    });
  }
  return DoResponse({ error: "method not allowed" }, 405);
};
const action$8 = async ({ request }) => {
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const guid = formData.get("guid");
    const bid = formData.get("bid");
    if (!file || typeof file === "string") {
      return DoResponse({ message: "No file uploaded" }, 405);
    }
    if (!guid || !bid) {
      return DoResponse({ message: "Missing required fields" }, 400);
    }
    const buffer = Buffer.from(await file.arrayBuffer());
    const ext = path.extname(file.name);
    const uuidname = crypto.randomUUID();
    const uniqueName = `${Date.now()}_${uuidname}${ext}`;
    await fs.mkdir(businessProfileUploadsDir$1, { recursive: true });
    const filePath = path.join(businessProfileUploadsDir$1, uniqueName);
    await fs.writeFile(filePath, buffer);
    const fileUrl = `/business_profile_pics/${uniqueName}`;
    const mimeType = file.type;
    const imageGuid = crypto.randomUUID();
    const exists = await query(
      `SELECT * FROM tbl_business_profile_image WHERE user_guid = ? AND business_guid = ?`,
      [guid, bid]
    );
    if (exists.length === 0) {
      const result = await query(
        `INSERT INTO tbl_business_profile_image (image_filename, user_guid, image_guid, business_guid, image_url, mimetype)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [uniqueName, guid, imageGuid, bid, fileUrl, mimeType]
      );
      return DoResponse(
        {
          message: "File uploaded and saved to database successfully",
          fileUrl,
          insertId: result.insertId
        },
        200
      );
    } else {
      const existingImage = exists[0];
      const existingPath = path.join(businessProfileUploadsDir$1, existingImage.image_filename);
      try {
        await fs.unlink(existingPath);
      } catch (err) {
        if (err.code !== "ENOENT") console.error("Error deleting old file:", err);
      }
      await query(
        `UPDATE tbl_business_profile_image SET image_filename = ?, image_guid = ?, image_url = ?, mimetype = ?
         WHERE user_guid = ? AND business_guid = ?`,
        [uniqueName, imageGuid, fileUrl, mimeType, guid, bid]
      );
      return DoResponse(
        {
          message: "File updated and saved to database successfully",
          fileUrl,
          insertId: existingImage.id
        },
        200
      );
    }
  } catch (error) {
    console.error("Upload error:", error);
    return DoResponse({ message: error.message || "Upload failed" }, 500);
  }
};
const route4 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  action: action$8,
  loader: loader$8
}, Symbol.toStringTag, { value: "Module" }));
const businessProfileUploadsDir = path.resolve("public/business_profile_bg");
const loader$7 = async ({ request, params }) => {
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "http://localhost:3393",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Credentials": "true"
        // optional
      }
    });
  }
  return DoResponse({ error: "method not allowed" }, 405);
};
const action$7 = async ({ request }) => {
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const guid = formData.get("guid");
    const bid = formData.get("bid");
    if (!file || typeof file === "string") {
      return DoResponse({ message: "No file uploaded" }, 405);
    }
    if (!guid || !bid) {
      return DoResponse({ message: "Missing required fields" }, 400);
    }
    const buffer = Buffer.from(await file.arrayBuffer());
    const ext = path.extname(file.name);
    const uuidname = crypto.randomUUID();
    const uniqueName = `${Date.now()}_${uuidname}${ext}`;
    await fs.mkdir(businessProfileUploadsDir, { recursive: true });
    const filePath = path.join(businessProfileUploadsDir, uniqueName);
    await fs.writeFile(filePath, buffer);
    const fileUrl = `/business_profile_bg/${uniqueName}`;
    const mimeType = file.type;
    const imageGuid = crypto.randomUUID();
    const exists = await query(
      `SELECT * FROM tbl_business_profile_bg WHERE user_guid = ? AND business_guid = ?`,
      [guid, bid]
    );
    if (exists.length === 0) {
      const result = await query(
        `INSERT INTO tbl_business_profile_bg (image_filename, user_guid, image_guid, business_guid, image_url, mimetype)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [uniqueName, guid, imageGuid, bid, fileUrl, mimeType]
      );
      return DoResponse(
        {
          message: "File uploaded and saved to database successfully",
          fileUrl,
          insertId: result.insertId
        },
        200
      );
    } else {
      const existingImage = exists[0];
      const existingPath = path.join(businessProfileUploadsDir, existingImage.image_filename);
      try {
        await fs.unlink(existingPath);
      } catch (err) {
        if (err.code !== "ENOENT") console.error("Error deleting old file:", err);
      }
      await query(
        `UPDATE tbl_business_profile_bg SET image_filename = ?, image_guid = ?, image_url = ?, mimetype = ?
         WHERE user_guid = ? AND business_guid = ?`,
        [uniqueName, imageGuid, fileUrl, mimeType, guid, bid]
      );
      return DoResponse(
        {
          message: "File updated and saved to database successfully",
          fileUrl,
          insertId: existingImage.id
        },
        200
      );
    }
  } catch (error) {
    console.error("Upload error:", error);
    return DoResponse({ message: error.message || "Upload failed" }, 500);
  }
};
const route5 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  action: action$7,
  loader: loader$7
}, Symbol.toStringTag, { value: "Module" }));
const businessGalleryUploadsDir = path.resolve("public/business_gallery_pics");
const loader$6 = async ({ request, params }) => {
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "http://localhost:3393",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Credentials": "true"
        // optional
      }
    });
  }
  return DoResponse({ error: "method not allowed" }, 405);
};
const action$6 = async ({ request }) => {
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const guid = formData.get("guid");
    const bid = formData.get("bid");
    const imageTitle = formData.get("image_title");
    if (!file || typeof file === "string") {
      return DoResponse({ message: "No file uploaded" }, 405);
    }
    if (!guid || !bid || !imageTitle) {
      return DoResponse({ message: "Please enter picture title." }, 400);
    }
    const buffer = Buffer.from(await file.arrayBuffer());
    const ext = path.extname(file.name);
    const uuidname = crypto$1.randomUUID();
    const uniqueName = `${Date.now()}_${uuidname}${ext}`;
    await fs.mkdir(businessGalleryUploadsDir, { recursive: true });
    const filePath = path.join(businessGalleryUploadsDir, uniqueName);
    await fs.writeFile(filePath, buffer);
    const fileUrl = `/business_gallery_pics/${uniqueName}`;
    const mimeType = file.type;
    const imageGuid = crypto$1.randomUUID();
    const result = await query(
      `INSERT INTO tbl_business_gallery_image
      (image_filename, user_guid, image_guid, image_url, mimetype, business_guid, image_title)
      VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [uniqueName, guid, imageGuid, fileUrl, mimeType, bid, imageTitle]
    );
    return DoResponse(
      {
        message: "File uploaded and saved to database successfully",
        fileUrl,
        insertId: result.insertId
      },
      200
    );
  } catch (error) {
    console.error("Upload error:", error);
    return DoResponse({ message: error.message || "Database save failed" }, 500);
  }
};
const route6 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  action: action$6,
  loader: loader$6
}, Symbol.toStringTag, { value: "Module" }));
const galleryDir$3 = path.resolve("public/business_gallery_pics");
const loader$5 = async ({ request, params }) => {
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "http://localhost:3393",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Credentials": "true"
        // optional
      }
    });
  }
  return DoResponse({ error: "method not allowed" }, 405);
};
const action$5 = async ({ request }) => {
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const userGuid = formData.get("guid");
    const businessGuid = formData.get("bid");
    const imageGuid = formData.get("image_guid");
    const imageTitle = formData.get("image_title") || "";
    if (!userGuid || !businessGuid || !imageGuid) {
      return DoResponse({ error: "Missing required fields" }, 400);
    }
    const [existing] = await query(
      `SELECT * FROM tbl_business_gallery_image
       WHERE user_guid = ? AND business_guid = ? AND image_guid = ?`,
      [userGuid, businessGuid, imageGuid]
    );
    const existingRecord = existing;
    if (!existingRecord) {
      return DoResponse({ error: "Image does not exist" }, 404);
    }
    let fileUrl = existingRecord.image_url;
    let originalName = existingRecord.image_filename;
    let mimeType = existingRecord.mimetype;
    if (file) {
      const uuidname = crypto$1.randomUUID();
      const ext = path.extname(file.name);
      const uniqueName = `${Date.now()}_${uuidname}${ext}`;
      const buffer = Buffer.from(await file.arrayBuffer());
      const filePath = path.join(galleryDir$3, uniqueName);
      await writeFile(filePath, buffer);
      const oldFilePath = path.join(galleryDir$3, existingRecord.image_filename);
      try {
        await unlink(oldFilePath);
      } catch (err) {
        if (err.code !== "ENOENT") console.error("Failed to delete old image:", err);
      }
      fileUrl = `/business_gallery_pics/${uniqueName}`;
      originalName = uniqueName;
      mimeType = file.type;
    }
    const result = await query(
      `UPDATE tbl_business_gallery_image
       SET image_filename = ?, image_url = ?, mimetype = ?, image_title = ?
       WHERE user_guid = ? AND business_guid = ? AND image_guid = ?`,
      [originalName, fileUrl, mimeType, imageTitle, userGuid, businessGuid, imageGuid]
    );
    return DoResponse(
      {
        message: "Gallery image updated successfully",
        fileUrl,
        insertId: existingRecord.id
      },
      200
    );
  } catch (err) {
    console.error("Error updating gallery image:", err);
    return DoResponse({ error: err.message || "Update failed" }, 500);
  }
};
const route7 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  action: action$5,
  loader: loader$5
}, Symbol.toStringTag, { value: "Module" }));
const galleryDir$2 = path.resolve("public/business_gallery_pics");
const loader$4 = async ({ request, params }) => {
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "http://localhost:3393",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Credentials": "true"
        // optional
      }
    });
  }
  return DoResponse({ error: "method not allowed" }, 405);
};
const action$4 = async ({ request }) => {
  try {
    const contentType = request.headers.get("Content-Type");
    if (!(contentType == null ? void 0 : contentType.includes("application/json"))) {
      return DoResponse({ error: "Invalid content type. Expected JSON." }, 415);
    }
    const body = await request.json();
    const { guid: userGuid, bid: businessGuid, image_guid: imageGuid } = body;
    if (!userGuid || !businessGuid || !imageGuid) {
      return DoResponse({ error: "Missing required fields" }, 400);
    }
    const [existingImageRecord] = await query(
      `SELECT * FROM tbl_business_gallery_image
       WHERE user_guid = ? AND business_guid = ? AND image_guid = ?`,
      [userGuid, businessGuid, imageGuid]
    );
    const image = existingImageRecord;
    if (!image) {
      return DoResponse({ message: "Image does not exist" }, 200);
    }
    const imagePath = path.join(galleryDir$2, image.image_filename);
    try {
      await unlink(imagePath);
      console.log(`Deleted old file: ${imagePath}`);
    } catch (err) {
      if (err.code !== "ENOENT") {
        console.error("Error deleting file:", err);
        return DoResponse({ error: "File deletion failed" }, 500);
      }
    }
    await query(
      `DELETE FROM tbl_business_gallery_image
       WHERE user_guid = ? AND business_guid = ? AND image_guid = ?`,
      [userGuid, businessGuid, imageGuid]
    );
    return DoResponse(
      {
        message: "File deleted successfully",
        insertId: image.id
      },
      200
    );
  } catch (error) {
    console.error("Deletion error:", error);
    return DoResponse({ error: error.message || "Deletion failed" }, 500);
  }
};
const route8 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  action: action$4,
  loader: loader$4
}, Symbol.toStringTag, { value: "Module" }));
const galleryDir$1 = path.resolve("public/business_gallery_products");
const loader$3 = async ({ request, params }) => {
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "http://localhost:3393",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Credentials": "true"
        // optional
      }
    });
  }
  return DoResponse({ error: "method not allowed" }, 405);
};
const action$3 = async ({ request }) => {
  try {
    const contentType = request.headers.get("Content-Type");
    if (!(contentType == null ? void 0 : contentType.includes("application/json"))) {
      return DoResponse({ error: "Invalid content type. Expected JSON." }, 415);
    }
    const body = await request.json();
    const { guid: userGuid, bid: businessGuid, product_guid: productGuid } = body;
    if (!userGuid || !businessGuid || !productGuid) {
      console.log("here");
      return DoResponse({ error: "Missing required fields" }, 400);
    }
    const [existingImageRecord] = await query(
      `SELECT * FROM tbl_business_gallery_products
       WHERE user_guid = ? AND business_guid = ? AND product_guid = ?`,
      [userGuid, businessGuid, productGuid]
    );
    const product = existingImageRecord;
    if (!product) {
      return DoResponse({ message: "Product does not exist" }, 200);
    }
    const imagePath = path.join(galleryDir$1, product.product_image_filename);
    try {
      await unlink(imagePath);
      console.log(`Deleted old file: ${imagePath}`);
    } catch (err) {
      if (err.code !== "ENOENT") {
        console.error("Error deleting file:", err);
        return DoResponse({ error: "File deletion failed" }, 500);
      }
    }
    await query(
      `DELETE FROM tbl_business_gallery_products
       WHERE user_guid = ? AND business_guid = ? AND product_guid = ?`,
      [userGuid, businessGuid, productGuid]
    );
    return DoResponse(
      {
        message: "File deleted successfully",
        insertId: product.id
      },
      200
    );
  } catch (error) {
    console.error("Deletion error:", error);
    return DoResponse({ error: error.message || "Deletion failed" }, 500);
  }
};
const route9 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  action: action$3,
  loader: loader$3
}, Symbol.toStringTag, { value: "Module" }));
const businessProductGalleryUploadsDir = path.resolve("public/business_gallery_products");
const loader$2 = async ({ request, params }) => {
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "http://localhost:3393",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Credentials": "true"
        // optional
      }
    });
  }
  return DoResponse({ error: "method not allowed" }, 405);
};
const action$2 = async ({ request }) => {
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const guid = formData.get("guid");
    const bid = formData.get("bid");
    const productTitle = formData.get("product_title");
    const productDescription = formData.get("product_description");
    const productAmount = formData.get("product_amount") || "";
    const productCurrencyCountryId = formData.get("product_currency_country_id") || "";
    const productLink = formData.get("product_link");
    if (!file || typeof file === "string") {
      return DoResponse({ message: "No file selected" }, 405);
    }
    if (!guid || !bid || !productTitle) {
      return DoResponse({ message: "Missing required fields. Product title is compulsory" }, 400);
    }
    const buffer = Buffer.from(await file.arrayBuffer());
    const ext = path.extname(file.name);
    const uuidname = crypto$1.randomUUID();
    const uniqueName = `${Date.now()}_${uuidname}${ext}`;
    await fs.mkdir(businessProductGalleryUploadsDir, { recursive: true });
    const filePath = path.join(businessProductGalleryUploadsDir, uniqueName);
    await fs.writeFile(filePath, buffer);
    const imageFileUrl = `/business_gallery_products/${uniqueName}`;
    const mimeType = file.type;
    const productGuid = crypto$1.randomUUID();
    const result = await query(
      `INSERT INTO tbl_business_gallery_products
            (product_image_filename,
            user_guid,
            product_guid,
            product_image_url,
            mimetype,
            business_guid,
            product_title,
            product_description,
            product_link,
            product_amount,
            product_currency_country_id)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        uniqueName,
        guid,
        productGuid,
        imageFileUrl,
        mimeType,
        bid,
        productTitle,
        productDescription,
        productLink,
        productAmount,
        productCurrencyCountryId
      ]
    );
    return DoResponse(
      {
        message: "File uploaded and saved to database successfully",
        imageFileUrl,
        insertId: result.insertId
      },
      200
    );
  } catch (error) {
    console.error("Upload error:", error);
    return DoResponse({ message: error.message || "Database save failed" }, 500);
  }
};
const route10 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  action: action$2,
  loader: loader$2
}, Symbol.toStringTag, { value: "Module" }));
const galleryDir = path.resolve("public/business_gallery_products");
const loader$1 = async ({ request, params }) => {
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "http://localhost:3393",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Credentials": "true"
        // optional
      }
    });
  }
  return DoResponse({ error: "method not allowed" }, 405);
};
const action$1 = async ({ request }) => {
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const userGuid = formData.get("guid");
    const businessGuid = formData.get("bid");
    const productGuid = formData.get("product_guid");
    const productTitle = formData.get("product_title") || "";
    const productDescription = formData.get("product_description") || "";
    const productAmount = formData.get("product_amount") || "";
    const productCurrencyCountryId = formData.get("product_currency_country_id") || "";
    const productLink = formData.get("product_link") || "";
    console.log(formData);
    if (!userGuid || !businessGuid || !productGuid) {
      return DoResponse({ error: "Missing required fields" }, 400);
    }
    const [existing] = await query(
      `SELECT * FROM tbl_business_gallery_products
            WHERE
            user_guid = ?
            AND
            business_guid = ?
            AND
            product_guid = ?`,
      [userGuid, businessGuid, productGuid]
    );
    const existingRecord = existing;
    if (!existingRecord) {
      return DoResponse({ error: "Product does not exist" }, 404);
    }
    let fileUrl = existingRecord.product_image_url;
    let originalName = existingRecord.product_image_filename;
    let mimeType = existingRecord.mimetype;
    if (file) {
      console.log(file);
      console.log("herebol");
      const uuidname = crypto$1.randomUUID();
      const ext = path.extname(file.name);
      const uniqueName = `${Date.now()}_${uuidname}${ext}`;
      const buffer = Buffer.from(await file.arrayBuffer());
      const filePath = path.join(galleryDir, uniqueName);
      console.log(filePath);
      await writeFile(filePath, buffer);
      const oldFilePath = path.join(galleryDir, existingRecord.product_image_filename);
      try {
        await unlink(oldFilePath);
        console.log("done");
      } catch (err) {
        if (err.code !== "ENOENT") console.error("Failed to delete old image:", err);
      }
      fileUrl = `/business_gallery_products/${uniqueName}`;
      originalName = uniqueName;
      mimeType = file.type;
    }
    const result = await query(
      `UPDATE tbl_business_gallery_products
            SET
            product_image_filename = ?,
            product_image_url = ?,
            mimetype = ?,
            product_title = ?,
            product_description = ?,
            product_link = ?,
            product_amount = ?,
            product_currency_country_id = ?
            WHERE
            user_guid = ?
            AND
            business_guid = ?
            AND
            product_guid = ?`,
      [
        originalName,
        fileUrl,
        mimeType,
        productTitle,
        productDescription,
        productLink,
        productAmount,
        productCurrencyCountryId,
        userGuid,
        businessGuid,
        productGuid
      ]
    );
    return DoResponse(
      {
        message: "Gallery image updated successfully",
        fileUrl,
        insertId: existingRecord.id
      },
      200
    );
  } catch (err) {
    console.error("Error updating gallery image:", err);
    return DoResponse({ message: err.message || "Update failed" }, 500);
  }
};
const route11 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  action: action$1,
  loader: loader$1
}, Symbol.toStringTag, { value: "Module" }));
const loader = async ({ request, params }) => {
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers
    });
  }
  return DoResponse({ error: "method not allowed" }, 405);
};
const action = async ({ request }) => {
  return DoResponse({
    message: "Hello"
  }, 200);
};
const route12 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  action,
  loader
}, Symbol.toStringTag, { value: "Module" }));
const serverManifest = { "entry": { "module": "/assets/entry.client-Ai_1fLJU.js", "imports": ["/assets/jsx-runtime-0DLF9kdB.js", "/assets/components-UtfmbdUD.js"], "css": [] }, "routes": { "root": { "id": "root", "parentId": void 0, "path": "", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasErrorBoundary": false, "module": "/assets/root-DdTteooJ.js", "imports": ["/assets/jsx-runtime-0DLF9kdB.js", "/assets/components-UtfmbdUD.js"], "css": ["/assets/root-DABPeJSW.css"] }, "routes/_index": { "id": "routes/_index", "parentId": "root", "path": "/", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasErrorBoundary": false, "module": "/assets/_index-BlkbRRZ-.js", "imports": ["/assets/jsx-runtime-0DLF9kdB.js"], "css": [] }, "routes/api/media/user_profile_pic_upload": { "id": "routes/api/media/user_profile_pic_upload", "parentId": "root", "path": "/user_profile_pic_upload", "index": void 0, "caseSensitive": void 0, "hasAction": true, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasErrorBoundary": false, "module": "/assets/user_profile_pic_upload-l0sNRNKZ.js", "imports": [], "css": [] }, "routes/api/media/user_profile_bg_upload": { "id": "routes/api/media/user_profile_bg_upload", "parentId": "root", "path": "/user_profile_bg_upload", "index": void 0, "caseSensitive": void 0, "hasAction": true, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasErrorBoundary": false, "module": "/assets/user_profile_bg_upload-l0sNRNKZ.js", "imports": [], "css": [] }, "routes/api/media/business_profile_pic_upload": { "id": "routes/api/media/business_profile_pic_upload", "parentId": "root", "path": "/business_profile_pic_upload", "index": void 0, "caseSensitive": void 0, "hasAction": true, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasErrorBoundary": false, "module": "/assets/business_profile_pic_upload-l0sNRNKZ.js", "imports": [], "css": [] }, "routes/api/media/business_profile_bg_upload": { "id": "routes/api/media/business_profile_bg_upload", "parentId": "root", "path": "/business_profile_bg_upload", "index": void 0, "caseSensitive": void 0, "hasAction": true, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasErrorBoundary": false, "module": "/assets/business_profile_bg_upload-l0sNRNKZ.js", "imports": [], "css": [] }, "routes/api/media/business_gallery_pic_upload": { "id": "routes/api/media/business_gallery_pic_upload", "parentId": "root", "path": "/business_gallery_pic_upload", "index": void 0, "caseSensitive": void 0, "hasAction": true, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasErrorBoundary": false, "module": "/assets/business_gallery_pic_upload-l0sNRNKZ.js", "imports": [], "css": [] }, "routes/api/media/business_gallery_pic_update": { "id": "routes/api/media/business_gallery_pic_update", "parentId": "root", "path": "/business_gallery_pic_update", "index": void 0, "caseSensitive": void 0, "hasAction": true, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasErrorBoundary": false, "module": "/assets/business_gallery_pic_update-l0sNRNKZ.js", "imports": [], "css": [] }, "routes/api/media/delete_business_gallery_pic": { "id": "routes/api/media/delete_business_gallery_pic", "parentId": "root", "path": "/delete_business_gallery_pic", "index": void 0, "caseSensitive": void 0, "hasAction": true, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasErrorBoundary": false, "module": "/assets/delete_business_gallery_pic-l0sNRNKZ.js", "imports": [], "css": [] }, "routes/api/media/delete_business_product": { "id": "routes/api/media/delete_business_product", "parentId": "root", "path": "/delete_business_product", "index": void 0, "caseSensitive": void 0, "hasAction": true, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasErrorBoundary": false, "module": "/assets/delete_business_product-l0sNRNKZ.js", "imports": [], "css": [] }, "routes/api/media/business_gallery_product_upload": { "id": "routes/api/media/business_gallery_product_upload", "parentId": "root", "path": "/business_gallery_product_upload", "index": void 0, "caseSensitive": void 0, "hasAction": true, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasErrorBoundary": false, "module": "/assets/business_gallery_product_upload-l0sNRNKZ.js", "imports": [], "css": [] }, "routes/api/media/business_gallery_product_update": { "id": "routes/api/media/business_gallery_product_update", "parentId": "root", "path": "/business_gallery_product_update", "index": void 0, "caseSensitive": void 0, "hasAction": true, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasErrorBoundary": false, "module": "/assets/business_gallery_product_update-l0sNRNKZ.js", "imports": [], "css": [] }, "routes/api/media/info": { "id": "routes/api/media/info", "parentId": "root", "path": "/info", "index": void 0, "caseSensitive": void 0, "hasAction": true, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasErrorBoundary": false, "module": "/assets/info-l0sNRNKZ.js", "imports": [], "css": [] } }, "url": "/assets/manifest-f1c705cf.js", "version": "f1c705cf" };
const mode = "production";
const assetsBuildDirectory = "build/client";
const basename = "/";
const future = { "v3_fetcherPersist": true, "v3_relativeSplatPath": true, "v3_throwAbortReason": true, "v3_routeConfig": false, "v3_singleFetch": true, "v3_lazyRouteDiscovery": true, "unstable_optimizeDeps": false };
const isSpaMode = false;
const publicPath = "/";
const entry = { module: entryServer };
const routes = {
  "root": {
    id: "root",
    parentId: void 0,
    path: "",
    index: void 0,
    caseSensitive: void 0,
    module: route0
  },
  "routes/_index": {
    id: "routes/_index",
    parentId: "root",
    path: "/",
    index: void 0,
    caseSensitive: void 0,
    module: route1
  },
  "routes/api/media/user_profile_pic_upload": {
    id: "routes/api/media/user_profile_pic_upload",
    parentId: "root",
    path: "/user_profile_pic_upload",
    index: void 0,
    caseSensitive: void 0,
    module: route2
  },
  "routes/api/media/user_profile_bg_upload": {
    id: "routes/api/media/user_profile_bg_upload",
    parentId: "root",
    path: "/user_profile_bg_upload",
    index: void 0,
    caseSensitive: void 0,
    module: route3
  },
  "routes/api/media/business_profile_pic_upload": {
    id: "routes/api/media/business_profile_pic_upload",
    parentId: "root",
    path: "/business_profile_pic_upload",
    index: void 0,
    caseSensitive: void 0,
    module: route4
  },
  "routes/api/media/business_profile_bg_upload": {
    id: "routes/api/media/business_profile_bg_upload",
    parentId: "root",
    path: "/business_profile_bg_upload",
    index: void 0,
    caseSensitive: void 0,
    module: route5
  },
  "routes/api/media/business_gallery_pic_upload": {
    id: "routes/api/media/business_gallery_pic_upload",
    parentId: "root",
    path: "/business_gallery_pic_upload",
    index: void 0,
    caseSensitive: void 0,
    module: route6
  },
  "routes/api/media/business_gallery_pic_update": {
    id: "routes/api/media/business_gallery_pic_update",
    parentId: "root",
    path: "/business_gallery_pic_update",
    index: void 0,
    caseSensitive: void 0,
    module: route7
  },
  "routes/api/media/delete_business_gallery_pic": {
    id: "routes/api/media/delete_business_gallery_pic",
    parentId: "root",
    path: "/delete_business_gallery_pic",
    index: void 0,
    caseSensitive: void 0,
    module: route8
  },
  "routes/api/media/delete_business_product": {
    id: "routes/api/media/delete_business_product",
    parentId: "root",
    path: "/delete_business_product",
    index: void 0,
    caseSensitive: void 0,
    module: route9
  },
  "routes/api/media/business_gallery_product_upload": {
    id: "routes/api/media/business_gallery_product_upload",
    parentId: "root",
    path: "/business_gallery_product_upload",
    index: void 0,
    caseSensitive: void 0,
    module: route10
  },
  "routes/api/media/business_gallery_product_update": {
    id: "routes/api/media/business_gallery_product_update",
    parentId: "root",
    path: "/business_gallery_product_update",
    index: void 0,
    caseSensitive: void 0,
    module: route11
  },
  "routes/api/media/info": {
    id: "routes/api/media/info",
    parentId: "root",
    path: "/info",
    index: void 0,
    caseSensitive: void 0,
    module: route12
  }
};
export {
  serverManifest as assets,
  assetsBuildDirectory,
  basename,
  entry,
  future,
  isSpaMode,
  mode,
  publicPath,
  routes
};
