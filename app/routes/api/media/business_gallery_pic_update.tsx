import { ActionFunctionArgs, LoaderFunction } from "@remix-run/node";
import { writeFile, unlink } from "fs/promises";
import path from "path";
import crypto from "crypto";
import { query } from "../DB";
import { DoResponse } from "~/lib/lib";
import sharp from "sharp";

const galleryDir = path.resolve("public/business_gallery_pics");

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
        const userGuid = formData.get("guid") as string;
        const businessGuid = formData.get("bid") as string;
        const imageGuid = formData.get("image_guid") as string;
        const imageTitle = (formData.get("image_title") as string) || "";

        if (!userGuid || !businessGuid || !imageGuid) {
            return DoResponse({ error: "Missing required fields" }, 400);
        }

        const [existing] = await query(
            `SELECT * FROM tbl_business_gallery_image
       WHERE user_guid = ? AND business_guid = ? AND image_guid = ?`,
            [userGuid, businessGuid, imageGuid]
        );


        const existingRecord = (existing as any);
        if (!existingRecord) {
            return DoResponse({ error: "Image does not exist" }, 404);
        }

        let fileUrl = existingRecord.image_url;
        let originalName = existingRecord.image_filename;
        let mimeType = existingRecord.mimetype;

        if (file) {
            // Generate unique name
            const buffer = Buffer.from(await file.arrayBuffer());
            const uuidname = crypto.randomUUID();

            let outputBuffer
            let ext = path.extname(file.name).toLowerCase();

            outputBuffer = await sharp(buffer)
                .jpeg({ quality: 90 })
                .toBuffer();
            ext = ".jpg"


            const uniqueName = `${Date.now()}_${uuidname}${ext}`;


            const filePath = path.join(galleryDir, uniqueName);

            await writeFile(filePath, buffer);

            // Delete old image
            const oldFilePath = path.join(galleryDir, existingRecord.image_filename);
            try {
                await unlink(oldFilePath);
            } catch (err: any) {
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
                insertId: existingRecord.id,
            },
            200
        );
    } catch (err: any) {
        console.error("Error updating gallery image:", err);
        return DoResponse({ error: err.message || "Update failed" }, 500);
    }
};

