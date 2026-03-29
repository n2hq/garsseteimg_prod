import { DoResponse } from "~/lib/lib";
import { query } from "../DB";
import fs from "fs/promises";
import { ActionFunctionArgs, LoaderFunction } from "@remix-run/node";
import path from "path";
import sharp from "sharp";

const userProfileUploadsDir = path.resolve("public/user_profile_bg");

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


        if (!file || typeof file === "string") {
            return DoResponse({ message: "No file uploaded" }, 405);
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const uuidname = crypto.randomUUID();

        let outputBuffer
        let ext = path.extname(file.name).toLowerCase();

        outputBuffer = await sharp(buffer)
            .jpeg({ quality: 90 })
            .toBuffer();
        ext = ".jpg"


        const uniqueName = `${Date.now()}_${uuidname}${ext}`;

        await fs.mkdir(userProfileUploadsDir, { recursive: true });

        const filePath = path.join(userProfileUploadsDir, uniqueName);
        await fs.writeFile(filePath, buffer);

        const fileUrl = `/user_profile_bg/${uniqueName}`;
        const mimeType = file.type;
        const imageGuid = crypto.randomUUID();

        const exists: any[] = await query(
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
                    insertId: (result as any).insertId,
                },
                200
            );
        } else {
            // Delete old file
            const existingImage = (exists[0] as any);
            const existingPath = path.join(userProfileUploadsDir, existingImage.image_filename);

            try {
                await fs.unlink(existingPath);
            } catch (err: any) {
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
                    insertId: existingImage.id,
                },
                200
            );
        }
    } catch (error: any) {
        console.error("Upload error:", error);
        return DoResponse({ message: error.message || "Upload failed" }, 500);
    }
};