import { ActionFunctionArgs, LoaderFunction } from "@remix-run/node";
import fs from "fs/promises";
import path from "path";
import crypto from "crypto";
import { DoResponse } from "~/lib/lib";
import { query } from "../DB";

const businessGalleryUploadsDir = path.resolve("public/business_gallery_pics");

export const loader: LoaderFunction = async ({ request, params }) => {
    if (request.method === "OPTIONS") {
        return new Response(null, {
            status: 204,
            headers: {
                "Access-Control-Allow-Origin": "http://localhost:3393",
                "Access-Control-Allow-Methods": "POST, OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type",
                "Access-Control-Allow-Credentials": "true", // optional
            },
        });
    }

    return DoResponse({ error: "method not allowed" }, 405)


}

export const action = async ({ request }: ActionFunctionArgs) => {
    try {
        const formData = await request.formData();
        const file = formData.get("file") as File | null;
        const guid = formData.get("guid") as string | null;
        const bid = formData.get("bid") as string | null;
        const imageTitle = formData.get("image_title") as string | null;

        if (!file || typeof file === "string") {
            return DoResponse({ message: "No file uploaded" }, 405);
        }

        if (!guid || !bid || !imageTitle) {
            return DoResponse({ message: "Please enter picture title." }, 400);
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const ext = '.jpg' //path.extname(file.name);
        const uuidname = crypto.randomUUID();
        const uniqueName = `${Date.now()}_${uuidname}${ext}`;

        await fs.mkdir(businessGalleryUploadsDir, { recursive: true });

        const filePath = path.join(businessGalleryUploadsDir, uniqueName);
        await fs.writeFile(filePath, buffer);

        const fileUrl = `/business_gallery_pics/${uniqueName}`;
        const mimeType = 'image/jpeg' //file.type;
        const imageGuid = crypto.randomUUID();

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
                insertId: (result as any).insertId,
            },
            200
        );
    } catch (error: any) {
        console.error("Upload error:", error);
        return DoResponse({ message: error.message || "Database save failed" }, 500);
    }
};