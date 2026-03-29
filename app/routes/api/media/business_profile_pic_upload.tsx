import { DoResponse } from "~/lib/lib";
import { query } from "../DB";
import fs from "fs/promises";
import { ActionFunctionArgs, LoaderFunction } from "@remix-run/node";
import path from "path";

const businessProfileUploadsDir = path.resolve("/vmedia/business_profile_pics");

export const loader: LoaderFunction = async ({ request, params }) => {
    /* if (request.method === "OPTIONS") {
        return new Response(null, {
            status: 204,
            headers: {
                "Access-Control-Allow-Origin": "http://localhost:3393",
                "Access-Control-Allow-Methods": "POST, OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type",
                "Access-Control-Allow-Credentials": "true", // optional
            },
        });
    } */

    return DoResponse({ error: "method not allowed" }, 405)


}

export const action = async ({ request }: ActionFunctionArgs) => {
    try {
        const formData = await request.formData();
        const file = formData.get("file") as File | null;
        const guid = formData.get("guid") as string | null;
        const bid = formData.get("bid") as string | null;

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

        console.log('i am here')

        await fs.mkdir(businessProfileUploadsDir, { recursive: true });

        const filePath = path.join(businessProfileUploadsDir, uniqueName);
        await fs.writeFile(filePath, buffer);

        const fileUrl = `/business_profile_pics/${uniqueName}`;
        const mimeType = file.type;
        const imageGuid = crypto.randomUUID();

        const exists: any[] = await query(
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
                    insertId: (result as any).insertId,
                },
                200
            );
        } else {
            // Delete old file
            const existingImage = (exists[0] as any);
            const existingPath = path.join(businessProfileUploadsDir, existingImage.image_filename);

            try {
                await fs.unlink(existingPath);
            } catch (err: any) {
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