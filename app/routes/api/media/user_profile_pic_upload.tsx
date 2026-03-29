import path from "path";
import multer from "multer";
import fs from "fs/promises";
import util from "util";
import { ActionFunctionArgs, LoaderFunction } from "@remix-run/node";
import { DoResponse, headers } from "~/lib/lib";
import { query } from "../DB";
import sharp from "sharp";

const userProfileUploadsDir = path.resolve("public/user_profile_pics");

export const loader: LoaderFunction = async ({ request, params }) => {


    return DoResponse({ error: "method not allowed" }, 405)


}

export const action = async ({ request }: ActionFunctionArgs) => {

    try {
        const formData = await request.formData();
        const file = formData.get("file") as File | null;
        const guid = formData.get("guid")?.toString();

        if (!file || typeof file === "string") {
            return DoResponse({ error: "No file uploaded" }, 400);
        }

        if (!guid) {
            return DoResponse({ error: "Missing user GUID" }, 400);
        }





        await fs.mkdir(userProfileUploadsDir, { recursive: true });

        const buffer = Buffer.from(await file.arrayBuffer());
        const uuidname = crypto.randomUUID();

        let outputBuffer
        let ext = path.extname(file.name).toLowerCase();

        outputBuffer = await sharp(buffer)
            .jpeg({ quality: 90 })
            .toBuffer();
        ext = ".jpg"


        const uniqueName = `${Date.now()}_${uuidname}${ext}`;

        const filePath = path.join(userProfileUploadsDir, uniqueName);

        await fs.writeFile(filePath, buffer);

        const fileUrl = `/user_profile_pics/${uniqueName}`;
        let mimeType = file.type;
        mimeType = 'image/jpeg'
        const imageGuid = crypto.randomUUID();



        const [exists] = await query(
            `SELECT * FROM tbl_user_profile_image WHERE user_guid = ?`,
            [guid]
        );


        const existingRecord = (exists as any);
        if (!existingRecord) {
            const [result] = await query(
                `INSERT INTO tbl_user_profile_image (image_filename, user_guid, image_guid, image_url, mimetype)
         VALUES (?, ?, ?, ?, ?)`,
                [uniqueName, guid, imageGuid, fileUrl, mimeType]
            );

            return DoResponse({
                message: "File uploaded and saved to database successfully",
                fileUrl,
                insertId: (result as any).insertId,
            }, 200);
        } else {
            // Delete old file
            const existingImage = (exists as any);
            const oldFilePath = path.join(userProfileUploadsDir, existingImage.image_filename);
            console.log(oldFilePath)


            try {
                await fs.unlink(oldFilePath);
            } catch (err: any) {
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
                insertId: (exists as any).id,
            }, 200);
        }

    } catch (error: any) {
        console.error("Upload error:", error);
        return DoResponse({ error: error.message || "Upload failed" }, 500);
    }
};